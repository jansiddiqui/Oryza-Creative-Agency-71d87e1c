"use client";

import { useState } from "react";
import { LEAD_STATUSES } from "@/lib/admin/types";
import { whatsappFor, type Lead } from "@/lib/leads-format";
import { updateLeadAction } from "@/app/admin/(panel)/leads/actions";
import { fmtWhen } from "./AdminShell";

const statusTone: Record<Lead["status"], string> = {
  new: "bg-gold-100 text-gold-700",
  contacted: "border border-ink/25 text-ink",
  converted: "bg-ink text-paper",
  not_fit: "border border-line text-muted",
};

function LeadStatusBadge({ status }: { status: Lead["status"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusTone[status]}`}>
      {LEAD_STATUSES.find((s) => s.id === status)?.label ?? status}
    </span>
  );
}

export function LeadCard({ lead }: { lead: Lead }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const [error, setError] = useState("");
  const dirty = status !== lead.status || notes !== lead.notes;
  const wa = whatsappFor(lead.phone, `Hi ${lead.name.split(" ")[0]}, this is Oryza Creative Agency — thanks for your enquiry${lead.business ? ` about ${lead.business}` : ""}.`);

  return (
    <article className="rounded-2xl border border-line bg-paper p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold">
            {lead.name}
            {lead.business && <span className="font-normal text-muted"> · {lead.business}</span>}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {fmtWhen(lead.createdAt)} · {lead.source === "plan-builder" ? "Plan builder" : "Contact form"}
            {lead.category && ` · ${lead.category}`}
            {lead.city && ` · ${lead.city}`}
          </p>
        </div>
        <span className="flex items-center gap-2">
          {!lead.emailSent && <span className="rounded-full border border-red-800/30 px-2.5 py-0.5 text-[12px] font-semibold text-red-900" title={lead.emailError ?? ""}>Email not sent</span>}
          <LeadStatusBadge status={lead.status} />
        </span>
      </header>

      <div className="mt-3 flex flex-wrap gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
            WhatsApp {lead.phone}
          </a>
        )}
        <a href={`tel:${lead.phone}`} className="rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink">Call</a>
      </div>

      {(lead.message || lead.planSummary || lead.answers) && (
        <details className="mt-4 rounded-xl bg-cream/60 p-3 text-[14px]">
          <summary className="cursor-pointer font-semibold">Message and plan</summary>
          {lead.message && <p className="mt-2 whitespace-pre-wrap">{lead.message}</p>}
          {lead.planSummary && <pre className="mt-3 whitespace-pre-wrap font-sans text-[13px] text-ink-soft">{lead.planSummary}</pre>}
          {lead.answers && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[13px] font-semibold">Plan answers</summary>
              <pre className="mt-2 overflow-x-auto text-[12px]">{JSON.stringify(lead.answers, null, 2)}</pre>
            </details>
          )}
        </details>
      )}

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setState("saving");
          const res = await updateLeadAction(lead.id, status, notes);
          if (res.ok) setState("saved");
          else {
            setState("error");
            setError(res.error);
          }
        }}
      >
        <label className="text-[13px] font-semibold">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Lead["status"])} className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] font-normal">
            {LEAD_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="text-[13px] font-semibold">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[14px] font-normal" />
        </label>
        <button disabled={!dirty || state === "saving"} className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper disabled:opacity-40">
          {state === "saving" ? "Saving…" : "Save"}
        </button>
      </form>
      <p aria-live="polite" className="mt-2 text-[13px] text-muted">
        {state === "saved" && !dirty ? "Saved." : state === "error" ? error : lead.updatedBy ? `Last updated ${fmtWhen(lead.updatedAt)} by ${lead.updatedBy}` : ""}
      </p>
    </article>
  );
}
