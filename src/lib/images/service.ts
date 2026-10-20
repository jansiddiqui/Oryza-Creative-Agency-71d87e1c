/**
 * Image Manager business logic: upload → review → approve (process + publish) → rollback / remove / delete.
 * Storage and database are passed in, so the same rules run against Supabase in production and an
 * in-memory store in tests. Callers must have checked the admin allow-list first.
 */
import { createHash, randomUUID } from "node:crypto";
import { imageSlots, slotById, type ImageSlot } from "@/data/image-slots";
import type { Admin } from "@/lib/admin/types";
import type { AuditAction } from "@/lib/admin/types";
import { inspectImage, renderSlotImages } from "./process";
import type { Focal, ImageSource, ImageVersion } from "./types";
import { ACCEPTED_TYPES, checkChecklist, checkSource, checkUpload } from "./validate";

export interface ImageRepo {
  listVersions(slotId: string): Promise<ImageVersion[]>;
  get(id: string): Promise<ImageVersion | null>;
  nextVersion(slotId: string): Promise<number>;
  insert(v: Omit<ImageVersion, "id">): Promise<ImageVersion>;
  update(id: string, patch: Partial<Omit<ImageVersion, "id" | "slotId" | "status">>): Promise<void>;
  /** Atomically archives the slot's live version and makes `id` live (null = no live image). */
  setLive(slotId: string, id: string | null): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface FileStore {
  signedUpload(path: string): Promise<{ path: string; token: string }>;
  downloadOriginal(path: string): Promise<Buffer>;
  removeOriginal(path: string): Promise<void>;
  putPublic(path: string, body: Buffer, contentType: string): Promise<void>;
  removePublic(paths: string[]): Promise<void>;
}

export interface Deps {
  repo: ImageRepo;
  files: FileStore;
  audit: (actor: string, action: AuditAction, target: string, details?: Record<string, unknown>) => Promise<void>;
  now?: () => Date;
}

export class ImageError extends Error {
  constructor(public readonly problems: string[]) {
    super(problems.join(" "));
  }
}

const fail = (...problems: string[]): never => {
  throw new ImageError(problems);
};

function slotOr404(slotId: string): ImageSlot {
  return slotById[slotId] ?? fail("Unknown image slot.");
}

/** Pages to refresh when a slot changes. */
export function pagesFor(slotId: string): string[] {
  const slot = slotById[slotId];
  if (!slot) return [];
  const derived = imageSlots.filter((s) => s.deriveFrom === slotId).map((s) => s.page);
  return [...new Set([slot.page, ...derived])];
}

/** Step 1: a signed URL so the browser uploads the original straight to private storage. */
export async function startUpload(deps: Deps, _admin: Admin, slotId: string, mime: string) {
  slotOr404(slotId);
  const ext = ACCEPTED_TYPES[mime] ?? fail("Use a JPG, PNG or WebP image.");
  return deps.files.signedUpload(`${slotId}/${randomUUID()}.${ext}`);
}

/** Step 2: verify the uploaded file on the server and record it as a version that needs review. */
export async function completeUpload(
  deps: Deps,
  admin: Admin,
  input: { slotId: string; path: string; source: string; credit?: string },
): Promise<ImageVersion> {
  const slot = slotOr404(input.slotId);
  const sourceError = checkSource(slot, input.source);
  if (!input.path.startsWith(`${slot.id}/`) || input.path.includes("..")) fail("Upload path does not belong to this slot.");
  if (sourceError) {
    await deps.files.removeOriginal(input.path).catch(() => undefined);
    fail(sourceError);
  }
  const buf = await deps.files.downloadOriginal(input.path);
  const facts = await inspectImage(buf);
  const problems = checkUpload(slot, { ...facts, bytes: buf.length });
  if (problems.length) {
    await deps.files.removeOriginal(input.path).catch(() => undefined);
    fail(...problems);
  }
  const now = (deps.now ?? (() => new Date()))().toISOString();
  const v = await deps.repo.insert({
    slotId: slot.id,
    version: await deps.repo.nextVersion(slot.id),
    status: "uploaded",
    source: input.source as ImageSource,
    originalPath: input.path,
    originalWidth: facts.width,
    originalHeight: facts.height,
    originalSha256: createHash("sha256").update(buf).digest("hex"),
    focal: slot.focal ?? { x: 0.5, y: 0.5 },
    aspects: null,
    derivedFrom: null,
    credit: input.credit?.trim().slice(0, 200) || null,
    checklist: null,
    uploadedBy: admin.email,
    uploadedAt: now,
    approvedBy: null,
    approvedAt: null,
  });
  await deps.audit(admin.email, "image.upload", slot.id, { version: v.version, source: v.source });
  return v;
}

/** Focal point can change until the version is approved (after that, upload again or roll back). */
export async function setFocal(deps: Deps, admin: Admin, id: string, focal: Focal) {
  const v = (await deps.repo.get(id)) ?? fail("Image not found.");
  if (v.status !== "uploaded") fail("The focal point can only change before approval.");
  const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0.5));
  await deps.repo.update(id, { focal: { x: clamp(focal.x), y: clamp(focal.y) } });
  await deps.audit(admin.email, "image.focal", v.slotId, { version: v.version, x: clamp(focal.x), y: clamp(focal.y) });
}

async function publish(deps: Deps, slot: ImageSlot, original: Buffer, focal: Focal, version: number) {
  const { files, aspects } = await renderSlotImages(original, slot, focal, version);
  for (const f of files) await deps.files.putPublic(f.path, f.body, f.contentType);
  return aspects;
}

/** Approve: re-check every rule on the server, process, publish and make it live. Returns pages to refresh. */
export async function approve(deps: Deps, admin: Admin, id: string, checklist: Record<string, unknown>): Promise<string[]> {
  const v = (await deps.repo.get(id)) ?? fail("Image not found.");
  const slot = slotOr404(v.slotId);
  if (v.status !== "uploaded") fail("Only a new upload can be approved; use rollback for older versions.");
  const sourceError = checkSource(slot, v.source);
  if (sourceError) fail(sourceError);
  const checklistError = checkChecklist(checklist);
  if (checklistError) fail(checklistError);

  const original = await deps.files.downloadOriginal(v.originalPath);
  const aspects = await publish(deps, slot, original, v.focal, v.version);
  const now = (deps.now ?? (() => new Date()))().toISOString();
  const hadLive = (await deps.repo.listVersions(slot.id)).some((x) => x.status === "live");
  await deps.repo.update(id, { aspects, approvedBy: admin.email, approvedAt: now, checklist: checklist as Record<string, boolean> });
  await deps.repo.setLive(slot.id, id);
  await deps.audit(admin.email, hadLive ? "image.replace" : "image.approve", slot.id, { version: v.version, source: v.source });

  // Slots that re-use this image (e.g. share images from a page header) follow it, unless they have their own.
  for (const d of imageSlots.filter((s) => s.deriveFrom === slot.id)) {
    const versions = await deps.repo.listVersions(d.id);
    const live = versions.find((x) => x.status === "live");
    if (live && !live.derivedFrom) continue;
    const dv = await deps.repo.nextVersion(d.id);
    const dAspects = await publish(deps, d, original, d.focal ?? v.focal, dv);
    const { id: _parentId, ...base } = v;
    void _parentId;
    const row = await deps.repo.insert({
      ...base,
      slotId: d.id,
      version: dv,
      status: "uploaded",
      focal: d.focal ?? v.focal,
      aspects: dAspects,
      derivedFrom: id,
      approvedBy: admin.email,
      approvedAt: now,
    });
    await deps.repo.setLive(d.id, row.id);
    await deps.audit(admin.email, live ? "image.replace" : "image.approve", d.id, { version: dv, derivedFrom: slot.id });
  }
  return pagesFor(slot.id);
}

/** Make an earlier approved version live again. */
export async function rollback(deps: Deps, admin: Admin, id: string): Promise<string[]> {
  const v = (await deps.repo.get(id)) ?? fail("Image not found.");
  if (v.status !== "archived" || !v.aspects || !v.approvedAt) fail("Only an earlier approved version can be restored.");
  const sourceError = checkSource(slotOr404(v.slotId), v.source);
  if (sourceError) fail(sourceError);
  await deps.repo.setLive(v.slotId, id);
  await deps.audit(admin.email, "image.rollback", v.slotId, { version: v.version });
  return pagesFor(v.slotId);
}

/** Take the slot's image off the site (it shows the brand fallback). Versions are kept for rollback. */
export async function removeLive(deps: Deps, admin: Admin, slotId: string): Promise<string[]> {
  slotOr404(slotId);
  const live = (await deps.repo.listVersions(slotId)).find((x) => x.status === "live");
  if (!live) return [];
  await deps.repo.setLive(slotId, null);
  await deps.audit(admin.email, "image.remove", slotId, { version: live.version });
  return pagesFor(slotId);
}

/** Permanently delete a version that is not live: its row, original and processed files. */
export async function deleteVersion(deps: Deps, admin: Admin, id: string) {
  const v = (await deps.repo.get(id)) ?? fail("Image not found.");
  if (v.status === "live") fail("Remove or replace the live image before deleting it.");
  const paths = Object.values(v.aspects ?? {}).flatMap((a) => a!.variants.flatMap((x) => [x.avif, x.webp]));
  if (paths.length) await deps.files.removePublic(paths);
  // Derived copies share the original; only delete it when this version owns it.
  if (!v.derivedFrom) await deps.files.removeOriginal(v.originalPath).catch(() => undefined);
  await deps.repo.remove(id);
  await deps.audit(admin.email, "image.delete", v.slotId, { version: v.version });
}
