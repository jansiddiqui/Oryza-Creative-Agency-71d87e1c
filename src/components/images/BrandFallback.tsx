import type { ImageSlot } from "@/data/image-slots";
import { industryIcons, CalendarIcon, ChatIcon, StrategyIcon, WebsiteIcon, type IconComponent } from "@/components/icons";
import { frameClass } from "./frame";

const pageIcons: Record<string, IconComponent> = {
  home: StrategyIcon,
  services: StrategyIcon,
  platforms: WebsiteIcon,
  process: CalendarIcon,
  contact: ChatIcon,
};

/**
 * Shown while a slot has no approved image: a calm cream panel with a fine pattern of the gold "O" leaf
 * motif and the slot's icon. Decorative only (hidden from screen readers) and always in the wide crop,
 * so an empty slot stays modest on phones.
 */
export function BrandFallback({ slot, className = "" }: { slot: ImageSlot; className?: string }) {
  const Icon = (slot.icon && (industryIcons[slot.icon] ?? pageIcons[slot.icon])) || StrategyIcon;
  const pid = `leaf-${slot.id}`;
  return (
    <div aria-hidden className={`relative overflow-hidden bg-cream ${frameClass(slot, { wideOnly: true })} ${className}`}>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={pid} width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
            {/* The leaf from the Oryza "O": an almond outline with its midrib. */}
            <path d="M28 10c8 6 9 18 0 34-9-16-8-28 0-34z" fill="none" stroke="#b9811a" strokeOpacity="0.22" strokeWidth="1" />
            <path d="M28 14v28" stroke="#b9811a" strokeOpacity="0.16" strokeWidth="0.8" />
          </pattern>
          <radialGradient id={`${pid}-fade`} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#f3ede0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f3ede0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
        <rect width="100%" height="100%" fill={`url(#${pid}-fade)`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full border border-gold-500/40 bg-paper/80 text-ink">
          <Icon size={44} accent />
        </span>
      </div>
    </div>
  );
}
