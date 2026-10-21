import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runReminders } from "@/lib/admin/reminders-run";
import { serviceConfigured } from "@/lib/supabase/admin";

/**
 * Daily reminders, called by Vercel Cron (vercel.json): 8:45 am IST runs everything (digest, approval and renewal
 * reminders); 6:00 pm IST runs approval reminders again. Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else gets 401 and nothing runs.
 */
export const dynamic = "force-dynamic";

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  return secret.length >= 16 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ ok: false }, { status: 401, headers: { "X-Robots-Tag": "noindex" } });
  if (!serviceConfigured()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  const kind = new URL(req.url).searchParams.get("only");
  const kinds = kind === "approval" ? (["approval"] as const) : (["digest", "approval", "renewal"] as const);
  const res = await runReminders(new Date(), [...kinds]);
  return NextResponse.json({ ok: true, ...res }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
