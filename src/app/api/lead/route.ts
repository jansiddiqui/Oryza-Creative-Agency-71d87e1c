import { NextResponse } from "next/server";
import { site } from "@/lib/site";

/**
 * Receives inquiries from the contact form and the plan builder.
 * Delivery: email via Resend (https://resend.com) once RESEND_API_KEY is set and oryzaonline.in is verified
 * in Resend. LEAD_TO_EMAIL defaults to Oryza's inbox; LEAD_FROM_EMAIL must be on the verified domain.
 * Phase 3 also stores leads in the database for the admin panel.
 */
const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  // Honeypot: real visitors never fill this hidden field.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const lead = {
    name: clean(body.name, 100),
    phone: clean(body.phone, 20).replace(/[^\d+]/g, ""),
    business: clean(body.business, 150),
    category: clean(body.category, 60),
    city: clean(body.city, 80),
    message: clean(body.message, 2000),
    plan: clean(body.plan, 8000),
  };
  if (!lead.name || lead.phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "name_and_phone_required" }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || site.email;
  const from = process.env.LEAD_FROM_EMAIL || "Oryza Website <website@oryzaonline.in>";
  if (!key) {
    console.error("[lead] RESEND_API_KEY is not set — lead not delivered");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const text = [
    `Name: ${lead.name}`,
    `Phone/WhatsApp: ${lead.phone}`,
    `Business: ${lead.business}`,
    `Category: ${lead.category}`,
    `City: ${lead.city}`,
    "",
    lead.message,
    lead.plan ? `\n--- Plan summary ---\n${lead.plan}` : "",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `New Oryza lead: ${lead.business || lead.name}`, text }),
    });
    if (!res.ok) {
      console.error(`[lead] Resend rejected the email: ${res.status} ${await res.text().catch(() => "")}`);
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[lead] Could not reach Resend", err);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
