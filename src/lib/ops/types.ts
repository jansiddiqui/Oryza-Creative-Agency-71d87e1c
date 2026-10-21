/** Shared types for client operations (clients, plans, content items, tasks, shoots). Pure — no server code. */
import type { PlatformId } from "@/data/platforms";

export type ClientStatus = "onboarding" | "active" | "paused" | "ended";
export type PlanStatus = "draft" | "approved";
export type ItemStage = "planned" | "in_production" | "client_review" | "approved" | "scheduled" | "published" | "done";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TeamRole = "strategist" | "designer" | "shooter" | "editor" | "community";
export type ShootStatus = "planned" | "done" | "cancelled";

export const CLIENT_STATUSES: { id: ClientStatus; label: string }[] = [
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "ended", label: "Ended" },
];

export const ITEM_STAGES: { id: ItemStage; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "in_production", label: "In production" },
  { id: "client_review", label: "With client" },
  { id: "approved", label: "Client approved" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "done", label: "Done" },
];

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

export const TEAM_ROLES: { id: TeamRole; label: string }[] = [
  { id: "strategist", label: "Strategist" },
  { id: "designer", label: "Designer" },
  { id: "shooter", label: "Shooter" },
  { id: "editor", label: "Editor" },
  { id: "community", label: "Community manager" },
];

/** Calendar colours for clients (readable on paper, distinct from each other). */
export const CLIENT_COLOURS = ["#8f5e0a", "#2f6b4f", "#5b4a8a", "#a33d3d", "#2d5f8b", "#7a5c1e", "#3d7a7a", "#8a3d6b", "#4f6b2f", "#6b4a2f"];

/** One editable calendar item in a plan draft. The compliance note is copied from the plan and read-only. */
export interface DraftItem {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** "8:30 pm" style, as the engine writes it. */
  time: string;
  platform: PlatformId;
  format: string;
  title: string;
  hook: string;
  cta: string;
  pillar: string;
  templateId: string;
  who: string;
  pinnedReason: string;
  /** Compliance note from the plan: kept with the item, never editable or removable. */
  complianceNote: string;
  assignee: string | null;
  /** Added by hand in the editor (not from the engine). */
  custom: boolean;
}

export interface DraftShoot {
  date: string;
  label: string;
  shots: string[];
}

/** The editable copy of a generated plan. Plan-level compliance notes are read-only. */
export interface PlanDraft {
  items: DraftItem[];
  shoots: DraftShoot[];
  compliance: string[];
}

/** One step worked back from the publish date. */
export interface DeadlineRule {
  format: string;
  step: string;
  label: string;
  /** Days relative to the publish date (negative = before). */
  offset: number;
  time: string;
  role: TeamRole;
  /** The "shoot" step uses the nearest shoot day on or before publish-3, else "client sends footage" at -4. */
  sort: number;
}

/** A task as planned from the rules (before it is saved). */
export interface PlannedTask {
  step: string;
  label: string;
  due: string;
  time: string;
  role: TeamRole;
  late: boolean;
}

export interface TaskRow {
  id: string;
  itemId: string;
  clientId: string;
  step: string;
  label: string;
  due: string;
  time: string;
  role: TeamRole;
  assignee: string | null;
  status: TaskStatus;
  late: boolean;
  blockedReason: string;
  note: string;
  completedAt?: string | null;
}

export interface ItemRow {
  id: string;
  clientId: string;
  planId: string;
  platform: PlatformId;
  format: string;
  title: string;
  hook: string;
  cta: string;
  pillar: string;
  templateId: string;
  date: string;
  time: string;
  stage: ItemStage;
  assignee: string | null;
  complianceNote: string;
  clientApproved: boolean;
}

export interface ShootRow {
  id: string;
  clientId: string;
  date: string;
  label: string;
  shots: string[];
  location: string;
  shooter: string | null;
  status: ShootStatus;
  /** "HH:MM" (24 h) or "" when not set. */
  startTime: string;
  endTime: string;
  props: string;
  people: string;
  notes: string;
}

export interface ClientLite {
  id: string;
  name: string;
  category: string;
  colour: string;
  status: ClientStatus;
}
