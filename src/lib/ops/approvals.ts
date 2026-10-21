/** What a client's answer on an approval link does to the item's tasks. Pure. */
import type { TaskRow } from "./types";

export type Decision = "approved" | "changes";
export const CLIENT_ACTOR = "client (approval link)";

export interface TaskChange {
  id: string;
  status: "done" | "todo";
  note: string;
  completedBy: string | null;
}

/**
 * Approved: the item's "Client approval" task is done (by the client). Changes requested: that task goes back to
 * "to do" with the client's comment as its note, so the team sees it on Today. Items without that step get no
 * task change (the approval is still recorded on the item).
 */
export function decisionTaskChange(tasks: Pick<TaskRow, "id" | "step" | "status" | "note">[], decision: Decision, comment = ""): TaskChange | null {
  const t = tasks.find((x) => x.step === "client_approval");
  if (!t) return null;
  if (decision === "approved") return { id: t.id, status: "done", note: t.note, completedBy: CLIENT_ACTOR };
  return { id: t.id, status: "todo", note: `Client asked for changes: ${comment}`.slice(0, 2000), completedBy: null };
}

/** The latest answer per item (responses newest first or in any order). */
export function latestDecisions<R extends { itemId: string; decision: Decision; at: string }>(responses: R[]): Map<string, R> {
  const out = new Map<string, R>();
  for (const r of [...responses].sort((a, b) => a.at.localeCompare(b.at))) out.set(r.itemId, r);
  return out;
}
