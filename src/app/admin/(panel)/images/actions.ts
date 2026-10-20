"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { LIVE_IMAGES_TAG } from "@/lib/images/live";
import * as images from "@/lib/images/service";
import { supabaseFileStore, supabaseImageRepo } from "@/lib/images/supabase-store";
import { serviceClient } from "@/lib/supabase/admin";

const deps = (): images.Deps => {
  const db = serviceClient();
  return { repo: supabaseImageRepo(db), files: supabaseFileStore(db), audit };
};

/** Public pages that show the slot refresh right away; the admin lists too. */
function refresh(pages: string[], slotId: string) {
  revalidateTag(LIVE_IMAGES_TAG, { expire: 0 });
  for (const p of pages) revalidatePath(p);
  revalidatePath("/admin/images");
  revalidatePath(`/admin/images/${slotId}`);
}

export async function startUploadAction(slotId: string, mime: string) {
  return adminAction((admin) => images.startUpload(deps(), admin, slotId, mime));
}

export async function completeUploadAction(input: { slotId: string; path: string; source: string; credit?: string }) {
  return adminAction(async (admin) => {
    const v = await images.completeUpload(deps(), admin, input);
    revalidatePath(`/admin/images/${input.slotId}`);
    revalidatePath("/admin/images");
    return { id: v.id, version: v.version };
  });
}

export async function setFocalAction(id: string, slotId: string, x: number, y: number) {
  return adminAction(async (admin) => {
    await images.setFocal(deps(), admin, id, { x, y });
    revalidatePath(`/admin/images/${slotId}`);
  });
}

export async function approveAction(id: string, slotId: string, checklist: Record<string, boolean>) {
  return adminAction(async (admin) => refresh(await images.approve(deps(), admin, id, checklist), slotId));
}

export async function rollbackAction(id: string, slotId: string) {
  return adminAction(async (admin) => refresh(await images.rollback(deps(), admin, id), slotId));
}

export async function removeLiveAction(slotId: string) {
  return adminAction(async (admin) => refresh(await images.removeLive(deps(), admin, slotId), slotId));
}

export async function deleteVersionAction(id: string, slotId: string) {
  return adminAction(async (admin) => {
    await images.deleteVersion(deps(), admin, id);
    revalidatePath(`/admin/images/${slotId}`);
    revalidatePath("/admin/images");
  });
}
