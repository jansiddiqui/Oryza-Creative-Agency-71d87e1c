"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { ASSET_TYPES, assetUploadTarget, getItemDetail, removeStoredAsset, setAssets } from "@/lib/admin/approvals-data";
import { updateItem } from "@/lib/admin/ops-data";
import { applyTaskChanges, approveOffline, loadOfflineApproval, planBoardMove } from "@/lib/admin/board-data";
import { BOARD_COLUMNS, OFFLINE_CHANNELS, offlineNoteProblem, undoChanges, type OfflineChannel, type TaskChange } from "@/lib/ops/board";
import { TASK_STATUSES, type ItemStage } from "@/lib/ops/types";

const refresh = () => revalidatePath("/admin", "layout");

export async function saveItemTextAction(id: string, p: { captionDraft?: string; notes?: string }) {
  return adminAction(async (admin) => {
    const item = await getItemDetail(id);
    if (!item) throw new Error("Item not found");
    await updateItem(id, { captionDraft: p.captionDraft, notes: p.notes });
    await audit(admin.email, "item.update", id, { clientId: item.clientId, fields: Object.keys(p) });
    refresh();
  });
}

/** A one-time link to upload an asset straight to private storage. */
export async function startAssetUploadAction(id: string, mime: string) {
  return adminAction(async () => {
    if (!ASSET_TYPES.includes(mime)) throw new Error("Use a JPG, PNG, WebP, GIF, MP4, MOV, WebM or PDF file");
    const item = await getItemDetail(id);
    if (!item) throw new Error("Item not found");
    if (item.assetLinks.length >= 20) throw new Error("An item can have up to 20 files");
    return assetUploadTarget(item, mime);
  });
}

/** Attaches an uploaded file (its storage path) or an outside https link to the item. */
export async function addAssetAction(id: string, ref: string) {
  return adminAction(async (admin) => {
    const item = await getItemDetail(id);
    if (!item) throw new Error("Item not found");
    const ok = ref.startsWith(`${item.clientId}/${item.id}/`) || /^https:\/\/\S{4,500}$/.test(ref);
    if (!ok) throw new Error("Not a file of this item or an https link");
    await setAssets(id, [...item.assetLinks.filter((a) => a !== ref), ref]);
    await audit(admin.email, "asset.add", id, { clientId: item.clientId, ref });
    refresh();
  });
}

export async function removeAssetAction(id: string, ref: string) {
  return adminAction(async (admin) => {
    const item = await getItemDetail(id);
    if (!item) throw new Error("Item not found");
    await setAssets(id, item.assetLinks.filter((a) => a !== ref));
    if (ref.startsWith(`${item.clientId}/${item.id}/`)) await removeStoredAsset(ref);
    await audit(admin.email, "asset.remove", id, { clientId: item.clientId, ref });
    refresh();
  });
}

/** Board drag: the server works out the move from the post's tasks and applies it; returns the changes for Undo. */
export async function boardMoveAction(id: string, to: string) {
  return adminAction(async (admin) => {
    if (!BOARD_COLUMNS.includes(to as ItemStage)) throw new Error("stage");
    const move = await planBoardMove(id, to as ItemStage);
    if (move.kind === "refuse") return move;
    if (move.kind === "offline_approval") return move;
    const n = await applyTaskChanges(id, move.changes, admin.email);
    const item = await getItemDetail(id);
    await audit(admin.email, "task.update", id, { clientId: item?.clientId, board: to, tasks: n });
    refresh();
    return move;
  });
}

/** Undo of a board move or a quick task action: only tasks still in the expected state are changed back. */
export async function undoTaskChangesAction(id: string, changes: TaskChange[]) {
  return adminAction(async (admin) => {
    const clean = (changes ?? []).slice(0, 20).filter((c) => typeof c.id === "string" && TASK_STATUSES.some((s) => s.id === c.from) && TASK_STATUSES.some((s) => s.id === c.to));
    const n = await applyTaskChanges(id, undoChanges(clean), admin.email);
    const item = await getItemDetail(id);
    await audit(admin.email, "task.update", id, { clientId: item?.clientId, undo: true, tasks: n });
    refresh();
    return { changed: n };
  });
}

/** "Approved by the client via WhatsApp/call": needs a note; recorded in the activity log. Owners can switch it off. */
export async function approveOfflineAction(id: string, note: string, channel: string) {
  return adminAction(async (admin) => {
    if (!(await loadOfflineApproval())) throw new Error("Offline approval is switched off in Settings");
    const problem = offlineNoteProblem(String(note ?? ""));
    if (problem) throw new Error(problem);
    if (!OFFLINE_CHANNELS.some((c) => c.id === channel)) throw new Error("Choose how the client approved");
    const r = await approveOffline(id, String(note).trim(), channel as OfflineChannel, admin.email);
    refresh();
    return r;
  });
}
