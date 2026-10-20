import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { leadsToCsv, whatsappFor, type Lead } from "@/lib/leads-format";
import { LeadCard } from "./LeadCard";

const lead = (l: Partial<Lead> = {}): Lead => ({
  id: "1",
  createdAt: "2026-10-20T05:30:00Z",
  source: "contact",
  name: "Asha Verma",
  phone: "9876543210",
  business: "Test School",
  category: "Schools",
  city: "Kanpur",
  message: "Hello",
  planSummary: "",
  answers: null,
  status: "new",
  notes: "",
  emailSent: true,
  emailError: null,
  updatedAt: "",
  updatedBy: null,
  ...l,
});

describe("lead card", () => {
  it("labels each lead status correctly (never with image labels)", () => {
    for (const [status, label] of [["new", "New"], ["contacted", "Contacted"], ["converted", "Converted"], ["not_fit", "Not a fit"]] as const) {
      const html = renderToStaticMarkup(<LeadCard lead={lead({ status })} />);
      expect(html).toContain(`>${label}</span>`);
      expect(html).not.toMatch(/needs review|Earlier version|Live</);
    }
  });

  it("offers WhatsApp click-to-chat with the lead's number and flags emails that failed", () => {
    const html = renderToStaticMarkup(<LeadCard lead={lead({ emailSent: false, emailError: "Resend 500" })} />);
    expect(html).toContain('href="https://wa.me/919876543210?text=');
    expect(html).toContain("Email not sent");
  });
});

describe("lead helpers", () => {
  it("builds WhatsApp links from Indian and international numbers", () => {
    expect(whatsappFor("98765 43210")).toBe("https://wa.me/919876543210");
    expect(whatsappFor("09876543210")).toBe("https://wa.me/919876543210");
    expect(whatsappFor("+91 98765-43210")).toBe("https://wa.me/919876543210");
    expect(whatsappFor("+44 20 7946 0958")).toBe("https://wa.me/442079460958");
    expect(whatsappFor("12345")).toBeNull();
  });

  it("exports CSV newest-first rows with quoted cells and neutralised formulas", () => {
    const csv = leadsToCsv([lead({ name: '=HYPERLINK("http://evil")', message: 'Says "hi", twice\nnew line', status: "converted" })]);
    expect(csv.startsWith("﻿\"Received\",\"Status\"")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv).toContain('"Says ""hi"", twice\nnew line"');
    expect(csv).toContain('"Converted"');
  });
});
