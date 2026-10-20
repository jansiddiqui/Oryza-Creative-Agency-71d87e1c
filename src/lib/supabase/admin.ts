import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/**
 * Service-role client: bypasses Row Level Security. Server only — use it solely after the caller has been
 * checked against the admin allow-list (or for the public lead intake, which only inserts).
 */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("Supabase service role is not configured");
  client ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const serviceConfigured = () => Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
