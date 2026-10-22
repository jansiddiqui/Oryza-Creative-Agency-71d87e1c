import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forwardToCallback, requestOrigin, signInRedirectUrl } from "./auth-redirect";

const SITE = "https://www.oryzaonline.in";

describe("sign-in link address (emailRedirectTo)", () => {
  it("production: comes back to the callback on www, with a safe next", () => {
    expect(signInRedirectUrl({ origin: "https://www.oryzaonline.in" }, SITE, "/admin/clients")).toBe("https://www.oryzaonline.in/admin/auth/callback?next=%2Fadmin%2Fclients");
    expect(signInRedirectUrl({ origin: "https://oryzaonline.in" }, SITE, undefined)).toBe("https://oryzaonline.in/admin/auth/callback?next=%2Fadmin");
  });

  it("Vercel preview: uses the preview's own address", () => {
    expect(signInRedirectUrl({ origin: "https://oryza-git-fix-jansiddiquis-projects.vercel.app" }, SITE, "/admin/today")).toBe("https://oryza-git-fix-jansiddiquis-projects.vercel.app/admin/auth/callback?next=%2Fadmin%2Ftoday");
    expect(signInRedirectUrl({ host: "internal:3000", forwardedHost: "oryza-abc-jansiddiquis-projects.vercel.app", forwardedProto: "https" }, SITE, "/admin")).toBe("https://oryza-abc-jansiddiquis-projects.vercel.app/admin/auth/callback?next=%2Fadmin");
  });

  it("local development: http://localhost only when the request really is local", () => {
    expect(signInRedirectUrl({ origin: "http://localhost:3000" }, SITE, "/admin")).toBe("http://localhost:3000/admin/auth/callback?next=%2Fadmin");
    expect(signInRedirectUrl({ host: "localhost:3000" }, SITE, "/admin")).toBe("http://localhost:3000/admin/auth/callback?next=%2Fadmin");
    expect(signInRedirectUrl({ host: "127.0.0.1:3100" }, SITE, "/admin")).toBe("http://127.0.0.1:3100/admin/auth/callback?next=%2Fadmin");
  });

  it("falls back to NEXT_PUBLIC_SITE_URL, then the production site — never a hard-coded localhost", () => {
    expect(requestOrigin({}, SITE)).toBe(SITE);
    expect(requestOrigin({}, "https://www.oryzaonline.in/")).toBe(SITE);
    expect(requestOrigin({}, undefined)).toBe(SITE);
    expect(requestOrigin({}, "not a url")).toBe(SITE);
    expect(requestOrigin({ origin: "null" }, SITE)).toBe(SITE);
  });

  it("ignores odd or unsafe header values", () => {
    expect(requestOrigin({ origin: "javascript:alert(1)" }, SITE)).toBe(SITE);
    expect(requestOrigin({ origin: "http://www.oryzaonline.in" }, SITE)).toBe(SITE); // plain http only for local
    expect(requestOrigin({ host: "evil.com/path?x" }, SITE)).toBe(SITE);
    expect(requestOrigin({ forwardedHost: "a.vercel.app, b.example", forwardedProto: "https, http" }, SITE)).toBe("https://a.vercel.app");
  });

  it("only allows admin paths after sign-in (no open redirect)", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/admin/../x", "/", "/admin?x=1"]) {
      expect(signInRedirectUrl({ origin: SITE }, SITE, bad)).toBe(`${SITE}/admin/auth/callback?next=%2Fadmin`);
    }
  });
});

describe("safety net: a code on an admin page goes to the callback", () => {
  const fwd = (u: string) => forwardToCallback(new URL(u))?.toString() ?? null;

  it("forwards /admin pages that received ?code=", () => {
    expect(fwd("https://www.oryzaonline.in/admin?code=abc")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin");
    expect(fwd("https://www.oryzaonline.in/admin/login?code=abc")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin");
    expect(fwd("https://www.oryzaonline.in/admin/today?code=abc")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin%2Ftoday");
    expect(fwd("https://www.oryzaonline.in/admin/login?code=abc&next=/admin/leads")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin%2Fleads");
    expect(fwd("https://www.oryzaonline.in/admin/login?code=abc&next=https://evil.com")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin");
    expect(fwd("http://localhost:3000/admin/?token_hash=t&type=magiclink")).toBe("http://localhost:3000/admin/auth/callback?token_hash=t&type=magiclink&next=%2Fadmin");
  });

  it("leaves the callback itself, other admin URLs and public pages alone", () => {
    expect(fwd("https://www.oryzaonline.in/admin/auth/callback?code=abc")).toBeNull();
    expect(fwd("https://www.oryzaonline.in/admin/today")).toBeNull();
    expect(fwd("https://www.oryzaonline.in/?code=abc")).toBeNull();
    expect(fwd("https://www.oryzaonline.in/administrator?code=abc")).toBeNull();
  });

  it("the proxy redirects before anything else (no login bounce that would lose the code)", async () => {
    const { proxy, config } = await import("@/proxy");
    const res = await proxy(new NextRequest("https://www.oryzaonline.in/admin/login?code=abc"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.oryzaonline.in/admin/auth/callback?code=abc&next=%2Fadmin");
    expect(res.headers.get("x-robots-tag")).toMatch(/noindex/);
    // Still /admin only: public pages are untouched.
    expect(config.matcher).toEqual(["/admin", "/admin/:path*"]);
  });
});

/* ---------- the callback route and the login action ---------- */
const s = vi.hoisted(() => ({
  exchange: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
  signInWithOtp: vi.fn<(x: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
  admin: true,
  headers: new Headers(),
}));
vi.mock("@/lib/supabase/server", () => ({
  sessionClient: async () => ({ auth: { exchangeCodeForSession: s.exchange, verifyOtp: s.verifyOtp, signOut: s.signOut, signInWithOtp: s.signInWithOtp } }),
}));
vi.mock("@/lib/admin/auth", () => ({ lookupAdmin: async () => (s.admin ? { email: "owner@oryza.test", role: "owner" } : null) }));
vi.mock("@/lib/supabase/admin", () => ({ serviceConfigured: () => true, serviceClient: () => ({ rpc: async () => ({ data: true, error: null }) }) }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: () => true }));
vi.mock("next/headers", () => ({ headers: async () => s.headers }));

beforeEach(() => {
  s.admin = true;
  s.exchange.mockReset().mockResolvedValue({ data: { user: { email: "owner@oryza.test" } }, error: null });
  s.verifyOtp.mockReset().mockResolvedValue({ data: { user: { email: "owner@oryza.test" } }, error: null });
  s.signOut.mockClear();
  s.signInWithOtp.mockClear();
});

describe("callback (/admin/auth/callback)", () => {
  const get = async (q: string) => {
    const { GET } = await import("@/app/admin/auth/callback/route");
    const res = await GET(new Request(`https://www.oryzaonline.in/admin/auth/callback${q}`));
    return { status: res.status, location: res.headers.get("location") };
  };

  it("exchanges the code (PKCE) and opens the requested admin page", async () => {
    expect(await get("?code=abc&next=%2Fadmin%2Fleads")).toEqual({ status: 307, location: "https://www.oryzaonline.in/admin/leads" });
    expect(s.exchange).toHaveBeenCalledWith("abc");
  }, 30_000);

  it("opens /admin when next is missing or unsafe", async () => {
    expect((await get("?code=abc")).location).toBe("https://www.oryzaonline.in/admin");
    expect((await get("?code=abc&next=https%3A%2F%2Fevil.com")).location).toBe("https://www.oryzaonline.in/admin");
  });

  it("verifies token_hash links too", async () => {
    expect((await get("?token_hash=t1&type=magiclink&next=%2Fadmin%2Ftoday")).location).toBe("https://www.oryzaonline.in/admin/today");
    expect(s.verifyOtp).toHaveBeenCalledWith({ token_hash: "t1", type: "magiclink" });
    await get("?token_hash=t2&type=bogus");
    expect(s.verifyOtp).toHaveBeenLastCalledWith({ token_hash: "t2", type: "email" });
  });

  it("expired, used or missing codes go to the login page with the 'link' message", async () => {
    s.exchange.mockResolvedValue({ data: { user: null }, error: { message: "invalid flow state, no valid flow state found" } });
    expect((await get("?code=old")).location).toBe("https://www.oryzaonline.in/admin/login?error=link");
    expect((await get("")).location).toBe("https://www.oryzaonline.in/admin/login?error=link");
    expect((await get("?error=access_denied&error_code=otp_expired")).location).toBe("https://www.oryzaonline.in/admin/login?error=link");
  });

  it("signs out anyone not on the allow-list", async () => {
    s.admin = false;
    expect((await get("?code=abc")).location).toBe("https://www.oryzaonline.in/admin/login?error=denied");
    expect(s.signOut).toHaveBeenCalled();
  });
});

describe("login page message", () => {
  it("explains an expired or used link and opens the email-link tab", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const Login = (await import("@/app/admin/login/page")).default;
    const html = renderToStaticMarkup(await Login({ searchParams: Promise.resolve({ error: "link" }) }));
    expect(html).toContain("This link has expired or was already used — request a new one");
    expect(html).toMatch(/aria-selected="true"[^>]*>Email link/);
  });
});

describe("sendSignInLink", () => {
  const send = async (headers: Record<string, string>, next = "/admin/clients") => {
    s.headers = new Headers(headers);
    const { sendSignInLink } = await import("@/app/admin/login/actions");
    const fd = new FormData();
    fd.set("email", "owner@oryza.test");
    fd.set("next", next);
    expect(await sendSignInLink({}, fd)).toEqual({ sent: true });
    return (s.signInWithOtp.mock.calls.at(-1)![0] as { options: { emailRedirectTo: string; shouldCreateUser: boolean } }).options;
  };

  it("sends the link back to the callback on the site in use, never creating users", async () => {
    expect(await send({ origin: "https://www.oryzaonline.in", host: "www.oryzaonline.in" })).toEqual({ emailRedirectTo: "https://www.oryzaonline.in/admin/auth/callback?next=%2Fadmin%2Fclients", shouldCreateUser: false });
    expect((await send({ host: "oryza-x-jansiddiquis-projects.vercel.app", "x-forwarded-proto": "https" })).emailRedirectTo).toBe("https://oryza-x-jansiddiquis-projects.vercel.app/admin/auth/callback?next=%2Fadmin%2Fclients");
    expect((await send({ origin: "http://localhost:3000" }, "/elsewhere")).emailRedirectTo).toBe("http://localhost:3000/admin/auth/callback?next=%2Fadmin");
  }, 30_000);

  it("does not send to emails that are not on the allow-list (same answer either way)", async () => {
    s.admin = false;
    s.headers = new Headers({ origin: SITE });
    const { sendSignInLink } = await import("@/app/admin/login/actions");
    const fd = new FormData();
    fd.set("email", "stranger@example.com");
    expect(await sendSignInLink({}, fd)).toEqual({ sent: true });
    expect(s.signInWithOtp).not.toHaveBeenCalled();
  });
});
