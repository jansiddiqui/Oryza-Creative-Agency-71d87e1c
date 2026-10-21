/**
 * Signed share links for clients (approval) and reports. A token is `<link id>.<signature>`, where the signature is
 * an HMAC-SHA256 of the kind, id and expiry with SHARE_LINK_SECRET (server only). The database keeps the expiry
 * and revocation; nothing secret is stored, and a token cannot be forged or extended without the secret.
 * Server only (uses node:crypto).
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type LinkKind = "approval" | "report";
export const LINK_DAYS = 7;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const b64url = (b: Buffer) => b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const expirySeconds = (expiresAt: string) => Math.floor(Date.parse(expiresAt) / 1000);

export function linkSecret(): string | null {
  const s = process.env.SHARE_LINK_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function signature(kind: LinkKind, id: string, expiresAt: string, secret: string) {
  return b64url(createHmac("sha256", secret).update(`${kind}:${id.toLowerCase()}:${expirySeconds(expiresAt)}`).digest()).slice(0, 43);
}

export function signLink(kind: LinkKind, id: string, expiresAt: string, secret: string): string {
  return `${id.toLowerCase()}.${signature(kind, id, expiresAt, secret)}`;
}

/** The link id inside a token (unverified), or null if the token is malformed. */
export function tokenId(token: string): string | null {
  const [id, sig, extra] = token.split(".");
  return extra === undefined && id && sig && UUID.test(id) && /^[A-Za-z0-9_-]{43}$/.test(sig) ? id.toLowerCase() : null;
}

export type LinkCheck = "ok" | "invalid" | "expired" | "revoked";

/** Verifies a token against its stored link row: signature (constant time), revocation and expiry. */
export function verifyLink(kind: LinkKind, token: string, row: { id: string; expiresAt: string; revokedAt: string | null } | null, secret: string, now = new Date()): LinkCheck {
  const id = tokenId(token);
  if (!id || !row || row.id.toLowerCase() !== id) return "invalid";
  const want = Buffer.from(signature(kind, id, row.expiresAt, secret));
  const got = Buffer.from(token.split(".")[1]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return "invalid";
  if (row.revokedAt) return "revoked";
  if (Date.parse(row.expiresAt) <= now.getTime()) return "expired";
  return "ok";
}

export const expiryFrom = (now = new Date(), days = LINK_DAYS) => new Date(now.getTime() + days * 86_400_000).toISOString();

/** A one-way hash of the visitor's IP for rate limiting (the IP itself is never stored). */
export const ipKey = (ip: string, secret: string) => createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
