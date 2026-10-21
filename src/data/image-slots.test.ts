import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categories } from "./categories";
import { imageSlots, slotById } from "./image-slots";
import { BRAND_HEX, buildPrompt, PROMPT_SECTIONS, slotPrompts, promptsMarkdown, REVIEW_CHECKLIST, requiredSource, SHARED_NEGATIVES, sourceSize, wordCount } from "@/lib/image-prompts";
import { sceneBriefs } from "./image-scenes";

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

  it("has no real-only slots, and nothing claims to show our office, studio, team or clients", () => {
    expect(imageSlots.filter((x) => x.type === "real-only")).toEqual([]);
    for (const x of imageSlots) {
      for (const text of [x.purpose, x.subject, x.alt, x.placement]) expect(text, x.id).not.toMatch(/\b(our|oryza'?s?) (office|studio|team|clients?)\b|\bstudio\b/i);
    }
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
  const prompted = imageSlots.filter((s) => s.type === "illustrative" && !s.deriveFrom);
  const all = prompted.flatMap((s) => (["main", "alt"] as const).map((v) => ({ slot: s, v, p: buildPrompt(s, v) })));

  it("gives every illustrative slot a main and an alternative prompt", () => {
    expect(prompted.length).toBeGreaterThanOrEqual(17);
    for (const { slot, v, p } of all) expect(p, `${slot.id} ${v}`).toBeTruthy();
    for (const s of prompted) expect(buildPrompt(s, "alt")).not.toBe(buildPrompt(s, "main"));
  });

  it("every slot shows a main and an alternative prompt — share images show their header's", () => {
    for (const x of imageSlots) {
      const p = slotPrompts(x, slotById);
      expect(p, x.id).not.toBeNull();
      expect(p!.main).not.toBe(p!.alt);
      if (x.deriveFrom) {
        expect(p!.from).toBe(x.deriveFrom);
        expect(p!.main).toBe(buildPrompt(slotById[x.deriveFrom], "main"));
      } else expect(p!.from).toBeNull();
    }
  });

  it("the contact slot has its own calm scenes with no office, studio or team", () => {
    for (const v of ["main", "alt"] as const) {
      const p = buildPrompt(slotById["contact-studio"], v)!;
      expect(p).toContain("Contact page");
      expect(p).toMatch(/real company's office, studio or team/); // in DO NOT INCLUDE
      expect(sceneBriefs["contact-studio"][v].people).toMatch(/^No people|^Nobody in the foreground/);
    }
  });

  it("the real-only safeguard still refuses to write a prompt (no slot uses it)", () => {
    expect(buildPrompt({ ...slotById["contact-studio"], type: "real-only" })).toBeNull();
  });

  it("does not write separate prompts for share images made from a page header", () => {
    for (const s of imageSlots.filter((x) => x.deriveFrom)) expect(buildPrompt(s)).toBeNull();
  });

  it("every prompt is 300–450 words", () => {
    for (const { slot, v, p } of all) {
      const n = wordCount(p!);
      expect(n, `${slot.id} ${v}: ${n} words`).toBeGreaterThanOrEqual(300);
      expect(n, `${slot.id} ${v}: ${n} words`).toBeLessThanOrEqual(450);
    }
  });

  it("every prompt has all 11 sections, in order", () => {
    for (const { slot, v, p } of all) {
      const positions = PROMPT_SECTIONS.map((h) => p!.indexOf(h));
      expect(positions.every((x) => x >= 0), `${slot.id} ${v} missing a section`).toBe(true);
      expect([...positions].sort((a, b) => a - b), `${slot.id} ${v} sections out of order`).toEqual(positions);
      expect(p!.startsWith("Create ONE photorealistic photograph")).toBe(true);
    }
  });

  it("every prompt has the brand colours, the exact size, the shared negatives and no placeholders", () => {
    for (const { slot, v, p } of all) {
      for (const hex of BRAND_HEX) expect(p, `${slot.id} ${v} ${hex}`).toContain(hex);
      expect(p).toContain("1536 × 1024 pixels");
      expect(p).toContain("3:2");
      expect(p).toContain("central 60%");
      expect(p).toContain(SHARED_NEGATIVES);
      expect(p, `${slot.id} ${v} has a placeholder`).not.toMatch(/[[\]{}]|\bTODO\b|\bundefined\b|\bnull\b/);
      expect(p).toMatch(/\d{4} K/); // colour temperature in Kelvin
      expect(p).toMatch(/\d+ mm lens, f\/\d/);
    }
  });

  it("the political leaders prompt carries the strict negatives", () => {
    const slot = slotById["industry-political-leaders-header"];
    for (const v of ["main", "alt"] as const) {
      const p = buildPrompt(slot, v)!;
      for (const n of ["party flags", "party colours", "symbols", "banners", "slogans", "posters", "rallies or crowds", "resemblance to a real politician"]) expect(p, n).toContain(n);
      expect(p).toContain("plain white kurta");
    }
  });

  it("scenes with no people say so, and none put people in the home, services or how-it-works images", () => {
    for (const id of ["home-hero", "services-header", "how-it-works-header"]) {
      for (const v of ["main", "alt"] as const) expect(sceneBriefs[id][v].people).toMatch(/^No people/);
    }
  });

  it("keeps the text side calm and the subject on the other side", () => {
    expect(buildPrompt(slotById["industry-schools-header"])).toContain("Keep the left third calm");
    expect(buildPrompt(slotById["home-hero"])).toContain("Keep the right third calm");
  });

  it("asks for a source big enough for every crop", () => {
    for (const s of imageSlots) {
      const need = requiredSource(s);
      const size = sourceSize(s);
      expect(size.width, s.id).toBeGreaterThanOrEqual(need.width);
      expect(size.height, s.id).toBeGreaterThanOrEqual(need.height);
    }
  });

  it("only has scene briefs for real slots", () => {
    for (const id of Object.keys(sceneBriefs)) expect(slotById[id]?.type, id).toBe("illustrative");
  });

  it("documents both prompts per slot and the review checklist", () => {
    const md = promptsMarkdown(imageSlots);
    for (const c of REVIEW_CHECKLIST) expect(md).toContain(c.label);
    for (const s of imageSlots) expect(md).toContain(`\`${s.id}\``);
    expect(md).not.toMatch(/real photo only|real-only/i);
    expect(md.match(/Made automatically from the header image/g)?.length).toBe(imageSlots.filter((x) => x.deriveFrom).length);
    for (const { p } of all) expect(md).toContain(p!);
  });

  it("docs/image-prompts.md is up to date (run npm run images:prompts)", () => {
    const file = readFileSync(join(process.cwd(), "docs", "image-prompts.md"), "utf8").replace(/\r\n/g, "\n");
    expect(file).toBe(promptsMarkdown(imageSlots));
  });
});
