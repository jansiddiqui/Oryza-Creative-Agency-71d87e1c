import type { Metadata } from "next";
import { Arrow, ButtonLink, Container, Eyebrow, PageHeader } from "@/components/ui";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a four-minute questionnaire to a day-by-day plan, profile optimization, shoot days, approvals and monthly reporting — how Oryza runs your social media.",
  alternates: { canonical: "/how-it-works" },
};

const phases = [
  { t: "You answer a few questions", d: "Your business type, audience, goals, key dates, strengths and which platforms you want. The questions change by industry — a school is asked about admissions, a leader about the constituency." },
  { t: "You get a detailed plan", d: "A 30-day calendar with every reel, post, story and platform update: what it is, the hook, who shoots it and when it goes live. Built from our written playbooks, not guesswork." },
  { t: "Kick-off and profile optimization", d: "We take access, audit your accounts and, if you choose the add-on, optimize each profile in the first 7–10 days." },
  { t: "Shoot days", d: "Every shoot has a planned shot list made from the calendar, so one visit covers weeks of content." },
  { t: "Weekly approvals", d: "You see each week’s content before it goes out. Nothing is published without your approval." },
  { t: "Publishing and replies", d: "We publish at the planned times, reply to comments and DMs in working hours and pass every lead to your WhatsApp." },
  { t: "Monthly report and next month", d: "Reach, followers, inquiries and top content — then the next month’s plan, adjusted to what worked." },
];

export default function HowItWorks() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="A plan you can see. A team you can hold to it."
        intro="Every client gets the same clear process. You always know what is being made, when it goes live and how it performed."
      />
      <section>
        <Container className="py-20">
          <ol className="relative space-y-10 border-l border-line pl-8 sm:pl-12">
            {phases.map((p, i) => (
              <li key={p.t} className="relative">
                <span className="absolute -left-[45px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-gold-300 sm:-left-[61px]">
                  {i + 1}
                </span>
                <h2 className="font-display text-2xl">{p.t}</h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{p.d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
      <section className="border-t border-line bg-cream/50">
        <Container className="grid gap-8 py-20 md:grid-cols-2">
          <div>
            <Eyebrow>Behind the scenes</Eyebrow>
            <h2 className="font-display text-3xl tracking-tight">Your plan becomes our team’s calendar.</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-muted">
            Once you sign up, every item in your plan turns into dated tasks for our team — script, shoot, edit,
            approval, publish, report — with deadlines worked back from the publish date. That is how we run many
            brands at once without anything slipping.
          </p>
        </Container>
      </section>
      <section>
        <Container className="flex flex-col items-start gap-6 py-20 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-3xl tracking-tight">Start with step one.</h2>
          <ButtonLink href="/plan-builder">Build my free plan <Arrow /></ButtonLink>
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "How it works", path: "/how-it-works" }])} />
    </>
  );
}
