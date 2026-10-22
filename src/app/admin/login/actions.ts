"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { visitorIp } from "@/app/share/request";
import { lookupAdmin } from "@/lib/admin/auth";
import { authRateOk } from "@/lib/admin/auth-limits";
import { signInRedirectUrl, type OriginHeaders } from "@/lib/admin/auth-redirect";
import { signInErrorMessage } from "@/lib/admin/password";
import { safeNext } from "@/lib/admin/safe-next";
import { serviceConfigured } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { sessionClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sent?: boolean };

const notReady = { error: "The admin is not connected to Supabase yet. See docs/supabase-setup.md." };
const TOO_MANY = "Too many attempts — try again in a minute.";
const email = (fd: FormData) => String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);

async function originHeaders(): Promise<OriginHeaders> {
  const h = await headers();
  return { origin: h.get("origin"), host: h.get("host"), forwardedHost: h.get("x-forwarded-host"), forwardedProto: h.get("x-forwarded-proto") };
}

export async function passwordSignIn(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!supabaseConfigured() || !serviceConfigured()) return notReady;
  const address = email(fd);
  const password = String(fd.get("password") ?? "");
  if (!address || !password) return { error: "Enter your email and password." };
  const ip = await visitorIp();
  if (!(await authRateOk("password", `${ip}|${address}`)) || !(await authRateOk("passwordIp", ip))) return { error: TOO_MANY };

  // "Remember me" off: the session ends when the browser closes (see lib/supabase/remember).
  const remember = fd.get("remember") === "on";
  const jar = await cookies();
  jar.set(REMEMBER_COOKIE, remember ? "1" : "0", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(remember ? { maxAge: 60 * 60 * 24 * 400 } : {}) });

  const supabase = await sessionClient({ temporary: !remember });
  const { error } = await supabase.auth.signInWithPassword({ email: address, password });
  if (error) return { error: signInErrorMessage(error) };
  if (!(await lookupAdmin(address))) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the admin." };
  }
  redirect(safeNext(fd.get("next")));
}

/** Both email flows answer the same way whether or not the address has access, so nothing is revealed. */
const NEUTRAL: LoginState = { sent: true };

async function emailAllowed(address: string): Promise<boolean> {
  const ip = await visitorIp();
  // Count both limits every time (no short-circuit), so the per-IP limit also covers unknown addresses.
  const [perAddress, perIp] = await Promise.all([authRateOk("email", address), authRateOk("emailIp", ip)]);
  return perAddress && perIp;
}

/**
 * Sends a one-time sign-in link — only to allow-listed emails that already have a login (never creates
 * accounts), and the answer is the same either way so it reveals nothing.
 */
export async function sendSignInLink(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!supabaseConfigured() || !serviceConfigured()) return notReady;
  const address = email(fd);
  if (!address) return { error: "Enter your email." };
  if (!(await emailAllowed(address))) return { error: TOO_MANY };
  if (await lookupAdmin(address)) {
    // Back to the callback on the site in use (production, preview or local), never a hard-coded address.
    const emailRedirectTo = signInRedirectUrl(await originHeaders(), process.env.NEXT_PUBLIC_SITE_URL, fd.get("next"));
    const supabase = await sessionClient();
    const { error } = await supabase.auth.signInWithOtp({ email: address, options: { emailRedirectTo, shouldCreateUser: false } });
    if (error) console.error("[admin] sign-in link failed:", error.status ?? "", error.code ?? "");
  }
  return NEUTRAL;
}

/**
 * "Forgot password?": emails a reset link (Supabase's Reset Password template, {{ .ConfirmationURL }}) that comes
 * back through the callback to /admin/reset-password. Same answer whether or not the email exists.
 */
export async function requestPasswordReset(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!supabaseConfigured() || !serviceConfigured()) return notReady;
  const address = email(fd);
  if (!address || !address.includes("@")) return { error: "Enter the email you sign in with." };
  if (!(await emailAllowed(address))) return { error: TOO_MANY };
  if (await lookupAdmin(address)) {
    const redirectTo = signInRedirectUrl(await originHeaders(), process.env.NEXT_PUBLIC_SITE_URL, "/admin/reset-password");
    const supabase = await sessionClient();
    const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
    if (error) console.error("[admin] reset email failed:", error.status ?? "", error.code ?? "");
  }
  return NEUTRAL;
}
