import "server-only";
import { serviceClient } from "@/lib/supabase/admin";
import { fmtDate } from "@/lib/engine/dates";
import { approvalReminderDue, digestFor, isDigestWindow, ist, renewalsDue } from "@/lib/ops/reminders";
import { audit } from "./audit";
import { approvalUrl, listApprovalLinks, markReminded } from "./approvals-data";
import { sendEmail, siteUrl } from "./email";
import { listClients, listShoots, listTasks, listTeam } from "./ops-data";
import { linkSecret } from "@/lib/ops/links";

const db = () => serviceClient();
type Kind = "digest" | "approval" | "renewal";

/** Claims a reminder for today (once per kind + ref + day). True when this run should send it. */
async function claim(kind: Kind, ref: string, day: string): Promise<boolean> {
  const { data, error } = await db().from("reminder_log").upsert({ kind, ref, sent_on: day }, { onConflict: "kind,ref,sent_on", ignoreDuplicates: true }).select("kind");
  if (error) {
    console.error("[reminders] could not claim", kind, ref, error.message);
    return false;
  }
  return (data ?? []).length > 0;
}
const result = (kind: Kind, ref: string, day: string, ok: boolean, detail = "") => db().from("reminder_log").update({ ok, detail: detail.slice(0, 500) }).eq("kind", kind).eq("ref", ref).eq("sent_on", day);

/**
 * The daily reminders. Called by Vercel Cron (see vercel.json). The morning digest only goes out in its 8:30–10:00
 * IST window, so a late retry never sends a stale digest; approval and renewal reminders go out on any run.
 */
export async function runReminders(now = new Date(), kinds: Kind[] = ["digest", "approval", "renewal"]) {
  const { date: today } = ist(now);
  const out = { digest: 0, approval: 0, renewal: 0, skipped: [] as string[] };

  if (kinds.includes("digest")) {
    if (!isDigestWindow(now)) out.skipped.push("digest: outside 8:30–10:00 IST");
    else {
      const [team, tasks, shoots] = await Promise.all([listTeam(), listTasks({ to: today, openOnly: true }), listShoots({ from: today, to: today })]);
      for (const m of team) {
        const d = digestFor({ email: m.email, name: m.name, active: m.active, optOut: Boolean(m.digestOptOut) }, tasks, shoots, today);
        if (!d || !(await claim("digest", m.email, today))) continue;
        const line = (t: (typeof d.overdue)[number]) => `• ${t.label} — due ${fmtDate(t.due)}${t.time ? ` ${t.time}` : ""}`;
        const text = [
          `Good morning ${d.name},`,
          "",
          d.overdue.length ? `Overdue (${d.overdue.length}):\n${d.overdue.map(line).join("\n")}` : "",
          d.dueToday.length ? `Due today (${d.dueToday.length}):\n${d.dueToday.map(line).join("\n")}` : "",
          d.shoots.length ? `Shoots today:\n${d.shoots.map((s) => `• ${s.label}${s.startTime ? ` at ${s.startTime}` : ""}${s.location ? `, ${s.location}` : ""}`).join("\n")}` : "",
          "",
          `Open Today: ${siteUrl()}/admin/today?who=me`,
          "",
          "You get this because you are on the Oryza team. To stop it, ask an owner to switch off your morning digest in Settings → Team.",
        ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
        const sent = await sendEmail({ to: d.email, subject: `Today: ${d.overdue.length} overdue, ${d.dueToday.length} due${d.shoots.length ? `, ${d.shoots.length} shoot` : ""}`, text });
        await result("digest", m.email, today, sent.ok, sent.error);
        if (sent.ok) out.digest++;
      }
    }
  }

  if (kinds.includes("approval")) {
    const secret = linkSecret();
    if (!secret) out.skipped.push("approval: SHARE_LINK_SECRET is not set");
    else {
      const [links, clients] = await Promise.all([listApprovalLinks(), listClients()]);
      for (const l of links.filter((x) => approvalReminderDue(x, now))) {
        if (!(await claim("approval", l.id, today))) continue;
        const c = clients.find((x) => x.id === l.clientId);
        const url = approvalUrl(l, secret);
        const sent = c?.email
          ? await sendEmail({
              to: c.email,
              subject: `Reminder: posts waiting for your approval — ${c.name}`,
              text: `Hello ${c.contactPerson || c.name},\n\nA gentle reminder: the posts we shared for your approval are still waiting. You can approve them or ask for changes here (no login needed):\n${url}\n\nThe link works until ${fmtDate(l.expiresAt.slice(0, 10))}.\n\nThank you,\nOryza Creative Agency`,
            })
          : { ok: false, error: "Client has no email — send the WhatsApp reminder from the client page" };
        await markReminded(l.id);
        await result("approval", l.id, today, sent.ok, sent.error);
        await audit("system (reminders)", "reminder.sent", l.id, { clientId: l.clientId, kind: "approval", emailed: sent.ok });
        out.approval++;
      }
    }
  }

  if (kinds.includes("renewal")) {
    const [clients, { data: owners }] = await Promise.all([listClients(), db().from("admin_users").select("email").eq("role", "owner").eq("active", true)]);
    for (const { client, days } of renewalsDue(clients, today)) {
      if (!(await claim("renewal", `${client.id}:${days}`, today))) continue;
      let ok = true;
      for (const o of (owners ?? []) as { email: string }[]) {
        const sent = await sendEmail({
          to: o.email,
          subject: `Renewal in ${days} day${days > 1 ? "s" : ""}: ${client.name}`,
          text: `${client.name} renews on ${fmtDate(client.renewalDate!)} (${days} day${days > 1 ? "s" : ""} from today).\n\nClient page: ${siteUrl()}/admin/clients/${client.id}\nPayments: ${siteUrl()}/admin/billing`,
        });
        ok = ok && sent.ok;
      }
      await result("renewal", `${client.id}:${days}`, today, ok);
      out.renewal++;
    }
  }
  return out;
}
