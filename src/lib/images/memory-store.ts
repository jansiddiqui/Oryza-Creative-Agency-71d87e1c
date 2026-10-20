/** In-memory ImageRepo + FileStore with the same rules as the database (tests and local previews). */
import { randomUUID } from "node:crypto";
import type { FileStore, ImageRepo } from "./service";
import type { ImageVersion } from "./types";

export function memoryStore() {
  const rows = new Map<string, ImageVersion>();
  const originals = new Map<string, Buffer>();
  const publicFiles = new Map<string, Buffer>();

  const repo: ImageRepo = {
    async listVersions(slotId) {
      return [...rows.values()].filter((r) => r.slotId === slotId).sort((a, b) => b.version - a.version);
    },
    async get(id) {
      return rows.get(id) ?? null;
    },
    async nextVersion(slotId) {
      return Math.max(0, ...[...rows.values()].filter((r) => r.slotId === slotId).map((r) => r.version)) + 1;
    },
    async insert(v) {
      const row = { ...v, id: randomUUID() };
      rows.set(row.id, row);
      return row;
    },
    async update(id, patch) {
      const r = rows.get(id);
      if (!r) throw new Error("not found");
      rows.set(id, { ...r, ...patch });
    },
    async setLive(slotId, id) {
      // Mirrors public.set_live_image: archive the current live version, promote `id`.
      for (const r of rows.values()) if (r.slotId === slotId && r.status === "live" && r.id !== id) r.status = "archived";
      if (id) {
        const r = rows.get(id);
        if (!r || r.slotId !== slotId) throw new Error("image version not found");
        if (!r.aspects || !r.approvedBy || !r.approvedAt) throw new Error("check constraint: live image must be approved");
        r.status = "live";
      }
    },
    async remove(id) {
      rows.delete(id);
    },
  };

  const files: FileStore = {
    async signedUpload(path) {
      return { path, token: `token-${path}` };
    },
    async downloadOriginal(path) {
      const b = originals.get(path);
      if (!b) throw new Error(`no original at ${path}`);
      return b;
    },
    async removeOriginal(path) {
      originals.delete(path);
    },
    async putPublic(path, body) {
      publicFiles.set(path, body);
    },
    async removePublic(paths) {
      for (const p of paths) publicFiles.delete(p);
    },
  };

  return { repo, files, rows, originals, publicFiles };
}
