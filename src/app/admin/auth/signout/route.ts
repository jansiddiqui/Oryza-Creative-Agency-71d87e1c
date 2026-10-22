import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { sessionClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (supabaseConfigured()) await (await sessionClient()).auth.signOut();
  const res = NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
  res.cookies.delete(REMEMBER_COOKIE);
  return res;
}
