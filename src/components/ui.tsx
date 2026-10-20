import Link from "next/link";
import type { ReactNode } from "react";

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
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition-colors ${styles[variant]} ${className}`;
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

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro: ReactNode }) {
  return (
    <section className="border-b border-line bg-cream/50">
      <Container className="py-16 sm:py-24">
        <div className="reveal max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>
        </div>
      </Container>
    </section>
  );
}

export function Arrow() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
