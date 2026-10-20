import type { Metadata } from "next";
import { Arrow, ButtonLink, Container, Eyebrow, PageHeader } from "@/components/ui";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { processSteps } from "@/data/process";
import { processIcons } from "@/components/icons";
import { ProcessFlow } from "@/components/infographics/ProcessFlow";
import { slotMedia } from "@/components/images/SlotImage";
import { revealDelay } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From a four-minute questionnaire to a day-by-day plan, profile optimization, shoot days, approvals and monthly reporting — how Oryza runs your social media.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorks() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="A plan you can see. A team you can hold to it."
        intro="Every client gets the same clear process. You always know what is being made, when it goes live and how it performed."
        media={slotMedia("how-it-works-header")}
      />
      <section className="border-b border-line">
        <Container className="py-16">
          <ProcessFlow />
        </Container>
      </section>
      <section>
        <Container className="py-20">
          <ol className="relative space-y-10 border-l border-line pl-8 sm:pl-12">
            {processSteps.map((p, i) => {
              const Icon = processIcons[p.id];
              return (
                <li key={p.id} className="relative" data-reveal="" style={revealDelay(i, 60)}>
                  <span className="absolute -left-[49px] top-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-gold-300 sm:-left-[67px]">
                    <Icon size={18} />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700">Step {i + 1}</p>
                  <h2 className="mt-1 font-display text-2xl">{p.title}</h2>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{p.detail}</p>
                </li>
              );
            })}
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
