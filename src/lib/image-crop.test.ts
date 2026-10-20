import { describe, expect, it } from "vitest";
import { focalCrop, outputWidths, parseInboxName } from "./image-crop";

describe("focalCrop", () => {
  it("takes the largest 16:9 area from a 3:2 source, centred by default", () => {
    expect(focalCrop(1536, 1024, [16, 9])).toEqual({ left: 0, top: 80, width: 1536, height: 864 });
  });

  it("takes a 4:5 portrait from a landscape source at the focal point", () => {
    const r = focalCrop(1536, 1024, [4, 5], { x: 0.6, y: 0.5 });
    expect(r).toMatchObject({ width: 819, height: 1024, top: 0 });
    expect(r.left).toBe(Math.round(0.6 * 1536 - 819 / 2));
  });

  it("clamps the crop inside the image when the focal point is near an edge", () => {
    expect(focalCrop(1536, 1024, [4, 5], { x: 0, y: 0 }).left).toBe(0);
    expect(focalCrop(1536, 1024, [4, 5], { x: 1, y: 1 })).toMatchObject({ left: 1536 - 819, top: 0 });
  });

  it("handles the 1200×630 share image ratio", () => {
    expect(focalCrop(1536, 1024, [1200, 630])).toEqual({ left: 0, top: 109, width: 1536, height: 806 });
  });
});

describe("outputWidths", () => {
  it("never upscales", () => {
    expect(outputWidths(1536, [640, 960, 1280, 1600])).toEqual([640, 960, 1280]);
    expect(outputWidths(500, [640, 960])).toEqual([500]);
  });
});

describe("parseInboxName", () => {
  it("reads slot ids, optional aspect and extension", () => {
    expect(parseInboxName("industry-schools-header.png")).toEqual({ slotId: "industry-schools-header", aspect: undefined, ext: "png" });
    expect(parseInboxName("home-hero@4x5.JPG")).toEqual({ slotId: "home-hero", aspect: "4x5", ext: "jpg" });
    expect(parseInboxName("notes.txt")).toBeNull();
    expect(parseInboxName("../evil.png")).toBeNull();
  });
});
