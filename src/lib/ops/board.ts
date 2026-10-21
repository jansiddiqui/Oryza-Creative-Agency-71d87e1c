/**
 * Board (Kanban by stage) drag rules. A post's stage is derived from its tasks, so a drag may only do what the app
 * already allows: start or finish the matching task. "Client approved" comes from the client's answer on the approval
 * link — or, when the owner allows it, a team member can record an approval given on WhatsApp or a call (with a note).
 * Pure.
 */
import { deriveStage } from "./deadlines";
import type { ItemStage, TaskRow, TaskStatus } from "./types";

export const BOARD_COLUMNS: ItemStage[] = ["planned", "in_production", "client_review", "approved", "scheduled", "published", "done"];

type T = Pick<TaskRow, "id" | "step" | "status" | "due">;
export interface TaskChange {
  id: string;
  step: string;
  from: TaskStatus;
  to: TaskStatus;
}

export type BoardMove =
  | { kind: "tasks"; changes: TaskChange[]; label: string }
  | { kind: "offline_approval" }
  | { kind: "refuse"; reason: string };

const order = (a: T, b: T) => a.due.localeCompare(b.due);

/** What dropping a post from one stage onto another means, given its tasks. */
export function boardMove(tasks: T[], to: ItemStage, opts: { offlineApproval: boolean }): BoardMove {
  const from = deriveStage(tasks);
  if (from === to) return { kind: "refuse", reason: "It is already here." };
  if (BOARD_COLUMNS.indexOf(to) < BOARD_COLUMNS.indexOf(from)) return { kind: "refuse", reason: "To move a post back, reopen its task from the post itself." };
  const find = (step: string) => tasks.find((t) => t.step === step);
  const approval = find("client_approval");
  const set = (t: T | undefined, status: TaskStatus) => (t && t.status !== status ? [{ id: t.id, step: t.step, from: t.status, to: status }] : []);
  let changes: TaskChange[] = [];
  let label = "";

  switch (to) {
    case "in_production": {
      const next = tasks.filter((t) => t.status === "todo" && t.step !== "client_approval").sort(order)[0];
      if (!next) return { kind: "refuse", reason: "There is no open task to start." };
      changes = set(next, "in_progress");
      label = `Started ${next.step.replace(/_/g, " ")}`;
      break;
    }
    case "client_review":
      if (!approval) return { kind: "refuse", reason: "This post has no client approval step." };
      changes = set(approval, "in_progress");
      label = "Waiting for the client";
      break;
    case "approved":
      if (!approval) return { kind: "refuse", reason: "This post has no client approval step." };
      if (!opts.offlineApproval) return { kind: "refuse", reason: "Only the client can approve — send it for approval. (Offline approval is switched off in Settings.)" };
      return { kind: "offline_approval" };
    case "scheduled":
    case "published": {
      if (approval && approval.status !== "done") return { kind: "refuse", reason: "The client has not approved it yet — send it for approval first." };
      const step = to === "scheduled" ? "schedule" : "publish";
      const t = find(step);
      if (!t) return { kind: "refuse", reason: `This post has no ${step} step.` };
      changes = [...(to === "published" ? set(find("schedule"), "done") : []), ...set(t, "done")];
      label = to === "scheduled" ? "Marked scheduled" : "Marked published";
      break;
    }
    case "done":
      if (from !== "published") return { kind: "refuse", reason: "Publish it first." };
      changes = tasks.filter((t) => t.status !== "done").map((t) => ({ id: t.id, step: t.step, from: t.status, to: "done" as TaskStatus }));
      label = "Marked done";
      break;
    default:
      return { kind: "refuse", reason: "Not possible." };
  }
  const after = tasks.map((t) => ({ ...t, status: changes.find((c) => c.id === t.id)?.to ?? t.status }));
  const result = deriveStage(after);
  // A post without a post-check step is finished as soon as it is published.
  if (result !== to && !(to === "published" && result === "done")) return { kind: "refuse", reason: "Its tasks don't allow that move yet — open the post to see what's left." };
  return { kind: "tasks", changes, label };
}

/** The reverse of a move (for Undo). */
export const undoChanges = (changes: TaskChange[]): TaskChange[] => changes.map((c) => ({ ...c, from: c.to, to: c.from }));

export const OFFLINE_CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Phone call" },
  { id: "in_person", label: "In person" },
] as const;
export type OfflineChannel = (typeof OFFLINE_CHANNELS)[number]["id"];

/** A note is required: at least a few words, at most 300 characters. */
export function offlineNoteProblem(note: string): string | null {
  const n = note.trim();
  if (n.length < 5) return "Add a short note (who approved and how), at least 5 characters.";
  if (n.length > 300) return "Keep the note under 300 characters.";
  return null;
}
