import type { CSSProperties } from "react";

/** Stagger helper for grids and infographic parts: `style={revealDelay(i)}`. Capped so long lists never feel slow. */
export function revealDelay(i: number, step = 70, max = 8): CSSProperties {
  return { ["--reveal-delay" as string]: `${Math.min(i, max) * step}ms` } as CSSProperties;
}
