import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/categories";
import { platforms } from "@/data/platforms";
import { samplePlan } from "@/lib/samples/school";
import { DayCard } from "@/components/PlanBits";
import { Arrow, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { ApprovalIcon, CheckIcon, IndustryIcon, PlatformIcon, ReportIcon } from "@/components/icons";
import { ProcessFlow } from "@/components/infographics/ProcessFlow";
import { PlanTimeline } from "@/components/infographics/PlanTimeline";
import { SlotImage } from "@/components/images/SlotImage";
import { revealDelay } from "@/components/motion/reveal";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — Social media management in ${site.city}, for every business` },
  description: site.description,
  alternates: { canonical: "/" },
};

const promises = [
  { t: "No fake followers", d: "We grow real audiences with content, never bought numbers.", Icon: CheckIcon },
  { t: "No guaranteed numbers", d: "Anyone promising exact reach is guessing. We plan, measure and improve.", Icon: ReportIcon },
  { t: "Nothing posted without you", d: "You approve each week’s content before it goes live.", Icon: ApprovalIcon },
];

function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: "en-IN",
    publisher: { "@id": `${site.url}/#organization` },
  };
}

export default function Home() {
  const sampleDays = samplePlan.days.filter((d) => d.items.length > 0).slice(0, 2);
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-cream/50">
        <Container className="grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="reveal">
            <Eyebrow>Social media management · {site.city}</Eyebrow>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              Social media, planned <span className="gold-text">day by day.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Schools, clinics, real estate, leaders, restaurants, coaching, retail — every business needs a different
              plan. Answer a few questions and get yours free: what to post, on which platform, on which day.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/plan-builder">Build my free plan <Arrow /></ButtonLink>
              <ButtonLink href="/services" variant="ghost">See services</ButtonLink>
            </div>
          </div>
          <div className="reveal reveal-2">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-700">
              Sample plan · fictional school
            </p>
            <div className="grid gap-4">
              {sampleDays.map((d) => <DayCard key={d.day} day={d} compact headingLevel={2} />)}
            </div>
            <p className="mt-3 text-[13px] text-muted">
              An example of what the planner produces. <Link href="/industries/schools" className="font-semibold text-gold-700 underline">See the full school plan</Link>.
            </p>
          </div>
        </Container>
      </section>

      {/* Wide visual band: only rendered once an approved image exists for the slot. */}
      <SlotImage slot="home-hero" sizes="100vw" className="max-h-[560px]" />

      {/* Industries */}
      <section className="cv-auto">
        <Container className="py-20">
          <Eyebrow>Who we work with</Eyebrow>
          <h2 className="max-w-2xl font-display text-4xl tracking-tight">A different playbook for every kind of business.</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <li key={c.slug} data-reveal="" style={revealDelay(i, 50)}>
                <Link
                  href={c.plannerLive ? `/industries/${c.slug}` : `/plan-builder?category=${c.slug}`}
                  className="card-lift flex h-full items-start gap-4 rounded-2xl border border-line bg-paper p-5"
                >
                  <IndustryIcon slug={c.slug} size={26} accent className="mt-0.5 text-ink" />
                  <span>
                    <span className="block font-semibold">{c.name}</span>
                    <span className="mt-1 block text-[13px] text-muted">{c.audience}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link href="/industries" className="inline-flex items-center gap-2 font-semibold text-gold-700 hover:text-ink">
              How each industry is different <Arrow />
            </Link>
          </p>
        </Container>
      </section>

      {/* How it works */}
      {/* Placeholder size while off screen matches the real one (the phone timeline is taller). */}
      <section className="cv-auto cv-process bg-ink text-paper">
        <div className="gold-rule" />
        <Container className="py-20">
          <Eyebrow light>How it works</Eyebrow>
          <h2 className="max-w-2xl font-display text-4xl tracking-tight">From four minutes of questions to a month of content.</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper/75">
            You answer, we plan, set up your profiles, shoot, send each week for approval, publish and report — then plan the next month from what worked.
          </p>
          <ProcessFlow light className="mt-14" />
          <div className="mt-12">
            <ButtonLink href="/how-it-works" variant="light">The full process <Arrow /></ButtonLink>
          </div>
        </Container>
      </section>

      {/* A month at a glance */}
      <section className="cv-auto border-b border-line">
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal="">
            <Eyebrow>A month at a glance</Eyebrow>
            <h2 className="font-display text-4xl tracking-tight">Every day planned, every shoot day booked.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              This is a real output of the planner for a fictional school in admission season: what goes out each day,
              which days we shoot, and which posts are pinned to key dates.
            </p>
            <div className="mt-8">
              <ButtonLink href="/plan-builder" variant="ghost">Build yours <Arrow /></ButtonLink>
            </div>
          </div>
          <PlanTimeline plan={samplePlan} caption="Sample plan · fictional school, 30 days." />
        </Container>
      </section>

      {/* Services and platforms */}
      <section className="cv-auto">
        <Container className="grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>What you pay for</Eyebrow>
            <h2 className="font-display text-4xl tracking-tight">Each platform is its own service.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Monthly management covers strategy, content, reels, posting, replies and reporting. Profile optimization
              is a one-time add-on, per platform, so you only pay for the platforms that fit your business.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/services">Services <Arrow /></ButtonLink>
              <ButtonLink href="/platforms" variant="ghost">Platforms</ButtonLink>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {platforms.map((p, i) => (
              <li key={p.id} data-reveal="" style={revealDelay(i, 50)} className="card-lift flex items-start gap-3.5 rounded-2xl border border-line bg-paper p-5">
                <PlatformIcon id={p.id} size={24} accent className="mt-0.5" />
                <span>
                  <span className="block font-semibold">{p.name}</span>
                  <span className="mt-1 block text-[13px] text-muted">{p.job}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Promises */}
      <section className="cv-auto border-t border-line bg-cream/50">
        <Container className="grid gap-8 py-16 md:grid-cols-3">
          {promises.map((p, i) => (
            <div key={p.t} data-reveal="" style={revealDelay(i)}>
              <p.Icon size={28} accent className="mb-3 text-ink" />
              <p className="font-display text-2xl">{p.t}</p>
              <p className="mt-2 text-[15px] text-muted">{p.d}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* CTA */}
      <section className="cv-auto">
        <Container className="flex flex-col items-start gap-6 py-20 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-4xl tracking-tight">See your plan before you pay anything.</h2>
            <p className="mt-2 text-muted">Free, and it takes about four minutes.</p>
          </div>
          <ButtonLink href="/plan-builder">Build my free plan <Arrow /></ButtonLink>
        </Container>
      </section>
      <JsonLd data={websiteSchema()} />
    </>
  );
}
