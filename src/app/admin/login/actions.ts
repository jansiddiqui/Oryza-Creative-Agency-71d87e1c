"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { lookupAdmin } from "@/lib/admin/auth";
import { serviceConfigured } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { sessionClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { safeNext } from "@/lib/admin/safe-next";

export type LoginState = { error?: string; sent?: boolean };

const notReady = { error: "The admin is not connected to Supabase yet. See docs/supabase-setup.md." };
const email = (fd: FormData) => String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);

export async function passwordSignIn(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!supabaseConfigured() || !serviceConfigured()) return notReady;
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email(fd), password: String(fd.get("password") ?? "") });
  if (error) return { error: "That email and password did not match." };
  if (!(await lookupAdmin(email(fd)))) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the admin." };
  }
  redirect(safeNext(fd.get("next")));
}

/**
 * Sends a one-time sign-in link — only to allow-listed emails that already have a login (never creates
 * accounts), and the answer is the same either way so it reveals nothing.
 */
export async function sendSignInLink(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!supabaseConfigured() || !serviceConfigured()) return notReady;
  const address = email(fd);
  if (address && (await lookupAdmin(address))) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const origin = h.get("origin") ?? (host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : site.url);
    const supabase = await sessionClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${origin}/admin/auth/callback?next=${encodeURIComponent(safeNext(fd.get("next")))}`, shouldCreateUser: false },
    });
    if (error) console.error("[admin] sign-in link failed:", error.message);
  }
  return { sent: true };
}
