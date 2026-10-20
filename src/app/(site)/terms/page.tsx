import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { site, telHref } from "@/lib/site";

// TODO(legal): have these terms reviewed before launch.
export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms for using the ${site.name} website and its free social media plan builder.`,
  alternates: { canonical: "/terms" },
};

const UPDATED = "20 October 2026";

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <p>
        These terms apply to your use of this website, run by {site.name} (“Oryza”, “we”). By using the website you
        agree to them. Our <Link href="/privacy-policy">privacy policy</Link> explains how we handle your data.
      </p>
    ),
  },
  {
    id: "plans",
    title: "Free plans are guidance",
    body: (
      <>
        <p>
          The plan builder creates a suggested social media plan from your answers, using fixed rules. It is general
          guidance, not a promise of results. Reach, followers, enquiries and sales depend on many things outside our
          control, so we do not guarantee any numbers.
        </p>
        <p>
          You are responsible for checking that what you post — including dates, offers, claims and photos of people —
          is accurate, lawful and has the consent it needs.
        </p>
        <p>You may use a plan you generate for your own business, free of charge.</p>
      </>
    ),
  },
  {
    id: "services",
    title: "Our paid services",
    body: (
      <p>
        {/* TODO(legal): payment terms, cancellation and refunds — or point to the client agreement. */}
        Information on this website about our services is not an offer. Paid work starts only after we agree a written
        proposal or agreement with you, which sets out scope, fees, timelines and payment terms. Each platform is a
        separate service, and profile optimization is a one-time charge on top of monthly management. Nothing is posted
        on your accounts without your approval.
      </p>
    ),
  },
  {
    id: "use",
    title: "Using the website",
    body: (
      <ul>
        <li>Give accurate details when you contact us.</li>
        <li>Do not misuse the website, for example by sending spam through the forms or trying to break its security.</li>
        <li>Do not copy the website’s design, text or plan templates to offer a competing service.</li>
      </ul>
    ),
  },
  {
    id: "ip",
    title: "Content and trademarks",
    body: (
      <p>
        The website’s text, design, logo and plan templates belong to Oryza. Names and logos of platforms such as
        Instagram, Facebook, WhatsApp, YouTube, Google, LinkedIn, X and Pinterest belong to their owners; we are not
        affiliated with or endorsed by them.
      </p>
    ),
  },
  {
    id: "links",
    title: "Other websites",
    body: (
      <p>
        Links to other websites and apps (such as WhatsApp) are provided for convenience. We are not responsible for
        their content or how they handle your data.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        {/* TODO(legal): confirm limitation of liability wording. */}
        We work to keep the website accurate and available, but it is provided “as is”. To the extent the law allows, we
        are not liable for losses arising from use of the website or the free plans.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        {/* TODO(legal): confirm courts — e.g. Kanpur Nagar, Uttar Pradesh. */}
        These terms are governed by the laws of India.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Changes and contact",
    body: (
      <p>
        We may update these terms and will show the new date at the top of this page. Questions: email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> or call <a href={telHref(site.phone)}>{site.phone}</a>.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <>
      <LegalPage
        eyebrow="Legal"
        title="Terms of use"
        intro="The ground rules for using this website and the free plan builder."
        updated={UPDATED}
        sections={sections}
      />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Terms of use", path: "/terms" }])} />
    </>
  );
}
