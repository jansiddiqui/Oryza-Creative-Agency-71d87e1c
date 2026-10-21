"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { ASSET_TYPES, assetUploadTarget, getItemDetail, removeStoredAsset, setAssets } from "@/lib/admin/approvals-data";
import { updateItem } from "@/lib/admin/ops-data";

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
