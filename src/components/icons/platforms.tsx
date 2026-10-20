import type { PlatformId } from "@/data/platforms";
import { ACCENT, icon, type IconComponent, type IconProps } from "./Icon";

/*
 * Simple line glyphs that hint at each platform without copying its trademarked logo.
 * They describe the platform next to its written name; they are never used as the only label.
 */

export const InstagramIcon = icon(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7h.01" strokeWidth={2.2} stroke={ACCENT} />
  </>,
);

export const FacebookIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 7.5h-1.3a2 2 0 0 0-2 2V21" />
    <path d="M9 13h5" stroke={ACCENT} />
  </>,
);

export const WhatsAppIcon = icon(
  <>
    <path d="M20.5 12A8.5 8.5 0 0 1 8.2 19.6L3.5 20.5l1-4.5A8.5 8.5 0 1 1 20.5 12z" />
    <path d="M9.2 8.5c0 3.4 2.9 6.3 6.3 6.3l.9-1.6-2-1-1 .9a4.3 4.3 0 0 1-2.4-2.4l.9-1-1-2z" stroke={ACCENT} />
  </>,
);

export const YouTubeIcon = icon(
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10 9.3v5.4l4.6-2.7z" stroke={ACCENT} />
  </>,
);

export const GoogleBusinessIcon = icon(
  <>
    <path d="M4.5 10.5v9a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-9" />
    <path d="M3 7.5L4.5 3h15L21 7.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
    <path d="M10 21v-4.5h4V21" stroke={ACCENT} />
  </>,
);

export const WebsiteIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" stroke={ACCENT} />
  </>,
);

export const LinkedInIcon = icon(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5v6M8 7.5h.01" />
    <path d="M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5" stroke={ACCENT} />
  </>,
);

export const XIcon = icon(
  <>
    <path d="M4.5 4h4l11 16h-4z" />
    <path d="M19.5 4l-6.2 7M10.7 13l-6.2 7" stroke={ACCENT} />
  </>,
);

export const PinterestIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M11.8 9.5L9.8 20.5" />
    <path d="M11 15c.5.4 1.2.6 1.9.6 2.2 0 3.6-1.8 3.6-4a4.5 4.5 0 0 0-9 .4c0 .8.2 1.5.6 2" stroke={ACCENT} />
  </>,
);

export const platformIcons: Record<PlatformId, IconComponent> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  whatsapp: WhatsAppIcon,
  youtube: YouTubeIcon,
  gbp: GoogleBusinessIcon,
  website: WebsiteIcon,
  linkedin: LinkedInIcon,
  x: XIcon,
  pinterest: PinterestIcon,
};

/** Icon for a platform id. */
export function PlatformIcon({ id, ...props }: { id: PlatformId } & IconProps) {
  const Icon = platformIcons[id];
  return <Icon {...props} />;
}
