import { site } from "@/lib/site";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; content is built from our own constants.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationSchema() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: `${site.url}/brand/oryza-logo.png`,
    image: `${site.url}/og.png`,
    description: site.description,
    address: {
      "@type": "PostalAddress",
      ...(site.address.street && { streetAddress: site.address.street }),
      ...(site.address.postalCode && { postalCode: site.address.postalCode }),
      addressLocality: site.address.locality,
      addressRegion: site.region,
      addressCountry: site.country,
    },
    areaServed: [{ "@type": "City", name: site.city }, { "@type": "Country", name: "India" }],
    knowsAbout: [
      "Social media management",
      "Instagram marketing",
      "Facebook marketing",
      "YouTube marketing",
      "WhatsApp Business",
      "Google Business Profile",
      "Local SEO",
    ],
  };
  data.telephone = site.phone.replace(/[^\d+]/g, "");
  data.email = site.email;
  if (site.social.length) data.sameAs = site.social.map((s) => s.url);
  return data;
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function serviceSchema(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${site.url}${path}`,
    provider: { "@id": `${site.url}/#organization` },
    areaServed: { "@type": "Country", name: "India" },
  };
}
