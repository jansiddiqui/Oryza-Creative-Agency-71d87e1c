import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { expiryFrom, linkSecret, signLink, tokenId, verifyLink, type LinkCheck } from "@/lib/ops/links";
import { cleanMetrics, deliveryStats, monthEnd, type Metrics } from "@/lib/ops/report";
import type { ItemRow } from "@/lib/ops/types";
import { siteUrl } from "./email";
import { getClient, listItems, listTasks, type Client } from "./ops-data";

const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};
type R = Record<string, unknown>;

export interface ReportRow {
  id: string | null;
  clientId: string;
  month: string;
  metrics: Metrics;
  notes: string;
  nextFocus: string;
  topItems: string[];
  updatedBy: string | null;
  updatedAt: string | null;
}

const toReport = (r: R): ReportRow => ({
  id: r.id as string,
  clientId: r.client_id as string,
  month: r.month as string,
  metrics: (r.metrics as Metrics) ?? {},
  notes: (r.notes as string) ?? "",
  nextFocus: (r.next_focus as string) ?? "",
  topItems: (r.top_items as string[]) ?? [],
  updatedBy: (r.updated_by as string) ?? null,
  updatedAt: (r.updated_at as string) ?? null,
});

/** The month's report (an empty one if nothing was recorded yet). */
export async function getReport(clientId: string, month: string): Promise<ReportRow> {
  const { data, error } = await db().from("monthly_reports").select("*").eq("client_id", clientId).eq("month", month).maybeSingle();
  fail(error);
  return data ? toReport(data as R) : { id: null, clientId, month, metrics: {}, notes: "", nextFocus: "", topItems: [], updatedBy: null, updatedAt: null };
}

export async function listReports(clientId: string): Promise<{ id: string; month: string }[]> {
  const { data } = await db().from("monthly_reports").select("id, month").eq("client_id", clientId).order("month", { ascending: false });
  return ((data ?? []) as R[]).map((r) => ({ id: r.id as string, month: r.month as string }));
}

export async function saveReport(clientId: string, month: string, input: { metrics: Record<string, Record<string, unknown>>; notes: string; nextFocus: string; topItems: string[] }, actor: string): Promise<string> {
  const { data: own } = input.topItems.length ? await db().from("content_items").select("id").eq("client_id", clientId).in("id", input.topItems) : { data: [] };
  const top = ((own ?? []) as R[]).map((r) => r.id as string).slice(0, 3);
  const { data, error } = await db()
    .from("monthly_reports")
    .upsert(
      { client_id: clientId, month, metrics: cleanMetrics(input.metrics), notes: input.notes.slice(0, 4000), next_focus: input.nextFocus.slice(0, 2000), top_items: top, updated_by: actor, updated_at: new Date().toISOString() },
      { onConflict: "client_id,month" },
    )
    .select("id")
    .single();
  fail(error);
  return (data as R).id as string;
}

/** Everything the report page shows: entered numbers, the system's delivery stats, top posts. */
export async function reportView(clientId: string, month: string) {
  const [client, report, items] = await Promise.all([getClient(clientId), getReport(clientId, month), listItems({ from: month, to: monthEnd(month) }, clientId)]);
  const tasks = await listTasks({ to: "9999-12-31", itemIds: items.map((x) => x.id) });
  const top = report.topItems.map((id) => items.find((x) => x.id === id)).filter(Boolean) as ItemRow[];
  return { client, report, items, delivery: deliveryStats(items, tasks, month), top };
}

export async function createReportLink(reportId: string, actor: string): Promise<string> {
  const secret = linkSecret();
  if (!secret) throw new Error("SHARE_LINK_SECRET is not set");
  const { data, error } = await db().from("report_links").insert({ report_id: reportId, expires_at: expiryFrom(), created_by: actor }).select("id, expires_at").single();
  fail(error);
  return `${siteUrl()}/share/report/${signLink("report", (data as R).id as string, (data as R).expires_at as string, secret)}`;
}

export async function listReportLinks(reportId: string) {
  const secret = linkSecret();
  const { data } = await db().from("report_links").select("*").eq("report_id", reportId).order("created_at", { ascending: false });
  return ((data ?? []) as R[]).map((r) => ({
    id: r.id as string,
    expiresAt: r.expires_at as string,
    revokedAt: (r.revoked_at as string) ?? null,
    url: secret ? `${siteUrl()}/share/report/${signLink("report", r.id as string, r.expires_at as string, secret)}` : null,
  }));
}

export async function revokeReportLink(id: string, actor: string) {
  void actor;
  fail((await db().from("report_links").update({ revoked_at: new Date().toISOString() }).eq("id", id)).error);
}

/** The shared report for a valid token, or why it cannot be shown. */
export async function openReportLink(token: string, now = new Date()): Promise<{ state: Exclude<LinkCheck, "ok"> } | ({ state: "ok" } & Awaited<ReturnType<typeof reportView>> & { client: Client })> {
  const secret = linkSecret();
  const id = tokenId(token);
  if (!secret || !id) return { state: "invalid" };
  const { data } = await db().from("report_links").select("id, expires_at, revoked_at, report_id").eq("id", id).maybeSingle();
  const row = data ? { id: (data as R).id as string, expiresAt: (data as R).expires_at as string, revokedAt: ((data as R).revoked_at as string) ?? null } : null;
  const state = verifyLink("report", token, row, secret, now);
  if (state !== "ok") return { state };
  const { data: rep } = await db().from("monthly_reports").select("client_id, month").eq("id", (data as R).report_id as string).maybeSingle();
  if (!rep) return { state: "invalid" };
  const view = await reportView((rep as R).client_id as string, (rep as R).month as string);
  if (!view.client) return { state: "invalid" };
  return { state: "ok", ...view, client: view.client };
}
