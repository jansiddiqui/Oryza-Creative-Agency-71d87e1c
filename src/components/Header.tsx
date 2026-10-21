import { getImageProps } from "next/image";
import Link from "next/link";
import { nav } from "@/lib/site";
import { ButtonLink, Container } from "./ui";
import { HeaderScroll } from "./motion/HeaderScroll";

/**
 * The logo as plain <img> tags with next/image's optimised sources (getImageProps): no client image
 * component on every page. The header logo loads with priority; the footer's light version lazily.
 */
export function Logo({ light = false }: { light?: boolean }) {
  const priority = !light;
  const { props: icon } = getImageProps({ src: "/brand/oryza-icon.png", alt: "", width: 34, height: 34, priority });
  const { props: word } = getImageProps({ src: light ? "/brand/oryza-wordmark-light.png" : "/brand/oryza-wordmark.png", alt: "Oryza", width: 96, height: 19, priority });
  return (
    <span className="header-logo flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- optimised sources from getImageProps; decorative alt="" */}
      <img {...icon} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- optimised sources and alt from getImageProps */}
      <img {...word} />
    </span>
  );
}

export function Header() {
  return (
    <header id="site-header" className="site-header sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <HeaderScroll targetId="site-header" />
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Oryza Creative Agency — home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-ink-soft hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block">
            <ButtonLink href="/plan-builder" className="!px-5 !py-2.5 text-sm">Get my free plan</ButtonLink>
          </span>
          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-ink/15 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open menu</span>
              <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-12 w-60 rounded-2xl border border-line bg-paper p-3 shadow-xl"
            >
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-cream">
                  {n.label}
                </Link>
              ))}
              <Link href="/plan-builder" className="mt-2 block rounded-lg bg-ink px-3 py-2.5 text-center text-[15px] font-semibold text-paper">
                Get my free plan
              </Link>
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}
