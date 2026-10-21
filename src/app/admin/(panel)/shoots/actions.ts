"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { getShoot, moveShoot, setShot, shootMovePlan, updateShootDetails } from "@/lib/admin/shoots-data";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const refresh = () => revalidatePath("/admin", "layout");

export async function setShotAction(shotId: string, done: boolean) {
  return adminAction(async (admin) => {
    const r = await setShot(shotId, Boolean(done), admin.email);
    await audit(admin.email, "shot.update", shotId, { clientId: r.clientId, shootId: r.shootId, itemId: r.itemId, done: Boolean(done) });
    refresh();
  });
}

export async function updateShootDetailsAction(id: string, p: { location?: string; startTime?: string; endTime?: string; shooter?: string | null; props?: string; people?: string; notes?: string; status?: string }) {
  return adminAction(async (admin) => {
    if (p.status && !["planned", "done", "cancelled"].includes(p.status)) throw new Error("status");
    const shoot = await getShoot(id);
    if (!shoot) throw new Error("Shoot not found");
    await updateShootDetails(id, { ...p, status: p.status as "planned" | "done" | "cancelled" | undefined });
    await audit(admin.email, "shoot.update", id, { clientId: shoot.clientId, fields: Object.keys(p) });
    refresh();
  });
}

/** What moving the shoot would change (shown before the admin confirms). */
export async function previewShootMoveAction(id: string, date: string) {
  return adminAction(async () => {
    if (!ISO.test(date)) throw new Error("date");
    const { changes } = await shootMovePlan(id, date);
    return changes.map((c) => ({ itemTitle: c.itemTitle, label: c.label, from: c.from, to: c.due, late: c.late }));
  });
}

export async function moveShootAction(id: string, date: string) {
  return adminAction(async (admin) => {
    if (!ISO.test(date)) throw new Error("date");
    const { shoot, changed } = await moveShoot(id, date);
    await audit(admin.email, "shoot.move", id, { clientId: shoot.clientId, from: shoot.date, to: date, tasksChanged: changed });
    refresh();
    return { changed };
  });
}
