import "server-only";
import { createHash } from "node:crypto";
import { linkSecret } from "@/lib/ops/links";
import { serviceClient } from "@/lib/supabase/admin";

/**
 * Rate limits for sign-in, sign-in links and password resets (on top of Supabase's own limits). Keys are hashed:
 * no email or IP is stored. Uses the atomic `rate_hit` database function.
 */
export const AUTH_LIMITS = {
  /** Password attempts per email+IP. */
  password: { max: 5, window: 60 },
  /** Password attempts per IP (any email). */
  passwordIp: { max: 20, window: 600 },
  /** Sign-in or reset emails per address. */
  email: { max: 3, window: 900 },
  /** Sign-in or reset emails per IP. */
  emailIp: { max: 10, window: 3600 },
  /** Current-password checks on the Account page, per admin. */
  change: { max: 5, window: 600 },
} as const;

export type AuthLimit = keyof typeof AUTH_LIMITS;

export const authKey = (limit: AuthLimit, value: string, secret: string) =>
  `auth:${limit}:${createHash("sha256").update(`${secret}:${value.trim().toLowerCase()}`).digest("hex").slice(0, 32)}`;

/** Counts one attempt; false = over the limit. A database error does not lock anyone out (Supabase limits still apply). */
export async function authRateOk(limit: AuthLimit, value: string): Promise<boolean> {
  const { max, window } = AUTH_LIMITS[limit];
  const { data, error } = await serviceClient().rpc("rate_hit", { p_key: authKey(limit, value, linkSecret() ?? "oryza-admin-auth"), p_max: max, p_window: window });
  if (error) {
    console.error("[admin] rate limit check failed:", error.message);
    return true;
  }
  return Boolean(data);
}
