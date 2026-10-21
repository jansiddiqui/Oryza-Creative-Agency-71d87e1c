/** Who gets which reminder, and when (IST). Pure. */
import { addDays } from "@/lib/engine/dates";
import type { ClientStatus, ShootRow, TaskRow } from "./types";

/** India Standard Time date and minutes since midnight for an instant. */
export function ist(now: Date) {
  const t = new Date(now.getTime() + 5.5 * 3600_000);
  return { date: t.toISOString().slice(0, 10), minutes: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

/** The morning digest goes out at 8:45 am IST (Vercel Cron "15 3 * * *" UTC); a run between 8:30 and 10:00 counts. */
export const DIGEST_CRON_UTC = "15 3 * * *";
export const isDigestWindow = (now: Date) => {
  const m = ist(now).minutes;
  return m >= 8 * 60 + 30 && m < 10 * 60;
};

export interface DigestMember {
  email: string;
  name: string;
  active: boolean;
  optOut: boolean;
}

export interface Digest {
  email: string;
  name: string;
  overdue: TaskRow[];
  dueToday: TaskRow[];
  shoots: ShootRow[];
}

/** One person's digest for `today`, or null when they opted out, are inactive or have nothing. */
export function digestFor(m: DigestMember, tasks: TaskRow[], shoots: ShootRow[], today: string): Digest | null {
  if (!m.active || m.optOut) return null;
  const mine = tasks.filter((t) => t.assignee === m.email && t.status !== "done");
  const d: Digest = {
    email: m.email,
    name: m.name,
    overdue: mine.filter((t) => t.due < today).sort((a, b) => a.due.localeCompare(b.due)),
    dueToday: mine.filter((t) => t.due === today),
    shoots: shoots.filter((s) => s.shooter === m.email && s.date === today && s.status !== "cancelled"),
  };
  return d.overdue.length || d.dueToday.length || d.shoots.length ? d : null;
}

export interface LinkForReminder {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  firstResponseAt: string | null;
  lastRemindedAt: string | null;
}

/** A client approval reminder is due once: 24 h after the link was sent, with no response, while it is still valid. */
export function approvalReminderDue(l: LinkForReminder, now: Date): boolean {
  const t = now.getTime();
  return !l.revokedAt && !l.firstResponseAt && !l.lastRemindedAt && Date.parse(l.expiresAt) > t && t - Date.parse(l.createdAt) >= 24 * 3600_000;
}

export const RENEWAL_DAYS = [15, 7, 1] as const;

/** Clients whose renewal is exactly 15, 7 or 1 day(s) away (IST), unless they have ended. */
export function renewalsDue<T extends { renewalDate: string | null; status: ClientStatus }>(clients: T[], today: string): { client: T; days: number }[] {
  const out: { client: T; days: number }[] = [];
  for (const c of clients) {
    if (!c.renewalDate || c.status === "ended") continue;
    for (const d of RENEWAL_DAYS) if (addDays(today, d) === c.renewalDate) out.push({ client: c, days: d });
  }
  return out;
}

/** The ready-to-send WhatsApp text the team can forward when a client has not responded. */
export const approvalNudgeText = (clientName: string, url: string) =>
  `Hi ${clientName}, a gentle reminder from Oryza: this week's posts are waiting for your approval. You can approve or ask for changes here: ${url}`;
