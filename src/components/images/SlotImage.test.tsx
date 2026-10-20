import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { slotById } from "@/data/image-slots";
import type { ManifestEntry } from "@/lib/image-manifest";
import { SlotImage, SlotPicture } from "./SlotImage";

const v = (aspect: string, w: number, h: number) => ({ w, h, avif: `/images/x/${aspect}-${w}.avif`, webp: `/images/x/${aspect}-${w}.webp` });

const entry: ManifestEntry = {
  source: "ai-illustrative",
  original: { file: "x.png", width: 1536, height: 1024, sha256: "" },
  focal: { x: 0.6, y: 0.5 },
  aspects: {
    "16x9": { width: 1536, height: 864, blurDataURL: "data:image/webp;base64,AAA", variants: [v("16x9", 640, 360), v("16x9", 1280, 720)] },
    "4x5": { width: 819, height: 1024, blurDataURL: "data:image/webp;base64,BBB", variants: [v("4x5", 480, 600), v("4x5", 640, 800)] },
  },
  approved_by: "Reviewer",
  approved_at: "2026-10-20T00:00:00Z",
  updated_at: "",
};

describe("SlotImage", () => {
  it("renders an art-directed picture: AVIF + WebP, portrait crop on phones, alt, lazy, blur placeholder", () => {
    const html = renderToStaticMarkup(<SlotPicture slot={slotById["industry-schools-header"]} entry={entry} sizes="50vw" />);
    expect(html).toContain("<picture");
    expect(html).toContain('media="(max-width: 767px)" type="image/avif"');
    expect(html).toContain("/images/x/4x5-480.avif");
    expect(html).toContain("/images/x/16x9-1280.avif");
    expect(html).toContain("/images/x/16x9-640.webp");
    expect(html).toContain(`alt="${slotById["industry-schools-header"].alt}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("data:image/webp;base64,AAA");
    expect(html).toContain("object-position:60% 50%");
  });

  it("loads hero images eagerly when marked priority", () => {
    const html = renderToStaticMarkup(<SlotPicture slot={slotById["industry-schools-header"]} entry={entry} sizes="50vw" priority />);
    expect(html).not.toContain('loading="lazy"');
  });

  it("shows the brand fallback (never a broken image) for an empty slot that allows it", () => {
    const html = renderToStaticMarkup(<SlotImage slot="industry-schools-header" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<pattern");
    expect(html).not.toContain("<img");
  });

  it("renders nothing for an empty slot without a fallback (e.g. real-only team photo)", () => {
    expect(renderToStaticMarkup(<SlotImage slot="contact-studio" />)).toBe("");
  });

  it("rejects unknown slot ids", () => {
    expect(() => renderToStaticMarkup(<SlotImage slot="nope" />)).toThrow(/Unknown image slot/);
  });
});
