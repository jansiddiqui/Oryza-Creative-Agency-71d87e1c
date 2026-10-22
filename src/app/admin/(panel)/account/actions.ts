"use server";

import { cookies } from "next/headers";
import { adminAction } from "@/lib/admin/action";
import { changePassword, signOutEverywhere } from "@/lib/admin/passwords-data";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";

/** Changes the signed-in admin's password; the current one is required. */
export async function changePasswordAction(current: string, password: string, confirm: string) {
  return adminAction(async (admin) => changePassword(admin.email, String(current ?? ""), String(password ?? ""), String(confirm ?? "")));
}

/** Signs this admin out everywhere (every browser and phone), then the page goes to the login screen. */
export async function signOutEverywhereAction() {
  return adminAction(async () => {
    await signOutEverywhere();
    (await cookies()).delete(REMEMBER_COOKIE);
  });
}
