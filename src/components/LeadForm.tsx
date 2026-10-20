"use client";

import { useState } from "react";
import { categories } from "@/data/categories";
import { site, telHref } from "@/lib/site";

export const inputCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-muted/70 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-300/40";
export const labelCls = "mb-1.5 block text-sm font-semibold";

export type LeadResult = "idle" | "sending" | "sent" | "not_configured" | "error";

export async function sendLead(payload: Record<string, string>): Promise<LeadResult> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return "sent";
    const data = await res.json().catch(() => ({}));
    return data.error === "not_configured" ? "not_configured" : "error";
  } catch {
    return "error";
  }
}

export function LeadStatus({ status, waHref }: { status: LeadResult; waHref?: string | null }) {
  if (status === "sent")
    return <p role="status" className="rounded-xl bg-gold-100 px-4 py-3 text-[15px] font-medium">Thank you — our team will contact you on WhatsApp within one working day.</p>;
  if (status === "not_configured" || status === "error")
    return (
      <p role="alert" className="rounded-xl border border-gold-500/50 px-4 py-3 text-[15px]">
        We couldn’t send this online right now.{" "}
        {waHref ? (
          <a className="font-semibold underline" href={waHref} target="_blank" rel="noopener noreferrer">Send it on WhatsApp instead</a>
        ) : (
          <>
            Please call <a className="font-semibold underline" href={telHref(site.phone)}>{site.phone}</a> or email{" "}
            <a className="font-semibold underline" href={`mailto:${site.email}`}>{site.email}</a>.
          </>
        )}
      </p>
    );
  return null;
}

export function LeadForm({
  defaultCategory = "",
  context = "",
  waHref,
  source = "contact",
}: {
  defaultCategory?: string;
  context?: string;
  waHref?: string | null;
  source?: "contact" | "plan-builder";
}) {
  const [status, setStatus] = useState<LeadResult>("idle");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
    if (context) payload.message = `${context}\n\n${payload.message ?? ""}`;
    payload.source = source;
    setStatus("sending");
    setStatus(await sendLead(payload));
  }
  if (status === "sent") return <LeadStatus status={status} />;
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="lf-name" className={labelCls}>Your name</label>
        <input id="lf-name" name="name" required autoComplete="name" className={inputCls} />
      </div>
      <div>
        <label htmlFor="lf-phone" className={labelCls}>WhatsApp number</label>
        <input id="lf-phone" name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9+ \-]{10,16}" className={inputCls} placeholder="+91" />
      </div>
      <div>
        <label htmlFor="lf-business" className={labelCls}>Business or brand name</label>
        <input id="lf-business" name="business" autoComplete="organization" className={inputCls} />
      </div>
      <div>
        <label htmlFor="lf-city" className={labelCls}>City</label>
        <input id="lf-city" name="city" autoComplete="address-level2" className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="lf-category" className={labelCls}>Category</label>
        <select id="lf-category" name="category" defaultValue={defaultCategory} className={inputCls}>
          <option value="">Choose one</option>
          {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="lf-message" className={labelCls}>What do you want from social media?</label>
        <textarea id="lf-message" name="message" rows={4} className={inputCls} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="sm:col-span-2 space-y-3">
        <button type="submit" disabled={status === "sending"} className="rounded-full bg-ink px-7 py-3 font-semibold text-paper hover:bg-ink-soft disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Send to Oryza"}
        </button>
        <LeadStatus status={status} waHref={waHref} />
      </div>
    </form>
  );
}
