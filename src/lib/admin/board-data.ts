import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { boardMove, type BoardMove, type OfflineChannel, type TaskChange } from "@/lib/ops/board";
import type { ItemStage } from "@/lib/ops/types";
import { audit } from "./audit";
import { getItem, listTasks, updateTask } from "./ops-data";

const db = () => serviceClient();
type R = Record<string, unknown>;

export async function loadOfflineApproval(): Promise<boolean> {
  const { data } = await db().from("ops_settings").select("allow_offline_approval").eq("id", 1).maybeSingle();
  return (data as R | null)?.allow_offline_approval !== false;
}

export async function saveOfflineApproval(enabled: boolean, actor: string) {
  const { error } = await db().from("ops_settings").update({ allow_offline_approval: enabled, updated_at: new Date().toISOString(), updated_by: actor }).eq("id", 1);
  if (error) throw new Error(error.message);
}

/** Works out a board move on the server from the post's current tasks (the browser's view is never trusted). */
export async function planBoardMove(itemId: string, to: ItemStage): Promise<BoardMove> {
  const tasks = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
  return boardMove(tasks, to, { offlineApproval: await loadOfflineApproval() });
}

/**
 * Applies task changes with the same code as Today's Start/Done buttons. Each change only applies if the task is
 * still in the expected state, so an Undo can never overwrite newer work.
 */
export async function applyTaskChanges(itemId: string, changes: TaskChange[], actor: string): Promise<number> {
  const tasks = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
  let n = 0;
  for (const c of changes) {
    const t = tasks.find((x) => x.id === c.id);
    if (!t || t.status !== c.from) continue;
    await updateTask(c.id, { status: c.to, blockedReason: c.to === "blocked" ? t.blockedReason || "Reopened" : undefined }, actor);
    n++;
  }
  return n;
}

/** Records a client's approval given on WhatsApp, a call or in person: the approval task is done by this team member. */
export async function approveOffline(itemId: string, note: string, channel: OfflineChannel, actor: string) {
  const item = await getItem(itemId);
  if (!item) throw new Error("Post not found");
  const tasks = await listTasks({ to: "9999-12-31", itemIds: [itemId] });
  const t = tasks.find((x) => x.step === "client_approval");
  if (!t) throw new Error("This post has no client approval step");
  if (t.status === "done") throw new Error("This post is already approved");
  await updateTask(t.id, { status: "done", note: `Approved offline (${channel}): ${note}`.slice(0, 2000) }, actor);
  await audit(actor, "client.approved_offline", itemId, { clientId: item.clientId, note, channel, taskId: t.id, previous: t.status });
  return { clientId: item.clientId, taskId: t.id, previous: t.status };
}

export interface OfflineApproval {
  by: string;
  at: string;
  note: string;
  channel: string;
}

/** The latest offline approval of a post, if its approval still stands. */
export async function offlineApprovalFor(itemId: string): Promise<OfflineApproval | null> {
  const { data } = await db().from("audit_log").select("actor_email, at, details").eq("action", "client.approved_offline").eq("target", itemId).order("at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const item = await getItem(itemId);
  if (!item?.clientApproved) return null;
  const d = ((data as R).details ?? {}) as R;
  return { by: (data as R).actor_email as string, at: (data as R).at as string, note: String(d.note ?? ""), channel: String(d.channel ?? "") };
}
