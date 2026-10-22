import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { lookupAdmin } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/admin/safe-next";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";

const OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "recovery", "invite", "signup", "email_change"];

/**
 * Finishes an email sign-in link and opens the admin. The usual link carries a one-time `code` (PKCE: it only
 * works in the browser that asked for it); a `token_hash` link (custom email template) is verified directly.
 * Expired, used or broken links go back to the login page with a clear message.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));
  // A failed password-reset link goes back to "Forgot password?" so a new one is one step away.
  const back = (error: string) =>
    NextResponse.redirect(new URL(error === "link" && next === "/admin/reset-password" ? "/admin/forgot-password?error=expired" : `/admin/login?error=${error}`, url));

  if (!code && !tokenHash) return back("link");
  // An email link always gives the normal (remembered) session.
  const supabase = await sessionClient({ temporary: false });
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type && OTP_TYPES.includes(type) ? type : "email" });
  if (error || !data.user?.email) return back("link");
  if (!(await lookupAdmin(data.user.email))) {
    await supabase.auth.signOut();
    return back("denied");
  }
  const res = NextResponse.redirect(new URL(next, url));
  res.cookies.delete(REMEMBER_COOKIE);
  return res;
}
