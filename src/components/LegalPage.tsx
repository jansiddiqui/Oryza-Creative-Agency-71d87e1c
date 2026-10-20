import type { ReactNode } from "react";
import { Container, PageHeader } from "./ui";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for the privacy policy and terms: header, draft notice, contents and numbered sections. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <section>
        <Container className="grid gap-12 py-16 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-700">On this page</p>
            <ol className="space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-soft hover:text-ink">{i + 1}. {s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl">
            {/* TODO(legal): remove this notice once a lawyer has reviewed the page. */}
            <p role="note" className="mb-10 rounded-xl border border-gold-500/50 bg-gold-100/40 px-5 py-4 text-[15px]">
              <strong>Draft pending legal review.</strong> Last updated {updated}. Questions? Write to us using the
              contact details below.
            </p>
            <div className="space-y-10 text-[16px] leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-gold-700 [&_a]:underline [&_li]:mt-1.5 [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
                  <h2 id={`${s.id}-h`} className="mb-3 font-display text-2xl text-ink">{i + 1}. {s.title}</h2>
                  <div className="space-y-3">{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
