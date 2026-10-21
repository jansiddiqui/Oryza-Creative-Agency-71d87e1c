import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import type { LeadStatus } from "@/lib/admin/types";
import type { Lead } from "./leads-format";

export interface LeadInput {
  source: "contact" | "plan-builder";
  name: string;
  phone: string;
  business: string;
  category: string;
  city: string;
  message: string;
  planSummary: string;
  answers: Record<string, unknown> | null;
}

/** Saves a lead (service role — the public cannot write to `leads` directly). Returns its id. */
export async function saveLead(l: LeadInput): Promise<string> {
  const { data, error } = await serviceClient()
    .from("leads")
    .insert({
      source: l.source,
      name: l.name,
      phone: l.phone,
      business: l.business,
      category: l.category,
      city: l.city,
      message: l.message,
      plan_summary: l.planSummary,
      answers: l.answers,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "lead not saved");
  return data.id as string;
}

export async function markLeadEmail(id: string, sent: boolean, emailError?: string) {
  await serviceClient().from("leads").update({ email_sent: sent, email_error: sent ? null : (emailError ?? "unknown").slice(0, 500) }).eq("id", id);
}

type Row = {
  id: string;
  created_at: string;
  source: Lead["source"];
  name: string;
  phone: string;
  business: string;
  category: string;
  city: string;
  message: string;
  plan_summary: string;
  answers: Record<string, unknown> | null;
  status: LeadStatus;
  notes: string;
  email_sent: boolean;
  email_error: string | null;
  updated_at: string;
  updated_by: string | null;
};

const toLead = (r: Row): Lead => ({
  id: r.id,
  createdAt: r.created_at,
  source: r.source,
  name: r.name,
  phone: r.phone,
  business: r.business,
  category: r.category,
  city: r.city,
  message: r.message,
  planSummary: r.plan_summary,
  answers: r.answers,
  status: r.status,
  notes: r.notes,
  emailSent: r.email_sent,
  emailError: r.email_error,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
});

/** Newest first, optional status filter and free-text search over name, phone, business, city and message. */
export async function listLeads(opts: { q?: string; status?: LeadStatus; limit?: number } = {}): Promise<Lead[]> {
  let query = serviceClient().from("leads").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 500);
  if (opts.status) query = query.eq("status", opts.status);
  const q = opts.q?.trim().replace(/[%_,()*]/g, " ").slice(0, 80);
  if (q) query = query.or(["name", "phone", "business", "city", "message", "category"].map((c) => `${c}.ilike.%${q}%`).join(","));
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toLead);
}

export async function updateLead(id: string, patch: { status?: LeadStatus; notes?: string }, actor: string) {
  const { error } = await serviceClient()
    .from("leads")
    .update({ ...patch, updated_at: new Date().toISOString(), updated_by: actor })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await serviceClient().from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLead(data as Row) : null;
}
