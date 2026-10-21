/**
 * Plan drafts: an editable copy of a generated plan. Editors can change wording, time and date, remove items,
 * add custom items and reassign — but compliance notes always stay attached and unchanged.
 */
import type { Plan } from "@/lib/engine/types";
import type { DraftItem, PlanDraft } from "./types";

/** The editable draft for a generated plan (stable ids: day and position). */
export function draftFromPlan(plan: Plan): PlanDraft {
  const items: DraftItem[] = plan.days.flatMap((d) =>
    d.items.map((x, i) => ({
      id: `i${d.day}-${i}`,
      date: d.date,
      time: x.time,
      platform: x.platform,
      format: x.format,
      title: x.title,
      hook: x.hook ?? "",
      cta: x.cta ?? "",
      pillar: x.pillar ?? "",
      templateId: x.templateId,
      who: x.who ?? "",
      pinnedReason: x.pinnedReason ?? "",
      complianceNote: x.note ?? "",
      assignee: null,
      custom: false,
    })),
  );
  return {
    items,
    shoots: plan.shootDays.map((s) => ({ date: s.date, label: s.label, shots: s.shots })),
    compliance: plan.compliance ?? [],
  };
}

export type ItemPatch = Partial<Pick<DraftItem, "title" | "hook" | "cta" | "time" | "date" | "assignee">>;

const clip = (s: string, n: number) => s.slice(0, n);

/** Edit an item's wording, time, date or assignee. The compliance note can never be changed this way. */
export function updateItem(draft: PlanDraft, id: string, patch: ItemPatch): PlanDraft {
  return {
    ...draft,
    items: draft.items.map((x) =>
      x.id !== id
        ? x
        : {
            ...x,
            ...(patch.title !== undefined && { title: clip(patch.title, 200) }),
            ...(patch.hook !== undefined && { hook: clip(patch.hook, 500) }),
            ...(patch.cta !== undefined && { cta: clip(patch.cta, 200) }),
            ...(patch.time !== undefined && { time: clip(patch.time, 20) }),
            ...(patch.date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(patch.date) && { date: patch.date }),
            ...(patch.assignee !== undefined && { assignee: patch.assignee || null }),
          },
    ),
  };
}

export const moveItem = (draft: PlanDraft, id: string, date: string) => updateItem(draft, id, { date });

export const removeItem = (draft: PlanDraft, id: string): PlanDraft => ({ ...draft, items: draft.items.filter((x) => x.id !== id) });

/** Add a hand-made item (no compliance note of its own; the plan-level notes still apply). */
export function addCustomItem(draft: PlanDraft, item: Pick<DraftItem, "date" | "platform" | "format" | "title"> & Partial<Pick<DraftItem, "hook" | "cta" | "time">>): PlanDraft {
  const n = draft.items.filter((x) => x.custom).length + 1;
  let id = `c${n}`;
  for (let k = n; draft.items.some((x) => x.id === id); k++) id = `c${k + 1}`;
  const added: DraftItem = {
    id,
    date: item.date,
    time: item.time ?? "1:30 pm",
    platform: item.platform,
    format: item.format,
    title: clip(item.title, 200),
    hook: clip(item.hook ?? "", 500),
    cta: clip(item.cta ?? "", 200),
    pillar: "",
    templateId: "CUSTOM",
    who: "Oryza",
    pinnedReason: "",
    complianceNote: "",
    assignee: null,
    custom: true,
  };
  return { ...draft, items: [...draft.items, added] };
}

/**
 * Accept an edited draft from the browser safely: only allowed fields are taken from it. Compliance notes (per
 * item and for the plan) always come from the stored draft, so they cannot be removed or rewritten.
 */
export function mergeDraft(stored: PlanDraft, incoming: PlanDraft): PlanDraft {
  const known = new Map(stored.items.map((x) => [x.id, x]));
  const items: DraftItem[] = [];
  for (const x of incoming.items) {
    const prev = known.get(x.id);
    if (prev) {
      items.push(updateItem({ ...stored, items: [prev] }, prev.id, { title: x.title, hook: x.hook, cta: x.cta, time: x.time, date: x.date, assignee: x.assignee }).items[0]);
    } else if (x.custom && /^c\d+$/.test(x.id)) {
      items.push({ ...addCustomItem({ ...stored, items: [] }, x).items[0], id: x.id, assignee: x.assignee || null });
    }
  }
  return { items: items.sort((a, b) => a.date.localeCompare(b.date)), shoots: stored.shoots, compliance: stored.compliance };
}

/** Every compliance note in `before` is still attached, unchanged, in `after` (for items that still exist). */
export function complianceKept(before: PlanDraft, after: PlanDraft): boolean {
  if (JSON.stringify(before.compliance) !== JSON.stringify(after.compliance)) return false;
  const prev = new Map(before.items.map((x) => [x.id, x.complianceNote]));
  return after.items.every((x) => !prev.has(x.id) || prev.get(x.id) === x.complianceNote);
}
