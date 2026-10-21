import { platformById, type PlatformId } from "@/data/platforms";
import { fmtMetric, growth, METRICS, metricValue, monthLabel, NOT_RECORDED, type Metrics } from "@/lib/ops/report";
import type { ItemRow } from "@/lib/ops/types";
import { fmtDay, formatLabel, PlatformGlyph } from "../ui";

const pname = (p: string) => platformById[p as PlatformId]?.name ?? p;

/**
 * One horizontal bar per platform, single series in brand ink. Platforms without a recorded number get no bar and
 * say "Not recorded" (never drawn as zero). Each bar has a hover title; the numbers table below is the table view.
 */
function BarChart({ title, rows }: { title: string; rows: { label: string; value?: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0));
  const recorded = rows.filter((r) => r.value !== undefined);
  if (!recorded.length) return null;
  return (
    <figure className="rounded-2xl border border-line bg-paper p-4 break-inside-avoid">
      <figcaption className="mb-3 text-[14px] font-semibold">{title}</figcaption>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[96px_1fr] items-center gap-3 text-[13px] sm:grid-cols-[150px_1fr]">
            <span className="truncate text-muted">{r.label}</span>
            {r.value === undefined ? (
              <span className="text-muted italic">{NOT_RECORDED}</span>
            ) : (
              <span className="group flex items-center gap-2" title={`${r.label}: ${r.value.toLocaleString("en-IN")}`}>
                <span className="h-3 rounded-r-[4px] bg-ink transition-opacity group-hover:opacity-80" style={{ width: `max(4px, ${(r.value / max) * 78}%)` }} />
                <span className="font-semibold tabular-nums">{r.value.toLocaleString("en-IN")}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export interface ReportDocProps {
  clientName: string;
  month: string;
  platforms: string[];
  metrics: Metrics;
  notes: string;
  nextFocus: string;
  delivery: { planned: number; published: number; onTime: number; onTimePct?: number };
  top: Pick<ItemRow, "id" | "title" | "platform" | "format" | "date">[];
}

/** The monthly report (admin preview, shared link and print). Only entered numbers; gaps say "Not recorded". */
export function ReportDoc(p: ReportDocProps) {
  const chart = (key: string, title: string) =>
    p.platforms.some((pl) => METRICS[pl as PlatformId]?.some((m) => m.key === key)) ? (
      <BarChart key={key} title={title} rows={p.platforms.filter((pl) => METRICS[pl as PlatformId]?.some((m) => m.key === key)).map((pl) => ({ label: pname(pl), value: metricValue(p.metrics, pl, key) }))} />
    ) : null;
  return (
    <article className="space-y-8">
      <header>
        <p className="text-[14px] font-semibold text-gold-700">Monthly report</p>
        <h1 className="font-display text-3xl sm:text-4xl">{p.clientName} · {monthLabel(p.month)}</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-muted">Numbers are taken from each platform&apos;s own insights and entered by the Oryza team. Anything we did not record is marked “{NOT_RECORDED}”.</p>
      </header>

      <section aria-labelledby="delivery-h">
        <h2 id="delivery-h" className="mb-3 font-display text-xl">What we delivered</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Posts planned" value={String(p.delivery.planned)} />
          <Stat label="Published" value={String(p.delivery.published)} hint={p.delivery.planned ? `${Math.round((p.delivery.published / p.delivery.planned) * 100)}% of planned` : undefined} />
          <Stat label="On time" value={p.delivery.onTimePct === undefined ? "—" : `${p.delivery.onTimePct}%`} hint={p.delivery.onTimePct === undefined ? "Nothing published yet" : `${p.delivery.onTime} of ${p.delivery.published} on or before their date`} />
        </div>
      </section>

      <section aria-labelledby="results-h" className="space-y-3">
        <h2 id="results-h" className="font-display text-xl">Results by platform</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {chart("followers_end", "Followers at month end")}
          {chart("reach", "Reach / views")}
          {chart("engagement", "Engagement")}
          {chart("enquiries", "Enquiries")}
          {chart("calls", "Google: calls")}
          {chart("directions", "Google: direction requests")}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <caption className="sr-only">All numbers recorded this month</caption>
            <thead className="bg-cream/60"><tr><th className="px-3 py-2">Platform</th><th className="px-3 py-2">Measure</th><th className="px-3 py-2 text-right">Value</th></tr></thead>
            <tbody>
              {p.platforms.flatMap((pl) =>
                (METRICS[pl as PlatformId] ?? []).map((m, i) => {
                  const v = metricValue(p.metrics, pl, m.key);
                  return (
                    <tr key={`${pl}-${m.key}`} className="border-t border-line">
                      <td className="px-3 py-1.5 font-semibold">{i === 0 ? pname(pl) : ""}</td>
                      <td className="px-3 py-1.5">{m.label}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${v === undefined ? "text-muted italic" : ""}`}>{fmtMetric(v)}</td>
                    </tr>
                  );
                }),
              )}
              {p.platforms.map((pl) => {
                const g = growth(p.metrics, pl);
                return METRICS[pl as PlatformId]?.some((m) => m.key === "followers_end") ? (
                  <tr key={`${pl}-growth`} className="border-t border-line bg-cream/30">
                    <td className="px-3 py-1.5 font-semibold">{pname(pl)}</td>
                    <td className="px-3 py-1.5">Follower change</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${g === undefined ? "text-muted italic" : ""}`}>{g === undefined ? NOT_RECORDED : `${g > 0 ? "+" : ""}${g.toLocaleString("en-IN")}`}</td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="top-h">
        <h2 id="top-h" className="mb-3 font-display text-xl">Top posts</h2>
        {p.top.length ? (
          <ol className="space-y-2">
            {p.top.map((x, i) => (
              <li key={x.id} className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 text-[14px]">
                <span className="font-display text-xl text-gold-700">{i + 1}</span>
                <PlatformGlyph platform={x.platform} />
                <span className="min-w-0 flex-1"><span className="block font-semibold">{x.title}</span><span className="text-[12px] text-muted">{formatLabel(x.format)} · {fmtDay(x.date)}</span></span>
              </li>
            ))}
          </ol>
        ) : <p className="text-[14px] text-muted italic">{NOT_RECORDED}</p>}
      </section>

      <section aria-labelledby="notes-h" className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-4">
          <h2 id="notes-h" className="mb-2 font-display text-xl">Notes</h2>
          <p className={`whitespace-pre-wrap text-[14px] ${p.notes ? "" : "text-muted italic"}`}>{p.notes || NOT_RECORDED}</p>
        </div>
        <div className="rounded-2xl border border-gold-500/40 bg-gold-100/40 p-4">
          <h2 className="mb-2 font-display text-xl">Next month&apos;s focus</h2>
          <p className={`whitespace-pre-wrap text-[14px] ${p.nextFocus ? "" : "text-muted italic"}`}>{p.nextFocus || NOT_RECORDED}</p>
        </div>
      </section>
    </article>
  );
}
