import "server-only";
import { redirect } from "next/navigation";
import { serviceClient, serviceConfigured } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { sessionClient } from "@/lib/supabase/server";
import type { Admin, AdminRole } from "./types";

export class AdminAuthError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Sign in to continue." : "You do not have permission for this.");
  }
}

/** Active allow-list entry for an email, or null. */
export async function lookupAdmin(email: string): Promise<Admin | null> {
  const { data } = await serviceClient().from("admin_users").select("email, role, active").eq("email", email.toLowerCase()).maybeSingle();
  return data?.active ? { email: data.email, role: data.role } : null;
}

/**
 * The signed-in admin, verified on the server: Supabase validates the session (getUser hits the auth
 * server, so a forged cookie fails) and the email must be active on the allow-list.
 */
export async function getAdmin(): Promise<Admin | null> {
  if (!supabaseConfigured() || !serviceConfigured()) return null;
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  return email ? lookupAdmin(email) : null;
}

const allowed = (a: Admin, min: AdminRole) => min === "editor" || a.role === "owner";

/** For pages: redirects to the login page (or the dashboard when the role is too low). */
export async function requireAdmin(min: AdminRole = "editor"): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (!allowed(a, min)) redirect("/admin?denied=1");
  return a;
}

/** For server actions and route handlers: throws AdminAuthError (401/403). */
export async function assertAdmin(min: AdminRole = "editor"): Promise<Admin> {
  const a = await getAdmin();
  if (!a) throw new AdminAuthError(401);
  if (!allowed(a, min)) throw new AdminAuthError(403);
  return a;
}
