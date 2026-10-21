import localFont from "next/font/local";

/*
 * Self-hosted variable fonts (files from Fontsource), loaded through next/font so they are preloaded and get a
 * metric-matched fallback — text no longer re-wraps when the webfont arrives (no layout shift).
 * Latin subset only: all site copy is English / Hinglish in Latin script.
 */
export const fraunces = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});

/**
 * Italic is used for a few quotes only, so it is not preloaded (use the `font-display-italic` class). "optional"
 * so a late italic file never swaps in and shifts the quote (first visits may keep the matched fallback).
 */
export const frauncesItalic = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2", weight: "100 900", style: "italic" }],
  variable: "--font-fraunces-italic",
  display: "optional",
  preload: false,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const manrope = localFont({
  src: [{ path: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-manrope",
  // Body text: "optional" means no late swap (it is the LCP text on most pages). First-time visitors on a slow
  // connection keep the metric-matched fallback; everyone else gets Manrope from cache or the preload.
  display: "optional",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: "Arial",
});
