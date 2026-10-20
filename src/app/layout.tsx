import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fraunces, frauncesItalic, manrope } from "./fonts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Social media management for every business`,
    template: `%s · ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // Search Console HTML-tag verification (optional if the domain is verified via DNS).
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim() && {
    verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION.trim() },
  }),
};

export const viewport: Viewport = {
  themeColor: "#13201c",
};

/** Root: document, fonts and global styles only. Public chrome lives in (site)/layout, admin chrome in admin/. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${frauncesItalic.variable} ${manrope.variable}`}>
      <body className="min-h-dvh flex flex-col">
        {children}
      </body>
    </html>
  );
}
