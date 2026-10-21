"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revokeReportLinkAction, saveReportAction, shareReportAction } from "@/app/admin/(panel)/reports/actions";
import { platformById, type PlatformId } from "@/data/platforms";
import { METRICS, type Metrics } from "@/lib/ops/report";
import { fmtWhen, Notice } from "../AdminShell";
import { CopyLink, WhatsAppShare } from "./ShareButtons";
import { btn, btnGhost, btnSmall, field, fmtDay } from "./ui";

type Input = Record<string, Record<string, string>>;
const toInput = (m: Metrics): Input => Object.fromEntries(Object.entries(m).map(([p, v]) => [p, Object.fromEntries(Object.entries(v ?? {}).map(([k, n]) => [k, String(n)]))]));

/** Enter the month's real numbers per platform. Blank means "Not recorded" — never zero. */
export function ReportEditor({ clientId, clientName, clientPhone, month, platforms, metrics, notes, nextFocus, topItems, candidates, links, saved }: {
  clientId: string;
  clientName: string;
  clientPhone: string;
  month: string;
  platforms: string[];
  metrics: Metrics;
  notes: string;
  nextFocus: string;
  topItems: string[];
  candidates: { id: string; title: string; date: string }[];
  links: { id: string; url: string | null; expiresAt: string; revokedAt: string | null }[];
  saved: boolean;
}) {
  const router = useRouter();
  const [m, setM] = useState<Input>(toInput(metrics));
  const [text, setText] = useState({ notes, nextFocus });
  const [top, setTop] = useState<string[]>([...topItems, "", "", ""].slice(0, 3));
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const set = (p: string, k: string, v: string) => setM((x) => ({ ...x, [p]: { ...x[p], [k]: v } }));

  return (
    <div className="space-y-6">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await saveReportAction(clientId, month, { metrics: m, notes: text.notes, nextFocus: text.nextFocus, topItems: top.filter(Boolean) });
          setMsg(res.ok ? { tone: "ok", text: "Report saved. Blank fields show as “Not recorded”." } : { tone: "error", text: res.error });
          if (res.ok) router.refresh();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {platforms.map((p) => (
            <fieldset key={p} className="rounded-2xl border border-line bg-paper p-4">
              <legend className="px-1 font-semibold">{platformById[p as PlatformId]?.name ?? p}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(METRICS[p as PlatformId] ?? []).map((d) => (
                  <label key={d.key} className="text-[12px] font-semibold">
                    {d.label}
                    <input inputMode="numeric" placeholder="Not recorded" value={m[p]?.[d.key] ?? ""} onChange={(e) => set(p, d.key, e.target.value)} className={`mt-1 w-full ${field}`} />
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <fieldset className="rounded-2xl border border-line bg-paper p-4">
          <legend className="px-1 font-semibold">Top 3 posts</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {top.map((v, i) => (
              <select key={i} aria-label={`Top post ${i + 1}`} value={v} onChange={(e) => setTop(top.map((x, j) => (j === i ? e.target.value : x)))} className={field}>
                <option value="">—</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{fmtDay(c.date)} · {c.title}</option>)}
              </select>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-[13px] font-semibold">Notes (optional)<textarea rows={4} value={text.notes} onChange={(e) => setText({ ...text, notes: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
          <label className="block text-[13px] font-semibold">Next month&apos;s focus<textarea rows={4} value={text.nextFocus} onChange={(e) => setText({ ...text, nextFocus: e.target.value })} className={`mt-1 w-full ${field}`} /></label>
        </div>
        <button className={btn}>Save report</button>
      </form>

      <section aria-labelledby="share-h" className="space-y-3 rounded-2xl border border-line bg-paper p-4">
        <h2 id="share-h" className="font-display text-xl">Share with the client</h2>
        <button
          type="button"
          className={btnGhost}
          disabled={!saved}
          title={saved ? "" : "Save the report first"}
          onClick={async () => {
            const res = await shareReportAction(clientId, month);
            if (!res.ok) return setMsg({ tone: "error", text: res.error });
            setNewUrl(res.data.url);
            router.refresh();
          }}
        >
          Create a 7-day link
        </button>
        {newUrl && (
          <div className="flex flex-wrap gap-2">
            <p className="w-full break-all rounded-lg bg-cream/70 px-3 py-2 font-mono text-[12px]">{newUrl}</p>
            <CopyLink url={newUrl} />
            <WhatsAppShare text={`Hi ${clientName}, your Oryza report for this month is ready: ${newUrl}`} phone={clientPhone} label="Send on WhatsApp" />
          </div>
        )}
        <ul className="space-y-1 text-[13px]">
          {links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2">
              <span className="text-muted">{l.revokedAt ? "Switched off" : `Link until ${fmtWhen(l.expiresAt)}`}</span>
              {!l.revokedAt && l.url && <CopyLink url={l.url} className={btnSmall} />}
              {!l.revokedAt && <button type="button" className={btnSmall} onClick={async () => { await revokeReportLinkAction(l.id, clientId); router.refresh(); }}>Revoke</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
