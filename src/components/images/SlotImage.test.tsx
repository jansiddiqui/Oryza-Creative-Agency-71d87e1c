import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { slotById } from "@/data/image-slots";
import type { LiveImage } from "@/lib/images/types";

vi.mock("@/lib/images/live", async (orig) => ({ ...(await orig<typeof import("@/lib/images/live")>()), getLiveImage: vi.fn(async () => null) }));
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");

const { getLiveImage } = await import("@/lib/images/live");
const { SlotImage, SlotPicture } = await import("./SlotImage");

const v = (aspect: string, w: number, h: number) => ({ w, h, avif: `slots/x/v1/${aspect}-${w}.avif`, webp: `slots/x/v1/${aspect}-${w}.webp` });

const entry: LiveImage = {
  slotId: "industry-schools-header",
  version: 1,
  source: "ai-illustrative",
  focal: { x: 0.6, y: 0.5 },
  aspects: {
    "16x9": { width: 1536, height: 864, blurDataURL: "data:image/webp;base64,AAA", variants: [v("16x9", 640, 360), v("16x9", 1280, 720)] },
    "4x5": { width: 819, height: 1024, blurDataURL: "data:image/webp;base64,BBB", variants: [v("4x5", 480, 600), v("4x5", 640, 800)] },
  },
  approvedAt: "2026-10-20T00:00:00Z",
};

afterEach(() => vi.mocked(getLiveImage).mockReset());

const render = async (el: Promise<React.ReactNode> | React.ReactNode) => renderToStaticMarkup(<>{await el}</>);

describe("SlotImage", () => {
  it("renders a live image as an art-directed picture: AVIF + WebP from storage, portrait on phones, lazy, blur", () => {
    const html = renderToStaticMarkup(<SlotPicture slot={slotById["industry-schools-header"]} entry={entry} sizes="50vw" />);
    expect(html).toContain("<picture");
    expect(html).toContain('media="(max-width: 767px)" type="image/avif"');
    expect(html).toContain("https://demo.supabase.co/storage/v1/object/public/site-images/slots/x/v1/4x5-480.avif");
    expect(html).toContain("/site-images/slots/x/v1/16x9-1280.avif");
    expect(html).toContain(`alt="${slotById["industry-schools-header"].alt}"`);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("data:image/webp;base64,AAA");
    expect(html).toContain("object-position:60% 50%");
  });

  it("loads hero images eagerly when marked priority", () => {
    expect(renderToStaticMarkup(<SlotPicture slot={slotById["industry-schools-header"]} entry={entry} sizes="50vw" priority />)).not.toContain('loading="lazy"');
  });

  it("shows the live image when there is one", async () => {
    vi.mocked(getLiveImage).mockResolvedValue(entry);
    expect(await render(SlotImage({ slot: "industry-schools-header" }))).toContain("<picture");
  });

  it("shows the brand fallback (never a broken image) for an empty slot that allows it", async () => {
    const html = await render(SlotImage({ slot: "industry-schools-header" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<pattern");
    expect(html).not.toContain("<img");
  });

  it("renders nothing for an empty slot without a fallback (e.g. the real-only team photo)", async () => {
    expect(await render(SlotImage({ slot: "contact-studio" }))).toBe("");
  });

  it("rejects unknown slot ids", async () => {
    await expect(SlotImage({ slot: "nope" })).rejects.toThrow(/Unknown image slot/);
  });
});
