"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateItemAction } from "@/app/admin/(panel)/clients/actions";
import { addAssetAction, approveOfflineAction, removeAssetAction, undoTaskChangesAction } from "@/app/admin/(panel)/items/actions";
import type { ItemView } from "@/lib/admin/item-view";
import { OFFLINE_CHANNELS, offlineNoteProblem, type OfflineChannel } from "@/lib/ops/board";
import { Dialog } from "../shell/Drawer";
import { Icon } from "../shell/Icon";
import { useToast } from "../shell/Toasts";
import { SendForApproval } from "./ApprovalPanel";
import { TaskRow } from "./TaskRow";
import { ASSET_ACCEPT, uploadAsset } from "./upload";
import { Badge, btn, btnDanger, btnGhost, btnSmall, btnText, card, field, fmtDay, label } from "./ui";
import { useStored } from "../ui/useStored";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
type Field = "title" | "hook" | "cta" | "captionDraft" | "notes";
const LIMIT: Record<Field, number> = { title: 200, hook: 500, cta: 200, captionDraft: 4000, notes: 4000 };

/** Inline field: saves when you leave it, shows "Saving…/Saved", and offers Undo. Caption/notes keep a local draft. */
function InlineField({ id, clientId, name, labelText, value: initial, multiline, hint }: { id: string; clientId: string; name: Field; labelText: string; value: string; multiline?: boolean; hint?: string }) {
  const router = useRouter();
  const toast = useToast();
  // An unsaved caption or note survives a reload (kept in this browser until it is saved).
  const [draft, setDraft] = useStored(`oz_draft_${id}_${name}`);
  const [edited, setValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(initial);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const restored = multiline && edited === null && draft !== null && draft !== initial;
  const value = edited ?? (restored ? draft! : initial);
  const problem = name === "title" && !value.trim() ? "A title is needed." : value.length > LIMIT[name] ? `Keep it under ${LIMIT[name]} characters.` : null;
  async function save() {
    if (value === saved || problem) return;
    const before = saved;
    setState("saving");
    const res = await updateItemAction(id, clientId, { [name]: value });
    if (!res.ok) {
      setState("error");
      return toast.show({ message: res.error, tone: "error" });
    }
    setValue(value);
    setSaved(value);
    setState("saved");
    setDraft(null);
    toast.show({
      message: `${labelText} saved`,
      undo: async () => {
        setValue(before);
        setSaved(before);
        const u = await updateItemAction(id, clientId, { [name]: before });
        router.refresh();
        return u.ok ? { ok: true } : { ok: false, error: u.error };
      },
    });
    router.refresh();
  }
  const common = {
    id: `f-${id}-${name}`,
    value,
    "aria-invalid": problem ? true : undefined,
    "aria-describedby": `h-${id}-${name}`,
    onChange: (e: { target: { value: string } }) => {
      setValue(e.target.value);
      setState("");
      if (multiline) setDraft(e.target.value);
    },
    onBlur: save,
    className: `w-full ${field}`,
  };
  return (
    <div className="space-y-1">
      <label htmlFor={common.id} className={label}>{labelText}{hint && <span className="font-normal text-muted"> · {hint}</span>}</label>
      {multiline ? <textarea {...common} rows={name === "captionDraft" ? 5 : 3} /> : <input {...common} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />}
      <p id={`h-${id}-${name}`} className={`min-h-4 text-[12px] ${problem || state === "error" ? "text-bad" : "text-muted"}`} aria-live="polite">
        {problem ?? (state === "saving" ? "Saving…" : state === "saved" ? "Saved" : restored ? "Unsaved draft restored — click away to save it." : value !== saved ? "Saves when you leave the field" : "")}
      </p>
    </div>
  );
}

/** The confirmation for "Approved by the client via WhatsApp/call": channel + required note; Undo afterwards. */
export function OfflineApprovalDialog({ id, open, onClose, onDone }: { id: string; open: boolean; onClose: () => void; onDone?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [channel, setChannel] = useState<OfflineChannel>("whatsapp");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record an offline approval"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={btn}
            disabled={busy}
            onClick={async () => {
              const p = offlineNoteProblem(note);
              if (p) return setError(p);
              setBusy(true);
              const res = await approveOfflineAction(id, note, channel);
              setBusy(false);
              if (!res.ok) return setError(res.error);
              onClose();
              setNote("");
              onDone?.();
              toast.show({
                message: "Recorded as approved by the client",
                undo: async () => {
                  const u = await undoTaskChangesAction(id, [{ id: res.data.taskId, step: "client_approval", from: res.data.previous, to: "done" }]);
                  router.refresh();
                  return u.ok ? { ok: true } : { ok: false, error: u.error };
                },
              });
              router.refresh();
            }}
          >
            {busy ? "Saving…" : "Record approval"}
          </button>
        </>
      }
    >
      <p>Use this only when the client clearly approved this post outside the approval link. It is saved in the activity log with your name and the note, and the post shows “Approved offline by you”.</p>
      <fieldset className="mt-3">
        <legend className={label}>How did they approve?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {OFFLINE_CHANNELS.map((c) => (
            <label key={c.id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[14px] ${channel === c.id ? "border-ink" : "border-edge"}`}>
              <input type="radio" name="channel" checked={channel === c.id} onChange={() => setChannel(c.id)} />{c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={`${label} mt-3`} htmlFor={`offline-note-${id}`}>Note (required)</label>
      <textarea id={`offline-note-${id}`} data-autofocus rows={3} value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} placeholder="e.g. Dr Verma approved on WhatsApp at 4:10 pm" className={`mt-1 w-full ${field}`} aria-invalid={error ? true : undefined} />
      {error && <p role="alert" className="mt-1 text-[13px] text-bad">{error}</p>}
    </Dialog>
  );
}

function OfflineApproval({ id, allow, done, offline }: { id: string; allow: boolean; done: boolean; offline: ItemView["offline"] }) {
  const [open, setOpen] = useState(false);
  if (offline) return <p className="rounded-xl bg-ok-bg px-3 py-2 text-[14px] text-ok"><span className="font-semibold">Approved offline by {offline.by}</span> · {OFFLINE_CHANNELS.find((c) => c.id === offline.channel)?.label ?? offline.channel} · {fmt(offline.at)}<span className="block text-ink">“{offline.note}”</span></p>;
  if (!allow || done) return null;
  return (
    <>
      <button type="button" className={btnText} onClick={() => setOpen(true)}>Client approved on WhatsApp or a call…</button>
      <OfflineApprovalDialog id={id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Files({ id, assets }: { id: string; assets: ItemView["assets"] }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [link, setLink] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {assets.map((a) => (
          <li key={a.ref} className="group relative">
            {a.kind === "image" ? (
              // Signed, short-lived URL: next/image can't optimise it.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} className="aspect-square w-full rounded-lg border border-edge object-cover" />
            ) : a.kind === "video" ? (
              <video src={a.url} controls preload="metadata" className="aspect-square w-full rounded-lg border border-edge bg-ink" />
            ) : (
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex aspect-square items-center justify-center rounded-lg border border-edge p-2 text-center text-[12px] font-semibold underline">{a.name}</a>
            )}
            <button type="button" onClick={() => setRemove(a.ref)} aria-label={`Remove ${a.name}`} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg bg-surface/90 shadow"><Icon name="close" size={16} /></button>
          </li>
        ))}
        <li>
          <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-edge-strong text-[13px] font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-50">
            <Icon name="upload" />{busy ? "Uploading…" : "Add files"}
          </button>
        </li>
      </ul>
      <input ref={input} type="file" accept={ASSET_ACCEPT} multiple className="sr-only" aria-label="Choose files to upload"
        onChange={async (e) => {
          for (const f of Array.from(e.target.files ?? [])) {
            setBusy(f.name);
            const res = await uploadAsset(id, f);
            if (!res.ok) toast.show({ message: res.error, tone: "error" });
          }
          setBusy("");
          toast.show("Files added");
          router.refresh();
        }}
      />
      <form
        className="mt-2 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await addAssetAction(id, link.trim());
          if (!res.ok) return toast.show({ message: res.error, tone: "error" });
          setLink("");
          toast.show("Link added");
          router.refresh();
        }}
      >
        <input type="url" aria-label="Add a link" placeholder="or paste an https link (Drive, Canva…)" value={link} onChange={(e) => setLink(e.target.value)} className={`min-w-0 flex-1 ${field}`} />
        <button className={btnSmall} disabled={!link.trim()}>Add</button>
      </form>
      <Dialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Remove this file?"
        footer={
          <>
            <button type="button" className={btnGhost} onClick={() => setRemove(null)}>Keep it</button>
            <button type="button" className={btnDanger} onClick={async () => {
              const ref = remove!;
              setRemove(null);
              const res = await removeAssetAction(id, ref);
              toast.show(res.ok ? "File removed" : { message: res.error, tone: "error" });
              router.refresh();
            }}>Remove</button>
          </>
        }
      >
        Uploaded files are deleted from storage and can&apos;t be brought back. The client will no longer see it.
      </Dialog>
    </div>
  );
}

/** The content item: details (inline editing), files, tasks, client approval. Used by the page and the drawer. */
export function ItemPanel({ view, today, drawer }: { view: ItemView; today: string; drawer?: boolean }) {
  const { item, client, tasks, team, assets, responses, offline, allowOffline } = view;
  const approval = tasks.find((t) => t.step === "client_approval");
  const [tab, setTab] = useState<"details" | "tasks" | "approval">("details");
  const done = tasks.filter((t) => t.status === "done").length;
  const details = (
      <section aria-label="Details" className={drawer && tab !== "details" ? "hidden" : "space-y-3"}>
        <InlineField id={item.id} clientId={client.id} name="title" labelText="Title" value={item.title} />
        <InlineField id={item.id} clientId={client.id} name="hook" labelText="Hook" value={item.hook} />
        <InlineField id={item.id} clientId={client.id} name="cta" labelText="Call to action" value={item.cta} />
        <InlineField id={item.id} clientId={client.id} name="captionDraft" labelText="Caption draft" hint="the client sees this" value={item.captionDraft} multiline />
        {item.complianceNote && <p className="rounded-xl bg-warn-bg px-3 py-2 text-[14px]"><span className="font-semibold">Compliance (locked):</span> {item.complianceNote}</p>}
        <div>
          <p className={`${label} mb-1`}>Designs and videos</p>
          <Files id={item.id} assets={assets} />
        </div>
        <div id="notes"><InlineField id={item.id} clientId={client.id} name="notes" labelText="Team notes" hint="not shown to the client" value={item.notes} multiline /></div>
      </section>
  );
  const taskList = (
      <section aria-label="Tasks" className={drawer && tab !== "tasks" ? "hidden" : ""}>
        {!drawer && <h2 className="mb-2 mt-6 font-display text-[18px]">Tasks <span className="font-sans text-[13px] text-muted">{done}/{tasks.length}</span></h2>}
        <ul className={`${card} overflow-hidden`}>{tasks.map((t) => <TaskRow key={`${t.id}-${t.status}`} task={t} today={today} team={team} />)}</ul>
      </section>
  );
  const approvalSection = (
      <section aria-label="Client approval" className={drawer && tab !== "approval" ? "hidden" : "space-y-3"}>
        {!drawer && <h2 className="mb-2 mt-6 font-display text-[18px]">Client approval</h2>}
        <p className="text-[14px]">
          {item.clientApproved ? <Badge tone="ok">Client approved</Badge> : approval ? <Badge tone={approval.status === "in_progress" ? "warn" : "neutral"}>{approval.status === "in_progress" ? "Waiting for the client" : "Not sent yet"}</Badge> : <span className="text-muted">This format has no client approval step.</span>}
        </p>
        <OfflineApproval id={item.id} allow={allowOffline && !!approval} done={item.clientApproved} offline={offline} />
        {!item.clientApproved && <SendForApproval clientId={client.id} clientName={client.contactPerson || client.name} clientPhone={client.phone} clientEmail={client.email} items={[{ id: item.id, title: item.title, date: item.date, platform: item.platform, format: item.format, clientApproved: item.clientApproved }]} preselect />}
        {responses.length > 0 && (
          <ul className="space-y-2 text-[14px]">
            {responses.map((r, i) => (
              <li key={i} className="rounded-lg bg-surface-2/60 px-3 py-2">
                <span className={`font-semibold ${r.decision === "approved" ? "text-ok" : "text-warn"}`}>{r.decision === "approved" ? "Approved" : "Changes requested"}</span> <span className="text-muted">· {fmt(r.at)}</span>
                {r.comment && <span className="block">“{r.comment}”</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
  );
  if (!drawer)
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">{details}</div>
        <div className="min-w-0">{taskList}{approvalSection}</div>
      </div>
    );
  return (
    <div>
      <div role="tablist" aria-label="Post sections" className="-mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-edge px-4 md:-mx-5 md:px-5">
        {([["details", "Details"], ["tasks", `Tasks ${done}/${tasks.length}`], ["approval", "Approval"]] as const).map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px min-h-11 whitespace-nowrap border-b-2 px-3 text-[14px] font-semibold ${tab === k ? "border-gold-500 text-ink" : "border-transparent text-muted"}`}>{l}</button>
        ))}
      </div>
      {details}
      {taskList}
      {approvalSection}
      <p className="mt-6 text-[12px] text-muted">Publishes {fmtDay(item.date)} {item.time} · <Link href={`/admin/clients/${client.id}`} className="underline">{client.name}</Link></p>
    </div>
  );
}
