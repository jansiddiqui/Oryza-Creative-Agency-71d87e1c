"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { listTeam } from "@/lib/admin/ops-data";
import { addLeave, reassignTasks, removeLeave } from "@/lib/admin/team-data";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const refresh = () => revalidatePath("/admin", "layout");

async function knownEmail(email: string) {
  if (!(await listTeam()).some((m) => m.email === email)) throw new Error("Unknown team member");
}

export async function addLeaveAction(email: string, start: string, end: string, note: string) {
  return adminAction(async (admin) => {
    if (!ISO.test(start) || !ISO.test(end) || end < start) throw new Error("Choose a start and end date");
    await knownEmail(email);
    const id = await addLeave({ email, start, end, note: String(note ?? "").slice(0, 200) }, admin.email);
    await audit(admin.email, "leave.update", email, { id, start, end, added: true });
    refresh();
  });
}

export async function removeLeaveAction(id: string, email: string) {
  return adminAction(async (admin) => {
    await removeLeave(id);
    await audit(admin.email, "leave.update", email, { id, removed: true });
    refresh();
  });
}

/** Hands one person's open tasks (and planned shoots) to another: all of them, or only within dates (e.g. leave). */
export async function reassignAction(from: string, to: string, start?: string, end?: string) {
  return adminAction(async (admin) => {
    if (from === to) throw new Error("Choose two different people");
    await knownEmail(from);
    await knownEmail(to);
    const range = start && end && ISO.test(start) && ISO.test(end) && end >= start ? { start, end } : undefined;
    const moved = await reassignTasks(from, to, range);
    await audit(admin.email, "task.reassign", from, { to, ...range, ...moved });
    refresh();
    return moved;
  });
}
