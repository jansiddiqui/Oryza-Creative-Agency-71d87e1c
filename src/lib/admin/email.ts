import "server-only";

/** Sends one email through Resend. Never throws: returns whether it went out and why not. */
export async function sendEmail(msg: { to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(msg.to)) return { ok: false, error: "No valid email address" };
  const from = process.env.OPS_FROM_EMAIL || process.env.LEAD_FROM_EMAIL || "Oryza Creative Agency <website@oryzaonline.in>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text, ...(msg.html && { html: msg.html }), ...(msg.replyTo && { reply_to: msg.replyTo }) }),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `Resend ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: (e as Error).message.slice(0, 300) };
  }
}

/** The site's own address for links in emails and WhatsApp messages. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.oryzaonline.in").replace(/\/$/, "");
