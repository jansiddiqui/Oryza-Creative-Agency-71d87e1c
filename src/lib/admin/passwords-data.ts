import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { sessionClient } from "@/lib/supabase/server";
import { authRateOk } from "./auth-limits";
import { newPasswordProblem, recentEmailSignIn, signInErrorMessage } from "./password";

export type PasswordResult = { done: true } | { problem: string };

const updateMessage = (e: { code?: string; message?: string }) =>
  e.code === "same_password"
    ? "That is your current password. Choose a new one."
    : e.code === "weak_password"
      ? "That password is too easy to guess. Try a longer one."
      : e.code === "reauthentication_needed"
        ? "For safety, sign in again with an email link, then change it."
        : "Could not save the password. Please try again.";

/** Reset page: allowed only right after signing in from an email link (reset or magic link). */
export async function setPasswordAfterEmailLink(email: string, password: string, confirm: string): Promise<PasswordResult> {
  const problem = newPasswordProblem(password, confirm, email);
  if (problem) return { problem };
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getClaims();
  if (!recentEmailSignIn(data?.claims?.amr, Math.floor(Date.now() / 1000))) {
    return { problem: "This reset session has ended. Request a new link from “Forgot password?”, or change your password under Account." };
  }
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { problem: updateMessage(error) } : { done: true };
}

/** Account page: the current password must be right (checked on a separate session that is closed straight away). */
export async function changePassword(email: string, current: string, password: string, confirm: string): Promise<PasswordResult> {
  if (!current) return { problem: "Enter your current password." };
  const problem = newPasswordProblem(password, confirm, email);
  if (problem) return { problem };
  if (current === password) return { problem: "The new password must be different from the current one." };
  if (!(await authRateOk("change", email))) return { problem: "Too many attempts — try again in a few minutes." };

  const check = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { error: wrong } = await check.auth.signInWithPassword({ email, password: current });
  if (wrong) return { problem: wrong.status === 429 ? signInErrorMessage(wrong) : "Your current password is not right." };
  await check.auth.signOut({ scope: "local" });

  const { error } = await (await sessionClient()).auth.updateUser({ password });
  return error ? { problem: updateMessage(error) } : { done: true };
}

/** Ends every session of this admin (all browsers and phones), including this one. */
export async function signOutEverywhere(): Promise<void> {
  const { error } = await (await sessionClient()).auth.signOut({ scope: "global" });
  if (error) throw new Error(error.message);
}
