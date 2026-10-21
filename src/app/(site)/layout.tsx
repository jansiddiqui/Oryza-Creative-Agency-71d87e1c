import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics } from "@/components/Analytics";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { JsonLd, organizationSchema } from "@/components/JsonLd";
import { PlatformSprite } from "@/components/icons";

/** Public website chrome: header, footer, schema, analytics and scroll reveals. Not used by /admin. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <PlatformSprite />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <JsonLd data={organizationSchema()} />
      <Analytics />
      <RevealObserver />
    </>
  );
}
