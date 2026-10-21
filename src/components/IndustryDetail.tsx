import type { ReactNode } from "react";
import { categoryBySlug } from "@/data/categories";
import type { Plan, Playbook } from "@/lib/engine/types";
import { DayCard } from "@/components/PlanBits";
import { Arrow, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { IndustryHeader } from "@/components/IndustryHeader";
import { FitStrip } from "@/components/infographics/FitMatrix";
import { PillarMix } from "@/components/infographics/PillarMix";
import { PlanTimeline } from "@/components/infographics/PlanTimeline";
import { CheckIcon } from "@/components/icons";
import { JsonLd, breadcrumbSchema, faqSchema, serviceSchema } from "@/components/JsonLd";

/** Shared layout for the industry pages built on the plan engine (hospitals, doctors, real estate, political leaders). */
export function IndustryDetail(props: {
  slug: string;
  crumb: string;
  title: string;
  description: string;
  heading: ReactNode;
  intro: ReactNode;
  playbook: Playbook;
  mixNote: string;
  sample: Plan;
  sampleLabel: string;
  sampleIntro: string;
  detailHeading: string;
  /** Compliance rules shown on the page — the same ones the engine enforces. */
  rules: string[];
  rulesHeading: string;
  rulesNote?: ReactNode;
  platformNote?: ReactNode;
  faqs: { q: string; a: string }[];
  faqHeading: string;
  cta: string;
  ctaLabel: string;
}) {
  const { slug, playbook, sample, faqs } = props;
  const cat = categoryBySlug[slug];
  const path = `/industries/${slug}`;
  const week = sample.days.slice(7, 14);
  return (
    <>
      <IndustryHeader slug={slug} eyebrow={`Industries · ${props.crumb}`} title={props.heading} intro={props.intro} />

      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Who you are talking to</Eyebrow>
            <ul className="divide-y divide-line border-y border-line">
              {playbook.audiences.map((a) => (
                <li key={a.name} className="flex items-start justify-between gap-6 py-4">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-[14px] text-muted">{a.needs}</p>
                  </div>
                  <p className="font-display text-2xl text-gold-500">{a.share}%</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>What we post about</Eyebrow>
            <PillarMix pillars={playbook.pillars.map((p) => ({ name: p.name, pct: p.share }))} />
            <p className="mt-4 text-[13px] text-muted">{props.mixNote}</p>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-cream/50">
        <Container className="py-20">
          <Eyebrow>A week from a sample plan</Eyebrow>
          <h2 className="max-w-3xl font-display text-4xl tracking-tight">{props.detailHeading}</h2>
          <p className="mt-3 max-w-2xl text-muted">{props.sampleIntro}</p>
          <div className="mt-10 rounded-2xl border border-line bg-paper p-5 sm:p-7">
            <p className="mb-4 font-display text-xl">The whole month at a glance</p>
            <PlanTimeline plan={sample} caption={props.sampleLabel} />
          </div>
          <p className="mb-4 mt-12 font-display text-2xl">Week 2 in detail</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {week.map((d) => <DayCard key={d.day} day={d} />)}
          </div>
        </Container>
      </section>

      <section>
        <Container className="grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Platforms for {props.crumb.toLowerCase()}</Eyebrow>
            <FitStrip category={cat} />
            {props.platformNote && <p className="mt-6 text-[15px] text-ink-soft">{props.platformNote}</p>}
          </div>
          <div>
            <Eyebrow>Compliance, built into every plan</Eyebrow>
            <h2 className="mb-5 font-display text-3xl tracking-tight">{props.rulesHeading}</h2>
            <ul className="space-y-3 text-[15px] text-ink-soft">
              {props.rules.map((r) => <li key={r} className="flex gap-3"><CheckIcon size={18} accent className="mt-0.5 shrink-0" />{r}</li>)}
            </ul>
            {props.rulesNote && <p className="mt-5 text-[13px] text-muted">{props.rulesNote}</p>}
          </div>
        </Container>
      </section>

      <section className="border-t border-line">
        <Container className="grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-4xl tracking-tight">{props.faqHeading}</h2>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="text-lg font-semibold">{f.q}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink text-paper">
        <Container className="flex flex-col items-start gap-8 py-20 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-2xl font-display text-4xl tracking-tight">{props.cta}</h2>
          <ButtonLink href={`/plan-builder?category=${slug}`} variant="gold">{props.ctaLabel} <Arrow /></ButtonLink>
        </Container>
      </section>
      <JsonLd data={serviceSchema(props.title, props.description, path)} />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }, { name: props.crumb, path }])} />
    </>
  );
}
