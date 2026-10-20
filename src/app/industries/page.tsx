import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/categories";
import { platformById, type PlatformId } from "@/data/platforms";
import { Arrow, Container, PageHeader } from "@/components/ui";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Social media management for every industry",
  description:
    "Social media strategies for schools, hospitals, doctors, real estate, political leaders, restaurants, coaching, retail, B2B and creators.",
  alternates: { canonical: "/industries" },
};

export default function Industries() {
  return (
    <>
      <PageHeader
        eyebrow="Industries"
        title="Different audiences. Different strategies."
        intro="Every industry has its own audience, its own trust signals and its own rules. Our playbooks start from what your audience needs to feel."
      />
      <section>
        <Container className="grid gap-5 py-20 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const core = (Object.keys(c.fit) as PlatformId[]).filter((p) => c.fit[p] === "core");
            return (
              <article key={c.slug} className="flex flex-col rounded-2xl border border-line bg-paper p-7">
                <h2 className="font-display text-2xl">{c.name}</h2>
                <p className="mt-3 font-display text-lg italic leading-snug text-ink-soft">“{c.feeling}”</p>
                <p className="mt-3 text-[14px] text-muted"><strong className="text-ink">Talks to:</strong> {c.audience}</p>
                <p className="mt-2 text-[14px] text-muted">
                  <strong className="text-ink">Core platforms:</strong> {core.map((p) => platformById[p].name).join(", ")}
                </p>
                <div className="mt-auto pt-6">
                  {c.plannerLive ? (
                    <Link href={`/industries/${c.slug}`} className="inline-flex items-center gap-2 font-semibold text-gold-700 hover:text-ink">
                      Full strategy and free planner <Arrow />
                    </Link>
                  ) : (
                    <Link href={`/plan-builder?category=${c.slug}`} className="inline-flex items-center gap-2 font-semibold text-gold-700 hover:text-ink">
                      Get a plan from our strategist <Arrow />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }])} />
    </>
  );
}
