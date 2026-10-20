import { describe, expect, it } from "vitest";
import { addressLine, site, telHref, whatsappLink } from "./site";

describe("site details", () => {
  it("opens WhatsApp chats with Oryza's number", () => {
    expect(site.whatsapp).toBe("917007345134");
    expect(whatsappLink("Hi Oryza, I'd like a plan")).toBe(
      "https://wa.me/917007345134?text=Hi%20Oryza%2C%20I'd%20like%20a%20plan",
    );
  });

  it("uses www.oryzaonline.in as the canonical host", () => {
    expect(site.url).toBe("https://www.oryzaonline.in");
  });

  it("links phone and email to Oryza's real contact details", () => {
    expect(telHref(site.phone)).toBe("tel:+917007345134");
    expect(site.email).toBe("contact@oryzaonline.in");
  });

  it("shows only confirmed address parts", () => {
    expect(addressLine()).toBe(["Kanpur Nagar", "Uttar Pradesh"].concat(site.address.postalCode || []).join(", "));
  });
});
