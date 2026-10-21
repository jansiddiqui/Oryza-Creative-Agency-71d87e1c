import { NextResponse } from "next/server";
import { AdminAuthError, assertAdmin } from "@/lib/admin/auth";
import { searchAll } from "@/lib/admin/shell-data";

/** Global search for the command palette (signed-in admins only; read-only). */
export async function GET(req: Request) {
  try {
    await assertAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ ok: false }, { status: e.status });
    throw e;
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ ok: true, hits: await searchAll(q) }, { headers: { "Cache-Control": "private, no-store" } });
}
