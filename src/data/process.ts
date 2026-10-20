import type { ProcessStepId } from "@/components/icons/services";

/** The seven steps of working with Oryza. Used by the flow diagram and the How it works page. */
export const processSteps: { id: ProcessStepId; label: string; title: string; detail: string }[] = [
  {
    id: "questions",
    label: "Questions",
    title: "You answer a few questions",
    detail: "Your business type, audience, goals, key dates, strengths and which platforms you want. The questions change by industry — a school is asked about admissions, a leader about the constituency.",
  },
  {
    id: "plan",
    label: "Plan",
    title: "You get a detailed plan",
    detail: "A 30-day calendar with every reel, post, story and platform update: what it is, the hook, who shoots it and when it goes live. Built from our written playbooks, not guesswork.",
  },
  {
    id: "setup",
    label: "Setup",
    title: "Kick-off and profile optimization",
    detail: "We take access, audit your accounts and, if you choose the add-on, optimize each profile in the first 7–10 days.",
  },
  {
    id: "shoot",
    label: "Shoot",
    title: "Shoot days",
    detail: "Every shoot has a planned shot list made from the calendar, so one visit covers weeks of content.",
  },
  {
    id: "approval",
    label: "Approval",
    title: "Weekly approvals",
    detail: "You see each week’s content before it goes out. Nothing is published without your approval.",
  },
  {
    id: "publish",
    label: "Publish",
    title: "Publishing and replies",
    detail: "We publish at the planned times, reply to comments and DMs in working hours and pass every lead to your WhatsApp.",
  },
  {
    id: "report",
    label: "Report",
    title: "Monthly report and next month",
    detail: "Reach, followers, inquiries and top content — then the next month’s plan, adjusted to what worked.",
  },
];
