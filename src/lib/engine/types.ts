import type { PlatformId, } from "@/data/platforms";
import type { Fit } from "@/data/categories";

export type Format = "reel" | "post" | "story";
export type Who = "Oryza shoots" | "Oryza edits" | "Client arranges" | "Oryza designs";

export interface Template {
  id: string;
  format: Format;
  pillar: string;
  /** Short idea name, may contain {variables}. */
  title: string;
  /** The opening line / angle, may contain {variables}. */
  hook: string;
  cta?: string;
  who: Who;
  shots?: string[];
  /** Shows a recognisable child/person face — blocked without consent. */
  faces?: boolean;
  /** All of these tags must be present. */
  requires?: string[];
  /** None of these tags may be present. */
  blockedBy?: string[];
  /** Each matching tag adds score. */
  boosts?: string[];
  /** Fill-in templates may repeat with new content (short cool-down). */
  repeatable?: boolean;
  /** Earliest plan day this template may be scheduled on. */
  minDay?: number;
  /** Only placed by a pinned rule, never by free scheduling. */
  pinnedOnly?: boolean;
  /** Shown with the item in the plan (e.g. "Doctor approves every medical fact"). */
  note?: string;
}

export interface Playbook {
  category: string;
  audiences: { name: string; share: number; needs: string }[];
  pillars: { id: string; name: string; share: number }[];
  tone: string;
  rules: string[];
  templates: Template[];
}

export interface PlanItem {
  templateId: string;
  platform: PlatformId;
  format: Format | "broadcast" | "status" | "short" | "video" | "blog" | "gpost" | "event" | "pin";
  title: string;
  hook?: string;
  cta?: string;
  who?: string;
  pillar?: string;
  time: string;
  pinnedReason?: string;
  /** Compliance or approval note carried from the template. */
  note?: string;
}

export interface PlanDay {
  day: number;
  date: string; // ISO yyyy-mm-dd
  weekday: string;
  items: PlanItem[];
  shoot?: { label: string; shots: string[] };
}

export interface Plan {
  version: string;
  snapshot: { label: string; value: string }[];
  audiences: Playbook["audiences"];
  platforms: { id: PlatformId; name: string; fit: Fit; selected: boolean; job: string }[];
  optimization: { platform: PlatformId; name: string; items: string[] }[];
  pillars: { name: string; pct: number }[];
  days: PlanDay[];
  deliverables: { platform: PlatformId; name: string; lines: string[] }[];
  shootDays: { day: number; date: string; label: string; shots: string[] }[];
  clientPart: string[];
  oryzaPart: string[];
  nextMonths: { month: string; themes: string[] }[];
  pkg: { id: string; name: string; summary: string };
  rules: string[];
  /** Compliance notes for regulated categories (absent for others). */
  compliance?: string[];
}
