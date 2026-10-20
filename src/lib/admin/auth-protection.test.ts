import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ---------- mocks: who is signed in, and Supabase itself ---------- */
const state = vi.hoisted(() => ({ user: null as null | { email: string }, allow: new Map<string, { role: string; active: boolean }>() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  sessionClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  serviceConfigured: () => true,
  serviceClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_c: string, email: string) => ({
          maybeSingle: async () => {
            const a = state.allow.get(email);
            return { data: a ? { email, ...a } : null };
          },
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/leads", () => ({ listLeads: vi.fn(async () => []) }));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  state.user = null;
  state.allow = new Map([
    ["owner@oryza.test", { role: "owner", active: true }],
    ["editor@oryza.test", { role: "editor", active: true }],
    ["gone@oryza.test", { role: "owner", active: false }],
  ]);
});
afterEach(() => vi.unstubAllEnvs());

describe("proxy (first gate for /admin)", () => {
  it("redirects visitors without a session to the login page, remembering where they were going", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(new NextRequest("https://www.oryzaonline.in/admin/images/home-hero"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.oryzaonline.in/admin/login?next=%2Fadmin%2Fimages%2Fhome-hero");
    expect(res.headers.get("x-robots-tag")).toMatch(/noindex/);
  });

  it("lets the login page and auth callback through, and marks them noindex", async () => {
    const { proxy } = await import("@/proxy");
    for (const p of ["/admin/login", "/admin/auth/callback?code=x"]) {
      const res = await proxy(new NextRequest(`https://www.oryzaonline.in${p}`));
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-robots-tag")).toMatch(/noindex/);
    }
  });

  it("only runs on /admin", async () => {
    const { config } = await import("@/proxy");
    expect(config.matcher).toEqual(["/admin", "/admin/:path*"]);
  });
});

describe("server-side admin check (every admin action and API)", () => {
  it("rejects unauthenticated calls before running anything (401)", async () => {
    const { adminAction } = await import("./action");
    const work = vi.fn();
    expect(await adminAction(work)).toMatchObject({ ok: false, status: 401 });
    expect(work).not.toHaveBeenCalled();
  });

  it("rejects signed-in users who are not on the allow-list, or switched off", async () => {
    const { adminAction } = await import("./action");
    const work = vi.fn();
    state.user = { email: "stranger@example.com" };
    expect(await adminAction(work)).toMatchObject({ ok: false, status: 401 });
    state.user = { email: "gone@oryza.test" };
    expect(await adminAction(work)).toMatchObject({ ok: false, status: 401 });
    expect(work).not.toHaveBeenCalled();
  });

  it("enforces owner-only actions (403 for editors)", async () => {
    const { adminAction } = await import("./action");
    const work = vi.fn(async () => "done");
    state.user = { email: "editor@oryza.test" };
    expect(await adminAction(work, "owner")).toMatchObject({ ok: false, status: 403 });
    expect(work).not.toHaveBeenCalled();
    expect(await adminAction(work)).toEqual({ ok: true, data: "done" });
    state.user = { email: "owner@oryza.test" };
    expect(await adminAction(work, "owner")).toEqual({ ok: true, data: "done" });
  });

  it("the leads CSV export refuses unauthenticated requests", async () => {
    const { GET } = await import("@/app/admin/(panel)/leads/export/route");
    const res = await GET(new Request("https://www.oryzaonline.in/admin/leads/export"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).not.toMatch(/csv/);
    state.user = { email: "editor@oryza.test" };
    const ok = await GET(new Request("https://www.oryzaonline.in/admin/leads/export"));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toMatch(/text\/csv/);
  });

  it("every admin page and route handler checks the admin on the server", () => {
    const dir = join(process.cwd(), "src", "app", "admin");
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(d, e.name));
        else if (/^(page|route)\.tsx?$/.test(e.name)) files.push(join(d, e.name));
      }
    };
    walk(dir);
    const open = ["login/page.tsx", "auth/callback/route.ts", "auth/signout/route.ts"];
    const unguarded = files
      .map((f) => relative(dir, f).split(sep).join("/"))
      .filter((f) => !open.includes(f))
      .filter((f) => !/requireAdmin\(|assertAdmin\(/.test(readFileSync(join(dir, f), "utf8")));
    expect(unguarded).toEqual([]);
  });

  it("every admin server action goes through adminAction", () => {
    const dir = join(process.cwd(), "src", "app", "admin");
    const actionFiles = ["(panel)/images/actions.ts", "(panel)/leads/actions.ts", "(panel)/users/actions.ts", "(panel)/account/actions.ts"];
    for (const f of actionFiles) {
      const src = readFileSync(join(dir, f), "utf8");
      const exported = src.match(/export async function \w+/g) ?? [];
      const guarded = src.match(/return adminAction\(/g) ?? [];
      expect(guarded.length, f).toBe(exported.length);
    }
  });
});

describe("login safety", () => {
  it("only redirects to admin paths after sign-in (no open redirect)", async () => {
    const { safeNext } = await import("./safe-next");
    expect(safeNext("/admin/images/home-hero")).toBe("/admin/images/home-hero");
    for (const bad of ["https://evil.example", "//evil.example", "/admin/../x", "/services", "/admin?x=https://e", null]) expect(safeNext(bad)).toBe("/admin");
  });
});

describe("public pages ship no admin code", () => {
  it("nothing outside /admin imports admin modules, Supabase clients or the service role", () => {
    const root = join(process.cwd(), "src");
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        const rel = relative(root, p).split(sep).join("/");
        if (e.isDirectory()) {
          if (["app/admin", "components/admin", "lib/admin", "lib/supabase", "lib/images"].includes(rel)) continue;
          walk(p);
        } else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && rel !== "lib/leads.ts" && rel !== "proxy.ts") {
          const src = readFileSync(p, "utf8");
          // Types/constants from lib/admin/types are fine; runtime admin code, Supabase clients and the service key are not.
          const runtime = /from "@\/lib\/admin\/(auth|action|audit|images-data)"|from "@\/components\/admin|from "@supabase\/|SUPABASE_SERVICE_ROLE_KEY|from "@\/lib\/supabase\/(admin|server)"/;
          if (runtime.test(src) && rel !== "app/api/lead/route.ts") offenders.push(rel);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
