import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { todayIST } from "@/lib/ops/deadlines";

/** Small, read-only lookups for the admin shell: nav counts, global search, notifications. */
const db = () => serviceClient();
type R = Record<string, unknown>;
const clean = (q: string) => q.trim().replace(/[%_,()*\\]/g, " ").slice(0, 60);

export interface ShellCounts {
  overdue: number;
  newLeads: number;
  reviewImages: number;
}

/** Counts for the sidebar badges. Never throws (a badge is not worth a broken page). */
export async function shellCounts(): Promise<ShellCounts> {
  try {
    const today = todayIST();
    const [overdue, leads, images] = await Promise.all([
      db().from("tasks").select("id", { count: "exact", head: true }).neq("status", "done").lt("due_date", today),
      db().from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      db().from("slot_images").select("id", { count: "exact", head: true }).eq("status", "uploaded"),
    ]);
    return { overdue: overdue.count ?? 0, newLeads: leads.count ?? 0, reviewImages: images.count ?? 0 };
  } catch {
    return { overdue: 0, newLeads: 0, reviewImages: 0 };
  }
}

export interface SearchHit {
  group: "Clients" | "Posts" | "Leads" | "Shoots";
  id: string;
  label: string;
  hint: string;
  href: string;
}

/** Clients, posts, leads and shoots matching a query (5 of each). */
export async function searchAll(q: string): Promise<SearchHit[]> {
  const s = clean(q);
  if (s.length < 2) return [];
  const like = `%${s}%`;
  const [clients, items, leads] = await Promise.all([
    db().from("clients").select("id, name, city, category").ilike("name", like).limit(5),
    db().from("content_items").select("id, title, format, publish_date, client_id").ilike("title", like).order("publish_date", { ascending: false }).limit(5),
    db().from("leads").select("id, name, business, city").or(`name.ilike.${like},business.ilike.${like},phone.ilike.${like}`).order("created_at", { ascending: false }).limit(5),
  ]);
  const clientRows = (clients.data ?? []) as R[];
  const { data: shootClients } = clientRows.length ? await db().from("shoot_days").select("id, shoot_date, label, client_id").in("client_id", clientRows.map((c) => c.id as string)).gte("shoot_date", todayIST()).order("shoot_date").limit(5) : { data: [] };
  const name = new Map(clientRows.map((c) => [c.id as string, c.name as string]));
  const needNames = ((items.data ?? []) as R[]).map((x) => x.client_id as string).filter((id) => !name.has(id));
  if (needNames.length) {
    const { data } = await db().from("clients").select("id, name").in("id", [...new Set(needNames)]);
    for (const c of (data ?? []) as R[]) name.set(c.id as string, c.name as string);
  }
  return [
    ...clientRows.map((c) => ({ group: "Clients" as const, id: c.id as string, label: c.name as string, hint: [c.city, c.category].filter(Boolean).join(" · "), href: `/admin/clients/${c.id}` })),
    ...((items.data ?? []) as R[]).map((x) => ({ group: "Posts" as const, id: x.id as string, label: x.title as string, hint: `${name.get(x.client_id as string) ?? ""} · ${x.format} · ${x.publish_date}`, href: `/admin/items/${x.id}` })),
    ...((leads.data ?? []) as R[]).map((l) => ({ group: "Leads" as const, id: l.id as string, label: l.name as string, hint: [l.business, l.city].filter(Boolean).join(" · "), href: `/admin/leads?lead=${l.id}` })),
    ...((shootClients ?? []) as R[]).map((x) => ({ group: "Shoots" as const, id: x.id as string, label: `${name.get(x.client_id as string) ?? ""} · ${x.label}`, hint: x.shoot_date as string, href: `/admin/shoots/${x.id}` })),
  ];
}

export interface Notification {
  id: string;
  kind: "approved" | "changes" | "lead" | "overdue";
  text: string;
  at: string;
  href: string;
}

/** What changed recently: client answers, new leads, and the overdue count. */
export async function notifications(): Promise<{ items: Notification[]; overdue: number }> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [events, leads, overdue] = await Promise.all([
    db().from("audit_log").select("id, at, action, target, details").in("action", ["client.approved", "client.changes_requested", "client.approved_offline"]).gte("at", since).order("at", { ascending: false }).limit(12),
    db().from("leads").select("id, created_at, name, business").eq("status", "new").gte("created_at", since).order("created_at", { ascending: false }).limit(5),
    db().from("tasks").select("id", { count: "exact", head: true }).neq("status", "done").lt("due_date", todayIST()),
  ]);
  const ev = (events.data ?? []) as R[];
  const itemIds = [...new Set(ev.map((e) => e.target as string))];
  const { data: items } = itemIds.length ? await db().from("content_items").select("id, title").in("id", itemIds) : { data: [] };
  const title = new Map(((items ?? []) as R[]).map((x) => [x.id as string, x.title as string]));
  const out: Notification[] = [
    ...ev.map((e) => ({
      id: `a${e.id}`,
      kind: (e.action === "client.changes_requested" ? "changes" : "approved") as Notification["kind"],
      text: `${e.action === "client.changes_requested" ? "Changes requested" : e.action === "client.approved_offline" ? "Approved offline" : "Client approved"}: ${title.get(e.target as string) ?? "a post"}`,
      at: e.at as string,
      href: `/admin/items/${e.target}`,
    })),
    ...((leads.data ?? []) as R[]).map((l) => ({ id: `l${l.id}`, kind: "lead" as const, text: `New lead: ${l.name}${l.business ? ` · ${l.business}` : ""}`, at: l.created_at as string, href: `/admin/leads?lead=${l.id}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return { items: out.slice(0, 15), overdue: overdue.count ?? 0 };
}
