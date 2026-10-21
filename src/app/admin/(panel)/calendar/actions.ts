"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { getItem, moveItem } from "@/lib/admin/ops-data";

/**
 * Reschedule a content item and recalculate its open tasks. If the client has already approved it, nothing moves
 * until the admin confirms (the UI asks first).
 */
export async function moveItemAction(id: string, date: string, confirmed = false) {
  return adminAction(async (admin) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date");
    const item = await getItem(id);
    if (!item) throw new Error("Item not found");
    if (item.date === date) return { moved: false, needsConfirm: false, changed: 0 };
    if (item.clientApproved && !confirmed) return { moved: false, needsConfirm: true, changed: 0 };
    const { changed } = await moveItem(id, date);
    await audit(admin.email, "item.move", id, { clientId: item.clientId, from: item.date, to: date, tasksChanged: changed, clientApproved: item.clientApproved });
    revalidatePath("/admin", "layout");
    return { moved: true, needsConfirm: false, changed };
  });
}
