import "server-only";
import { randomUUID } from "node:crypto";
import { serviceClient } from "@/lib/supabase/admin";
import { CLIENT_ACTOR, decisionTaskChange, latestDecisions, type Decision } from "@/lib/ops/approvals";
import { deriveStage } from "@/lib/ops/deadlines";
import { expiryFrom, ipKey, linkSecret, signLink, tokenId, verifyLink, type LinkCheck } from "@/lib/ops/links";
import type { ItemRow, ItemStage } from "@/lib/ops/types";
import { audit } from "./audit";
import { siteUrl } from "./email";
import { getClient, getItem, listTasks, type Client } from "./ops-data";

const db = () => serviceClient();
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};
type R = Record<string, unknown>;

export const ASSET_BUCKET = "client-assets";

/* ------------------------------------------------------------------ item details (caption, notes, assets) */
export interface ItemDetail extends ItemRow {
  captionDraft: string;
  notes: string;
  assetLinks: string[];
}

export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const { data, error } = await db().from("content_items").select("*").eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  const base = await getItem(id);
  const r = data as R;
  return { ...(base as ItemRow), captionDraft: (r.caption_draft as string) ?? "", notes: (r.notes as string) ?? "", assetLinks: (r.asset_links as string[]) ?? [] };
}

const isPath = (a: string) => !/^https?:\/\//i.test(a);
const kindOf = (a: string) => (/\.(mp4|mov|webm)$/i.test(a) ? "video" : /\.pdf$/i.test(a) ? "pdf" : /^https?:/i.test(a) ? "link" : "image");

/** Assets as viewable URLs: stored files get short-lived signed URLs; outside links (Drive, Canva…) are kept. */
export async function assetViews(links: string[], seconds = 3600): Promise<{ ref: string; url: string; kind: string; name: string }[]> {
  const paths = links.filter(isPath);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await db().storage.from(ASSET_BUCKET).createSignedUrls(paths, seconds);
    for (const d of data ?? []) if (d.signedUrl && d.path) signed.set(d.path, d.signedUrl);
  }
  return links
    .map((a) => ({ ref: a, url: isPath(a) ? (signed.get(a) ?? "") : a, kind: kindOf(a), name: a.split("/").pop() ?? a }))
    .filter((v) => v.url);
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "application/pdf": "pdf" };
export const ASSET_TYPES = Object.keys(EXT);

/** A one-time upload link for a new asset of an item (the browser uploads straight to private storage). */
export async function assetUploadTarget(item: Pick<ItemRow, "id" | "clientId">, mime: string) {
  const ext = EXT[mime];
  if (!ext) throw new Error("This file type is not supported");
  const path = `${item.clientId}/${item.id}/${randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(ASSET_BUCKET).createSignedUploadUrl(path);
  fail(error);
  return { path: data!.path, token: data!.token };
}

export async function setAssets(itemId: string, links: string[]) {
  fail((await db().from("content_items").update({ asset_links: links.slice(0, 20), updated_at: new Date().toISOString() }).eq("id", itemId)).error);
}

export async function removeStoredAsset(path: string) {
  if (isPath(path)) await db().storage.from(ASSET_BUCKET).remove([path]);
}

/* ------------------------------------------------------------------ approval links (staff side) */
export interface ApprovalLinkRow {
  id: string;
  clientId: string;
  itemIds: string[];
  label: string;
  expiresAt: string;
  revokedAt: string | null;
  createdBy: string;
  createdAt: string;
  lastRemindedAt: string | null;
  firstResponseAt: string | null;
}
const toLink = (r: R): ApprovalLinkRow => ({
  id: r.id as string,
  clientId: r.client_id as string,
  itemIds: (r.item_ids as string[]) ?? [],
  label: (r.label as string) ?? "",
  expiresAt: r.expires_at as string,
  revokedAt: (r.revoked_at as string) ?? null,
  createdBy: r.created_by as string,
  createdAt: r.created_at as string,
  lastRemindedAt: (r.last_reminded_at as string) ?? null,
  firstResponseAt: (r.first_response_at as string) ?? null,
});

export const approvalUrl = (link: Pick<ApprovalLinkRow, "id" | "expiresAt">, secret: string) => `${siteUrl()}/share/approve/${signLink("approval", link.id, link.expiresAt, secret)}`;

export async function createApprovalLink(clientId: string, itemIds: string[], label: string, actor: string) {
  const secret = linkSecret();
  if (!secret) throw new Error("SHARE_LINK_SECRET is not set");
  const { data: items } = await db().from("content_items").select("id").eq("client_id", clientId).in("id", itemIds);
  const ids = ((items ?? []) as R[]).map((r) => r.id as string);
  if (!ids.length) throw new Error("Choose at least one item of this client");
  const { data, error } = await db().from("approval_links").insert({ client_id: clientId, item_ids: ids, label: label.slice(0, 120), expires_at: expiryFrom(), created_by: actor }).select("*").single();
  fail(error);
  const link = toLink(data as R);
  // Items that are not yet approved now wait for the client.
  fail((await db().from("content_items").update({ stage: "client_review" }).in("id", ids).in("stage", ["planned", "in_production"])).error);
  return { link, url: approvalUrl(link, secret) };
}

export async function listApprovalLinks(clientId?: string): Promise<(ApprovalLinkRow & { url: string | null; responses: number })[]> {
  let q = db().from("approval_links").select("*").order("created_at", { ascending: false }).limit(50);
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  fail(error);
  const links = ((data ?? []) as R[]).map(toLink);
  const { data: resp } = links.length ? await db().from("approval_responses").select("link_id").in("link_id", links.map((l) => l.id)) : { data: [] };
  const count = new Map<string, number>();
  for (const r of (resp ?? []) as R[]) count.set(r.link_id as string, (count.get(r.link_id as string) ?? 0) + 1);
  const secret = linkSecret();
  return links.map((l) => ({ ...l, url: secret ? approvalUrl(l, secret) : null, responses: count.get(l.id) ?? 0 }));
}

export async function getApprovalLink(id: string): Promise<ApprovalLinkRow | null> {
  const { data } = await db().from("approval_links").select("*").eq("id", id).maybeSingle();
  return data ? toLink(data as R) : null;
}

export async function revokeApprovalLink(id: string, actor: string) {
  fail((await db().from("approval_links").update({ revoked_at: new Date().toISOString(), revoked_by: actor }).eq("id", id)).error);
}

export async function markReminded(id: string) {
  fail((await db().from("approval_links").update({ last_reminded_at: new Date().toISOString() }).eq("id", id)).error);
}

/* ------------------------------------------------------------------ the public link (client side) */
/** Counts a request against the visitor's limit; false = too many (the page shows "try again later"). */
export async function rateOk(scope: string, ip: string, max: number, windowSeconds: number): Promise<boolean> {
  const secret = linkSecret();
  if (!secret) return false;
  const { data, error } = await db().rpc("rate_hit", { p_key: `${scope}:${ipKey(ip || "unknown", secret)}`, p_max: max, p_window: windowSeconds });
  if (error) {
    console.error("[share] rate limit check failed:", error.message);
    return true; // fail open on our own database error, never on a bad token
  }
  return Boolean(data);
}

export interface PublicItem {
  id: string;
  platform: string;
  format: string;
  title: string;
  date: string;
  time: string;
  captionDraft: string;
  hook: string;
  cta: string;
  complianceNote: string;
  assets: { url: string; kind: string; name: string }[];
  decision: Decision | null;
  comment: string;
}

/** Verifies an approval token and loads what the client may see. Never returns anything for a bad link. */
export async function openApprovalLink(token: string, now = new Date()): Promise<{ state: Exclude<LinkCheck, "ok"> } | { state: "ok"; link: ApprovalLinkRow; client: Pick<Client, "name" | "colour">; items: PublicItem[] }> {
  const secret = linkSecret();
  const id = tokenId(token);
  if (!secret || !id) return { state: "invalid" };
  const link = await getApprovalLink(id);
  const state = verifyLink("approval", token, link, secret, now);
  if (state !== "ok" || !link) return { state: state === "ok" ? "invalid" : state };
  const client = await getClient(link.clientId);
  if (!client) return { state: "invalid" };
  const [{ data: rows }, { data: resp }] = await Promise.all([
    db().from("content_items").select("*").in("id", link.itemIds).order("publish_date").order("publish_time"),
    db().from("approval_responses").select("item_id, decision, comment, at").eq("link_id", link.id),
  ]);
  const latest = latestDecisions(((resp ?? []) as R[]).map((r) => ({ itemId: r.item_id as string, decision: r.decision as Decision, comment: r.comment as string, at: r.at as string })));
  const items: PublicItem[] = [];
  for (const r of (rows ?? []) as R[]) {
    const assets = await assetViews((r.asset_links as string[]) ?? []);
    const d = latest.get(r.id as string);
    items.push({
      id: r.id as string,
      platform: r.platform as string,
      format: r.format as string,
      title: r.title as string,
      date: r.publish_date as string,
      time: r.publish_time as string,
      captionDraft: (r.caption_draft as string) ?? "",
      hook: (r.hook as string) ?? "",
      cta: (r.cta as string) ?? "",
      complianceNote: (r.compliance_notes as string) ?? "",
      assets: assets.map(({ url, kind, name }) => ({ url, kind, name })),
      decision: d?.decision ?? null,
      comment: d?.comment ?? "",
    });
  }
  return { state: "ok", link, client: { name: client.name, colour: client.colour }, items };
}

/**
 * Records the client's answer for items on a valid link and updates the items and their tasks straight away.
 * Approved: client-approval task done, item marked client-approved. Changes: task back to "to do" with the comment.
 */
export async function respond(token: string, itemIds: string[], decision: Decision, comment: string, now = new Date()): Promise<{ ok: boolean; state?: LinkCheck; count?: number }> {
  const opened = await openApprovalLink(token, now);
  if (opened.state !== "ok") return { ok: false, state: opened.state };
  const allowed = new Set(opened.link.itemIds);
  const ids = [...new Set(itemIds)].filter((i) => allowed.has(i));
  const text = comment.trim().slice(0, 2000);
  if (!ids.length || (decision === "changes" && !text)) return { ok: false };
  const at = now.toISOString();
  fail((await db().from("approval_responses").insert(ids.map((item_id) => ({ link_id: opened.link.id, item_id, decision, comment: decision === "changes" ? text : text.slice(0, 500) })))).error);
  for (const itemId of ids) {
    const tasks = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
    const change = decisionTaskChange(tasks, decision, text);
    if (change)
      fail((await db().from("tasks").update({ status: change.status, note: change.note, completed_by: change.completedBy, completed_at: change.status === "done" ? at : null, blocked_reason: "", updated_at: at }).eq("id", change.id)).error);
    const after = change ? tasks.map((t) => (t.id === change.id ? { ...t, status: change.status } : t)) : tasks;
    const stage: ItemStage = after.length ? deriveStage(after) : decision === "approved" ? "approved" : "client_review";
    fail((await db().from("content_items").update({ client_approved_at: decision === "approved" ? at : null, stage, updated_at: at }).eq("id", itemId)).error);
    await audit(CLIENT_ACTOR, decision === "approved" ? "client.approved" : "client.changes_requested", itemId, { clientId: opened.link.clientId, linkId: opened.link.id, ...(decision === "changes" && { comment: text }) });
  }
  if (!opened.link.firstResponseAt) await db().from("approval_links").update({ first_response_at: at }).eq("id", opened.link.id);
  return { ok: true, count: ids.length };
}

/** A content item's client answers, newest first. */
export async function itemResponses(itemId: string): Promise<{ decision: Decision; comment: string; at: string }[]> {
  const { data } = await db().from("approval_responses").select("decision, comment, at").eq("item_id", itemId).order("at", { ascending: false }).limit(20);
  return ((data ?? []) as R[]).map((r) => ({ decision: r.decision as Decision, comment: (r.comment as string) ?? "", at: r.at as string }));
}
