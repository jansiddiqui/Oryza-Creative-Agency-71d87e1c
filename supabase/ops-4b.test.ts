import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Phase 4B tables: Row Level Security on every one, owner-only money, the rate limiter and data rules. */
const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.jwt() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

let db: PGlite;
let client = "";
let item = "";

async function as<T>(role: "anon" | "authenticated", email: string | null, sql: string): Promise<T[]> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claims', '${email ? JSON.stringify({ email }) : ""}', false);`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("reset role;");
  }
}

const TABLES = ["task_estimates", "team_leave", "shoot_shots", "approval_links", "approval_responses", "rate_limits", "reminder_log", "monthly_reports", "report_links", "client_billing", "invoices"];

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));
  await db.exec(`insert into public.admin_users (email, role) values ('owner@oryza.test', 'owner'), ('editor@oryza.test', 'editor');`);
  client = (await db.query<{ id: string }>(`insert into public.clients (name, category, start_date, created_by) values ('Sunrise Clinic', 'hospitals-clinics', '2026-11-02', 'x') returning id`)).rows[0].id;
  const plan = (await db.query<{ id: string }>(`insert into public.client_plans (client_id, month_start, answers, generated, draft, engine_version, created_by) values ($1, '2026-11-02', '{}', '{}', '{"items":[],"shoots":[],"compliance":[]}', 'v', 'x') returning id`, [client])).rows[0].id;
  item = (await db.query<{ id: string }>(`insert into public.content_items (client_id, plan_id, draft_item_id, platform, format, title, publish_date) values ($1, $2, 'i1-0', 'instagram', 'reel', 'T', '2026-11-12') returning id`, [client, plan])).rows[0].id;
  await db.query(`insert into public.approval_links (client_id, item_ids, expires_at, created_by) values ($1, array[$2]::uuid[], now() + interval '7 days', 'x')`, [client, item]);
  await db.query(`insert into public.invoices (client_id, number, issued_on, due_on, amount, created_by) values ($1, 'ORY-001', '2026-11-01', '2026-11-10', 25000, 'x')`, [client]);
  await db.query(`insert into public.client_billing (client_id, monthly_fee, updated_by) values ($1, 25000, 'x')`, [client]);
  await db.query(`insert into public.monthly_reports (client_id, month, updated_by) values ($1, '2026-11-01', 'x')`, [client]);
}, 60_000);

afterAll(async () => db?.close());

describe("phase 4B: Row Level Security", () => {
  it("anon sees nothing on every new table", async () => {
    for (const t of TABLES) await expect(as("anon", null, `select * from public.${t}`), t).rejects.toThrow(/permission denied/);
  });

  it("signed-in non-admins see nothing", async () => {
    for (const t of TABLES) expect(await as("authenticated", "stranger@example.com", `select * from public.${t}`), t).toEqual([]);
  });

  it("staff see approval links and reports, but not money", async () => {
    expect((await as("authenticated", "editor@oryza.test", "select id from public.approval_links")).length).toBe(1);
    expect((await as("authenticated", "editor@oryza.test", "select id from public.monthly_reports")).length).toBe(1);
    expect(await as("authenticated", "editor@oryza.test", "select * from public.invoices")).toEqual([]);
    expect(await as("authenticated", "editor@oryza.test", "select * from public.client_billing")).toEqual([]);
    await as("authenticated", "editor@oryza.test", "update public.invoices set status = 'paid', paid_on = '2026-11-05'");
    expect((await db.query("select status from public.invoices")).rows).toEqual([{ status: "due" }]);
  });

  it("owners see and change money and estimates", async () => {
    expect((await as("authenticated", "owner@oryza.test", "select number from public.invoices"))).toEqual([{ number: "ORY-001" }]);
    await as("authenticated", "owner@oryza.test", "update public.task_estimates set hours = 4 where step = 'edit'");
    await as("authenticated", "editor@oryza.test", "update public.task_estimates set hours = 9 where step = 'edit'");
    expect((await db.query<{ hours: string }>("select hours from public.task_estimates where step = 'edit'")).rows[0].hours).toBe("4.00");
  });

  it("nobody but the server writes approval responses or touches the rate limiter", async () => {
    await expect(as("authenticated", "owner@oryza.test", `insert into public.approval_responses (link_id, item_id, decision) select id, '${item}', 'approved' from public.approval_links`)).rejects.toThrow(/row-level security/);
    await expect(as("authenticated", "owner@oryza.test", "select public.rate_hit('x', 5, 60)")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "select public.rate_hit('x', 5, 60)")).rejects.toThrow(/permission denied/);
  });
});

describe("phase 4B: data rules", () => {
  it("rate_hit allows up to the limit in a window, then refuses", async () => {
    const r: boolean[] = [];
    for (let i = 0; i < 4; i++) r.push((await db.query<{ ok: boolean }>("select public.rate_hit('ip:1', 3, 60) as ok")).rows[0].ok);
    expect(r).toEqual([true, true, true, false]);
    await db.exec("update public.rate_limits set window_start = now() - interval '2 minutes' where key = 'ip:1'");
    expect((await db.query<{ ok: boolean }>("select public.rate_hit('ip:1', 3, 60) as ok")).rows[0].ok).toBe(true);
  });

  it("changes requested need a comment; paid invoices need a paid date; leave ends after it starts", async () => {
    const link = (await db.query<{ id: string }>("select id from public.approval_links")).rows[0].id;
    await expect(db.query(`insert into public.approval_responses (link_id, item_id, decision) values ($1, $2, 'changes')`, [link, item])).rejects.toThrow(/check constraint/);
    await db.query(`insert into public.approval_responses (link_id, item_id, decision, comment) values ($1, $2, 'changes', 'Use the new logo')`, [link, item]);
    await expect(db.exec("update public.invoices set status = 'paid'")).rejects.toThrow(/check constraint/);
    await expect(db.exec("insert into public.team_leave (email, start_date, end_date, created_by) values ('editor@oryza.test', '2026-11-10', '2026-11-09', 'x')")).rejects.toThrow(/check constraint/);
  });

  it("a report month is the first of a month and one per client; an invoice number is unique", async () => {
    await expect(db.query(`insert into public.monthly_reports (client_id, month, updated_by) values ($1, '2026-11-15', 'x')`, [client])).rejects.toThrow(/check constraint/);
    await expect(db.query(`insert into public.monthly_reports (client_id, month, updated_by) values ($1, '2026-11-01', 'x')`, [client])).rejects.toThrow(/duplicate key/);
    await expect(db.query(`insert into public.invoices (client_id, number, issued_on, due_on, amount, created_by) values ($1, 'ORY-001', '2026-11-01', '2026-11-10', 1, 'x')`, [client])).rejects.toThrow(/duplicate key/);
  });

  it("shoot times are HH:MM; the audit log accepts the new actions", async () => {
    await expect(db.exec("update public.shoot_days set start_time = '9am'")).resolves.toBeDefined(); // no rows yet
    const s = (await db.query<{ id: string }>(`insert into public.shoot_days (client_id, shoot_date) values ($1, '2026-11-10') returning id`, [client])).rows[0].id;
    await expect(db.query(`update public.shoot_days set start_time = '9am' where id = $1`, [s])).rejects.toThrow(/check constraint/);
    await db.query(`update public.shoot_days set start_time = '09:30', end_time = '13:00' where id = $1`, [s]);
    await db.exec(`insert into public.audit_log (actor_email, action, target) values ('client via approval link', 'client.approved', 'x'), ('owner@oryza.test', 'invoice.update', 'y')`);
  });
});
