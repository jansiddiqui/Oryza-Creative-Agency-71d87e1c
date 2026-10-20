import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { addressLine, site, telHref } from "@/lib/site";

// TODO(legal): have this policy reviewed against the Digital Personal Data Protection Act, 2023 and its Rules.
export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and protects the details you share on this website.`,
  alternates: { canonical: "/privacy-policy" },
};

const UPDATED = "20 October 2026";

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        This website is run by {site.name} (“Oryza”, “we”), {addressLine()}, India. {/* TODO(legal): registered legal entity name and type. */}
        For anything about your personal data, email <a href={`mailto:${site.email}`}>{site.email}</a> or call{" "}
        <a href={telHref(site.phone)}>{site.phone}</a>.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what you choose to send us, plus basic usage statistics:</p>
        <ul>
          <li>
            <strong>Contact and plan requests:</strong> your name, WhatsApp/phone number and, if you add them, your
            business name, city, category and message.
          </li>
          <li>
            <strong>Plan builder:</strong> your answers are used in your browser to build the plan. When you unlock the
            full plan, your name, number and a summary of the plan are sent to us.
          </li>
          <li>
            <strong>Usage statistics:</strong> if analytics are switched on (see “Cookies and analytics”), pages visited,
            approximate location, device and browser type, and how you interact with pages.
          </li>
        </ul>
        <p>We do not ask for payment details, passwords or government ID numbers on this website.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To reply to your enquiry, usually on WhatsApp or by phone, and to prepare the plan or proposal you asked for.</li>
        <li>To understand which pages help visitors, and to fix problems with the website.</li>
        <li>To keep records we are required to keep by law.</li>
      </ul>
    ),
  },
  {
    id: "basis",
    title: "Your consent",
    body: (
      <p>
        We process your details because you gave them to us for a specific purpose — to be contacted about social
        media services. You can withdraw that consent at any time by writing to us; we will then stop contacting you and
        delete your details unless the law requires us to keep them. We do not sell your data and do not use it for
        unrelated marketing.
      </p>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <p>We use a few service providers to run this website. They process data only on our instructions:</p>
        <ul>
          <li><strong>Vercel</strong> — hosts the website.</li>
          <li><strong>Cloudflare</strong> — domain name and network security.</li>
          <li><strong>Resend</strong> — delivers form submissions to our inbox by email.</li>
          <li><strong>Google Analytics</strong> and <strong>Microsoft Clarity</strong> — usage statistics, when enabled.</li>
          <li><strong>WhatsApp (Meta)</strong> — only if you choose to message us on WhatsApp.</li>
        </ul>
        <p>Some of these providers store data outside India. We share data with authorities only when the law requires it.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          The website itself works without cookies. If analytics are switched on, Google Analytics and Microsoft Clarity
          set cookies to count visits and show how pages are used (for example, where people click or scroll). Clarity
          masks text you type into forms.
        </p>
        <p>
          You can block or delete cookies in your browser settings, or use Google’s{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">analytics opt-out add-on</a>.
          The website keeps working if you do.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <p>
        {/* TODO(legal): confirm retention periods. */}
        We keep enquiry details for as long as we are talking to you and for a reasonable period afterwards, then delete
        them unless you become a client or the law requires us to keep them. Analytics data is kept according to the
        retention settings of the analytics tools.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us to:</p>
        <ul>
          <li>tell you what personal data we hold about you and how it is used;</li>
          <li>correct, complete or update it;</li>
          <li>delete it, or stop using it by withdrawing consent;</li>
          <li>nominate someone to exercise these rights for you in case of death or incapacity.</li>
        </ul>
        <p>
          Write to <a href={`mailto:${site.email}`}>{site.email}</a>. We will reply within a reasonable time.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        The website runs only over HTTPS, form submissions are checked on our server before delivery, and access to
        enquiries is limited to our team. No method of transmission or storage is completely secure, but we take
        reasonable steps to protect your data.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievances",
    body: (
      <p>
        {/* TODO(legal): name the Grievance Officer if required. */}
        If you have a concern about how we handle your data, contact us at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. If we cannot resolve it, you may approach the Data Protection
        Board of India.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We will update this page when our practices change and show the new date at the top. See also our{" "}
        <Link href="/terms">terms of use</Link>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <LegalPage
        eyebrow="Legal"
        title="Privacy policy"
        intro="What we collect when you contact us or use the plan builder, why, and how you stay in control of it."
        updated={UPDATED}
        sections={sections}
      />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Privacy policy", path: "/privacy-policy" }])} />
    </>
  );
}
