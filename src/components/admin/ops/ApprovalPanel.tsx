"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createApprovalAction, emailApprovalAction, logShareAction, revokeApprovalAction } from "@/app/admin/(panel)/approvals/actions";
import type { PlatformId } from "@/data/platforms";
import { addDays } from "@/lib/engine/dates";
import { mondayOf } from "@/lib/ops/calendar";
import { fmtWhen, Notice } from "../AdminShell";
import { CopyLink, WhatsAppShare } from "./ShareButtons";
import { btn, btnGhost, btnSmall, fmtDay, formatLabel, PlatformGlyph } from "./ui";
import { useConfirm } from "../shell/Confirm";

export interface ApprovalItem {
  id: string;
  title: string;
  date: string;
  platform: PlatformId;
  format: string;
  clientApproved: boolean;
}

const shareText = (clientName: string, url: string, label: string) =>
  `Hi ${clientName}, your upcoming posts${label ? ` (${label})` : ""} are ready for approval. Please open this link to approve them or tell us what to change (no login needed, works for 7 days): ${url}`;

function Share({ linkId, url, clientName, clientPhone, clientEmail, label }: { linkId: string; url: string; clientName: string; clientPhone: string; clientEmail: string; label: string }) {
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-2">
      <p className="break-all rounded-lg bg-cream/70 px-3 py-2 font-mono text-[12px]">{url}</p>
      <div className="flex flex-wrap gap-2">
        <CopyLink url={url} onCopy={() => void logShareAction(linkId, "copy")} />
        <WhatsAppShare text={shareText(clientName, url, label)} phone={clientPhone} label="Send on WhatsApp" onShare={() => void logShareAction(linkId, "whatsapp")} />
        <button
          type="button"
          disabled={!clientEmail}
          title={clientEmail ? `Email ${clientEmail}` : "Add the client's email first"}
          className={btnGhost}
          onClick={async () => {
            const res = await emailApprovalAction(linkId);
            setMsg(res.ok ? `Emailed to ${res.data.to}.` : res.error);
          }}
        >
          Email the link
        </button>
      </div>
      {msg && <p role="status" className="text-[13px] text-muted">{msg}</p>}
    </div>
  );
}

/** Choose a week (or tick items) and create a 7-day approval link the client can open without logging in. */
export function SendForApproval({ clientId, clientName, clientPhone, clientEmail, items, preselect, today }: { clientId: string; clientName: string; clientPhone: string; clientEmail: string; items: ApprovalItem[]; preselect?: boolean; today?: string }) {
  const router = useRouter();
  const single = items.length === 1 && preselect;
  const [week, setWeek] = useState(() => mondayOf(today ?? items[0]?.date ?? new Date().toISOString().slice(0, 10)));
  const inWeek = useMemo(() => (single ? items : items.filter((x) => x.date >= week && x.date <= addDays(week, 6))), [items, week, single]);
  // Start with this week's items that the client has not approved yet.
  const [picked, setPicked] = useState<Set<string>>(() => new Set(items.filter((x) => !x.clientApproved && (single || (x.date >= week && x.date <= addDays(week, 6)))).map((x) => x.id)));
  const [created, setCreated] = useState<{ id: string; url: string; label: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selectWeek = (start: string) => {
    setWeek(start);
    setPicked(new Set(items.filter((x) => x.date >= start && x.date <= addDays(start, 6) && !x.clientApproved).map((x) => x.id)));
  };
  const chosen = inWeek.filter((x) => picked.has(x.id));
  const label = single ? items[0].title : `Week of ${fmtDay(week)}`;

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-paper p-4">
      {!single && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnSmall} aria-label="Previous week" onClick={() => selectWeek(addDays(week, -7))}>←</button>
          <span className="text-[14px] font-semibold">Week of {fmtDay(week)}</span>
          <button type="button" className={btnSmall} aria-label="Next week" onClick={() => selectWeek(addDays(week, 7))}>→</button>
        </div>
      )}
      {!single && (
        inWeek.length ? (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {inWeek.map((x) => (
              <li key={x.id}>
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={picked.has(x.id)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(x.id); else n.delete(x.id); return n; })} />
                  <PlatformGlyph platform={x.platform} />
                  <span className="min-w-0 flex-1 truncate">{fmtDay(x.date)} · {formatLabel(x.format)} · {x.title}</span>
                  {x.clientApproved && <span className="text-[11px] font-semibold text-gold-700">approved</span>}
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="text-[14px] text-muted">No items this week.</p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {created ? (
        <Share linkId={created.id} url={created.url} clientName={clientName} clientPhone={clientPhone} clientEmail={clientEmail} label={created.label} />
      ) : (
        <button
          type="button"
          className={btn}
          disabled={busy || !chosen.length}
          onClick={async () => {
            setBusy(true);
            setError("");
            const res = await createApprovalAction(clientId, chosen.map((x) => x.id), label);
            setBusy(false);
            if (!res.ok) return setError(res.error);
            setCreated({ ...res.data, label });
            router.refresh();
          }}
        >
          {busy ? "Creating link…" : chosen.length > 1 ? `Send ${chosen.length} items for approval` : "Send for approval"}
        </button>
      )}
    </div>
  );
}

export interface LinkSummary {
  id: string;
  label: string;
  url: string | null;
  itemCount: number;
  responses: number;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  firstResponseAt: string | null;
  lastRemindedAt: string | null;
  reminderDue: boolean;
  nudge: string;
}

/** Links sent to this client: status, answers, share again, revoke, and the 24-hour WhatsApp reminder. */
export function ApprovalLinks({ links, clientName, clientPhone, clientEmail, now }: { links: LinkSummary[]; clientName: string; clientPhone: string; clientEmail: string; now: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  if (!links.length) return <p className="text-[14px] text-muted">No approval links yet.</p>;
  return (
    <ul className="space-y-3">
      {links.map((l) => {
        const expired = l.expiresAt <= now;
        const state = l.revokedAt ? "Switched off" : expired ? "Expired" : l.firstResponseAt ? `${l.responses} answer${l.responses === 1 ? "" : "s"}` : "Waiting for the client";
        return (
          <li key={l.id} className="space-y-2 rounded-2xl border border-line bg-paper p-4 text-[14px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">{l.label || "Approval link"} <span className="font-normal text-muted">· {l.itemCount} item{l.itemCount > 1 ? "s" : ""} · sent {fmtWhen(l.createdAt)}</span></p>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${l.revokedAt || expired ? "border border-line text-muted" : l.firstResponseAt ? "bg-ink text-paper" : "bg-gold-100 text-gold-700"}`}>{state}</span>
            </div>
            {!l.revokedAt && !expired && <p className="text-[12px] text-muted">Works until {fmtWhen(l.expiresAt)}{l.lastRemindedAt && ` · reminder sent ${fmtWhen(l.lastRemindedAt)}`}</p>}
            {(l.reminderDue || (l.lastRemindedAt && !l.firstResponseAt)) && !l.revokedAt && !expired && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gold-100/50 px-3 py-2">
                <span className="text-[13px]">No answer after 24 hours.</span>
                <WhatsAppShare text={l.nudge} phone={clientPhone} label="Send WhatsApp reminder" onShare={() => void logShareAction(l.id, "reminder")} className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-paper" />
              </div>
            )}
            {l.url && !l.revokedAt && !expired && <Share linkId={l.id} url={l.url} clientName={clientName} clientPhone={clientPhone} clientEmail={clientEmail} label={l.label} />}
            {!l.revokedAt && !expired && (
              <button type="button" className={btnSmall} onClick={async () => { if (await confirm({ title: "Revoke this link?", body: "The client will no longer be able to open it. You can send a new link any time.", action: "Revoke link", danger: true })) { await revokeApprovalAction(l.id); router.refresh(); } }}>Revoke link</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
