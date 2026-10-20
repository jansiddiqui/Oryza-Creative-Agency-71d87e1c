/** Pure helpers for leads (shared by the admin UI, CSV export and tests). */
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";

export interface Lead {
  id: string;
  createdAt: string;
  source: "contact" | "plan-builder";
  name: string;
  phone: string;
  business: string;
  category: string;
  city: string;
  message: string;
  planSummary: string;
  answers: Record<string, unknown> | null;
  status: LeadStatus;
  notes: string;
  emailSent: boolean;
  emailError: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

/** wa.me link for an Indian or international number; null when it cannot be a WhatsApp number. */
export function whatsappFor(phone: string, text?: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  if (d.length < 11 || d.length > 15) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const statusLabel = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.id === s)?.label ?? s;

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote every cell; neutralise spreadsheet formulas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function leadsToCsv(leads: Lead[]): string {
  const header = ["Received", "Status", "Name", "Phone / WhatsApp", "Business", "Category", "City", "Source", "Message", "Plan summary", "Notes", "Email sent"];
  const rows = leads.map((l) => [
    l.createdAt,
    statusLabel(l.status),
    l.name,
    l.phone,
    l.business,
    l.category,
    l.city,
    l.source,
    l.message,
    l.planSummary,
    l.notes,
    l.emailSent ? "yes" : "no",
  ]);
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
