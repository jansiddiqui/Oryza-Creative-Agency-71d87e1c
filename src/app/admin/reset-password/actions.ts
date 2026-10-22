"use server";

import { adminAction } from "@/lib/admin/action";
import { setPasswordAfterEmailLink } from "@/lib/admin/passwords-data";

/** Sets a new password from the reset link (no current password needed, only right after the email link). */
export async function setNewPasswordAction(password: string, confirm: string) {
  return adminAction(async (admin) => setPasswordAfterEmailLink(admin.email, String(password ?? ""), String(confirm ?? "")));
}
