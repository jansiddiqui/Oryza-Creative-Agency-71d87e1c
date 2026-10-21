import { NextResponse } from "next/server";
import { rateOk, respond } from "@/lib/admin/approvals-data";
import { visitorIp } from "../../../request";

/**
 * The client's answer on an approval link. No login: the signed link itself is the permission, checked again here
 * (signature, expiry, revocation) for every answer, and each visitor is limited to 30 answers per 10 minutes.
 */
export const dynamic = "force-dynamic";

const reply = (body: { ok: boolean; error?: string; count?: number }, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw).slice(0, 200);
  let body: { itemIds?: unknown; decision?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply({ ok: false, error: "This request is not valid." }, 400);
  }
  const itemIds = Array.isArray(body.itemIds) ? body.itemIds.slice(0, 60).map(String) : [];
  const decision = body.decision;
  if (decision !== "approved" && decision !== "changes") return reply({ ok: false, error: "Choose approve or request changes." }, 400);
  if (!(await rateOk("share-answer", await visitorIp(), 30, 600))) return reply({ ok: false, error: "Too many answers in a short time. Please wait a few minutes and try again." }, 429);
  const res = await respond(token, itemIds, decision, String(body.comment ?? ""));
  if (res.ok) return reply({ ok: true, count: res.count });
  if (res.state === "expired") return reply({ ok: false, error: "This link has expired. Ask Oryza for a new one." }, 410);
  if (res.state === "revoked") return reply({ ok: false, error: "This link has been switched off. Ask Oryza for a new one." }, 410);
  if (res.state === "invalid") return reply({ ok: false, error: "This link is not valid." }, 404);
  return reply({ ok: false, error: decision === "changes" ? "Please write what you would like changed." : "Nothing to approve." }, 422);
}
