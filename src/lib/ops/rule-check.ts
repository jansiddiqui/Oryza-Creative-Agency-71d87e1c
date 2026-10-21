/**
 * Edit warnings: the same word checks the plan engine uses, applied to text an editor types in the plan editor.
 * Admin only (it imports every category's wording rules).
 */
import { EARLIER_PRICE } from "@/data/compliance-common";
import { MEDICAL_BANNED_WORDING } from "@/data/medical";
import { B2B_BANNED_WORDING } from "@/data/playbooks/b2b";
import { COACHING_BANNED_WORDING } from "@/data/playbooks/coaching";
import { CREATOR_BANNED_WORDING } from "@/data/playbooks/creators";
import { POLITICAL_BANNED_WORDING } from "@/data/playbooks/political";
import { PRO_BANNED_WORDING, STRICT_BLOCKED } from "@/data/playbooks/professionals";
import { REAL_ESTATE_BANNED_WORDING } from "@/data/playbooks/real-estate";
import { RESTAURANT_BANNED_WORDING } from "@/data/playbooks/restaurant";
import { RETAIL_BANNED_WORDING } from "@/data/playbooks/retail";
import { STYLE_BANNED_WORDING } from "@/data/playbooks/style";
import { WELLNESS_BANNED_WORDING } from "@/data/playbooks/wellness";

type Check = { re: RegExp; why: string };

/** The wording checks for a category (some depend on the answers, e.g. a lawyer's strict mode). */
export function checksFor(slug: string, answers: Record<string, unknown> = {}): Check[] {
  switch (slug) {
    case "hospitals-clinics":
    case "doctors":
      return [{ re: MEDICAL_BANNED_WORDING, why: "medical claims, superlatives, offers or fear-based wording" }];
    case "real-estate":
      return [{ re: REAL_ESTATE_BANNED_WORDING, why: "returns, appreciation, superlatives or fake urgency" }];
    case "political-leaders":
      return [{ re: POLITICAL_BANNED_WORDING, why: "religion or caste appeals, attacks, forces, children or superlatives" }];
    case "restaurants-cafes":
      return [{ re: RESTAURANT_BANNED_WORDING, why: "alcohol, health claims, superlatives or urgency" }];
    case "coaching-institutes":
      return [{ re: COACHING_BANNED_WORDING, why: "guarantees, superlatives, seat scarcity or pressure" }];
    case "retail-showrooms":
      return [
        { re: RETAIL_BANNED_WORDING, why: "price superlatives or fake stock urgency" },
        { re: EARLIER_PRICE, why: "an earlier price — use it only if the client confirmed it was real" },
      ];
    case "gyms-salons":
      return [{ re: WELLNESS_BANNED_WORDING, why: "guaranteed results, medical or skin-lightening claims, body-shaming or urgency" }];
    case "interiors-fashion-jewellery":
      return [
        { re: STYLE_BANNED_WORDING, why: "investment or returns, superlatives, discounts or urgency" },
        { re: EARLIER_PRICE, why: "an earlier price — use it only if the client confirmed it was real" },
      ];
    case "b2b-manufacturers":
      return [{ re: B2B_BANNED_WORDING, why: "superlatives, comparisons or anonymised customer name-drops" }];
    case "professionals": {
      const strict = answers.profession && answers.profession !== "consultant";
      return [
        { re: PRO_BANNED_WORDING, why: "superlatives, guarantees or income claims" },
        ...(strict ? [{ re: STRICT_BLOCKED, why: "solicitation, results, fees, clients or testimonials (not allowed in this profession's rules)" }] : []),
      ];
    }
    case "creators":
      return [{ re: CREATOR_BANNED_WORDING, why: "guarantees, stock tips, medical claims or engagement schemes" }];
    default:
      return [];
  }
}

/** Warnings for one piece of text: which words break the category's rules, and why. */
export function editWarnings(slug: string, text: string, answers: Record<string, unknown> = {}): string[] {
  const out: string[] = [];
  for (const c of checksFor(slug, answers)) {
    const all = new RegExp(c.re.source, c.re.flags.includes("g") ? c.re.flags : c.re.flags + "g");
    const words = [...new Set([...text.matchAll(all)].map((m) => m[0].trim()).filter(Boolean))];
    if (words.length) out.push(`${words.map((w) => `“${w}”`).join(", ")} ${words.length > 1 ? "break" : "breaks"} this category's rules (${c.why}).`);
  }
  return out;
}
