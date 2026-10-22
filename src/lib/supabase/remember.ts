/**
 * "Remember me". On (the default): the normal Supabase session, kept across browser restarts. Off: the same session,
 * but its cookies have no expiry date, so they end when the browser closes. Pure (used by the proxy too).
 */
export const REMEMBER_COOKIE = "oz_remember";

export function sessionCookieOptions<T extends { maxAge?: number; expires?: Date | number | string }>(options: T, temporary: boolean): T {
  if (!temporary) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
