import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Runs the real migrations in an embedded Postgres (PGlite) with minimal stand-ins for the Supabase
 * `auth` and `storage` schemas, then checks the Row Level Security rules as the public `anon` role and as
 * signed-in users.
 */
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
  -- Like Supabase: new tables are fully granted to every API role; RLS and explicit revokes must do the work.
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
  await db.exec(`
    insert into public.admin_users (email, role) values ('owner@oryza.test', 'owner'), ('editor@oryza.test', 'editor');
    insert into public.admin_users (email, role, active) values ('gone@oryza.test', 'editor', false);
    insert into public.slot_images (slot_id, version, status, source, original_path, original_width, original_height, aspects, uploaded_by, approved_by, approved_at)
      values ('home-hero', 1, 'live', 'ai-illustrative', 'home-hero/1.png', 1536, 1024, '{}', 'owner@oryza.test', 'owner@oryza.test', now()),
             ('home-hero', 2, 'uploaded', 'ai-illustrative', 'home-hero/2.png', 1536, 1024, null, 'owner@oryza.test', null, null);
    insert into public.leads (source, name, phone) values ('contact', 'Asha', '+919876543210');
  `);
}, 60_000);

afterAll(async () => db?.close());

describe("migrations + Row Level Security", () => {
  it("creates the storage buckets: public processed images; private originals and client assets", async () => {
    const rows = (await db.query<{ id: string; public: boolean }>("select id, public from storage.buckets order by id")).rows;
    expect(rows).toEqual([{ id: "client-assets", public: false }, { id: "image-originals", public: false }, { id: "site-images", public: true }]);
  });

  it("anon sees only live images", async () => {
    const rows = await as<{ version: number }>("anon", null, "select version from public.slot_images");
    expect(rows).toEqual([{ version: 1 }]);
  });

  it("anon cannot read private image columns (original paths, uploader emails)", async () => {
    await expect(as("anon", null, "select original_path from public.slot_images")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "select uploaded_by from public.slot_images")).rejects.toThrow(/permission denied/);
  });

  it("anon cannot read or write leads, audit log or admin users", async () => {
    await expect(as("anon", null, "select * from public.leads")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "insert into public.leads (source, name, phone) values ('contact','x','1234567890')")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "select * from public.audit_log")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "select * from public.admin_users")).rejects.toThrow(/permission denied/);
    await expect(as("anon", null, "update public.slot_images set status = 'archived'")).rejects.toThrow(/permission denied/);
  });

  it("a signed-in non-admin sees nothing", async () => {
    expect(await as("authenticated", "stranger@example.com", "select * from public.leads")).toEqual([]);
    expect(await as("authenticated", "stranger@example.com", "select * from public.slot_images")).toEqual([]);
    expect(await as("authenticated", "gone@oryza.test", "select * from public.leads")).toEqual([]);
  });

  it("admins read leads and all image versions; only owners manage users", async () => {
    expect(await as("authenticated", "editor@oryza.test", "select name from public.leads")).toEqual([{ name: "Asha" }]);
    expect((await as("authenticated", "editor@oryza.test", "select version from public.slot_images")).length).toBe(2);
    await as("authenticated", "editor@oryza.test", "insert into public.admin_users (email) values ('sneaky@oryza.test')").catch(() => undefined);
    expect((await db.query("select 1 from public.admin_users where email = 'sneaky@oryza.test'")).rows).toEqual([]);
    await as("authenticated", "owner@oryza.test", "insert into public.admin_users (email) values ('new@oryza.test')");
    expect((await db.query("select role from public.admin_users where email = 'new@oryza.test'")).rows).toEqual([{ role: "editor" }]);
  });

  it("allows only one live image per slot, and only processed approved images can be live", async () => {
    await expect(db.exec("update public.slot_images set status = 'live', aspects = '{}', approved_by = 'x', approved_at = now() where version = 2")).rejects.toThrow(/duplicate key/);
    await expect(db.exec("update public.slot_images set status = 'archived' where version = 1; update public.slot_images set status = 'live' where version = 2")).rejects.toThrow(/check constraint/);
  });

  it("rejects bad data: unknown image source, bad lead source, upper-case admin email", async () => {
    await expect(db.exec("insert into public.slot_images (slot_id, version, source, original_path, original_width, original_height, uploaded_by) values ('x', 9, 'stock', 'p', 1, 1, 'a')")).rejects.toThrow(/check constraint/);
    await expect(db.exec("insert into public.leads (source, name, phone) values ('popup', 'x', '1234567890')")).rejects.toThrow(/check constraint/);
    await expect(db.exec("insert into public.admin_users (email) values ('Upper@Oryza.test')")).rejects.toThrow(/check constraint/);
  });

  it("set_live_image swaps the live version atomically and can remove it; the public cannot call it", async () => {
    const ids = (await db.query<{ id: string; version: number }>("select id, version from public.slot_images where slot_id = 'home-hero' order by version")).rows;
    await db.exec("update public.slot_images set aspects = '{}', approved_by = 'owner@oryza.test', approved_at = now() where version = 2");
    await db.query("select public.set_live_image('home-hero', $1)", [ids[1].id]);
    expect((await db.query("select version, status from public.slot_images where slot_id = 'home-hero' order by version")).rows).toEqual([
      { version: 1, status: "archived" },
      { version: 2, status: "live" },
    ]);
    await db.query("select public.set_live_image('home-hero', null)");
    expect((await db.query("select count(*)::int as n from public.slot_images where status = 'live'")).rows).toEqual([{ n: 0 }]);
    await expect(db.query("select public.set_live_image('other-slot', $1)", [ids[0].id])).rejects.toThrow(/not found/);
    await expect(as("anon", null, "select public.set_live_image('home-hero', null)")).rejects.toThrow(/permission denied/);
    await expect(as("authenticated", "owner@oryza.test", "select public.set_live_image('home-hero', null)")).rejects.toThrow(/permission denied/);
  });
});
