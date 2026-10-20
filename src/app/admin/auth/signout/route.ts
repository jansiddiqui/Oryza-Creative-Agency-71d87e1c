import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { sessionClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (supabaseConfigured()) await (await sessionClient()).auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
