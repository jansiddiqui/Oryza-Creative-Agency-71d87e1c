/**
 * npm run images:process -- --by "Your name" [--slot <slot-id>] [--dry-run]
 *
 * Takes originals from /image-inbox, validates them against the slot registry, crops each required aspect at
 * the focal point, writes AVIF + WebP at every size to /public/images/<slot-id>/ (metadata stripped), and
 * records the result and the approval in src/data/image-manifest.json. Processed originals move to
 * /image-inbox/done/. Running it with --by is the approval: only do it after the human review checklist.
 *
 * Inbox naming: <slot-id>.png|jpg|webp, optional <slot-id>@4x5.png (dedicated portrait), optional sidecar
 * <slot-id>.json: { "focal": { "x": 0.6, "y": 0.5 }, "source": "real" | "ai-illustrative", "credit": "…" }.
 * Real-only slots require the sidecar with "source": "real".
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { imageSlots, slotById, type AspectId, type ImageSlot } from "../src/data/image-slots";
import { focalCrop, outputWidths, parseInboxName } from "../src/lib/image-crop";
import type { ImageManifest, ImageSource, ManifestAspect, ManifestEntry } from "../src/lib/image-manifest";

const ROOT = process.cwd();
const INBOX = join(ROOT, "image-inbox");
const DONE = join(INBOX, "done");
const PUBLIC = join(ROOT, "public", "images");
const MANIFEST = join(ROOT, "src", "data", "image-manifest.json");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const by = arg("by")?.trim();
const only = arg("slot");
const dryRun = process.argv.includes("--dry-run");

type Sidecar = { focal?: { x: number; y: number }; source?: ImageSource; credit?: string };
type Group = { main?: string; perAspect: Partial<Record<AspectId, string>>; sidecar?: Sidecar };

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

async function processSlot(slot: ImageSlot, group: Group, source: ImageSource, focal: { x: number; y: number }, credit?: string): Promise<ManifestEntry | null> {
  const aspects: Partial<Record<AspectId, ManifestAspect>> = {};
  const outDir = join(PUBLIC, slot.id);
  const mainFile = group.main ?? Object.values(group.perAspect)[0];
  if (!mainFile) return null;

  // Validate every aspect before writing anything.
  const plans: { aspectId: AspectId; file: string; data: Buffer; rect: ReturnType<typeof focalCrop>; widths: number[]; ratio: [number, number] }[] = [];
  for (const aspect of slot.aspects) {
    const file = group.perAspect[aspect.id] ?? group.main;
    if (!file) {
      fail(`${slot.id}: no image for the ${aspect.id} crop (add ${slot.id}.png or ${slot.id}@${aspect.id}.png)`);
      continue;
    }
    const { data, info } = await sharp(join(INBOX, file)).rotate().toBuffer({ resolveWithObject: true });
    const rect = focalCrop(info.width, info.height, aspect.ratio, focal);
    if (rect.width < aspect.minWidth) {
      fail(`${slot.id} (${file}): the ${aspect.id} crop is ${rect.width}px wide; it needs at least ${aspect.minWidth}px. Generate a larger original (see docs/image-prompts.md).`);
      continue;
    }
    const kept = (rect.width * rect.height) / (info.width * info.height);
    if (kept < 0.4) console.warn(`  ! ${slot.id} ${aspect.id}: the crop keeps only ${Math.round(kept * 100)}% of the image — check the focal point.`);
    plans.push({ aspectId: aspect.id, file, data, rect, widths: outputWidths(rect.width, aspect.widths), ratio: aspect.ratio });
  }
  if (plans.length !== slot.aspects.length) return null;
  if (dryRun) {
    for (const p of plans) console.log(`  ✓ ${slot.id} ${p.aspectId}: crop ${p.rect.width}×${p.rect.height} → ${p.widths.join(", ")} px`);
    return null;
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const p of plans) {
    const variants = [];
    for (const w of p.widths) {
      const h = Math.round((w * p.ratio[1]) / p.ratio[0]);
      const base = sharp(p.data).extract(p.rect).resize(w, h, { fit: "cover" });
      const name = `${p.aspectId}-${w}`;
      await base.clone().avif({ quality: 55, effort: 4 }).toFile(join(outDir, `${name}.avif`));
      await base.clone().webp({ quality: 78 }).toFile(join(outDir, `${name}.webp`));
      variants.push({ w, h, avif: `/images/${slot.id}/${name}.avif`, webp: `/images/${slot.id}/${name}.webp` });
    }
    const blur = await sharp(p.data).extract(p.rect).resize(16).webp({ quality: 40 }).toBuffer();
    aspects[p.aspectId] = {
      width: p.rect.width,
      height: p.rect.height,
      variants,
      blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    };
    console.log(`  ✓ ${slot.id} ${p.aspectId}: ${variants.map((v) => v.w).join(", ")} px (AVIF + WebP)`);
  }

  const raw = readFileSync(join(INBOX, mainFile));
  const meta = await sharp(raw).rotate().metadata();
  const now = new Date().toISOString();
  return {
    source,
    original: { file: mainFile, width: meta.autoOrient?.width ?? meta.width ?? 0, height: meta.autoOrient?.height ?? meta.height ?? 0, sha256: createHash("sha256").update(raw).digest("hex") },
    focal,
    aspects,
    ...(credit ? { credit } : {}),
    approved_by: by ?? null,
    approved_at: now,
    updated_at: now,
  };
}

async function main() {
  if (!dryRun && !by) {
    console.error('Approval needed: run with --by "Your name" after checking every image against the review checklist in docs/image-prompts.md.\n(Use --dry-run to only validate.)');
    process.exit(1);
  }
  if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });

  const groups = new Map<string, Group>();
  for (const f of readdirSync(INBOX)) {
    if (f === "README.md" || f === "done") continue;
    if (f.endsWith(".json")) {
      const id = f.replace(/\.json$/, "");
      const g = groups.get(id) ?? { perAspect: {} };
      try {
        g.sidecar = JSON.parse(readFileSync(join(INBOX, f), "utf8"));
      } catch {
        fail(`${f}: not valid JSON`);
      }
      groups.set(id, g);
      continue;
    }
    const parsed = parseInboxName(f);
    if (!parsed) {
      fail(`${f}: name must be <slot-id>.png|jpg|webp or <slot-id>@<aspect>.png`);
      continue;
    }
    const g = groups.get(parsed.slotId) ?? { perAspect: {} };
    if (parsed.aspect) g.perAspect[parsed.aspect as AspectId] = f;
    else g.main = f;
    groups.set(parsed.slotId, g);
  }

  const manifest: ImageManifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const processed: string[] = [];

  for (const [slotId, group] of groups) {
    if (only && slotId !== only) continue;
    const slot = slotById[slotId];
    if (!slot) {
      fail(`${slotId}: no such slot in src/data/image-slots.ts`);
      continue;
    }
    if (!group.main && !Object.keys(group.perAspect).length) {
      fail(`${slotId}: sidecar found but no image`);
      continue;
    }
    for (const a of Object.keys(group.perAspect)) {
      if (!slot.aspects.some((x) => x.id === a)) fail(`${slotId}@${a}: this slot has no ${a} crop`);
    }
    const side = group.sidecar ?? {};
    const source: ImageSource | undefined = side.source ?? (slot.type === "real-only" ? undefined : "ai-illustrative");
    if (slot.type === "real-only" && source !== "real") {
      fail(`${slotId} is real-only: add ${slotId}.json with { "source": "real" } — AI images are not allowed here.`);
      continue;
    }
    if (source !== "real" && source !== "ai-illustrative") {
      fail(`${slotId}: source must be "real" or "ai-illustrative"`);
      continue;
    }
    const focal = side.focal ?? slot.focal ?? { x: 0.5, y: 0.5 };
    if (!(focal.x >= 0 && focal.x <= 1 && focal.y >= 0 && focal.y <= 1)) {
      fail(`${slotId}: focal x and y must be between 0 and 1`);
      continue;
    }

    console.log(`${slotId} (${source})`);
    const entry = await processSlot(slot, group, source, focal, side.credit);
    if (entry) {
      manifest.slots[slotId] = entry;
      processed.push(slotId);
    }

    // Slots that re-use this original (e.g. OG share images), unless they have their own file.
    for (const derived of imageSlots.filter((s) => s.deriveFrom === slotId && !groups.has(s.id))) {
      console.log(`${derived.id} (from ${slotId})`);
      const d = await processSlot(derived, { main: group.main, perAspect: {} }, source, derived.focal ?? focal, side.credit);
      if (d) manifest.slots[derived.id] = d;
    }
  }

  if (!dryRun && processed.length) {
    manifest.slots = Object.fromEntries(Object.entries(manifest.slots).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    mkdirSync(DONE, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    for (const id of processed) {
      const g = groups.get(id)!;
      for (const f of [g.main, ...Object.values(g.perAspect), g.sidecar ? `${id}.json` : undefined]) {
        if (f && existsSync(join(INBOX, f))) renameSync(join(INBOX, f), join(DONE, `${stamp}-${f}`));
      }
    }
    console.log(`\nUpdated ${MANIFEST}. Commit public/images/ and the manifest.`);
  }
  if (!groups.size) console.log("image-inbox is empty — nothing to do.");
  if (errors.length) {
    console.error(`\n${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
