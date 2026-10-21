import type { ReactNode } from "react";
import { platformById, type PlatformId } from "@/data/platforms";
import { fmtDate, weekdayName } from "@/lib/engine/dates";
import { CATEGORY_LABELS } from "@/lib/ops/categories";
import { ITEM_STAGES, TASK_STATUSES, type ItemStage, type TaskStatus } from "@/lib/ops/types";

/** Shared bits for the client operations screens (calendar, Today, clients, plan editor). */
export const field = "rounded-lg border border-line bg-paper px-3 py-2 text-[14px]";
export const btn = "inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper disabled:opacity-40";
export const btnGhost = "inline-flex items-center justify-center rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink disabled:opacity-40";
export const btnSmall = "rounded-full border border-ink/20 px-3 py-1 text-[12px] font-semibold hover:border-ink disabled:opacity-40";

export const catLabel = (slug: string) => CATEGORY_LABELS[slug] ?? slug;
export const fmtDay = (iso: string) => `${weekdayName(iso)} ${fmtDate(iso)}`;
export const formatLabel = (f: string) => (f === "gpost" ? "Google post" : f.charAt(0).toUpperCase() + f.slice(1));
export const stageLabel = (s: ItemStage) => ITEM_STAGES.find((x) => x.id === s)?.label ?? s;
export const taskStatusLabel = (s: TaskStatus) => TASK_STATUSES.find((x) => x.id === s)?.label ?? s;

export function ClientDot({ colour, size = 10 }: { colour: string; size?: number }) {
  return <span aria-hidden="true" className="inline-block shrink-0 rounded-full" style={{ background: colour, width: size, height: size }} />;
}

/* Compact platform marks for dense admin views (kept apart from the public icon set so no public chunk changes). */
const MARK: Record<PlatformId, { t: string; bg: string }> = {
  instagram: { t: "IG", bg: "#8a3d6b" },
  facebook: { t: "FB", bg: "#2d5f8b" },
  whatsapp: { t: "WA", bg: "#2f6b4f" },
  youtube: { t: "YT", bg: "#a33d3d" },
  gbp: { t: "G", bg: "#5b4a8a" },
  website: { t: "W", bg: "#3d7a7a" },
  linkedin: { t: "in", bg: "#2d5f8b" },
  x: { t: "X", bg: "#1f1f1f" },
  pinterest: { t: "P", bg: "#a33d3d" },
};

export function PlatformGlyph({ platform, size = 14 }: { platform: PlatformId; size?: number }) {
  const m = MARK[platform];
  if (!m) return null;
  return (
    <abbr title={platformById[platform]?.name ?? platform} className="inline-flex shrink-0 items-center justify-center rounded-[4px] font-sans font-bold text-white no-underline" style={{ background: m.bg, minWidth: size + 6, height: size + 2, padding: "0 2px", fontSize: Math.max(8, Math.round(size * 0.62)), lineHeight: 1 }}>
      {m.t}
    </abbr>
  );
}

const stageTone: Record<ItemStage, string> = {
  planned: "border border-line text-muted",
  in_production: "bg-gold-100 text-gold-700",
  client_review: "border border-gold-500/60 text-gold-700",
  approved: "bg-cream text-ink",
  scheduled: "border border-ink/30 text-ink",
  published: "bg-ink text-paper",
  done: "bg-ink text-paper",
};

export function StageBadge({ stage }: { stage: ItemStage }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageTone[stage]}`}>{stageLabel(stage)}</span>;
}

const taskTone: Record<TaskStatus, string> = {
  todo: "border border-line text-muted",
  in_progress: "bg-gold-100 text-gold-700",
  done: "bg-ink text-paper",
  blocked: "border border-red-800/40 bg-red-50 text-red-900",
};

export function TaskBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${taskTone[status]}`}>{taskStatusLabel(status)}</span>;
}

export function Section({ title, count, children, id }: { title: string; count?: number; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id ? `${id}-h` : undefined} className="mb-8">
      <h2 id={id ? `${id}-h` : undefined} className="mb-3 flex items-baseline gap-2 font-display text-xl">
        {title}
        {count !== undefined && <span className="font-sans text-[14px] font-semibold text-muted">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-xl border border-dashed border-line px-4 py-3 text-[14px] text-muted">{children}</p>;
