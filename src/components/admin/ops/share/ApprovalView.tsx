"use client";

import { useState } from "react";

/*
 * The client's approval page. Deliberately self-contained (only React): it posts answers to the link's own
 * endpoint with fetch, so this public page shares no code paths with the website's pages.
 */

export interface ApprovalViewItem {
  id: string;
  platformName: string;
  platformMark: string;
  formatLabel: string;
  when: string;
  title: string;
  captionDraft: string;
  hook: string;
  cta: string;
  complianceNote: string;
  assets: { url: string; kind: string; name: string }[];
  decision: "approved" | "changes" | null;
  comment: string;
}

async function answer(token: string, itemIds: string[], decision: "approved" | "changes", comment: string): Promise<{ ok: boolean; error?: string; count?: number }> {
  try {
    const res = await fetch(`/share/approve/${encodeURIComponent(token)}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds, decision, comment }),
    });
    return (await res.json()) as { ok: boolean; error?: string; count?: number };
  } catch {
    return { ok: false, error: "Could not reach Oryza. Please check your connection and try again." };
  }
}

const btn = "rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper disabled:opacity-40";
const btnGhost = "rounded-full border border-ink/20 px-5 py-2.5 text-[14px] font-semibold disabled:opacity-40";

function ItemCard({ item, token, onDone }: { item: ApprovalViewItem; token: string; onDone: (ids: string[], decision: "approved" | "changes", comment: string, msg: string) => void }) {
  const [mode, setMode] = useState<"" | "changes">("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const send = async (decision: "approved" | "changes") => {
    setBusy(true);
    setError("");
    const res = await answer(token, [item.id], decision, decision === "changes" ? comment : "");
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Something went wrong.");
    setMode("");
    onDone([item.id], decision, comment, decision === "approved" ? `Approved: ${item.title}` : `Changes sent for: ${item.title}`);
  };
  const status = item.decision === "approved" ? "Approved" : item.decision === "changes" ? "Changes requested" : "Waiting for you";
  return (
    <li className={`rounded-2xl border bg-paper p-4 sm:p-5 ${item.decision === "approved" ? "border-ink/30" : item.decision === "changes" ? "border-gold-500" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <abbr title={item.platformName} className="inline-flex h-4 min-w-5 items-center justify-center rounded-[4px] bg-ink px-1 text-[9px] font-bold text-white no-underline">{item.platformMark}</abbr>
          <span className="font-semibold text-ink">{item.platformName}</span>
          <span>· {item.formatLabel} · {item.when}</span>
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${item.decision === "approved" ? "bg-ink text-paper" : item.decision === "changes" ? "bg-gold-100 text-gold-700" : "border border-line text-muted"}`}>{status}</span>
      </div>
      <h2 className="mt-2 text-[18px] font-semibold">{item.title}</h2>
      {item.captionDraft ? (
        <p className="mt-2 whitespace-pre-wrap text-[15px]">{item.captionDraft}</p>
      ) : (
        <div className="mt-2 space-y-1 text-[15px]">
          {item.hook && <p>{item.hook}</p>}
          {item.cta && <p className="text-muted">{item.cta}</p>}
        </div>
      )}
      {item.assets.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {item.assets.map((a) =>
            a.kind === "image" ? (
              // Signed, short-lived private URL: next/image cannot optimise it, so a plain <img> is used.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.url} src={a.url} alt={`Design for ${item.title}`} loading="lazy" className="aspect-square w-full rounded-xl border border-line object-cover" />
            ) : a.kind === "video" ? (
              <video key={a.url} src={a.url} controls preload="metadata" className="aspect-square w-full rounded-xl border border-line bg-ink object-contain" />
            ) : (
              <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center rounded-xl border border-line p-3 text-center text-[13px] font-semibold underline">
                Open {a.kind === "pdf" ? "PDF" : "file"}: {a.name}
              </a>
            ),
          )}
        </div>
      )}
      {item.complianceNote && <p className="mt-3 rounded-xl bg-gold-100/50 px-3 py-2 text-[13px]"><span className="font-semibold">Please note:</span> {item.complianceNote}</p>}
      {item.decision === "changes" && item.comment && <p className="mt-3 text-[13px] text-muted">Your note: {item.comment}</p>}

      {mode === "changes" ? (
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send("changes");
          }}
        >
          <label htmlFor={`c-${item.id}`} className="block text-[13px] font-semibold">What would you like changed?</label>
          <textarea id={`c-${item.id}`} required rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-[15px]" />
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !comment.trim()} className={btn}>{busy ? "Sending…" : "Send changes"}</button>
            <button type="button" onClick={() => setMode("")} className={btnGhost}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.decision !== "approved" && <button type="button" disabled={busy} onClick={() => send("approved")} className={btn}>Approve</button>}
          <button type="button" disabled={busy} onClick={() => setMode("changes")} className={btnGhost}>Request changes</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-red-900">{error}</p>}
    </li>
  );
}

/** Every item with its caption, designs and notes; approve each, all, or ask for changes. */
export function ApprovalView({ token, clientName, until, label, items: initial }: { token: string; clientName: string; until: string; label: string; items: ApprovalViewItem[] }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const waiting = items.filter((x) => x.decision !== "approved");
  const done = (ids: string[], decision: "approved" | "changes", comment: string, m: string) => {
    setItems((all) => all.map((x) => (ids.includes(x.id) ? { ...x, decision, comment: decision === "changes" ? comment : "" } : x)));
    setMsg(m);
  };
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Hello {clientName}</h1>
      <p className="mt-2 text-[15px] text-muted">
        {label ? `${label}: ` : ""}please review {items.length} post{items.length > 1 ? "s" : ""}. Approve each one, or tell us what to change. This link works until {until}.
      </p>
      <div aria-live="polite" className="mt-4 min-h-6 text-[14px] font-semibold">{msg}</div>
      {waiting.length > 1 && (
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm(`Approve all ${waiting.length} remaining posts?`)) return;
              setBusy(true);
              const ids = waiting.map((x) => x.id);
              const res = await answer(token, ids, "approved", "");
              setBusy(false);
              if (res.ok) done(ids, "approved", "", `Thank you — ${res.count} posts approved.`);
              else setMsg(res.error ?? "Something went wrong.");
            }}
            className={`w-full sm:w-auto ${btn} py-3 text-[15px]`}
          >
            {busy ? "Approving…" : `Approve all ${waiting.length} remaining`}
          </button>
        </div>
      )}
      <ul className="space-y-4">{items.map((x) => <ItemCard key={x.id} item={x} token={token} onDone={done} />)}</ul>
      <p className="mt-8 text-center text-[13px] text-muted">{waiting.length ? `${waiting.length} still waiting for your answer.` : "All posts are approved. Thank you!"}</p>
    </div>
  );
}
