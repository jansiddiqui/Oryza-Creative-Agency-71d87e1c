/** Pure crop maths for the image pipeline (tested in image-crop.test.ts). */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Largest rectangle of the target ratio that fits in the source, centred on the focal point (0–1)
 * and clamped to the source edges.
 */
export function focalCrop(srcW: number, srcH: number, ratio: [number, number], focal = { x: 0.5, y: 0.5 }): Rect {
  const target = ratio[0] / ratio[1];
  let width = srcW;
  let height = Math.round(srcW / target);
  if (height > srcH) {
    height = srcH;
    width = Math.round(srcH * target);
  }
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  const left = clamp(Math.round(focal.x * srcW - width / 2), srcW - width);
  const top = clamp(Math.round(focal.y * srcH - height / 2), srcH - height);
  return { left, top, width, height };
}

/** Output widths for a crop: every requested width that fits, never upscaled; the crop width itself is the cap. */
export function outputWidths(cropWidth: number, widths: number[]): number[] {
  const fit = widths.filter((w) => w <= cropWidth);
  return fit.length ? fit : [cropWidth];
}
