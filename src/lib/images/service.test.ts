import sharp from "sharp";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { slotById } from "@/data/image-slots";
import { REVIEW_CHECKLIST } from "@/lib/image-prompts";
import type { Admin, AuditAction } from "@/lib/admin/types";
import { memoryStore } from "./memory-store";
import { approve, completeUpload, deleteVersion, ImageError, removeLive, rollback, setFocal, startUpload, type Deps } from "./service";
import { renderSlotImages } from "./process";
import { checkUpload } from "./validate";

const admin: Admin = { email: "editor@oryza.test", role: "editor" };
const allTicked = Object.fromEntries(REVIEW_CHECKLIST.map((c) => [c.id, true]));

async function image(w: number, h: number, format: "jpeg" | "png" = "jpeg") {
  return sharp({ create: { width: w, height: h, channels: 3, background: "#8f5e0a" } })
    .withMetadata({ exif: { IFD0: { Artist: "private-camera-owner" } } })
    [format]()
    .toBuffer();
}

let store: ReturnType<typeof memoryStore>;
let deps: Deps;
let log: { action: AuditAction; target: string }[];

async function upload(slotId: string, source = "ai-illustrative", w = 1536, h = 1024) {
  const { path } = await startUpload(deps, admin, slotId, "image/jpeg");
  store.originals.set(path, await image(w, h));
  return completeUpload(deps, admin, { slotId, path, source });
}

beforeEach(() => {
  store = memoryStore();
  log = [];
  deps = { repo: store.repo, files: store.files, audit: async (_a, action, target) => void log.push({ action, target }) };
});

describe("upload validation", () => {
  const slot = slotById["industry-schools-header"];
  it("accepts a 3:2 landscape at 1536×1024", () => {
    expect(checkUpload(slot, { mime: "image/png", bytes: 2e6, width: 1536, height: 1024 })).toEqual([]);
  });
  it("rejects other file types, oversize files and images too small for a crop", () => {
    expect(checkUpload(slot, { mime: "image/gif", bytes: 1e5, width: 1536, height: 1024 })[0]).toMatch(/JPG, PNG or WebP/);
    expect(checkUpload(slot, { mime: "image/jpeg", bytes: 30e6, width: 1536, height: 1024 })[0]).toMatch(/limit is 25 MB/);
    expect(checkUpload(slot, { mime: "image/jpeg", bytes: 1e5, width: 800, height: 600 }).join(" ")).toMatch(/Too small for the 16:9 crop/);
  });
  it("rejects the wrong shape (a tall portrait for a landscape header)", () => {
    expect(checkUpload(slot, { mime: "image/jpeg", bytes: 1e5, width: 1400, height: 4200 }).join(" ")).toMatch(/Wrong shape/);
  });
  it("re-checks the real file on the server and removes rejected uploads", async () => {
    await expect(upload("industry-schools-header", "ai-illustrative", 900, 600)).rejects.toThrow(ImageError);
    expect(store.originals.size).toBe(0);
    expect(store.rows.size).toBe(0);
  });
  it("refuses paths outside the slot's folder", async () => {
    await expect(completeUpload(deps, admin, { slotId: "home-hero", path: "contact-studio/x.jpg", source: "ai-illustrative" })).rejects.toThrow(/does not belong/);
  });
});

describe("real-only enforcement (safeguard; no live slot uses it, so a test slot is registered here)", () => {
  beforeAll(() => {
    slotById["test-real-only"] = { ...slotById["contact-studio"], id: "test-real-only", type: "real-only" };
  });
  afterAll(() => {
    delete slotById["test-real-only"];
  });

  it("rejects an AI image for a real-only slot (server side) and deletes the upload", async () => {
    await expect(upload("test-real-only", "ai-illustrative", 1536, 1152)).rejects.toThrow(/only a real photo/);
    expect(store.rows.size).toBe(0);
    expect(store.originals.size).toBe(0);
  });
  it("accepts a real photo there, and real photos on every normal slot", async () => {
    expect((await upload("contact-studio", "real", 1536, 1152)).source).toBe("real");
    expect((await upload("home-hero", "real")).source).toBe("real");
    const v = await upload("test-real-only", "real", 1536, 1152);
    expect(v.source).toBe("real");
  });
  it("refuses approval if a real-only row was tampered to AI", async () => {
    const v = await upload("test-real-only", "real", 1536, 1152);
    await store.repo.update(v.id, { source: "ai-illustrative" });
    await expect(approve(deps, admin, v.id, allTicked)).rejects.toThrow(/only a real photo/);
  });
});

describe("crop and size generation", () => {
  it("makes AVIF + WebP for every crop and width, never upscaled, metadata stripped", async () => {
    const { files, aspects } = await renderSlotImages(await image(1536, 1024), slotById["industry-schools-header"], { x: 0.6, y: 0.5 }, 3);
    expect(aspects["16x9"]!.variants.map((v) => [v.w, v.h])).toEqual([[640, 360], [960, 540], [1280, 720]]);
    expect(aspects["4x5"]!.variants.map((v) => [v.w, v.h])).toEqual([[480, 600], [640, 800]]);
    expect(files).toHaveLength(10);
    expect(files.every((f) => f.path.startsWith("slots/industry-schools-header/v3/"))).toBe(true);
    const webp = files.find((f) => f.path.endsWith("16x9-1280.webp"))!;
    const meta = await sharp(webp.body).metadata();
    expect([meta.format, meta.width, meta.height, Boolean(meta.exif)]).toEqual(["webp", 1280, 720, false]);
    expect(aspects["16x9"]!.blurDataURL).toMatch(/^data:image\/webp;base64,/);
  });
  it("makes the 1200×630 share image", async () => {
    const { aspects } = await renderSlotImages(await image(1536, 1024), slotById["industry-schools-og"], { x: 0.5, y: 0.5 }, 1);
    expect(aspects.og!.variants.map((v) => [v.w, v.h])).toEqual([[1200, 630]]);
  });
});

describe("approve, replace, rollback, remove, delete", () => {
  it("cannot approve until every checklist item is ticked", async () => {
    const v = await upload("home-hero");
    await expect(approve(deps, admin, v.id, { ...allTicked, hands: false })).rejects.toThrow(/Tick every review item/);
    expect((await store.repo.get(v.id))!.status).toBe("uploaded");
  });

  it("approve publishes files and goes live; a second approval replaces it; rollback restores the first", async () => {
    const v1 = await upload("home-hero");
    expect(await approve(deps, admin, v1.id, allTicked)).toEqual(["/"]);
    expect((await store.repo.get(v1.id))!.status).toBe("live");
    expect([...store.publicFiles.keys()].some((k) => k.startsWith("slots/home-hero/v1/"))).toBe(true);

    const v2 = await upload("home-hero");
    await approve(deps, admin, v2.id, allTicked);
    expect((await store.repo.get(v1.id))!.status).toBe("archived");
    expect((await store.repo.get(v2.id))!.status).toBe("live");

    await rollback(deps, admin, v1.id);
    expect((await store.repo.get(v1.id))!.status).toBe("live");
    expect((await store.repo.get(v2.id))!.status).toBe("archived");
    expect(log.map((l) => l.action)).toEqual(["image.upload", "image.approve", "image.upload", "image.replace", "image.rollback"]);
  });

  it("cannot roll back to an upload that was never approved", async () => {
    const v = await upload("home-hero");
    await expect(rollback(deps, admin, v.id)).rejects.toThrow(/earlier approved version/);
  });

  it("remove takes the image off (fallback shows) but keeps versions; delete only works when not live", async () => {
    const v = await upload("home-hero");
    await approve(deps, admin, v.id, allTicked);
    await expect(deleteVersion(deps, admin, v.id)).rejects.toThrow(/Remove or replace/);
    await removeLive(deps, admin, "home-hero");
    expect((await store.repo.listVersions("home-hero")).some((x) => x.status === "live")).toBe(false);
    await deleteVersion(deps, admin, v.id);
    expect(store.rows.size).toBe(0);
    expect([...store.publicFiles.keys()].filter((k) => k.startsWith("slots/home-hero/"))).toEqual([]);
    expect(store.originals.size).toBe(0);
  });

  it("approving an industry header also publishes its share image (unless that has its own)", async () => {
    const v = await upload("industry-schools-header");
    expect(await approve(deps, admin, v.id, allTicked)).toEqual(["/industries/schools"]);
    const og = await store.repo.listVersions("industry-schools-og");
    expect(og.map((x) => [x.status, x.derivedFrom])).toEqual([["live", v.id]]);
  });

  it("focal point can change only before approval", async () => {
    const v = await upload("home-hero");
    await setFocal(deps, admin, v.id, { x: 0.2, y: 2 });
    expect((await store.repo.get(v.id))!.focal).toEqual({ x: 0.2, y: 1 });
    await approve(deps, admin, v.id, allTicked);
    await expect(setFocal(deps, admin, v.id, { x: 0.5, y: 0.5 })).rejects.toThrow(/before approval/);
  });
});
