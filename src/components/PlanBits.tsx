import type { PlatformId } from "@/data/platforms";
import type { PlanDay, PlanItem } from "@/lib/engine/types";
import { fmtDate } from "@/lib/engine/dates";
import { CameraIcon, PlatformIcon } from "@/components/icons";

export const platformMeta: Record<PlatformId, { short: string; dot: string }> = {
  instagram: { short: "Instagram", dot: "#C13584" },
  facebook: { short: "Facebook", dot: "#1877F2" },
  whatsapp: { short: "WhatsApp", dot: "#1FA855" },
  youtube: { short: "YouTube", dot: "#E62117" },
  gbp: { short: "Google", dot: "#4285F4" },
  website: { short: "Website", dot: "#8F5E0A" },
  linkedin: { short: "LinkedIn", dot: "#0A66C2" },
  x: { short: "X", dot: "#13201C" },
  pinterest: { short: "Pinterest", dot: "#BD081C" },
};

const formatLabel: Record<string, string> = {
  reel: "Reel", post: "Post", story: "Story", broadcast: "Broadcast", status: "Status", short: "Short",
  video: "Video", blog: "Update", gpost: "Update", event: "Event", pin: "Pins",
};

export function ItemRow({ item, compact }: { item: PlanItem; compact?: boolean }) {
  const m = platformMeta[item.platform];
  return (
    <li className="flex gap-3 py-2.5">
      <PlatformIcon id={item.platform} size={16} className="mt-0.5 text-ink-soft" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug">
          <span className="font-semibold">{m.short} {formatLabel[item.format] ?? item.format}</span>
          <span className="text-muted"> · {item.time}</span>
          {item.pinnedReason && !compact && (
            <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700">
              {item.pinnedReason}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[15px] font-medium leading-snug text-ink">{item.title}</p>
        {!compact && item.hook && <p className="mt-0.5 text-[13px] leading-snug text-muted">{item.hook}</p>}
        {!compact && (item.who || item.cta) && (
          <p className="mt-1 text-[12px] text-muted">
            {item.who && <>By: {item.who}</>}
            {item.who && item.cta && " · "}
            {item.cta && <>CTA: {item.cta}</>}
          </p>
        )}
      </div>
    </li>
  );
}

export function DayCard({ day, compact, headingLevel = 3 }: { day: PlanDay; compact?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="break-inside-avoid rounded-2xl border border-line bg-paper p-5">
      <header className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <H className="font-display text-xl">Day {day.day}</H>
        <p className="text-sm text-muted">
          {day.weekday}, {fmtDate(day.date)}
        </p>
      </header>
      {day.shoot && (
        <div className="mt-3 rounded-xl bg-ink px-4 py-3 text-paper">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-300"><CameraIcon size={16} />{day.shoot.label}</p>
          {!compact && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[13px] text-paper/80">
              {day.shoot.shots.map((s) => <li key={s}>{s}</li>)}
            </ul>
          )}
        </div>
      )}
      <ul className="divide-y divide-line/70">
        {day.items.map((it, i) => <ItemRow key={i} item={it} compact={compact} />)}
      </ul>
    </article>
  );
}
