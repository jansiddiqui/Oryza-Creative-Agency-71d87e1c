"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { updateTask } from "@/lib/admin/ops-data";
import { TASK_STATUSES, type TaskStatus } from "@/lib/ops/types";

/** Quick actions on a task: Start, Done, Blocked (with a reason) or a note. */
export async function updateTaskAction(id: string, patch: { status?: string; blockedReason?: string; note?: string }) {
  return adminAction(async (admin) => {
    if (patch.status && !TASK_STATUSES.some((s) => s.id === patch.status)) throw new Error("status");
    if (patch.status === "blocked" && !patch.blockedReason?.trim()) throw new Error("A blocked task needs a reason");
    const { clientId } = await updateTask(id, { ...patch, status: patch.status as TaskStatus | undefined }, admin.email);
    await audit(admin.email, "task.update", id, { clientId, ...patch });
    revalidatePath("/admin", "layout");
  });
}
