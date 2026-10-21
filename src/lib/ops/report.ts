/**
 * Monthly reports: the numbers are entered by the team and never invented. A missing value is shown as
 * "Not recorded" — never as zero. Delivery stats come from the system (items and tasks). Pure.
 */
import type { PlatformId } from "@/data/platforms";
import type { ItemRow, TaskRow } from "./types";

export interface MetricDef {
  key: string;
  label: string;
}

const SOCIAL: MetricDef[] = [
  { key: "followers_start", label: "Followers at start" },
  { key: "followers_end", label: "Followers at end" },
  { key: "reach", label: "Reach" },
  { key: "engagement", label: "Engagement" },
  { key: "profile_visits", label: "Profile visits" },
  { key: "enquiries", label: "Enquiries" },
];

export const METRICS: Record<PlatformId, MetricDef[]> = {
  instagram: SOCIAL,
  facebook: SOCIAL,
  youtube: [{ key: "followers_start", label: "Subscribers at start" }, { key: "followers_end", label: "Subscribers at end" }, { key: "reach", label: "Views" }, { key: "engagement", label: "Engagement" }, { key: "enquiries", label: "Enquiries" }],
  linkedin: SOCIAL,
  x: SOCIAL,
  pinterest: SOCIAL,
  whatsapp: [{ key: "followers_start", label: "Contacts / channel followers at start" }, { key: "followers_end", label: "Contacts / channel followers at end" }, { key: "enquiries", label: "Enquiries" }],
  gbp: [{ key: "profile_visits", label: "Profile views" }, { key: "calls", label: "Calls" }, { key: "directions", label: "Direction requests" }, { key: "website_clicks", label: "Website clicks" }, { key: "enquiries", label: "Enquiries / messages" }],
  website: [{ key: "profile_visits", label: "Visits" }, { key: "enquiries", label: "Enquiries" }],
};

export type Metrics = Partial<Record<string, Partial<Record<string, number>>>>;

export const NOT_RECORDED = "Not recorded";

/** Keeps only real, non-negative numbers for known platform metrics. Blank inputs are dropped (never zero). */
export function cleanMetrics(input: Record<string, Record<string, unknown>>): Metrics {
  const out: Metrics = {};
  for (const [p, vals] of Object.entries(input ?? {})) {
    const defs = METRICS[p as PlatformId];
    if (!defs || !vals || typeof vals !== "object") continue;
    for (const d of defs) {
      const raw = vals[d.key];
      if (raw === "" || raw === null || raw === undefined) continue;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[,\s]/g, ""));
      if (!Number.isFinite(n) || n < 0 || n > 1e10) continue;
      (out[p] ??= {})[d.key] = Math.round(n);
    }
  }
  return out;
}

export const metricValue = (m: Metrics, p: string, key: string): number | undefined => m[p]?.[key];

export function fmtMetric(v: number | undefined): string {
  return v === undefined ? NOT_RECORDED : v.toLocaleString("en-IN");
}

/** Follower change, only when both start and end were recorded. */
export function growth(m: Metrics, p: string): number | undefined {
  const s = metricValue(m, p, "followers_start");
  const e = metricValue(m, p, "followers_end");
  return s === undefined || e === undefined ? undefined : e - s;
}

/** Platforms with at least one recorded number. */
export const recordedPlatforms = (m: Metrics) => Object.keys(m).filter((p) => Object.keys(m[p] ?? {}).length);

/** IST calendar date of an instant. */
const istDate = (iso: string) => new Date(Date.parse(iso) + 5.5 * 3600_000).toISOString().slice(0, 10);

/** Items planned for the month vs published, and the share published on or before their date. */
export function deliveryStats(items: Pick<ItemRow, "id" | "date" | "stage">[], tasks: Pick<TaskRow, "itemId" | "step" | "status" | "completedAt">[], month: string) {
  const ym = month.slice(0, 7);
  const mine = items.filter((x) => x.date.slice(0, 7) === ym);
  const published = mine.filter((x) => x.stage === "published" || x.stage === "done");
  const onTime = published.filter((x) => {
    const t = tasks.find((k) => k.itemId === x.id && k.step === "publish");
    return t?.status === "done" && t.completedAt ? istDate(t.completedAt) <= x.date : false;
  });
  return {
    planned: mine.length,
    published: published.length,
    onTime: onTime.length,
    onTimePct: published.length ? Math.round((onTime.length / published.length) * 100) : undefined,
  };
}

export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
export function monthEnd(month: string) {
  const d = new Date(month.slice(0, 7) + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
export const monthLabel = (month: string) => new Date(month.slice(0, 7) + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

/** Platforms the report covers: those with recorded numbers or with content that month (in a stable order). */
export function reportPlatforms(m: Metrics, items: Pick<ItemRow, "platform">[], selected: string[] = []): string[] {
  const order = Object.keys(METRICS);
  const set = new Set([...recordedPlatforms(m), ...items.map((x) => x.platform), ...selected]);
  return order.filter((p) => set.has(p));
}
