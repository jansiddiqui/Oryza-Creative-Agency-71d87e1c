import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/categories";
import { platforms } from "@/data/platforms";
import { samplePlan } from "@/lib/sample";
import { DayCard } from "@/components/PlanBits";
import { Arrow, ButtonLink, Container, Eyebrow } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — Social media management in ${site.city}, for every business` },
  description: site.description,
  alternates: { canonical: "/" },
};

const steps = [
  { t: "Answer a few questions", d: "Your business, audience, goals, key dates and platforms. The questions change with your industry." },
  { t: "Get a day-by-day plan", d: "Every reel, post and story for 30 days: the hook, the call to action, who shoots it and when it goes live." },
  { t: "We run it with you", d: "Shoot days, weekly approvals, publishing, replies and a monthly report. Nothing goes out without your approval." },
];

const promises = [
  { t: "No fake followers", d: "We grow real audiences with content, never bought numbers." },
  { t: "No guaranteed numbers", d: "Anyone promising exact reach is guessing. We plan, measure and improve." },
  { t: "Nothing posted without you", d: "You approve each week’s content before it goes live." },
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
              {sampleDays.map((d) => <DayCard key={d.day} day={d} compact />)}
            </div>
            <p className="mt-3 text-[13px] text-muted">
              An example of what the planner produces. <Link href="/industries/schools" className="font-semibold text-gold-700 underline">See the full school plan</Link>.
            </p>
          </div>
        </Container>
      </section>

      {/* Industries */}
      <section>
        <Container className="py-20">
          <Eyebrow>Who we work with</Eyebrow>
          <h2 className="max-w-2xl font-display text-4xl tracking-tight">A different playbook for every kind of business.</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.plannerLive ? `/industries/${c.slug}` : `/plan-builder?category=${c.slug}`}
                  className="flex h-full flex-col rounded-2xl border border-line bg-paper p-5 transition-colors hover:border-ink"
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="mt-1 text-[13px] text-muted">{c.audience}</span>
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
      <section className="bg-ink text-paper">
        <div className="gold-rule" />
        <Container className="py-20">
          <Eyebrow light>How it works</Eyebrow>
          <h2 className="max-w-2xl font-display text-4xl tracking-tight">From four minutes of questions to a month of content.</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.t}>
                <span className="font-display text-3xl text-gold-300">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-2xl">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-paper/75">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <ButtonLink href="/how-it-works" variant="light">The full process <Arrow /></ButtonLink>
          </div>
        </Container>
      </section>

      {/* Services and platforms */}
      <section>
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
            {platforms.map((p) => (
              <li key={p.id} className="rounded-2xl border border-line bg-paper p-5">
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-[13px] text-muted">{p.job}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Promises */}
      <section className="border-t border-line bg-cream/50">
        <Container className="grid gap-8 py-16 md:grid-cols-3">
          {promises.map((p) => (
            <div key={p.t}>
              <p className="font-display text-2xl">{p.t}</p>
              <p className="mt-2 text-[15px] text-muted">{p.d}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* CTA */}
      <section>
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
