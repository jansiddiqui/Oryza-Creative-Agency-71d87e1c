import type { Metadata } from "next";
import { platforms } from "@/data/platforms";
import { categories } from "@/data/categories";
import { Container, Eyebrow, PageHeader } from "@/components/ui";
import { PlatformIcon } from "@/components/icons";
import { FitMatrix } from "@/components/infographics/FitMatrix";
import { slotMedia } from "@/components/images/SlotImage";
import { revealDelay } from "@/components/motion/reveal";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Which social media platform is right for your business?",
  description:
    "What Instagram, Facebook, WhatsApp, YouTube, Google, LinkedIn, X and Pinterest each do for a brand — and which fit your industry.",
  alternates: { canonical: "/platforms" },
};

export default function Platforms() {
  return (
    <>
      <PageHeader
        eyebrow="Platform guide"
        title="Every platform has a different job."
        intro="Posting the same thing everywhere wastes your audience’s attention. Here is what each platform does for a brand, and where it fits."
        media={slotMedia("platforms-header")}
      />
      <section>
        <Container className="py-20">
          <div className="grid gap-5 md:grid-cols-2">
            {platforms.map((p, i) => (
              <article key={p.id} data-reveal="" style={revealDelay(i % 2)} className="card-lift rounded-2xl border border-line bg-paper p-7">
                <h2 className="flex items-center gap-3 font-display text-2xl"><PlatformIcon id={p.id} size={28} accent />{p.name}</h2>
                <p className="mt-1 font-semibold text-gold-700">{p.job}</p>
                <dl className="mt-4 space-y-2 text-[15px]">
                  <div><dt className="inline font-semibold">Formats: </dt><dd className="inline text-muted">{p.formats}</dd></div>
                  <div><dt className="inline font-semibold">Strongest for: </dt><dd className="inline text-muted">{p.strongestFor}</dd></div>
                  <div><dt className="inline font-semibold">Every month: </dt><dd className="inline text-muted">{p.monthly.join(", ")}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-cream/40">
        <Container className="py-20">
          <Eyebrow>Platform fit by industry</Eyebrow>
          <h2 className="font-display text-4xl tracking-tight">Where your business should be</h2>
          <p className="mt-3 max-w-2xl text-muted">
            {categories.length} industries × {platforms.length} platforms. Each business needs only some of them — this is where we start every plan.
          </p>
          <div className="mt-10">
            <FitMatrix categories={categories} />
          </div>
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Platforms", path: "/platforms" }])} />
    </>
  );
}
