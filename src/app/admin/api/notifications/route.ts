import { NextResponse } from "next/server";
import { AdminAuthError, assertAdmin } from "@/lib/admin/auth";
import { notifications } from "@/lib/admin/shell-data";

/** Recent client answers, new leads and the overdue count for the bell (signed-in admins only; read-only). */
export async function GET() {
  try {
    await assertAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ ok: false }, { status: e.status });
    throw e;
  }
  return NextResponse.json({ ok: true, ...(await notifications()) }, { headers: { "Cache-Control": "private, no-store" } });
}
