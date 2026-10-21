/** The onboarding checklist for a new client, built from their plan answers. Pure. */
import { platformById, type PlatformId } from "@/data/platforms";

export interface OnboardingSeed {
  kind: "access" | "consent" | "assets" | "optimization";
  label: string;
  platform: string;
}

export function onboardingFor(answers: Record<string, unknown>): OnboardingSeed[] {
  const selected = (Array.isArray(answers.platforms) ? answers.platforms : ["instagram"]).filter((p): p is PlatformId => typeof p === "string" && p in platformById);
  const optimize = (Array.isArray(answers.optimize) ? answers.optimize : []).filter((p): p is PlatformId => selected.includes(p as PlatformId));
  const out: OnboardingSeed[] = selected.map((p) => ({ kind: "access", label: `${platformById[p].name} access received`, platform: p }));
  out.push({ kind: "consent", label: answers.consent === "yes" ? "Consent forms on file (confirmed)" : "Consent forms collected", platform: "" });
  out.push({ kind: "assets", label: "Logo, brand colours and fonts received", platform: "" });
  out.push({ kind: "assets", label: "Photo and video library shared", platform: "" });
  for (const p of optimize) for (const item of platformById[p].optimization) out.push({ kind: "optimization", label: `${platformById[p].name}: ${item}`, platform: p });
  return out;
}
