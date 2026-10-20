import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { serviceConfigured } from "@/lib/supabase/admin";
import { markLeadEmail, saveLead } from "@/lib/leads";

/**
 * Receives inquiries from the contact form and the plan builder.
 * 1. Saves the lead in the database FIRST (so it is never lost), with the plan answers and summary.
 * 2. Emails it to Oryza via Resend and records whether the email went out.
 * The visitor sees success if either step worked; it only fails when both did.
 */
const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Plan answers arrive as a JSON string; keep them only if they parse to a small object. */
function parseAnswers(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "string" || !v || v.length > 20000) return null;
  try {
    const o = JSON.parse(v);
    return o && typeof o === "object" && !Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

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
    source: body.source === "plan-builder" ? ("plan-builder" as const) : ("contact" as const),
    name: clean(body.name, 100),
    phone: clean(body.phone, 20).replace(/[^\d+]/g, ""),
    business: clean(body.business, 150),
    category: clean(body.category, 60),
    city: clean(body.city, 80),
    message: clean(body.message, 2000),
    planSummary: clean(body.plan, 8000),
    answers: parseAnswers(body.answers),
  };
  if (!lead.name || lead.phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "name_and_phone_required" }, { status: 422 });
  }

  // 1. Save first.
  let leadId: string | null = null;
  if (serviceConfigured()) {
    try {
      leadId = await saveLead(lead);
    } catch (err) {
      console.error("[lead] could not save to the database:", (err as Error).message);
    }
  }

  // 2. Email.
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || site.email;
  const from = process.env.LEAD_FROM_EMAIL || "Oryza Website <website@oryzaonline.in>";
  let emailed = false;
  let emailError = "";
  if (!key) {
    emailError = "RESEND_API_KEY is not set";
    console.error("[lead] RESEND_API_KEY is not set — lead not emailed");
  } else {
    const text = [
      `Name: ${lead.name}`,
      `Phone/WhatsApp: ${lead.phone}`,
      `Business: ${lead.business}`,
      `Category: ${lead.category}`,
      `City: ${lead.city}`,
      `Source: ${lead.source === "plan-builder" ? "Plan builder" : "Contact form"}`,
      "",
      lead.message,
      lead.planSummary ? `\n--- Plan summary ---\n${lead.planSummary}` : "",
      leadId ? `\nSaved in the admin: ${site.url}/admin/leads` : "",
    ].join("\n");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject: `New Oryza lead: ${lead.business || lead.name}`, text }),
      });
      emailed = res.ok;
      if (!res.ok) {
        emailError = `Resend ${res.status} ${await res.text().catch(() => "")}`.slice(0, 500);
        console.error(`[lead] Resend rejected the email: ${emailError}`);
      }
    } catch (err) {
      emailError = (err as Error).message;
      console.error("[lead] Could not reach Resend", err);
    }
  }
  if (leadId) await markLeadEmail(leadId, emailed, emailError).catch(() => undefined);

  if (leadId || emailed) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, error: key ? "send_failed" : "not_configured" }, { status: key ? 502 : 503 });
}
