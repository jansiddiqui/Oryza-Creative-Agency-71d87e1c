"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateLeadAction } from "@/app/admin/(panel)/leads/actions";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/types";
import { whatsappFor, type Lead } from "@/lib/leads-format";
import { AdminTitle, fmtWhen } from "./AdminShell";
import { Badge, btn, btnGhost, btnSmall, card, field, label, type Tone } from "./ops/ui";
import { Drawer } from "./shell/Drawer";
import { useToast } from "./shell/Toasts";
import { DataTable, type Column } from "./ui/DataTable";

const TONE: Record<LeadStatus, Tone> = { new: "info", contacted: "warn", converted: "ok", not_fit: "neutral" };
export const statusText = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.id === s)?.label ?? s;

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={TONE[status]}>{statusText(status)}</Badge>;
}

const greeting = (l: Lead) => `Hi ${l.name.split(" ")[0]}, this is Oryza Creative Agency — thanks for your enquiry${l.business ? ` about ${l.business}` : ""}.`;
const ago = (iso: string) => {
  const h = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h} h ago` : h < 24 * 7 ? `${Math.round(h / 24)} d ago` : fmtWhen(iso);
};
const pretty = (v: unknown): string => (Array.isArray(v) ? v.map(pretty).join(", ") : v && typeof v === "object" ? Object.values(v as Record<string, unknown>).map(pretty).filter(Boolean).join(" · ") : String(v ?? ""));
const human = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** One lead: contact, status (instant, with Undo), notes (saved when you leave the field), plan answers, Convert. */
export function LeadPanel({ lead, onChanged }: { lead: Lead; onChanged: (patch: Partial<Lead>) => void }) {
  const router = useRouter();
  const toast = useToast();
  const [notes, setNotes] = useState(lead.notes);
  const [saved, setSaved] = useState(lead.notes);
  const wa = whatsappFor(lead.phone, greeting(lead));
  const setStatus = async (s: LeadStatus) => {
    const prev = lead.status;
    if (prev === s) return;
    onChanged({ status: s });
    const res = await updateLeadAction(lead.id, s, saved);
    if (!res.ok) {
      onChanged({ status: prev });
      return toast.show({ message: res.error, tone: "error" });
    }
    toast.show({ message: `${lead.name}: ${statusText(s)}`, undo: async () => { onChanged({ status: prev }); const u = await updateLeadAction(lead.id, prev, saved); router.refresh(); return u.ok ? { ok: true } : { ok: false, error: u.error }; } });
    router.refresh();
  };
  const saveNotes = async () => {
    if (notes === saved) return;
    const before = saved;
    const res = await updateLeadAction(lead.id, lead.status, notes);
    if (!res.ok) return toast.show({ message: res.error, tone: "error" });
    setSaved(notes);
    onChanged({ notes });
    toast.show({ message: "Notes saved", undo: async () => { setNotes(before); setSaved(before); const u = await updateLeadAction(lead.id, lead.status, before); router.refresh(); return u.ok ? { ok: true } : { ok: false, error: u.error }; } });
    router.refresh();
  };
  const answers = lead.answers ? Object.entries(lead.answers).filter(([k, v]) => k !== "category" && pretty(v)) : [];
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">{lead.source === "plan-builder" ? "Plan builder" : "Contact form"} · {fmtWhen(lead.createdAt)}{lead.category && ` · ${lead.category}`}{lead.city && ` · ${lead.city}`}</p>
      {!lead.emailSent && <p className="rounded-lg bg-bad-bg px-3 py-2 text-[13px] text-bad" title={lead.emailError ?? ""}>The notification email was not sent — this lead is only here.</p>}
      <div className="flex flex-wrap gap-2">
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>WhatsApp {lead.phone}</a>}
        <a href={`tel:${lead.phone}`} className={btnGhost}>Call</a>
      </div>
      <div>
        <p className={`${label} mb-1`}>Status</p>
        <div role="radiogroup" aria-label="Status" className="inline-flex flex-wrap rounded-[10px] bg-surface-2 p-[3px]">
          {LEAD_STATUSES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={lead.status === s.id} onClick={() => setStatus(s.id)} className={`min-h-10 rounded-lg px-3 text-[13px] font-semibold md:min-h-8 ${lead.status === s.id ? "bg-surface shadow-sm" : "text-text-2"}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <label className={label}>
        Notes
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="What was discussed, the next step…" className={`mt-1 w-full ${field}`} />
        <span className="mt-1 block text-[12px] font-normal text-muted">{notes !== saved ? "Saves when you leave the field" : lead.updatedBy ? `Last updated ${fmtWhen(lead.updatedAt)} by ${lead.updatedBy}` : ""}</span>
      </label>
      {lead.message && <div><p className={`${label} mb-1`}>Message</p><p className="whitespace-pre-wrap rounded-lg bg-surface-2/60 px-3 py-2 text-[14px]">{lead.message}</p></div>}
      {answers.length > 0 && (
        <div className={`${card} p-3`}>
          <p className="mb-1 text-[13px] font-semibold">Plan builder answers</p>
          <dl className="space-y-1 text-[13px]">
            {answers.map(([k, v]) => <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2"><dt className="text-muted">{human(k)}</dt><dd className="break-words">{pretty(v)}</dd></div>)}
          </dl>
        </div>
      )}
    </div>
  );
}

/** Leads: saved views, search, sorting, bulk status, a drawer per lead. */
export function LeadsView({ leads: initial, openId }: { leads: Lead[]; openId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [leads, setLeads] = useState(initial);
  const [open, setOpen] = useState<string | null>(openId ?? null);
  // Fresh data from the server (after a refresh) replaces the local copy.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setLeads(initial);
  }
  const patch = useCallback((id: string, p: Partial<Lead>) => setLeads((all) => all.map((l) => (l.id === id ? { ...l, ...p } : l))), []);
  const current = leads.find((l) => l.id === open);
  const close = () => {
    setOpen(null);
    try {
      history.replaceState(null, "", "/admin/leads");
    } catch {
      /* ignore */
    }
  };
  const bulkStatus = (s: LeadStatus) => async (rows: Lead[]) => {
    const prev = rows.map((r) => [r.id, r.status, r.notes] as const);
    rows.forEach((r) => patch(r.id, { status: s }));
    const res = await Promise.all(rows.map((r) => updateLeadAction(r.id, s, r.notes)));
    if (res.some((r) => !r.ok)) toast.show({ message: "Some leads could not be updated", tone: "error" });
    else
      toast.show({
        message: `${rows.length} lead${rows.length > 1 ? "s" : ""} marked ${statusText(s).toLowerCase()}`,
        undo: async () => {
          prev.forEach(([id, st]) => patch(id, { status: st }));
          await Promise.all(prev.map(([id, st, n]) => updateLeadAction(id, st, n)));
          router.refresh();
        },
      });
    router.refresh();
  };
  const columns: Column<Lead>[] = [
    { key: "name", label: "Name", sort: (l) => l.name, card: "title", render: (l) => <button type="button" onClick={() => setOpen(l.id)} className="text-left"><span className="block font-semibold hover:underline">{l.name}</span>{l.business && <span className="block text-[13px] font-normal text-muted">{l.business}</span>}</button> },
    { key: "source", label: "Source", sort: (l) => l.source, card: "meta", render: (l) => (l.source === "plan-builder" ? "Plan builder" : "Contact form") },
    { key: "category", label: "Category", sort: (l) => l.category, card: "meta", render: (l) => l.category || "—" },
    { key: "city", label: "City", sort: (l) => l.city, card: "meta", render: (l) => l.city || "—" },
    { key: "status", label: "Status", sort: (l) => LEAD_STATUSES.findIndex((s) => s.id === l.status), card: "badge", render: (l) => <span className="inline-flex flex-wrap gap-1"><LeadStatusBadge status={l.status} />{!l.emailSent && <Badge tone="bad" dot={false} title={l.emailError ?? ""}>Email not sent</Badge>}</span> },
    { key: "received", label: "Received", sort: (l) => l.createdAt, card: "meta", className: "whitespace-nowrap text-muted", render: (l) => ago(l.createdAt) },
  ];
  return (
    <>
      <AdminTitle title="Leads" intro="Contact form and plan builder enquiries. Saved even when the email could not be sent." actions={
          // A file download (CSV route), not a page.
          <a href="/admin/leads/export" download className={btnGhost}>Export CSV</a>
        } />
      <DataTable
        id="leads"
        rows={leads}
        rowKey={(l) => l.id}
        columns={columns}
        initialSort={{ key: "received", dir: "desc" }}
        search={(l) => [l.name, l.phone, l.business, l.city, l.category, l.message, l.notes].join(" ")}
        views={[
          { id: "all", label: "All", test: () => true },
          { id: "new", label: "New", test: (l) => l.status === "new" },
          { id: "contacted", label: "Contacted", test: (l) => l.status === "contacted" },
          { id: "plan", label: "Plan builder", test: (l) => l.source === "plan-builder" && l.status !== "converted" },
          { id: "converted", label: "Converted", test: (l) => l.status === "converted" },
          { id: "not_fit", label: "Not a fit", test: (l) => l.status === "not_fit" },
        ]}
        bulk={[{ label: "Mark contacted", run: bulkStatus("contacted") }, { label: "Not a fit", run: bulkStatus("not_fit") }]}
        onOpen={(l) => setOpen(l.id)}
        actions={(l) => (
          <span className="inline-flex gap-1.5">
            {whatsappFor(l.phone) && <a href={whatsappFor(l.phone, greeting(l))!} target="_blank" rel="noopener noreferrer" className={btnSmall}>WhatsApp</a>}
            {l.status !== "converted" && <Link href={`/admin/clients/new?lead=${l.id}`} className={btnSmall}>Convert</Link>}
          </span>
        )}
        empty={<p className="rounded-xl border border-dashed border-edge-strong/60 px-4 py-8 text-center text-[14px] text-muted">No leads here yet. Enquiries from the contact form and the plan builder appear as they arrive.</p>}
      />
      <Drawer
        open={!!current}
        onClose={close}
        title={current ? `${current.name}${current.business ? ` · ${current.business}` : ""}` : ""}
        badge={current && <LeadStatusBadge status={current.status} />}
        footer={current && current.status !== "converted" ? <Link href={`/admin/clients/new?lead=${current.id}`} className={btn}>Convert to client</Link> : undefined}
      >
        {current && <LeadPanel key={current.id} lead={current} onChanged={(p) => patch(current.id, p)} />}
      </Drawer>
    </>
  );
}
