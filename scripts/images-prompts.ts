/**
 * npm run images:prompts
 * Writes docs/image-prompts.md: every image slot, its sizes and a ready-to-copy prompt (rule-based, no AI API).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { imageSlots } from "../src/data/image-slots";
import { promptsMarkdown } from "../src/lib/image-prompts";

const out = join(process.cwd(), "docs", "image-prompts.md");
writeFileSync(out, promptsMarkdown(imageSlots), "utf8");
const real = imageSlots.filter((s) => s.type === "real-only").length;
console.log(`Wrote ${out}: ${imageSlots.length} slots (${imageSlots.length - real} illustrative, ${real} real-only).`);
