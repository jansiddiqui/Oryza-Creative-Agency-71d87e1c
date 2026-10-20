import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import type { AuditAction } from "./types";

/** Records who did what, when. Never throws — a failed audit write is logged, not shown to the admin. */
export async function audit(actor: string, action: AuditAction, target: string, details: Record<string, unknown> = {}) {
  const { error } = await serviceClient().from("audit_log").insert({ actor_email: actor, action, target, details });
  if (error) console.error("[audit] could not record", action, target, error.message);
}
