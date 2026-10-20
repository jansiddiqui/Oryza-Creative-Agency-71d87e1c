import type { Metadata } from "next";
import { platforms } from "@/data/platforms";
import { categories } from "@/data/categories";
import { Container, Eyebrow, FitChip, PageHeader } from "@/components/ui";
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
      />
      <section>
        <Container className="py-20">
          <div className="grid gap-5 md:grid-cols-2">
            {platforms.map((p) => (
              <article key={p.id} className="rounded-2xl border border-line bg-paper p-7">
                <h2 className="font-display text-2xl">{p.name}</h2>
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
            <strong className="text-ink">Core</strong> platforms are always in the plan. <strong className="text-ink">Add</strong> platforms are recommended when the goal or budget allows.
          </p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-paper">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Platform fit by industry</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="p-4 font-semibold">Industry</th>
                  {platforms.map((p) => (
                    <th key={p.id} scope="col" className="p-4 font-semibold">{p.name.replace(" Business Profile", "").replace(" & Google indexing", "")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.slug} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="p-4 font-semibold">{c.name}</th>
                    {platforms.map((p) => (
                      <td key={p.id} className="p-4">
                        <FitChip fit={c.fit[p.id]} label={c.fit[p.id] === "core" ? "Core" : c.fit[p.id] === "add" ? "Add" : "—"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Platforms", path: "/platforms" }])} />
    </>
  );
}
