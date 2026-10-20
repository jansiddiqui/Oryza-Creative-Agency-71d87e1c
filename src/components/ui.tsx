import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "./icons";

type Variant = "primary" | "gold" | "ghost" | "light";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  gold: "bg-gold-300 text-ink hover:bg-gold-100",
  ghost: "border border-ink/20 text-ink hover:border-ink hover:bg-ink/[0.03]",
  light: "border border-paper/30 text-paper hover:border-paper hover:bg-paper/5",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
}) {
  const cls = `btn-arrow inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-[background-color,border-color,transform] active:scale-[0.98] motion-reduce:active:scale-100 ${styles[variant]} ${className}`;
  if (external)
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] ${
        light ? "text-gold-300" : "text-gold-700"
      }`}
    >
      <span aria-hidden className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  media,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  /** Optional image beside the headline (e.g. an approved image slot). */
  media?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-cream/50">
      <Container className={`py-16 sm:py-24 ${media ? "grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
        <div className="reveal max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>
        </div>
        {media && <div className="reveal reveal-2 overflow-hidden rounded-2xl">{media}</div>}
      </Container>
    </section>
  );
}

export function Arrow() {
  return <ArrowRightIcon size={16} />;
}

const fitStyle = {
  core: "bg-ink text-paper",
  add: "border border-gold-500/60 text-gold-700",
  skip: "text-muted/60 line-through",
} as const;

export function FitChip({ fit, label }: { fit: "core" | "add" | "skip"; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${fitStyle[fit]}`}>
      {label}
    </span>
  );
}
