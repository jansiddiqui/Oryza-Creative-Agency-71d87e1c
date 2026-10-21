import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { ButtonLink, Container, PageHeader } from "@/components/ui";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { addressLine, site, telHref, whatsappLink } from "@/lib/site";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { SlotImage } from "@/components/images/SlotImage";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to Oryza about social media management for your business. Based in ${site.city}, working with businesses across India.`,
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  const wa = whatsappLink("Hi Oryza, I'd like to talk about social media for my business.");
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us about your business."
        intro="Share a few details and a strategist will reach you on WhatsApp within one working day."
      />
      <section>
        <Container className="grid gap-14 py-20 lg:grid-cols-[1.3fr_0.7fr]">
          <LeadForm waHref={wa} />
          <aside className="space-y-6 rounded-2xl bg-cream/60 p-7">
            {/* Calm illustrative image (or a real photo) — renders nothing until one is approved. */}
            <SlotImage slot="contact-studio" sizes="(min-width: 1024px) 30vw, 100vw" className="rounded-xl" />
            {wa && <ButtonLink href={wa} external className="w-full">Chat on WhatsApp</ButtonLink>}
            <div className="flex gap-3 text-[15px]">
              <PinIcon size={20} accent className="mt-0.5" />
              <div><p className="font-semibold">Based in</p><p className="text-muted">{addressLine()}</p></div>
            </div>
            {site.hours && (
              <div className="flex gap-3 text-[15px]">
                <ClockIcon size={20} accent className="mt-0.5" />
                <div><p className="font-semibold">Hours</p><p className="text-muted">{site.hours}</p></div>
              </div>
            )}
            <div className="flex gap-3 text-[15px]">
              <PhoneIcon size={20} accent className="mt-0.5" />
              <div><p className="font-semibold">Call</p><a href={telHref(site.phone)} className="text-muted hover:text-ink">{site.phone}</a></div>
            </div>
            <div className="flex gap-3 text-[15px]">
              <MailIcon size={20} accent className="mt-0.5" />
              <div><p className="font-semibold">Email</p><a href={`mailto:${site.email}`} className="text-muted hover:text-ink">{site.email}</a></div>
            </div>
            <p className="text-[13px] text-muted">Prefer to see a plan first? <Link href="/plan-builder" className="font-semibold text-gold-700 underline">Build your free plan</Link>.</p>
          </aside>
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
