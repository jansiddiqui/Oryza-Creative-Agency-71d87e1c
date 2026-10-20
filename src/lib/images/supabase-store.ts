import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKETS } from "@/lib/supabase/config";
import type { FileStore, ImageRepo } from "./service";
import type { ImageVersion } from "./types";

type Row = {
  id: string;
  slot_id: string;
  version: number;
  status: ImageVersion["status"];
  source: ImageVersion["source"];
  original_path: string;
  original_width: number;
  original_height: number;
  original_sha256: string | null;
  focal_x: number;
  focal_y: number;
  aspects: ImageVersion["aspects"];
  derived_from: string | null;
  credit: string | null;
  checklist: Record<string, boolean> | null;
  uploaded_by: string;
  uploaded_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

export const toVersion = (r: Row): ImageVersion => ({
  id: r.id,
  slotId: r.slot_id,
  version: r.version,
  status: r.status,
  source: r.source,
  originalPath: r.original_path,
  originalWidth: r.original_width,
  originalHeight: r.original_height,
  originalSha256: r.original_sha256,
  focal: { x: r.focal_x, y: r.focal_y },
  aspects: r.aspects,
  derivedFrom: r.derived_from,
  credit: r.credit,
  checklist: r.checklist,
  uploadedBy: r.uploaded_by,
  uploadedAt: r.uploaded_at,
  approvedBy: r.approved_by,
  approvedAt: r.approved_at,
});

function toRow(v: Partial<Omit<ImageVersion, "id">>): Partial<Row> {
  const r: Partial<Row> = {};
  if (v.slotId !== undefined) r.slot_id = v.slotId;
  if (v.version !== undefined) r.version = v.version;
  if (v.status !== undefined) r.status = v.status;
  if (v.source !== undefined) r.source = v.source;
  if (v.originalPath !== undefined) r.original_path = v.originalPath;
  if (v.originalWidth !== undefined) r.original_width = v.originalWidth;
  if (v.originalHeight !== undefined) r.original_height = v.originalHeight;
  if (v.originalSha256 !== undefined) r.original_sha256 = v.originalSha256;
  if (v.focal !== undefined) Object.assign(r, { focal_x: v.focal.x, focal_y: v.focal.y });
  if (v.aspects !== undefined) r.aspects = v.aspects;
  if (v.derivedFrom !== undefined) r.derived_from = v.derivedFrom;
  if (v.credit !== undefined) r.credit = v.credit;
  if (v.checklist !== undefined) r.checklist = v.checklist;
  if (v.uploadedBy !== undefined) r.uploaded_by = v.uploadedBy;
  if (v.uploadedAt !== undefined) r.uploaded_at = v.uploadedAt;
  if (v.approvedBy !== undefined) r.approved_by = v.approvedBy;
  if (v.approvedAt !== undefined) r.approved_at = v.approvedAt;
  return r;
}

const check = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data;
};

export function supabaseImageRepo(db: SupabaseClient): ImageRepo & { listAll(): Promise<ImageVersion[]> } {
  return {
    async listAll() {
      return (check(await db.from("slot_images").select("*").order("version", { ascending: false })) as Row[]).map(toVersion);
    },
    async listVersions(slotId) {
      return (check(await db.from("slot_images").select("*").eq("slot_id", slotId).order("version", { ascending: false })) as Row[]).map(toVersion);
    },
    async get(id) {
      const row = check(await db.from("slot_images").select("*").eq("id", id).maybeSingle()) as Row | null;
      return row ? toVersion(row) : null;
    },
    async nextVersion(slotId) {
      const row = check(await db.from("slot_images").select("version").eq("slot_id", slotId).order("version", { ascending: false }).limit(1).maybeSingle()) as { version: number } | null;
      return (row?.version ?? 0) + 1;
    },
    async insert(v) {
      return toVersion(check(await db.from("slot_images").insert(toRow(v)).select("*").single()) as Row);
    },
    async update(id, patch) {
      check(await db.from("slot_images").update(toRow(patch)).eq("id", id));
    },
    async setLive(slotId, id) {
      check(await db.rpc("set_live_image", { p_slot: slotId, p_id: id }));
    },
    async remove(id) {
      check(await db.from("slot_images").delete().eq("id", id));
    },
  };
}

export function supabaseFileStore(db: SupabaseClient): FileStore & { signedReadUrl(path: string): Promise<string | null> } {
  const originals = db.storage.from(BUCKETS.originals);
  const pub = db.storage.from(BUCKETS.public);
  return {
    async signedUpload(path) {
      const d = check(await originals.createSignedUploadUrl(path));
      if (!d) throw new Error("Could not create an upload link");
      return { path: d.path, token: d.token };
    },
    async downloadOriginal(path) {
      const blob = check(await originals.download(path));
      if (!blob) throw new Error("Uploaded file not found");
      return Buffer.from(await blob.arrayBuffer());
    },
    async removeOriginal(path) {
      check(await originals.remove([path]));
    },
    async putPublic(path, body, contentType) {
      check(await pub.upload(path, body, { contentType, upsert: true, cacheControl: "31536000" }));
    },
    async removePublic(paths) {
      if (paths.length) check(await pub.remove(paths));
    },
    async signedReadUrl(path) {
      const { data } = await originals.createSignedUrl(path, 60 * 30);
      return data?.signedUrl ?? null;
    },
  };
}
