import { NextResponse } from "next/server";
import { lookupAdmin } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/admin/safe-next";

/** Finishes an email sign-in link: exchanges the one-time code for a session, then checks the allow-list. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/admin/login?error=link", url));
  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) return NextResponse.redirect(new URL("/admin/login?error=link", url));
  if (!(await lookupAdmin(data.user.email))) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?error=denied", url));
  }
  return NextResponse.redirect(new URL(next, url));
}
