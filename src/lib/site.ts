/**
 * Central business details. Real values confirmed by Oryza are set as defaults (env vars can override).
 * Values marked TODO are still unknown — leave them empty until Oryza confirms; never guess.
 */
const env = (v: string | undefined, fallback = "") => (v && v.trim()) || fallback;

export const site = {
  name: "Oryza Creative Agency",
  shortName: "Oryza",
  tagline: "Social media, run like a brand should be.",
  description:
    "Social media management for every business — schools, clinics, real estate, leaders, restaurants and more. Get a free day-by-day plan from Oryza.",
  // Canonical host is www; Vercel redirects oryzaonline.in → www.oryzaonline.in.
  url: env(process.env.NEXT_PUBLIC_SITE_URL, "https://www.oryzaonline.in").replace(/\/$/, ""),
  city: "Kanpur",
  region: "Uttar Pradesh",
  country: "IN",
  address: {
    // TODO: street address and PIN code (old site showed both 209214 and 208001 — Oryza to confirm).
    street: env(process.env.NEXT_PUBLIC_ADDRESS_STREET),
    postalCode: env(process.env.NEXT_PUBLIC_ADDRESS_PIN),
    locality: "Kanpur Nagar",
  },
  // TODO: business hours, e.g. "Mon–Sat, 10:00–19:00". Hidden until set.
  hours: env(process.env.NEXT_PUBLIC_HOURS),
  // WhatsApp Business number: same as the phone. Digits only, with country code.
  whatsapp: env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "917007345134").replace(/\D/g, ""),
  phone: env(process.env.NEXT_PUBLIC_PHONE, "+91 7007345134"),
  email: env(process.env.NEXT_PUBLIC_EMAIL, "contact@oryzaonline.in"),
  // TODO: Oryza's own profile URLs. Empty ones are hidden.
  social: [
    { label: "Instagram", url: env(process.env.NEXT_PUBLIC_INSTAGRAM_URL) },
    { label: "Facebook", url: env(process.env.NEXT_PUBLIC_FACEBOOK_URL) },
    { label: "LinkedIn", url: env(process.env.NEXT_PUBLIC_LINKEDIN_URL) },
    { label: "YouTube", url: env(process.env.NEXT_PUBLIC_YOUTUBE_URL) },
  ].filter((s) => s.url),
};

/** Phone in tel: link form, e.g. +917007345134. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** One-line address from the confirmed parts only. */
export const addressLine = () =>
  [site.address.street, site.address.locality, site.region, site.address.postalCode].filter(Boolean).join(", ");

export function whatsappLink(message: string): string | null {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/platforms", label: "Platforms" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
];

export const legalNav = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms" },
];
