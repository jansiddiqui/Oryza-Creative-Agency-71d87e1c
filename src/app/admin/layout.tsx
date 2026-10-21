import "./(panel)/ops.css";
import type { Metadata, Viewport } from "next";

/** Private area: never indexed, no public header/footer/analytics (those live in app/(site)). */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Oryza admin" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  // Installable on phones (admin scope only; no service worker, nothing is cached offline).
  manifest: "/admin-pwa/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Oryza admin", statusBarStyle: "default" },
  icons: { apple: "/admin-pwa/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#f6f4ef", viewportFit: "cover" };

export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-root min-h-dvh bg-canvas text-ink">{children}</div>;
}
