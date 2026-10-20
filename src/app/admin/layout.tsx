import type { Metadata } from "next";

/** Private area: never indexed, no public header/footer/analytics (those live in app/(site)). */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Oryza admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
}
