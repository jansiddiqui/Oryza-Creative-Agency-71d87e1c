import type { CSSProperties, ReactNode } from "react";

export type IconProps = {
  /** Rendered size in px (the drawing grid is always 24). */
  size?: number;
  /** Paint the icon's accent strokes in brand gold instead of currentColor. */
  accent?: boolean;
  /** Accessible name. Without it the icon is decorative and hidden from screen readers. */
  title?: string;
  className?: string;
};

export type IconComponent = (props: IconProps) => ReactNode;

/** Stroke for the secondary/accent parts of an icon: gold when `accent` is on, otherwise the text colour. */
export const ACCENT = "var(--icon-accent, currentColor)";

/**
 * Shared frame for every Oryza icon: 24px grid, 1.5px stroke, round caps and joins, currentColor.
 * Accent paths use `stroke={ACCENT}` so they turn gold when `accent` is set.
 */
export function Svg({ size = 24, accent, title, className = "", children }: IconProps & { children: ReactNode }) {
  const style = accent ? ({ "--icon-accent": "var(--color-gold-500)" } as CSSProperties) : undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={`oz-icon shrink-0 ${className}`}
      style={style}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Builds an icon component from its drawing. */
export function icon(draw: ReactNode): IconComponent {
  const C = (props: IconProps) => <Svg {...props}>{draw}</Svg>;
  return C;
}
