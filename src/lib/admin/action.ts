import "server-only";
import { ImageError } from "@/lib/images/service";
import { AdminAuthError, assertAdmin } from "./auth";
import type { Admin, AdminRole } from "./types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; problems?: string[]; status?: 401 | 403 };

/**
 * Every admin server action runs through this: it re-checks the signed-in admin on the server (allow-list +
 * role) before doing anything, and turns errors into plain messages for the UI.
 */
export async function adminAction<T>(fn: (admin: Admin) => Promise<T>, min: AdminRole = "editor"): Promise<ActionResult<T>> {
  let admin: Admin;
  try {
    admin = await assertAdmin(min);
  } catch (e) {
    if (e instanceof AdminAuthError) return { ok: false, error: e.message, status: e.status };
    throw e;
  }
  try {
    return { ok: true, data: await fn(admin) };
  } catch (e) {
    if (e instanceof ImageError) return { ok: false, error: e.problems.join(" "), problems: e.problems };
    console.error("[admin] action failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
