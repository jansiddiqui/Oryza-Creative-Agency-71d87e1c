/**
 * Planner question model shared by every category: the plan builder renders its steps from these definitions.
 * Category question sets live in ./categories/* and load only when that category is chosen.
 */
import { categoryBySlug } from "@/data/categories";
import type { PlatformId } from "@/data/platforms";
import type { Plan } from "@/lib/engine/types";

export type Answers = Record<string, unknown>;
export interface Opt { id: string; label: string }
export type Options = readonly Opt[] | ((a: Answers) => readonly Opt[]);

export interface QBase {
  key: string;
  label: string;
  hint?: string;
  /** Shown only when this returns true. */
  when?: (a: Answers) => boolean;
  /** Half-width: consecutive half questions share a two-column row. */
  half?: boolean;
}

export type Question =
  | (QBase & { kind: "text"; required?: boolean; placeholder?: string })
  | (QBase & { kind: "date" })
  | (QBase & { kind: "choice"; name: string; options: Options })
  | (QBase & { kind: "multi"; options: Options; max?: number; /** The first pick is starred as the main one. */ star?: boolean })
  | (QBase & { kind: "events"; options: readonly Opt[]; defaultKind: string; withLabel?: string; max?: number })
  | (QBase & { kind: "list"; itemLabel: string; placeholder?: string; /** Lets the visitor add rows up to this many. */ max?: number })
  | (QBase & { kind: "group"; itemLabel: string; fields: GroupField[]; empty: Record<string, string>; max?: number })
  | (QBase & { kind: "platforms" })
  | (QBase & { kind: "optimize" })
  | (QBase & { kind: "package" });

/** One field inside a repeatable group (e.g. a project or a work-done fact). */
export interface GroupField {
  key: string;
  label: string;
  type: "text" | "date" | "choice";
  options?: readonly Opt[];
  placeholder?: string;
  /** Wide fields span the full row. */
  wide?: boolean;
}

export interface PlannerStep {
  id: string;
  title: string;
  questions: Question[];
}

export interface PlannerConfig {
  slug: string;
  /** Short name used in the progress label ("Schools · step 1 of 5"). */
  label: string;
  initial: Answers;
  steps: PlannerStep[];
  /** Key of the required name field. */
  nameKey: string;
  generate: (a: Answers, startDate: string) => Plan;
}

export const corePlatforms = (slug: string) => (Object.keys(categoryBySlug[slug].fit) as PlatformId[]).filter((p) => categoryBySlug[slug].fit[p] === "core");

export const stageQ: Question = { kind: "choice", key: "stage", label: "Your social media today", name: "Stage", options: [{ id: "new", label: "Not started" }, { id: "revive", label: "Page exists, rarely posts" }, { id: "active", label: "Posting regularly" }] };
export const shootOptions = (own: string) => [{ id: "1", label: "1 shoot day a month" }, { id: "2", label: "2 shoot days" }, { id: "weekly", label: "Weekly access" }, { id: "own", label: own }];
export const platformsQ = (who: string): Question => ({ kind: "platforms", key: "platforms", label: "Which platforms should we manage?", hint: `Core platforms for ${who} are pre-selected.` });
export const optimizeQ: Question = { kind: "optimize", key: "optimize", label: "Optimize these profiles first? (one-time, extra cost)" };
export const packageStep: PlannerStep = { id: "package", title: "How much content each month?", questions: [{ kind: "package", key: "pkg", label: "Package" }] };
export const yesNo = (yes: string, no: string) => [{ id: "yes", label: yes }, { id: "no", label: no }];
export const withDates = <T extends { events: { date: string }[] }>(a: T) => ({ ...a, events: a.events.filter((e) => e.date) });

export const consent3 = (label: string, hint: string): Question => ({ kind: "choice", key: "consent", label, name: "Consent", hint, options: [{ id: "yes", label: "Yes, written" }, { id: "some", label: "Some" }, { id: "no", label: "No" }] });
export const cameraQ = (label: string): Question => ({ kind: "choice", key: "onCamera", label, name: "On camera", options: [{ id: "all", label: "Yes" }, { id: "some", label: "Short clips only" }, { id: "none", label: "No — designs and voice-over" }] });

export const resolveOptions = (o: Options, a: Answers) => (typeof o === "function" ? o(a) : o);
