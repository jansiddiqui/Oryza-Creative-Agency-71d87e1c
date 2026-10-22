import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { newPasswordProblem, passwordStrength, recentEmailSignIn, signInErrorMessage } from "./password";
import { sessionCookieOptions } from "@/lib/supabase/remember";

/* ---------------------------------------------------------------- pure rules */
describe("password rules and strength", () => {
  it("needs at least 10 characters", () => {
    expect(passwordStrength("short").label).toBe("Too short");
    expect(newPasswordProblem("abc12345", "abc12345")).toMatch(/at least 10/);
  });

  it("rates common, personal and repetitive passwords as weak", () => {
    expect(passwordStrength("password123").score).toBe(1);
    expect(passwordStrength("aaaaaaaaaaaa").score).toBe(1);
    expect(passwordStrength("1234567890ab").score).toBe(1);
    expect(passwordStrength("ashaverma-2026", "ashaverma@oryza.test").score).toBe(1);
    expect(newPasswordProblem("password123", "password123")).toMatch(/too easy/);
  });

  it("rewards length and variety", () => {
    expect(passwordStrength("monsoon tea").score).toBeGreaterThanOrEqual(1);
    expect(passwordStrength("Monsoon-tea-29").score).toBeGreaterThanOrEqual(3);
    expect(passwordStrength("quiet river lamp Kanpur 7!").label).toBe("Strong");
  });

  it("the confirm field must match", () => {
    expect(newPasswordProblem("Monsoon-tea-29", "Monsoon-tea-28")).toBe("The two passwords do not match.");
    expect(newPasswordProblem("Monsoon-tea-29", "Monsoon-tea-29")).toBeNull();
    expect(newPasswordProblem("x".repeat(73), "x".repeat(73))).toMatch(/at most 72/);
  });

  it("clear sign-in errors: wrong details vs too many attempts, never the raw error", () => {
    expect(signInErrorMessage({ status: 400, code: "invalid_credentials", message: "Invalid login credentials" })).toBe("Wrong email or password.");
    expect(signInErrorMessage({ status: 429, message: "x" })).toBe("Too many attempts — try again in a minute.");
    expect(signInErrorMessage({ code: "over_request_rate_limit" })).toBe("Too many attempts — try again in a minute.");
  });

  it("a password can be set without the current one only right after an email link", () => {
    const now = 1_800_000_000;
    expect(recentEmailSignIn([{ method: "recovery", timestamp: now - 60 }], now)).toBe(true);
    expect(recentEmailSignIn([{ method: "otp", timestamp: now - 600 }], now)).toBe(true);
    expect(recentEmailSignIn([{ method: "recovery", timestamp: now - 16 * 60 }], now)).toBe(false);
    expect(recentEmailSignIn([{ method: "password", timestamp: now - 10 }], now)).toBe(false);
    expect(recentEmailSignIn(undefined, now)).toBe(false);
    expect(recentEmailSignIn([{ method: "recovery", timestamp: "soon" }], now)).toBe(false);
  });

  it("'Remember me' off makes the auth cookies end with the browser", () => {
    const o = { path: "/", maxAge: 400 * 86400, sameSite: "lax" as const };
    expect(sessionCookieOptions(o, false)).toBe(o);
    expect(sessionCookieOptions(o, true)).toEqual({ path: "/", sameSite: "lax" });
  });
});

/* ---------------------------------------------------------------- server side, with Supabase mocked */
const s = vi.hoisted(() => ({
  admins: new Set(["owner@oryza.test"]),
  rate: new Map<string, number>(),
  rateMax: {} as Record<string, number>,
  rpcError: false,
  jar: new Map<string, { value: string; options?: Record<string, unknown> }>(),
  headers: new Headers({ origin: "https://www.oryzaonline.in", "x-forwarded-for": "203.0.113.7" }),
  sessionOpts: [] as unknown[],
  signIn: vi.fn(),
  otp: vi.fn<(x: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
  reset: vi.fn<(e: string, o: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
  update: vi.fn<(x: unknown) => Promise<{ error: null | { code: string } }>>(async () => ({ error: null })),
  signOut: vi.fn<(x?: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
  claims: { amr: [] as unknown[] },
  exchange: vi.fn(),
  checkSignIn: vi.fn(),
  checkSignOut: vi.fn<(x?: unknown) => Promise<{ error: null }>>(async () => ({ error: null })),
}));

vi.mock("next/headers", () => ({
  headers: async () => s.headers,
  cookies: async () => ({
    get: (n: string) => (s.jar.has(n) ? { name: n, value: s.jar.get(n)!.value } : undefined),
    getAll: () => [...s.jar].map(([name, v]) => ({ name, value: v.value })),
    set: (n: string, value: string, options?: Record<string, unknown>) => s.jar.set(n, { value, options }),
    delete: (n: string) => s.jar.delete(n),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { to }); } }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfigured: () => true, SUPABASE_URL: "https://demo.supabase.co", SUPABASE_ANON_KEY: "anon" }));
vi.mock("@/lib/supabase/admin", () => ({
  serviceConfigured: () => true,
  serviceClient: () => ({
    rpc: async (...[, a]: [string, { p_key: string; p_max: number }]) => {
      if (s.rpcError) return { data: null, error: { message: "db down" } };
      const n = (s.rate.get(a.p_key) ?? 0) + 1;
      s.rate.set(a.p_key, n);
      const scope = a.p_key.split(":")[1];
      return { data: n <= (s.rateMax[scope] ?? a.p_max), error: null };
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  sessionClient: async (opts?: unknown) => {
    s.sessionOpts.push(opts);
    return { auth: { signInWithPassword: s.signIn, signInWithOtp: s.otp, resetPasswordForEmail: s.reset, updateUser: s.update, signOut: s.signOut, getClaims: async () => ({ data: { claims: s.claims }, error: null }), exchangeCodeForSession: s.exchange, verifyOtp: vi.fn() } };
  },
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { signInWithPassword: s.checkSignIn, signOut: s.checkSignOut } }) }));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  lookupAdmin: async (e: string) => (s.admins.has(e) ? { email: e, role: "owner" } : null),
  assertAdmin: async () => ({ email: "owner@oryza.test", role: "owner" }),
}));

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  s.rate.clear();
  s.rateMax = {};
  s.rpcError = false;
  s.jar.clear();
  s.sessionOpts = [];
  s.claims = { amr: [] };
  s.signIn.mockReset().mockResolvedValue({ error: null });
  s.checkSignIn.mockReset().mockResolvedValue({ error: null });
  for (const f of [s.otp, s.reset, s.update, s.signOut, s.checkSignOut]) f.mockClear();
  s.update.mockResolvedValue({ error: null });
  s.exchange.mockReset().mockResolvedValue({ data: { user: { email: "owner@oryza.test" } }, error: null });
});

describe("rate limits", () => {
  it("keys are hashed — no email or IP is stored", async () => {
    const { authKey } = await import("./auth-limits");
    const k = authKey("email", "Owner@Oryza.test ", "secret");
    expect(k).toMatch(/^auth:email:[0-9a-f]{32}$/);
    expect(k).not.toContain("oryza");
    expect(authKey("email", "owner@oryza.test", "secret")).toBe(k);
  });

  it("allows up to the limit, then refuses; a database error does not lock anyone out", async () => {
    const { authRateOk, AUTH_LIMITS } = await import("./auth-limits");
    for (let i = 0; i < AUTH_LIMITS.email.max; i++) expect(await authRateOk("email", "a@b.c")).toBe(true);
    expect(await authRateOk("email", "a@b.c")).toBe(false);
    expect(await authRateOk("email", "other@b.c")).toBe(true);
    s.rpcError = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await authRateOk("email", "a@b.c")).toBe(true);
  });
});

describe("sign in with a password", () => {
  it("wrong email or password → one clear message", async () => {
    s.signIn.mockResolvedValue({ error: { status: 400, code: "invalid_credentials", message: "Invalid login credentials" } });
    const { passwordSignIn } = await import("@/app/admin/login/actions");
    expect(await passwordSignIn({}, form({ email: "owner@oryza.test", password: "nope", remember: "on" }))).toEqual({ error: "Wrong email or password." });
  }, 30_000);

  it("after 5 tries in a minute: too many attempts, and Supabase is not even asked", async () => {
    s.signIn.mockResolvedValue({ error: { status: 400, message: "Invalid login credentials" } });
    const { passwordSignIn } = await import("@/app/admin/login/actions");
    for (let i = 0; i < 5; i++) await passwordSignIn({}, form({ email: "owner@oryza.test", password: "nope" }));
    expect(await passwordSignIn({}, form({ email: "owner@oryza.test", password: "nope" }))).toEqual({ error: "Too many attempts — try again in a minute." });
    expect(s.signIn).toHaveBeenCalledTimes(5);
  });

  it("Remember me on: normal session; off: browser-session cookies", async () => {
    const { passwordSignIn } = await import("@/app/admin/login/actions");
    await expect(passwordSignIn({}, form({ email: "owner@oryza.test", password: "right-password", remember: "on", next: "/admin/leads" }))).rejects.toMatchObject({ to: "/admin/leads" });
    expect(s.jar.get("oz_remember")?.value).toBe("1");
    expect(s.sessionOpts.at(-1)).toEqual({ temporary: false });
    await expect(passwordSignIn({}, form({ email: "owner@oryza.test", password: "right-password" }))).rejects.toMatchObject({ to: "/admin" });
    expect(s.jar.get("oz_remember")).toMatchObject({ value: "0", options: expect.not.objectContaining({ maxAge: expect.anything() }) });
    expect(s.sessionOpts.at(-1)).toEqual({ temporary: true });
  });

  it("a valid login without admin access is signed straight out", async () => {
    s.admins.delete("x@oryza.test");
    const { passwordSignIn } = await import("@/app/admin/login/actions");
    expect(await passwordSignIn({}, form({ email: "x@oryza.test", password: "right-password" }))).toEqual({ error: "This account does not have access to the admin." });
    expect(s.signOut).toHaveBeenCalled();
  });
});

describe("forgot password (neutral, rate-limited)", () => {
  it("emails a reset link that comes back through the callback to /admin/reset-password", async () => {
    const { requestPasswordReset } = await import("@/app/admin/login/actions");
    expect(await requestPasswordReset({}, form({ email: "Owner@Oryza.test" }))).toEqual({ sent: true });
    expect(s.reset).toHaveBeenCalledWith("owner@oryza.test", { redirectTo: "https://www.oryzaonline.in/admin/auth/callback?next=%2Fadmin%2Freset-password" });
  });

  it("uses the preview or local origin when that is where it was asked", async () => {
    const { requestPasswordReset } = await import("@/app/admin/login/actions");
    s.headers = new Headers({ origin: "https://oryza-git-auth-jansiddiquis-projects.vercel.app" });
    await requestPasswordReset({}, form({ email: "owner@oryza.test" }));
    expect(s.reset.mock.calls.at(-1)![1]).toEqual({ redirectTo: "https://oryza-git-auth-jansiddiquis-projects.vercel.app/admin/auth/callback?next=%2Fadmin%2Freset-password" });
    s.headers = new Headers({ origin: "http://localhost:3000" });
    await requestPasswordReset({}, form({ email: "owner@oryza.test" }));
    expect(s.reset.mock.calls.at(-1)![1]).toEqual({ redirectTo: "http://localhost:3000/admin/auth/callback?next=%2Fadmin%2Freset-password" });
    s.headers = new Headers({ origin: "https://www.oryzaonline.in" });
  });

  it("answers exactly the same for an unknown email, and sends nothing", async () => {
    const { requestPasswordReset, sendSignInLink } = await import("@/app/admin/login/actions");
    const known = await requestPasswordReset({}, form({ email: "owner@oryza.test" }));
    const unknown = await requestPasswordReset({}, form({ email: "stranger@example.com" }));
    expect(unknown).toEqual(known);
    expect(s.reset).toHaveBeenCalledTimes(1);
    expect(await sendSignInLink({}, form({ email: "stranger@example.com" }))).toEqual({ sent: true });
    expect(s.otp).not.toHaveBeenCalled();
  });

  it("3 requests per address, then 'too many' — for known and unknown emails alike", async () => {
    const { requestPasswordReset } = await import("@/app/admin/login/actions");
    for (const email of ["owner@oryza.test", "stranger@example.com"]) {
      for (let i = 0; i < 3; i++) expect(await requestPasswordReset({}, form({ email }))).toEqual({ sent: true });
      expect(await requestPasswordReset({}, form({ email }))).toEqual({ error: "Too many attempts — try again in a minute." });
    }
    expect(s.reset).toHaveBeenCalledTimes(3);
  });

  it("limits each IP too (10 per hour across addresses)", async () => {
    const { requestPasswordReset } = await import("@/app/admin/login/actions");
    for (let i = 0; i < 10; i++) expect(await requestPasswordReset({}, form({ email: `p${i}@example.com` }))).toEqual({ sent: true });
    expect(await requestPasswordReset({}, form({ email: "p99@example.com" }))).toEqual({ error: "Too many attempts — try again in a minute." });
  });
});

describe("reset link → callback → new password", () => {
  const get = async (q: string) => {
    const { GET } = await import("@/app/admin/auth/callback/route");
    const res = await GET(new Request(`https://www.oryzaonline.in/admin/auth/callback${q}`));
    return res.headers.get("location");
  };

  it("the callback exchanges the code and opens the reset page (normal session)", async () => {
    s.jar.set("oz_remember", { value: "0" });
    expect(await get("?code=abc&next=%2Fadmin%2Freset-password")).toBe("https://www.oryzaonline.in/admin/reset-password");
    expect(s.exchange).toHaveBeenCalledWith("abc");
    expect(s.sessionOpts.at(-1)).toEqual({ temporary: false });
  });

  it("an expired or used reset link goes back to 'Forgot password?' with a clear message", async () => {
    s.exchange.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    expect(await get("?code=old&next=%2Fadmin%2Freset-password")).toBe("https://www.oryzaonline.in/admin/forgot-password?error=expired");
    expect(await get("?error=access_denied&error_code=otp_expired&next=%2Fadmin%2Freset-password")).toBe("https://www.oryzaonline.in/admin/forgot-password?error=expired");
    expect(await get("?code=old&next=%2Fadmin")).toBe("https://www.oryzaonline.in/admin/login?error=link");
  });

  it("sets the new password only right after the email link", async () => {
    const { setNewPasswordAction } = await import("@/app/admin/reset-password/actions");
    s.claims = { amr: [{ method: "recovery", timestamp: Math.floor(Date.now() / 1000) - 30 }] };
    expect(await setNewPasswordAction("Monsoon-tea-29", "Monsoon-tea-29")).toEqual({ ok: true, data: { done: true } });
    expect(s.update).toHaveBeenCalledWith({ password: "Monsoon-tea-29" });

    s.update.mockClear();
    s.claims = { amr: [{ method: "password", timestamp: Math.floor(Date.now() / 1000) - 30 }] };
    const r = await setNewPasswordAction("Monsoon-tea-29", "Monsoon-tea-29");
    expect(r).toMatchObject({ ok: true, data: { problem: expect.stringMatching(/reset session has ended/) } });
    expect(s.update).not.toHaveBeenCalled();
  });

  it("checks the rules on the server too", async () => {
    const { setNewPasswordAction } = await import("@/app/admin/reset-password/actions");
    s.claims = { amr: [{ method: "recovery", timestamp: Math.floor(Date.now() / 1000) }] };
    expect(await setNewPasswordAction("short", "short")).toMatchObject({ data: { problem: expect.stringMatching(/at least 10/) } });
    expect(await setNewPasswordAction("Monsoon-tea-29", "Monsoon-tea-30")).toMatchObject({ data: { problem: "The two passwords do not match." } });
    s.update.mockResolvedValue({ error: { code: "same_password" } });
    expect(await setNewPasswordAction("Monsoon-tea-29", "Monsoon-tea-29")).toMatchObject({ data: { problem: expect.stringMatching(/current password/) } });
  });
});

describe("Account: change password and sign out everywhere", () => {
  it("needs the right current password (checked on a separate, closed session)", async () => {
    const { changePasswordAction } = await import("@/app/admin/(panel)/account/actions");
    s.checkSignIn.mockResolvedValue({ error: { status: 400 } });
    expect(await changePasswordAction("wrong", "Monsoon-tea-29", "Monsoon-tea-29")).toMatchObject({ data: { problem: "Your current password is not right." } });
    expect(s.update).not.toHaveBeenCalled();

    s.checkSignIn.mockResolvedValue({ error: null });
    expect(await changePasswordAction("old-password-1", "Monsoon-tea-29", "Monsoon-tea-29")).toEqual({ ok: true, data: { done: true } });
    expect(s.checkSignIn).toHaveBeenLastCalledWith({ email: "owner@oryza.test", password: "old-password-1" });
    expect(s.checkSignOut).toHaveBeenCalledWith({ scope: "local" });
    expect(s.update).toHaveBeenCalledWith({ password: "Monsoon-tea-29" });
  });

  it("is rate-limited (5 checks per 10 minutes)", async () => {
    const { changePasswordAction } = await import("@/app/admin/(panel)/account/actions");
    s.checkSignIn.mockResolvedValue({ error: { status: 400 } });
    for (let i = 0; i < 5; i++) await changePasswordAction(`wrong-${i}`, "Monsoon-tea-29", "Monsoon-tea-29");
    expect(await changePasswordAction("wrong", "Monsoon-tea-29", "Monsoon-tea-29")).toMatchObject({ data: { problem: expect.stringMatching(/Too many attempts/) } });
    expect(s.checkSignIn).toHaveBeenCalledTimes(5);
  });

  it("refuses a new password equal to the current one, or a weak one", async () => {
    const { changePasswordAction } = await import("@/app/admin/(panel)/account/actions");
    expect(await changePasswordAction("Monsoon-tea-29", "Monsoon-tea-29", "Monsoon-tea-29")).toMatchObject({ data: { problem: expect.stringMatching(/different/) } });
    expect(await changePasswordAction("x", "password123", "password123")).toMatchObject({ data: { problem: expect.stringMatching(/too easy/) } });
  });

  it("signs out of all devices (global scope)", async () => {
    const { signOutEverywhereAction } = await import("@/app/admin/(panel)/account/actions");
    s.jar.set("oz_remember", { value: "1" });
    expect(await signOutEverywhereAction()).toEqual({ ok: true, data: undefined });
    expect(s.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(s.jar.has("oz_remember")).toBe(false);
  });
});

describe("proxy", () => {
  it("lets 'Forgot password?' through without a session; the reset page still needs one", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { proxy, isPublicAdminPath } = await import("@/proxy");
    expect(isPublicAdminPath("/admin/forgot-password")).toBe(true);
    expect(isPublicAdminPath("/admin/reset-password")).toBe(false);
    expect((await proxy(new NextRequest("https://www.oryzaonline.in/admin/forgot-password"))).headers.get("location")).toBeNull();
    expect((await proxy(new NextRequest("https://www.oryzaonline.in/admin/reset-password"))).headers.get("location")).toBe("https://www.oryzaonline.in/admin/login?next=%2Fadmin%2Freset-password");
    vi.unstubAllEnvs();
  });
});

describe("sign-in screens keep public bundles unchanged", () => {
  it("login, forgot and reset screens use plain links and full page loads (no next/link or next/navigation)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const files = [
      "app/admin/login/page.tsx",
      "app/admin/forgot-password/page.tsx",
      "app/admin/reset-password/page.tsx",
      "components/admin/LoginForm.tsx",
      "components/admin/auth/AuthLayout.tsx",
      "components/admin/auth/PasswordField.tsx",
      "components/admin/auth/ForgotPasswordForm.tsx",
      "components/admin/auth/ResetPasswordForm.tsx",
    ];
    for (const f of files) {
      const src = readFileSync(join(process.cwd(), "src", f), "utf8");
      expect(src, f).not.toMatch(/from "next\/(link|navigation)"/);
    }
  });
});
