import type { ReactNode } from "react";
import { IndustryIcon } from "./icons";
import { SlotImage } from "./images/SlotImage";
import { Container, Eyebrow } from "./ui";

/**
 * Header for an industry page: icon, eyebrow, headline and intro, with the industry's image slot beside it
 * (the brand fallback until an approved image exists, so the layout never changes when one arrives).
 */
export function IndustryHeader({ slug, eyebrow, title, intro }: { slug: string; eyebrow: string; title: ReactNode; intro: ReactNode }) {
  return (
    <section className="border-b border-line bg-cream/50">
      <Container className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/40 bg-paper">
            <IndustryIcon slug={slug} size={30} accent />
          </span>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>
        </div>
        <div className="reveal reveal-2">
          <SlotImage slot={`industry-${slug}-header`} sizes="(min-width: 1024px) 45vw, 100vw" priority className="rounded-2xl" />
        </div>
      </Container>
    </section>
  );
}
