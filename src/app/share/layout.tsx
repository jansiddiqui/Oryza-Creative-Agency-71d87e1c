import type { Metadata } from "next";
import "../admin/(panel)/ops.css";

/**
 * Pages opened from links Oryza sends to clients (approvals, reports). No login, never indexed, no analytics or
 * tracking, no site header/footer. Each page checks its signed link and rate-limits visitors on the server.
 */
export const metadata: Metadata = {
  title: { default: "Oryza", template: "%s · Oryza" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line bg-ink px-4 py-3 text-paper print:border-0 print:bg-paper print:text-ink sm:px-8">
        <p className="mx-auto flex max-w-4xl items-center gap-2.5">
          {/* A plain image keeps these pages off the website's own image code. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/oryza-icon.png" alt="" width={24} height={24} />
          <span className="font-display text-lg">Oryza Creative Agency</span>
        </p>
      </header>
      <main id="main" className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
