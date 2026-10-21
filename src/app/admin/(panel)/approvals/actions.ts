"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { approvalUrl, createApprovalLink, getApprovalLink, revokeApprovalLink } from "@/lib/admin/approvals-data";
import { sendEmail } from "@/lib/admin/email";
import { getClient } from "@/lib/admin/ops-data";
import { linkSecret } from "@/lib/ops/links";

const refresh = () => revalidatePath("/admin", "layout");

/** Creates a 7-day signed approval link for the chosen items of one client. */
export async function createApprovalAction(clientId: string, itemIds: string[], label: string) {
  return adminAction(async (admin) => {
    if (!linkSecret()) throw new Error("Approval links need SHARE_LINK_SECRET to be set (see docs/client-ops-4b.md)");
    const { link, url } = await createApprovalLink(clientId, itemIds.slice(0, 60).map(String), String(label ?? ""), admin.email);
    await audit(admin.email, "approval.create", link.id, { clientId, items: link.itemIds.length, expiresAt: link.expiresAt });
    refresh();
    return { id: link.id, url };
  });
}

export async function revokeApprovalAction(id: string) {
  return adminAction(async (admin) => {
    const link = await getApprovalLink(id);
    if (!link) throw new Error("Link not found");
    await revokeApprovalLink(id, admin.email);
    await audit(admin.email, "approval.revoke", id, { clientId: link.clientId });
    refresh();
  });
}

/** Emails the link to the client (Resend). */
export async function emailApprovalAction(id: string) {
  return adminAction(async (admin) => {
    const secret = linkSecret();
    const link = await getApprovalLink(id);
    if (!secret || !link) throw new Error("Link not found");
    const client = await getClient(link.clientId);
    if (!client?.email) throw new Error("Add the client's email on the client page first");
    const url = approvalUrl(link, secret);
    const sent = await sendEmail({
      to: client.email,
      subject: `Please approve your upcoming posts — ${client.name}`,
      text: `Hello ${client.contactPerson || client.name},\n\nYour upcoming posts are ready for your approval${link.label ? ` (${link.label})` : ""}. Open the link to see each post and approve it or ask for changes — no login needed:\n${url}\n\nThe link works for 7 days.\n\nThank you,\nOryza Creative Agency`,
      replyTo: admin.email,
    });
    if (!sent.ok) throw new Error(`The email could not be sent (${sent.error})`);
    await audit(admin.email, "approval.send", id, { clientId: link.clientId, channel: "email" });
    return { to: client.email };
  });
}

/** Records that the team shared the link by WhatsApp or copied it (for the activity log). */
export async function logShareAction(id: string, channel: string) {
  return adminAction(async (admin) => {
    const link = await getApprovalLink(id);
    if (!link) throw new Error("Link not found");
    await audit(admin.email, "approval.send", id, { clientId: link.clientId, channel: ["whatsapp", "reminder"].includes(channel) ? channel : "copy" });
  });
}
