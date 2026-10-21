"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { undoTaskChangesAction } from "@/app/admin/(panel)/items/actions";
import { updateTaskAction } from "@/app/admin/(panel)/today/actions";
import type { TeamMember } from "@/lib/admin/ops-data";
import type { TaskRow as Task, TaskStatus } from "@/lib/ops/types";
import { Drawer } from "../shell/Drawer";
import { Icon } from "../shell/Icon";
import { useToast } from "../shell/Toasts";
import { btnSmall, btnText, field, fmtDay, TaskBadge } from "./ui";

/** Due-date words for a task: "Overdue · was due Fri 6 Nov", "Due today 6:00 pm", "Thu 12 Nov". */
export function dueText(t: Pick<Task, "due" | "time" | "status">, today: string) {
  if (t.status === "done") return `Done · was due ${fmtDay(t.due)}`;
  if (t.due < today) return `Overdue · was due ${fmtDay(t.due)}`;
  if (t.due === today) return `Due today${t.time ? ` ${t.time}` : ""}`;
  return `${fmtDay(t.due)}${t.time ? ` · ${t.time}` : ""}`;
}

/**
 * One task with one-tap actions. Changes show immediately; Done, Start and Blocked offer Undo (they're reversible).
 * Phones get the check plus a "⋯" action sheet so every target is 44 px.
 */
export function TaskRow({ task, today, team, title, showItem = true }: { task: Task; today: string; team: TeamMember[]; title?: string; showItem?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [mode, setMode] = useState<"" | "blocked" | "note">("");
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const overdue = status !== "done" && task.due < today;
  const dueToday = status !== "done" && task.due === today;
  const who = task.assignee ? (team.find((m) => m.email === task.assignee)?.name ?? task.assignee) : "Unassigned";

  async function set(next: TaskStatus, reason?: string) {
    const prev = status;
    setStatus(next);
    setMode("");
    setSheet(false);
    setBusy(true);
    const res = await updateTaskAction(task.id, { status: next, blockedReason: reason });
    setBusy(false);
    if (!res.ok) {
      setStatus(prev);
      return toast.show({ message: res.error, tone: "error" });
    }
    toast.show({
      message: next === "done" ? `${task.label} marked done` : next === "in_progress" ? `${task.label} started` : next === "blocked" ? `${task.label} blocked` : `${task.label} reopened`,
      undo: async () => {
        setStatus(prev);
        const u = await undoTaskChangesAction(task.itemId, [{ id: task.id, step: task.step, from: prev, to: next }]);
        router.refresh();
        return u.ok ? { ok: true } : { ok: false, error: u.error };
      },
    });
    router.refresh();
  }

  async function saveNote() {
    setBusy(true);
    const res = await updateTaskAction(task.id, { note: text });
    setBusy(false);
    if (!res.ok) return toast.show({ message: res.error, tone: "error" });
    setMode("");
    toast.show("Note saved");
    router.refresh();
  }

  const name = title ? `${task.label} · ${title}` : task.label;
  return (
    <li className={`relative border-t border-edge first:border-t-0 ${status === "done" ? "bg-surface-2/40" : ""}`}>
      {(overdue || dueToday) && <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[3px] ${overdue ? "bg-bad" : "bg-[#c98a10]"}`} />}
      <div className="flex items-center gap-1 py-1 pl-1 pr-2 md:gap-3 md:pl-2">
        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center" title={status === "done" ? "Mark not done" : "Mark done"}>
          <input type="checkbox" checked={status === "done"} disabled={busy} onChange={(e) => set(e.target.checked ? "done" : "todo")} aria-label={`${status === "done" ? "Reopen" : "Mark done"}: ${name}`} className="!h-5 !w-5 cursor-pointer" />
        </label>
        <div className="min-w-0 flex-1 py-1.5">
          <p className={`text-[14px] font-semibold ${status === "done" ? "text-muted line-through" : ""}`}>
            {showItem && title ? <Link href={`/admin/items/${task.itemId}`} scroll={false} className="hover:underline">{task.label}<span className="font-normal text-text-2"> · {title}</span></Link> : task.label}
          </p>
          <p className={`text-[13px] ${overdue ? "font-semibold text-bad" : "text-muted"}`}>
            {dueText({ ...task, status }, today)} · {who}
            {task.late && status !== "done" && " · flagged late"}
          </p>
          {status === "blocked" && task.blockedReason && <p className="text-[13px] text-bad">Blocked: {task.blockedReason}</p>}
          {task.note && <p className="text-[13px] text-text-2">Note: {task.note}</p>}
        </div>
        {status !== "todo" && status !== "done" && <span className="hidden md:inline"><TaskBadge status={status} /></span>}
        <div className="hidden items-center gap-1 md:flex">
          {status !== "in_progress" && status !== "done" && <button type="button" disabled={busy} className={btnText} onClick={() => set("in_progress")}>Start</button>}
          {status !== "blocked" && status !== "done" && <button type="button" disabled={busy} className={btnText} onClick={() => { setMode("blocked"); setText(""); }}>Blocked</button>}
          <button type="button" disabled={busy} className={btnText} onClick={() => { setMode("note"); setText(task.note); }}>Note</button>
        </div>
        <button type="button" onClick={() => setSheet(true)} aria-label={`Actions for ${name}`} className="grid h-11 w-11 place-items-center rounded-lg text-muted md:hidden"><Icon name="more" /></button>
      </div>
      {mode && (
        <form
          className="flex flex-wrap gap-2 px-3 pb-3 md:pl-14"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "blocked") void set("blocked", text);
            else void saveNote();
          }}
        >
          <input autoFocus required={mode === "blocked"} aria-label={mode === "blocked" ? "Why is it blocked?" : "Note"} placeholder={mode === "blocked" ? "Why is it blocked? (required)" : "Add a note"} value={text} onChange={(e) => setText(e.target.value)} className={`min-w-0 flex-1 ${field}`} />
          <button disabled={busy || (mode === "blocked" && !text.trim())} className={btnSmall}>Save</button>
          <button type="button" className={btnText} onClick={() => setMode("")}>Cancel</button>
        </form>
      )}
      <Drawer open={sheet} onClose={() => setSheet(false)} title={task.label} subtitle={title} width={420}>
        <div className="grid gap-2">
          {status !== "in_progress" && status !== "done" && <button type="button" className="min-h-12 rounded-xl border border-edge px-4 text-left text-[15px] font-semibold" onClick={() => set("in_progress")}>Start</button>}
          {status !== "done" && <button type="button" className="min-h-12 rounded-xl border border-edge px-4 text-left text-[15px] font-semibold" onClick={() => set("done")}>Mark done</button>}
          {status !== "blocked" && status !== "done" && <button type="button" className="min-h-12 rounded-xl border border-edge px-4 text-left text-[15px] font-semibold" onClick={() => { setSheet(false); setMode("blocked"); setText(""); }}>Blocked…</button>}
          <button type="button" className="min-h-12 rounded-xl border border-edge px-4 text-left text-[15px] font-semibold" onClick={() => { setSheet(false); setMode("note"); setText(task.note); }}>Add a note</button>
          <Link href={`/admin/items/${task.itemId}`} className="flex min-h-12 items-center rounded-xl border border-edge px-4 text-[15px] font-semibold">Open the post</Link>
        </div>
      </Drawer>
    </li>
  );
}
