import type { ProcessStepId } from "@/components/icons/services";

/** Who does a step: the client, Oryza, or both together. */
export type ProcessWho = "you" | "oryza" | "both";
export const WHO_LABEL: Record<ProcessWho, string> = { you: "You", oryza: "Oryza", both: "Oryza + you" };

/**
 * The seven steps of working with Oryza. Used by the flow diagram and the How it works page.
 * `short` and `when` only repeat what the site already says (the four-minute questions, the 7–10 day setup add-on,
 * the monthly report) — no new claims.
 */
export const processSteps: { id: ProcessStepId; label: string; title: string; detail: string; short: string; who: ProcessWho; when?: string }[] = [
  {
    id: "questions",
    short: "Tell us about your business",
    who: "you",
    when: "4 min",
    label: "Questions",
    title: "You answer a few questions",
    detail: "Your business type, audience, goals, key dates, strengths and which platforms you want. The questions change by industry — a school is asked about admissions, a leader about the constituency.",
  },
  {
    id: "plan",
    short: "30-day calendar, day by day",
    who: "oryza",
    label: "Plan",
    title: "You get a detailed plan",
    detail: "A 30-day calendar with every reel, post, story and platform update: what it is, the hook, who shoots it and when it goes live. Built from our written playbooks, not guesswork.",
  },
  {
    id: "setup",
    short: "Profiles optimised",
    who: "oryza",
    when: "first 7–10 days",
    label: "Setup",
    title: "Kick-off and profile optimization",
    detail: "We take access, audit your accounts and, if you choose the add-on, optimize each profile in the first 7–10 days.",
  },
  {
    id: "shoot",
    short: "Planned shot list",
    who: "both",
    label: "Shoot",
    title: "Shoot days",
    detail: "Every shoot has a planned shot list made from the calendar, so one visit covers weeks of content.",
  },
  {
    id: "approval",
    short: "You approve each week",
    who: "you",
    label: "Approval",
    title: "Weekly approvals",
    detail: "You see each week’s content before it goes out. Nothing is published without your approval.",
  },
  {
    id: "publish",
    short: "On time, every platform",
    who: "oryza",
    label: "Publish",
    title: "Publishing and replies",
    detail: "We publish at the planned times, reply to comments and DMs in working hours and pass every lead to your WhatsApp.",
  },
  {
    id: "report",
    short: "Honest numbers",
    who: "oryza",
    when: "monthly",
    label: "Report",
    title: "Monthly report and next month",
    detail: "Reach, followers, inquiries and top content — then the next month’s plan, adjusted to what worked.",
  },
];
