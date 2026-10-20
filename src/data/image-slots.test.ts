import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categories } from "./categories";
import { imageSlots, slotById } from "./image-slots";
import { buildPrompt, NEGATIVE_PROMPT, promptsMarkdown, REVIEW_CHECKLIST, requiredSource, sourceSize, STYLE_GUIDE } from "@/lib/image-prompts";
import { approvedEntry, manifest, ogImageUrl, pickVariant, type ImageManifest } from "@/lib/image-manifest";

describe("image slot registry", () => {
  it("has unique ids", () => {
    expect(new Set(imageSlots.map((s) => s.id)).size).toBe(imageSlots.length);
  });

  it("has a header and an OG slot for every industry, plus the page slots", () => {
    for (const c of categories) {
      expect(slotById[`industry-${c.slug}-header`]?.aspects.map((a) => a.id)).toEqual(["16x9", "4x5"]);
      expect(slotById[`industry-${c.slug}-og`]?.aspects.map((a) => a.id)).toEqual(["og"]);
    }
    for (const id of ["home-hero", "services-header", "platforms-header", "how-it-works-header", "contact-studio"]) expect(slotById[id]).toBeDefined();
  });

  it("marks team/studio photos as real-only", () => {
    expect(slotById["contact-studio"].type).toBe("real-only");
  });

  it("gives every slot alt text, a placement and sane crops", () => {
    for (const s of imageSlots) {
      expect(s.alt.length, s.id).toBeGreaterThan(10);
      expect(s.placement.length, s.id).toBeGreaterThan(10);
      for (const a of s.aspects) {
        expect(a.minWidth, `${s.id} ${a.id}`).toBeLessThanOrEqual(Math.max(...a.widths));
        expect([...a.widths].sort((x, y) => x - y), `${s.id} ${a.id}`).toEqual(a.widths);
      }
      if (s.deriveFrom) expect(slotById[s.deriveFrom], s.id).toBeDefined();
    }
  });
});

describe("prompt generator", () => {
  it("never writes a prompt for a real-only slot", () => {
    for (const s of imageSlots.filter((x) => x.type === "real-only")) expect(buildPrompt(s)).toBeNull();
  });

  it("builds each illustrative prompt from the subject, the shared style guide and the size", () => {
    const s = slotById["industry-schools-header"];
    const p = buildPrompt(s)!;
    expect(p).toContain("school courtyard");
    expect(p).toContain(STYLE_GUIDE);
    expect(p).toContain("3:2 landscape, at least 1536×1024px");
    expect(p).toContain("16:9 and 4:5");
  });

  it("asks for a source big enough for every crop", () => {
    for (const s of imageSlots) {
      const need = requiredSource(s);
      const size = sourceSize(s);
      expect(size.width, s.id).toBeGreaterThanOrEqual(need.width);
      expect(size.height, s.id).toBeGreaterThanOrEqual(need.height);
    }
  });

  it("documents negatives and the human review checklist", () => {
    const md = promptsMarkdown(imageSlots);
    for (const n of NEGATIVE_PROMPT) expect(md).toContain(n);
    for (const c of REVIEW_CHECKLIST) expect(md).toContain(c);
    for (const s of imageSlots) expect(md).toContain(`\`${s.id}\``);
  });

  it("docs/image-prompts.md is up to date (run npm run images:prompts)", () => {
    const file = readFileSync(join(process.cwd(), "docs", "image-prompts.md"), "utf8").replace(/\r\n/g, "\n");
    expect(file).toBe(promptsMarkdown(imageSlots));
  });
});

describe("image manifest", () => {
  it("only references known slots, files that exist, and real photos in real-only slots", () => {
    for (const [id, e] of Object.entries(manifest.slots)) {
      const slot = slotById[id];
      expect(slot, id).toBeDefined();
      if (slot.type === "real-only") expect(e.source, id).toBe("real");
      for (const a of Object.values(e.aspects)) {
        for (const v of a!.variants) {
          expect(existsSync(join(process.cwd(), "public", v.webp)), v.webp).toBe(true);
          expect(existsSync(join(process.cwd(), "public", v.avif)), v.avif).toBe(true);
        }
      }
    }
  });

  it("shows an image only after a person approved it", () => {
    const m: ImageManifest = {
      version: 1,
      slots: {
        a: { source: "ai-illustrative", original: { file: "a.png", width: 1, height: 1, sha256: "" }, focal: { x: 0.5, y: 0.5 }, aspects: {}, approved_by: null, approved_at: null, updated_at: "" },
        b: {
          source: "ai-illustrative",
          original: { file: "b.png", width: 1, height: 1, sha256: "" },
          focal: { x: 0.5, y: 0.5 },
          aspects: { og: { width: 1536, height: 806, blurDataURL: "", variants: [{ w: 1200, h: 630, avif: "/images/b/og-1200.avif", webp: "/images/b/og-1200.webp" }] } },
          approved_by: "Reviewer",
          approved_at: "2026-10-20T00:00:00Z",
          updated_at: "",
        },
      },
    };
    expect(approvedEntry("a", m)).toBeNull();
    expect(approvedEntry("b", m)).not.toBeNull();
    expect(ogImageUrl("b", m)).toBe("/images/b/og-1200.webp");
  });

  it("picks the smallest variant that is wide enough", () => {
    const v = [640, 960, 1280].map((w) => ({ w, h: w, avif: `${w}.avif`, webp: `${w}.webp` }));
    expect(pickVariant(v, 700).w).toBe(960);
    expect(pickVariant(v, 3000).w).toBe(1280);
  });
});
