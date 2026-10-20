import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanBuilder } from "@/components/planner/PlanBuilder";
import { Container, Eyebrow } from "@/components/ui";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Free social media plan builder",
  description:
    "Answer a few questions about your business and get a detailed 30-day social media plan: every reel, post, story and platform update, day by day.",
  alternates: { canonical: "/plan-builder" },
};

export default function PlanBuilderPage() {
  return (
    <>
      <section className="no-print border-b border-line bg-cream/50">
        <Container className="py-12 sm:py-16">
          <Eyebrow>Free plan builder</Eyebrow>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl">
            Your next 30 days of social media, planned in four minutes.
          </h1>
        </Container>
      </section>
      <section>
        <Container className="py-12 sm:py-16">
          <Suspense fallback={<p className="text-muted">Loading the planner…</p>}>
            <PlanBuilder />
          </Suspense>
        </Container>
      </section>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Plan builder", path: "/plan-builder" }])} />
    </>
  );
}
