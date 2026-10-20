import Link from "next/link";
import { categories } from "@/data/categories";
import { addressLine, legalNav, nav, site, telHref } from "@/lib/site";
import { Logo } from "./Header";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="bg-ink text-paper/80">
      <div className="gold-rule" />
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Social media strategy, content and management for every kind of business — planned day by day, approved
            by you, run by our team in {site.city}.
          </p>
          <address className="mt-5 space-y-1 text-sm not-italic">
            <a href={telHref(site.phone)} className="block hover:text-paper">{site.phone}</a>
            <a href={`mailto:${site.email}`} className="block hover:text-paper">{site.email}</a>
            <span className="block">{addressLine()}</span>
          </address>
          {site.social.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {site.social.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer me" className="underline-offset-4 hover:text-paper hover:underline">{s.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Footer">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Oryza</p>
          <ul className="space-y-2.5 text-sm">
            {nav.map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-paper">{n.label}</Link></li>
            ))}
            <li><Link href="/plan-builder" className="hover:text-paper">Free plan builder</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Industries</p>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 7).map((c) => (
              <li key={c.slug}>
                <Link href={c.plannerLive ? `/industries/${c.slug}` : "/industries"} className="hover:text-paper">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container className="flex flex-col gap-2 border-t border-paper/10 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}. All rights reserved.
          {legalNav.map((l) => (
            <Link key={l.href} href={l.href} className="ml-4 underline-offset-4 hover:text-paper hover:underline">{l.label}</Link>
          ))}
        </p>
        <p>No fake followers. No guaranteed numbers. Nothing posted without your approval.</p>
      </Container>
    </footer>
  );
}
