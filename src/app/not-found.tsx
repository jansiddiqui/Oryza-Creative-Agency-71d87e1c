import type { Metadata } from "next";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="font-display text-7xl text-gold-500">404</p>
      <h1 className="mt-4 font-display text-3xl">This page isn’t here.</h1>
      <p className="mt-3 text-muted">It may have moved when we rebuilt our website.</p>
      <div className="mt-8"><ButtonLink href="/">Go to the homepage</ButtonLink></div>
    </Container>
  );
}
