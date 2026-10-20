import type { Metadata } from "next";
import { packages } from "@/lib/engine/school-engine";
import { platforms } from "@/data/platforms";
import { Arrow, ButtonLink, Container, Eyebrow, PageHeader } from "@/components/ui";
import { JsonLd, breadcrumbSchema, serviceSchema } from "@/components/JsonLd";
import { CameraIcon, PlatformIcon, WhatsAppIcon, serviceIcons, type IconComponent } from "@/components/icons";
import { PackageCompare } from "@/components/infographics/PackageCompare";
import { slotMedia } from "@/components/images/SlotImage";
import { revealDelay } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Social media management services & packages",
  description:
    "Monthly social media management in Starter, Growth and Premium volumes, plus one-time profile optimization for every platform.",
  alternates: { canonical: "/services" },
};

const included: { text: string; Icon: IconComponent }[] = [
  { text: "Strategy and a 30-day calendar for every platform", Icon: serviceIcons.strategy },
  { text: "Shoot days with a planned shot list", Icon: CameraIcon },
  { text: "Reels, carousels, posts and stories", Icon: serviceIcons.reels },
  { text: "Captions in Hindi–English, hashtags and keywords", Icon: serviceIcons.content },
  { text: "Scheduling and publishing at the right times", Icon: serviceIcons.posting },
  { text: "Comment and DM replies in working hours", Icon: serviceIcons.community },
  { text: "Leads passed to your WhatsApp", Icon: WhatsAppIcon },
  { text: "Monthly report: reach, followers, inquiries, top content", Icon: serviceIcons.reporting },
];

export default function Services() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title={<>Two lines on your bill. <span className="gold-text">Nothing hidden.</span></>}
        intro="One-time profile optimization to get every platform ready, and monthly management to keep your brand growing. Each platform is its own service, so you only pay for what fits your business."
        media={slotMedia("services-header")}
      />

      <section>
        <Container className="py-20">
          <Eyebrow>Monthly management</Eyebrow>
          <h2 className="font-display text-4xl tracking-tight">Packages by volume</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Volumes below are for Instagram, the base of most plans. Other platforms are added on top based on your
            business. Pricing is shared on a call after we understand your needs.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {Object.entries(packages).map(([id, p], i) => (
              <div
                key={id}
                data-reveal=""
                style={revealDelay(i)}
                className={`rounded-2xl border p-7 ${id === "growth" ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}
              >
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${id === "growth" ? "text-gold-300" : "text-gold-700"}`}>
                  {id === "growth" ? "Most chosen" : "Package"}
                </p>
                <p className="mt-2 font-display text-3xl">{p.name}</p>
                <ul className={`mt-5 space-y-2 text-[15px] ${id === "growth" ? "text-paper/85" : "text-ink-soft"}`}>
                  <li>{p.reels} reels a month</li>
                  <li>{p.posts} posts a month</li>
                  <li>Stories {p.storyDaysPerWeek >= 7 ? `daily (${p.storiesPerDay}+ a day)` : `${p.storyDaysPerWeek} days a week`}</li>
                  <li>{p.shoots} shoot day{p.shoots > 1 ? "s" : ""} a month</li>
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <p className="mb-4 font-display text-2xl">Side by side</p>
            <PackageCompare />
          </div>
          <div className="mt-12 rounded-2xl border border-line bg-cream/60 p-7">
            <p className="font-display text-2xl">Every package includes</p>
            <ul className="mt-5 grid gap-x-8 gap-y-3.5 text-[15px] text-ink-soft sm:grid-cols-2">
              {included.map(({ text, Icon }) => (
                <li key={text} className="icon-hover flex items-start gap-3"><Icon size={20} accent className="mt-0.5 text-ink" />{text}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-cream/40">
        <Container className="py-20">
          <Eyebrow>One-time add-on</Eyebrow>
          <h2 className="font-display text-4xl tracking-tight">Profile optimization, platform by platform</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Done in your first 7–10 days and charged separately from the monthly fee. Pick only the platforms you need.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((p, i) => (
              <div key={p.id} data-reveal="" style={revealDelay(i, 50)} className="card-lift rounded-2xl border border-line bg-paper p-6">
                <p className="flex items-center gap-2.5 font-display text-xl"><PlatformIcon id={p.id} size={24} accent />{p.name}</p>
                <ul className="mt-3 space-y-1.5 text-[14px] text-muted">
                  {p.optimization.map((o) => <li key={o}>· {o}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <ButtonLink href="/plan-builder">See what your plan would include <Arrow /></ButtonLink>
          </div>
        </Container>
      </section>
      <JsonLd data={serviceSchema("Social media management", metadata.description as string, "/services")} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }])} />
    </>
  );
}
