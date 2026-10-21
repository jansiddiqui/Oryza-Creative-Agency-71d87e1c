import "server-only";
import { headers } from "next/headers";

/** The visitor's IP as seen by Vercel (first x-forwarded-for entry), only for rate limiting (hashed, never stored). */
export async function visitorIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}
