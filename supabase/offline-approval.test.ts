import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/** Phase 5A: the owner's "offline approval" setting and its audit action. */
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

async function as<T>(role: "anon" | "authenticated", email: string | null, sql: string): Promise<T[]> {
  await db.exec(`set role ${role}; select set_config('request.jwt.claims', '${email ? JSON.stringify({ email }) : ""}', false);`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("reset role;");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  const dir = join(process.cwd(), "supabase", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));
  await db.exec(`insert into public.admin_users (email, role) values ('owner@oryza.test', 'owner'), ('editor@oryza.test', 'editor');`);
}, 60_000);

afterAll(async () => db?.close());

describe("offline approval setting", () => {
  it("is on by default", async () => {
    const r = await db.query<{ allow_offline_approval: boolean }>("select allow_offline_approval from public.ops_settings where id = 1");
    expect(r.rows[0].allow_offline_approval).toBe(true);
  });

  it("only an owner can switch it (editors can read it, anon cannot)", async () => {
    await expect(as("anon", null, "select allow_offline_approval from public.ops_settings")).rejects.toThrow(/permission denied/);
    expect(await as("authenticated", "editor@oryza.test", "select allow_offline_approval from public.ops_settings")).toHaveLength(1);
    expect(await as("authenticated", "editor@oryza.test", "update public.ops_settings set allow_offline_approval = false where id = 1 returning id")).toHaveLength(0);
    expect(await as("authenticated", "owner@oryza.test", "update public.ops_settings set allow_offline_approval = false where id = 1 returning id")).toHaveLength(1);
    const r = await db.query<{ allow_offline_approval: boolean }>("select allow_offline_approval from public.ops_settings where id = 1");
    expect(r.rows[0].allow_offline_approval).toBe(false);
  });
});

describe("audit actions", () => {
  it("accepts client.approved_offline with who, note and channel", async () => {
    await db.query(`insert into public.audit_log (actor_email, action, target, details) values ('editor@oryza.test', 'client.approved_offline', 'item-1', '{"note":"Approved on WhatsApp","channel":"whatsapp"}')`);
    const r = await db.query<{ actor_email: string; at: string }>("select actor_email, at from public.audit_log where action = 'client.approved_offline'");
    expect(r.rows[0].actor_email).toBe("editor@oryza.test");
    expect(r.rows[0].at).toBeTruthy();
  });

  it("allows every action the app writes, and nothing else", async () => {
    const types = readFileSync(join(process.cwd(), "src", "lib", "admin", "types.ts"), "utf8");
    const union = types.slice(types.indexOf("export type AuditAction"), types.indexOf(";", types.indexOf("export type AuditAction")));
    const actions = [...union.matchAll(/"([a-z_]+\.[a-z_]+)"/g)].map((m) => m[1]);
    expect(actions).toContain("client.approved_offline");
    for (const a of actions) await db.query(`insert into public.audit_log (actor_email, action, target) values ('x', $1, 't')`, [a]);
    await expect(db.query(`insert into public.audit_log (actor_email, action, target) values ('x', 'client.approved_by_magic', 't')`)).rejects.toThrow(/audit_log_action_check/);
  });
});
