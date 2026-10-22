/**
 * Email sign-in links. Pure (no Next imports) so the proxy, the login action and tests share it.
 *
 * The link in the email must come back to /admin/auth/callback on the site the person is using (production,
 * a Vercel preview or local development). Supabase only honours that address if it is on the project's
 * Redirect URLs list — otherwise it falls back to the Site URL (the homepage), which is the "?code= on the
 * homepage" symptom. See docs/supabase-setup.md.
 */
import { safeNext } from "./safe-next";

export const CALLBACK_PATH = "/admin/auth/callback";
const FALLBACK_SITE = "https://www.oryzaonline.in";

export interface OriginHeaders {
  origin?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}

const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const isLocal = (host: string) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);

/** "https://host[:port]" from a URL-ish string, or null if it is not a plain http(s) origin. */
function cleanOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!HOST.test(u.host)) return null;
    // Plain http only for local development.
    if (u.protocol === "http:" && !isLocal(u.host)) return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * The origin the request came from: the browser's Origin header, else the (forwarded) host, else
 * NEXT_PUBLIC_SITE_URL, else the production site. Never a hard-coded localhost.
 */
export function requestOrigin(h: OriginHeaders, siteUrl?: string | null): string {
  const fromOrigin = cleanOrigin(h.origin);
  if (fromOrigin) return fromOrigin;
  const host = (h.forwardedHost ?? h.host ?? "").split(",")[0].trim();
  if (host && HOST.test(host)) {
    const proto = (h.forwardedProto ?? "").split(",")[0].trim() || (isLocal(host) ? "http" : "https");
    const fromHost = cleanOrigin(`${proto}://${host}`);
    if (fromHost) return fromHost;
  }
  return cleanOrigin(siteUrl) ?? FALLBACK_SITE;
}

/** emailRedirectTo for signInWithOtp: <origin>/admin/auth/callback?next=<safe admin path>. */
export function signInRedirectUrl(h: OriginHeaders, siteUrl: string | null | undefined, next: unknown): string {
  return `${requestOrigin(h, siteUrl)}${CALLBACK_PATH}?next=${encodeURIComponent(safeNext(next))}`;
}

/**
 * Safety net: an /admin address that received a sign-in code without going through the callback (for
 * example an old email, or a link Supabase sent to a different admin path) is forwarded to the callback,
 * which finishes the sign-in and then opens that page. Returns null when there is nothing to forward.
 */
export function forwardToCallback(url: URL): URL | null {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/admin" && !path.startsWith("/admin/")) return null;
  if (path === CALLBACK_PATH) return null;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  if (!code && !tokenHash) return null;
  const to = new URL(CALLBACK_PATH, url);
  if (code) to.searchParams.set("code", code);
  if (tokenHash) {
    to.searchParams.set("token_hash", tokenHash);
    const type = url.searchParams.get("type");
    if (type) to.searchParams.set("type", type);
  }
  to.searchParams.set("next", safeNext(url.searchParams.get("next") ?? (path === "/admin/login" ? "/admin" : path)));
  return to;
}
