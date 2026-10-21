import type { ReactNode } from "react";
import { platformById, type PlatformId } from "@/data/platforms";
import { fmtDate, weekdayName } from "@/lib/engine/dates";
import { CATEGORY_LABELS } from "@/lib/ops/categories";
import { ITEM_STAGES, TASK_STATUSES, type ItemStage, type TaskStatus } from "@/lib/ops/types";

/*
 * Admin design system: shared class names and small components (docs/admin-ux-audit.md §3).
 * Touch layouts get 44 px targets and 16 px fields; desktop is a little denser.
 */
export const field = "min-h-11 rounded-lg border border-edge-strong bg-surface px-3 py-2 text-base text-ink md:min-h-10 md:text-[14px]";
/** Primary: one per view. */
export const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-[14px] font-semibold text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10";
/** Secondary: white with a strong border. */
export const btnGhost = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-edge-strong bg-surface px-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10";
/** Small secondary (32 px on desktop, still 44 px on touch). */
export const btnSmall = "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-edge-strong bg-surface px-3 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-8 md:text-[13px]";
/** Text-only button. */
export const btnText = "inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50 md:min-h-8 md:text-[13px]";
export const btnDanger = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-bad px-4 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50 md:min-h-10";
export const card = "rounded-xl border border-edge bg-surface";
export const label = "block text-[13px] font-semibold text-text-2";

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

export type Tone = "ok" | "warn" | "bad" | "info" | "violet" | "neutral" | "ink" | "gold";
const TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  violet: "bg-violet-bg text-violet",
  neutral: "bg-neutral-bg text-neutral",
  ink: "bg-[#e8e6e0] text-ink",
  gold: "bg-gold-100 text-gold-700",
};

/** The one badge: a tone, a label, and (by default) a dot so meaning never rests on colour alone. */
export function Badge({ tone = "neutral", children, dot = true, title }: { tone?: Tone; children: ReactNode; dot?: boolean; title?: string }) {
  return (
    <span title={title} className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[12px] font-semibold ${TONE[tone]}`}>
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export const STAGE_TONE: Record<ItemStage, Tone> = { planned: "neutral", in_production: "info", client_review: "warn", approved: "ok", scheduled: "violet", published: "ink", done: "ink" };
export const TASK_TONE: Record<TaskStatus, Tone> = { todo: "neutral", in_progress: "info", done: "ok", blocked: "bad" };

export function StageBadge({ stage }: { stage: ItemStage }) {
  return <Badge tone={STAGE_TONE[stage]}>{stageLabel(stage)}</Badge>;
}

export function TaskBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_TONE[status]}>{taskStatusLabel(status)}</Badge>;
}

export function Section({ title, count, children, id, action }: { title: string; count?: number; children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <section aria-labelledby={id ? `${id}-h` : undefined} className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={id ? `${id}-h` : undefined} className="flex items-baseline gap-2 font-display text-[18px] leading-6">
          {title}
          {count !== undefined && <span className="font-sans text-[13px] font-semibold text-muted tabular-nums">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Empty state: what's empty, why, and (optionally) the next step. */
export function Empty({ children, title, action }: { children?: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-edge-strong/60 bg-surface/60 px-4 py-6 text-center text-[14px] text-muted">
      {title && <p className="mb-1 text-[15px] font-semibold text-ink">{title}</p>}
      {children}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

/** Loading placeholder with the final size (no layout shift). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-shimmer rounded-md bg-[linear-gradient(90deg,#ece9e2_25%,#f4f2ed_37%,#ece9e2_63%)] bg-[length:400%_100%] ${className}`} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-[5px] border border-b-2 border-edge bg-surface px-1.5 font-sans text-[11px] font-semibold text-muted">{children}</kbd>;
}
