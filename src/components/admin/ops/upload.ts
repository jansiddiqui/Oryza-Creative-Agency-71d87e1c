"use client";

import { addAssetAction, startAssetUploadAction } from "@/app/admin/(panel)/items/actions";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const ASSET_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf";
const MAX = 100 * 1024 * 1024;

/**
 * Uploads one file to a content item through the existing actions: a one-time link from the server, a direct
 * upload to private storage, then the server attaches it to the item.
 */
export async function uploadAsset(itemId: string, file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > MAX) return { ok: false, error: `${file.name} is larger than 100 MB.` };
  const target = await startAssetUploadAction(itemId, file.type);
  if (!target.ok) return { ok: false, error: target.error };
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from("client-assets").uploadToSignedUrl(target.data.path, target.data.token, file, { contentType: file.type });
  if (error) return { ok: false, error: `Upload failed: ${error.message}` };
  const added = await addAssetAction(itemId, target.data.path);
  return added.ok ? { ok: true } : { ok: false, error: added.error };
}
