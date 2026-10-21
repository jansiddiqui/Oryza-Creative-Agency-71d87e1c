import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Client operations tables: Row Level Security, the undeletable compliance notes, and data rules. */
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
let plan = "";
let item = "";

async function as<T>(role: "anon" | "authenticated", email: string | null, sql: string): Promise<T[]> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claims', '${email ? JSON.stringify({ email }) : ""}', false);`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("reset role;");
  }
}

const TABLES = ["clients", "client_plans", "content_items", "tasks", "shoot_days", "onboarding_items", "team_members", "deadline_rules", "ops_settings"];
const draft = { items: [{ id: "i1-0", title: "Meet our doctors", complianceNote: "Doctor approves." }, { id: "i2-0", title: "OPD timings", complianceNote: "" }], shoots: [], compliance: ["No cure claims."] };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));
  await db.exec(`insert into public.admin_users (email, role) values ('owner@oryza.test', 'owner'), ('editor@oryza.test', 'editor');`);
  client = (await db.query<{ id: string }>(`insert into public.clients (name, category, start_date, created_by) values ('Sunrise Clinic', 'hospitals-clinics', '2026-11-02', 'owner@oryza.test') returning id`)).rows[0].id;
  plan = (await db.query<{ id: string }>(
    `insert into public.client_plans (client_id, month_start, answers, generated, draft, engine_version, created_by) values ($1, '2026-11-02', '{}', '{}', $2, 'hospital-v1', 'owner@oryza.test') returning id`,
    [client, JSON.stringify(draft)],
  )).rows[0].id;
  item = (await db.query<{ id: string }>(
    `insert into public.content_items (client_id, plan_id, draft_item_id, platform, format, title, publish_date, compliance_notes) values ($1, $2, 'i1-0', 'instagram', 'reel', 'Meet our doctors', '2026-11-12', 'Doctor approves.') returning id`,
    [client, plan],
  )).rows[0].id;
  await db.query(`insert into public.tasks (item_id, client_id, step, label, due_date, role) values ($1, $2, 'script', 'Script', '2026-11-07', 'strategist')`, [item, client]);
}, 60_000);

afterAll(async () => db?.close());

describe("client operations: Row Level Security", () => {
  it("anon sees nothing and can write nothing", async () => {
    for (const t of TABLES) {
      await expect(as("anon", null, `select * from public.${t}`), t).rejects.toThrow(/permission denied/);
    }
    await expect(as("anon", null, "insert into public.clients (name, start_date, created_by) values ('x', '2026-11-01', 'x')")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "update public.tasks set status = 'done'")).rejects.toThrow(/permission denied/);
  });

  it("a signed-in non-admin (or a switched-off admin) sees nothing", async () => {
    await db.exec("insert into public.admin_users (email, role, active) values ('gone@oryza.test', 'editor', false)");
    for (const email of ["stranger@example.com", "gone@oryza.test"])
      for (const t of TABLES) expect(await as("authenticated", email, `select * from public.${t}`), `${email} ${t}`).toEqual([]);
  });

  it("staff read and work on clients, plans, items and tasks after signing in", async () => {
    expect(await as("authenticated", "editor@oryza.test", "select name from public.clients")).toEqual([{ name: "Sunrise Clinic" }]);
    await as("authenticated", "editor@oryza.test", `update public.tasks set status = 'in_progress' where item_id = '${item}'`);
    expect((await db.query("select status from public.tasks")).rows).toEqual([{ status: "in_progress" }]);
    expect((await as("authenticated", "editor@oryza.test", "select step from public.deadline_rules")).length).toBeGreaterThan(20);
  });

  it("only owners change deadline rules, working days and the team", async () => {
    await as("authenticated", "editor@oryza.test", "update public.deadline_rules set offset_days = -9 where format = 'reel' and step = 'script'");
    await as("authenticated", "editor@oryza.test", "update public.ops_settings set working_days = '{1,2,3,4,5}'");
    await as("authenticated", "editor@oryza.test", "insert into public.team_members (email) values ('editor@oryza.test')").catch(() => undefined);
    expect((await db.query("select offset_days from public.deadline_rules where format = 'reel' and step = 'script'")).rows).toEqual([{ offset_days: -5 }]);
    expect((await db.query<{ working_days: number[] }>("select working_days from public.ops_settings")).rows[0].working_days).toEqual([1, 2, 3, 4, 5, 6]);
    expect((await db.query("select * from public.team_members")).rows).toEqual([]);
    await as("authenticated", "owner@oryza.test", "update public.deadline_rules set offset_days = -6 where format = 'reel' and step = 'script'");
    await as("authenticated", "owner@oryza.test", "insert into public.team_members (email, roles) values ('editor@oryza.test', '{designer}')");
    expect((await db.query("select offset_days from public.deadline_rules where format = 'reel' and step = 'script'")).rows).toEqual([{ offset_days: -6 }]);
    expect((await db.query("select email from public.team_members")).rows).toEqual([{ email: "editor@oryza.test" }]);
  });
});

describe("compliance notes cannot be deleted", () => {
  it("a content item's compliance notes cannot be changed or cleared — even by the service role", async () => {
    await expect(db.query(`update public.content_items set compliance_notes = '' where id = $1`, [item])).rejects.toThrow(/compliance notes cannot be changed/);
    await expect(db.query(`update public.content_items set compliance_notes = 'Something else' where id = $1`, [item])).rejects.toThrow(/compliance notes cannot be changed/);
    await db.query(`update public.content_items set title = 'Meet our cardiologists' where id = $1`, [item]);
    expect((await db.query("select title, compliance_notes from public.content_items")).rows).toEqual([{ title: "Meet our cardiologists", compliance_notes: "Doctor approves." }]);
  });

  it("a plan draft keeps its plan-level and per-item compliance notes; wording edits and removals are fine", async () => {
    const save = (d: unknown) => db.query(`update public.client_plans set draft = $2 where id = $1`, [plan, JSON.stringify(d)]);
    await expect(save({ ...draft, compliance: [] })).rejects.toThrow(/plan compliance notes/);
    await expect(save({ ...draft, items: [{ ...draft.items[0], complianceNote: "" }, draft.items[1]] })).rejects.toThrow(/compliance note cannot be changed/);
    await save({ ...draft, items: [{ ...draft.items[0], title: "New title" }] });
    expect((await db.query<{ t: string }>(`select draft -> 'items' -> 0 ->> 'title' as t from public.client_plans`)).rows[0].t).toBe("New title");
  });
});

describe("data rules", () => {
  it("a blocked task needs a reason; a done task records who and when", async () => {
    await expect(db.query(`update public.tasks set status = 'blocked' where item_id = $1`, [item])).rejects.toThrow(/check constraint/);
    await db.query(`update public.tasks set status = 'blocked', blocked_reason = 'Waiting for client footage' where item_id = $1`, [item]);
    await expect(db.query(`update public.tasks set status = 'done' where item_id = $1`, [item])).rejects.toThrow(/check constraint/);
    await db.query(`update public.tasks set status = 'done', completed_by = 'editor@oryza.test', completed_at = now() where item_id = $1`, [item]);
  });

  it("an approved plan records who approved it and when", async () => {
    await expect(db.query(`update public.client_plans set status = 'approved' where id = $1`, [plan])).rejects.toThrow(/check constraint/);
    await db.query(`update public.client_plans set status = 'approved', approved_by = 'owner@oryza.test', approved_at = now() where id = $1`, [plan]);
  });

  it("one client per lead, one plan per client per month, valid colours and categories", async () => {
    const lead = (await db.query<{ id: string }>("insert into public.leads (source, name, phone) values ('plan-builder', 'Asha', '+919876543210') returning id")).rows[0].id;
    await db.query(`insert into public.clients (name, start_date, created_by, lead_id) values ('A', '2026-11-02', 'x', $1)`, [lead]);
    await expect(db.query(`insert into public.clients (name, start_date, created_by, lead_id) values ('B', '2026-11-02', 'x', $1)`, [lead])).rejects.toThrow(/duplicate key/);
    await expect(db.query(`insert into public.client_plans (client_id, month_start, answers, generated, draft, engine_version, created_by) values ($1, '2026-11-02', '{}', '{}', '{}', 'v', 'x')`, [client])).rejects.toThrow(/duplicate key/);
    await expect(db.exec(`insert into public.clients (name, start_date, created_by, colour) values ('C', '2026-11-02', 'x', 'red')`)).rejects.toThrow(/check constraint/);
    await expect(db.exec(`insert into public.clients (name, start_date, created_by, category) values ('D', '2026-11-02', 'x', 'Bad Category!')`)).rejects.toThrow(/check constraint/);
  });

  it("the audit log accepts the new client actions", async () => {
    await db.exec(`insert into public.audit_log (actor_email, action, target) values ('owner@oryza.test', 'plan.approve', 'x'), ('owner@oryza.test', 'task.update', 'y')`);
    await expect(db.exec(`insert into public.audit_log (actor_email, action, target) values ('x', 'client.delete_everything', 'z')`)).rejects.toThrow(/check constraint/);
  });
});
