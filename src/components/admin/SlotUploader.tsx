"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { slotById } from "@/data/image-slots";
import { BUCKETS, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { ACCEPTED_TYPES, checkSource, checkUpload } from "@/lib/images/validate";
import { completeUploadAction, startUploadAction } from "@/app/admin/(panel)/images/actions";

type Phase = "idle" | "checking" | "uploading" | "saving";

async function readSize(file: File): Promise<{ width: number; height: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

/**
 * Upload for one slot: drag and drop or pick a file (phone camera roll works too). The browser checks type,
 * size and shape first, uploads the original straight to private storage with a one-time link, and the server
 * checks everything again before the version is saved for review.
 */
export function SlotUploader({ slotId }: { slotId: string }) {
  const slot = slotById[slotId];
  const realOnly = slot.type === "real-only";
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<"real" | "ai-illustrative" | "">(realOnly ? "real" : "");
  const [credit, setCredit] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [drag, setDrag] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState("");

  async function handle(file: File | undefined) {
    if (!file) return;
    setErrors([]);
    setDone("");
    const sourceError = checkSource(slot, source);
    if (sourceError) return setErrors([sourceError]);
    setPhase("checking");
    const size = await readSize(file);
    const problems = checkUpload(slot, { mime: file.type, bytes: file.size, ...size });
    if (problems.length) {
      setPhase("idle");
      return setErrors(problems);
    }
    setPhase("uploading");
    const target = await startUploadAction(slotId, file.type);
    if (!target.ok) {
      setPhase("idle");
      return setErrors([target.error]);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(BUCKETS.originals).uploadToSignedUrl(target.data.path, target.data.token, file, { contentType: file.type });
    if (error) {
      setPhase("idle");
      return setErrors([`Upload failed: ${error.message}`]);
    }
    setPhase("saving");
    const saved = await completeUploadAction({ slotId, path: target.data.path, source, credit });
    setPhase("idle");
    if (!saved.ok) return setErrors(saved.problems ?? [saved.error]);
    setDone(`Uploaded as version ${saved.data.version}. Set the focal point and review it below.`);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const busy = phase !== "idle";
  return (
    <section aria-labelledby="upload-h" className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <h2 id="upload-h" className="font-display text-2xl">Upload</h2>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[14px] font-semibold">What is this image?</legend>
        <div className="flex flex-wrap gap-2">
          <label className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-[14px] ${source === "real" ? "border-ink bg-ink text-paper" : "border-line"}`}>
            <input type="radio" name="source" value="real" className="sr-only" checked={source === "real"} onChange={() => setSource("real")} />
            Real photo
          </label>
          <label
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] ${realOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${source === "ai-illustrative" ? "border-ink bg-ink text-paper" : "border-line"}`}
          >
            <input type="radio" name="source" value="ai-illustrative" className="sr-only" disabled={realOnly} checked={source === "ai-illustrative"} onChange={() => setSource("ai-illustrative")} />
            AI illustrative
          </label>
        </div>
        {realOnly && <p className="mt-2 text-[13px] text-muted">This slot shows real work, people or places, so only a real photo is allowed.</p>}
      </fieldset>

      <label className="mt-4 block text-[14px] font-semibold">
        Credit <span className="font-normal text-muted">(optional — photographer or source)</span>
        <input value={credit} onChange={(e) => setCredit(e.target.value)} maxLength={200} className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-[15px]" />
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={`mt-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${drag ? "border-gold-500 bg-gold-100/40" : "border-line"}`}
      >
        <p className="font-semibold">{busy ? (phase === "checking" ? "Checking the image…" : phase === "uploading" ? "Uploading…" : "Saving…") : "Drop the image here"}</p>
        <p className="mt-1 text-[13px] text-muted">JPG, PNG or WebP · landscape 3:2, 1536×1024 or larger · up to 25 MB</p>
        <label className={`mt-4 inline-flex cursor-pointer rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-paper ${busy || !source ? "pointer-events-none opacity-50" : ""}`}>
          Choose a file
          <input
            ref={input}
            type="file"
            accept={Object.keys(ACCEPTED_TYPES).join(",")}
            className="sr-only"
            disabled={busy || !source}
            onChange={(e) => void handle(e.target.files?.[0])}
          />
        </label>
        {!source && <p className="mt-2 text-[13px] text-gold-700">Choose “Real photo” or “AI illustrative” first.</p>}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="mt-4 space-y-1 rounded-xl border border-red-800/30 bg-red-50 px-4 py-3 text-[14px] text-red-900">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      {done && <p role="status" className="mt-4 rounded-xl bg-cream px-4 py-3 text-[14px]">{done}</p>}
    </section>
  );
}
