import { afterEach, describe, expect, it, vi } from "vitest";

const row = {
  slot_id: "home-hero",
  version: 3,
  source: "ai-illustrative",
  focal_x: 0.4,
  focal_y: 0.55,
  aspects: { "16x9": { width: 1536, height: 864, blurDataURL: "x", variants: [{ w: 640, h: 360, avif: "slots/home-hero/v3/16x9-640.avif", webp: "slots/home-hero/v3/16x9-640.webp" }] } },
  approved_at: "2026-10-20T00:00:00Z",
};

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("./live");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const configured = { NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key" };

describe("live images for the public site", () => {
  it("reads only live rows with the public key, cached under the slot-images tag", async () => {
    const { fetchLiveImages, LIVE_IMAGES_TAG } = await load(configured);
    const fetcher = vi.fn(async () => new Response(JSON.stringify([row]), { status: 200 }));
    const live = await fetchLiveImages(fetcher as unknown as typeof fetch);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit & { next: { tags: string[] } }];
    expect(url).toContain("/rest/v1/slot_images?");
    expect(url).toContain("status=eq.live");
    expect(url).not.toContain("original_path");
    expect((init.headers as Record<string, string>).apikey).toBe("anon-key");
    expect(init.next.tags).toEqual([LIVE_IMAGES_TAG]);
    expect(live.get("home-hero")).toMatchObject({ version: 3, focal: { x: 0.4, y: 0.55 } });
  });

  it("never breaks the site: errors, timeouts and missing config all mean 'no images' (brand fallback)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchLiveImages } = await load(configured);
    expect((await fetchLiveImages((async () => new Response("down", { status: 503 })) as unknown as typeof fetch)).size).toBe(0);
    expect((await fetchLiveImages((async () => { throw new Error("timeout"); }) as unknown as typeof fetch)).size).toBe(0);
    const unconfigured = await load({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" });
    const never = vi.fn();
    expect((await unconfigured.fetchLiveImages(never as unknown as typeof fetch)).size).toBe(0);
    expect(never).not.toHaveBeenCalled();
  });

  it("picks the smallest file that is wide enough", async () => {
    const { pickVariant } = await load(configured);
    const v = [640, 960, 1280].map((w) => ({ w, h: w, avif: `${w}.avif`, webp: `${w}.webp` }));
    expect(pickVariant(v, 700).w).toBe(960);
    expect(pickVariant(v, 3000).w).toBe(1280);
  });
});
