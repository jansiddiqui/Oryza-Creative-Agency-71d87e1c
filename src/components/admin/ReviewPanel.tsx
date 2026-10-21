"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slotById, type AspectSpec } from "@/data/image-slots";
import { REVIEW_CHECKLIST } from "@/lib/image-prompts";
import { focalCrop } from "@/lib/image-crop";
import type { Focal } from "@/lib/images/types";
import { approveAction, deleteVersionAction, setFocalAction } from "@/app/admin/(panel)/images/actions";
import { useConfirm } from "./shell/Confirm";

const aspectName = (a: AspectSpec) =>
  a.id === "og" ? "Share image 1200×630" : a.id === "4x5" ? "Phones 4:5" : a.id === "4x3" ? "Card 4:3" : "Desktop 16:9";

/** Exactly what the site will show for one crop: the original positioned so the focal crop fills the box. */
export function CropPreview({ url, w, h, aspect, focal }: { url: string; w: number; h: number; aspect: AspectSpec; focal: Focal }) {
  const r = focalCrop(w, h, aspect.ratio, focal);
  const px = w === r.width ? 0 : (r.left / (w - r.width)) * 100;
  const py = h === r.height ? 0 : (r.top / (h - r.height)) * 100;
  return (
    <figure>
      <div
        className="w-full rounded-lg border border-line bg-cream bg-no-repeat"
        style={{
          aspectRatio: `${aspect.ratio[0]} / ${aspect.ratio[1]}`,
          backgroundImage: `url("${url}")`,
          backgroundSize: `${(w / r.width) * 100}% auto`,
          backgroundPosition: `${px}% ${py}%`,
        }}
        role="img"
        aria-label={`${aspectName(aspect)} preview`}
      />
      <figcaption className="mt-1.5 text-[12px] text-muted">
        {aspectName(aspect)} · crop {r.width}×{r.height}px
      </figcaption>
    </figure>
  );
}

export function ReviewPanel({
  id,
  slotId,
  version,
  originalUrl,
  width,
  height,
  focal: initialFocal,
}: {
  id: string;
  slotId: string;
  version: number;
  originalUrl: string | null;
  width: number;
  height: number;
  focal: Focal;
}) {
  const slot = slotById[slotId];
  const router = useRouter();
  const confirm = useConfirm();
  const box = useRef<HTMLDivElement>(null);
  const [focal, setFocal] = useState(initialFocal);
  const [dragging, setDragging] = useState(false);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<"" | "focal" | "approve" | "delete">("");
  const [error, setError] = useState("");
  const allTicked = REVIEW_CHECKLIST.every((c) => ticks[c.id]);

  const at = (clientX: number, clientY: number): Focal => {
    const r = box.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;
    return { x: clamp((clientX - r.left) / r.width), y: clamp((clientY - r.top) / r.height) };
  };

  async function saveFocal(f: Focal) {
    setBusy("focal");
    const res = await setFocalAction(id, slotId, f.x, f.y);
    setBusy("");
    if (!res.ok) setError(res.error);
  }

  function nudge(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const f = { x: Math.min(1, Math.max(0, +(focal.x + d[0]).toFixed(2))), y: Math.min(1, Math.max(0, +(focal.y + d[1]).toFixed(2))) };
    setFocal(f);
    void saveFocal(f);
  }

  return (
    <section aria-labelledby="review-h" className="rounded-2xl border border-gold-500/50 bg-paper p-5 sm:p-6">
      <h2 id="review-h" className="font-display text-2xl">Review version {version}</h2>
      <p className="mt-1 text-[14px] text-muted">Drag the point to the most important part of the picture. Every crop below follows it.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {originalUrl ? (
            <div
              ref={box}
              className="relative touch-none select-none overflow-hidden rounded-xl border border-line"
              style={{ aspectRatio: `${width} / ${height}` }}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDragging(true);
                setFocal(at(e.clientX, e.clientY));
              }}
              onPointerMove={(e) => dragging && setFocal(at(e.clientX, e.clientY))}
              onPointerUp={(e) => {
                setDragging(false);
                void saveFocal(at(e.clientX, e.clientY));
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- private original via signed URL */}
              <img src={originalUrl} alt="Uploaded original" className="h-full w-full object-cover" draggable={false} />
              <button
                type="button"
                aria-label={`Focal point at ${Math.round(focal.x * 100)}% across, ${Math.round(focal.y * 100)}% down. Use arrow keys to move.`}
                onKeyDown={nudge}
                className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-gold-500/80 shadow-lg"
                style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
              />
            </div>
          ) : (
            <p className="text-muted">The original could not be loaded. Refresh the page.</p>
          )}
          <p className="mt-2 text-[12px] text-muted">
            Original {width}×{height}px · focal {Math.round(focal.x * 100)}% / {Math.round(focal.y * 100)}%{busy === "focal" ? " · saving…" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start">
          {originalUrl && slot.aspects.map((a) => <CropPreview key={a.id} url={originalUrl} w={width} h={height} aspect={a} focal={focal} />)}
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="font-display text-xl">Review checklist</legend>
        <p className="mt-1 text-[13px] text-muted">Zoom in on the original. Tick every point — or delete this upload and try another.</p>
        <ul className="mt-4 space-y-2.5">
          {REVIEW_CHECKLIST.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-ink">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#13201c]" checked={Boolean(ticks[c.id])} onChange={(e) => setTicks((t) => ({ ...t, [c.id]: e.target.checked }))} />
                <span>
                  <span className="block text-[15px] font-semibold">{c.label}</span>
                  <span className="block text-[13px] text-muted">{c.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-800/30 bg-red-50 px-4 py-3 text-[14px] text-red-900">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!allTicked || busy !== ""}
          onClick={async () => {
            setError("");
            setBusy("approve");
            const res = await approveAction(id, slotId, ticks);
            setBusy("");
            if (!res.ok) return setError(res.error);
            router.refresh();
          }}
          className="rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === "approve" ? "Publishing… (about 10–20 seconds)" : "Approve and publish"}
        </button>
        <button
          type="button"
          disabled={busy !== ""}
          onClick={async () => {
            if (!(await confirm({ title: "Delete this upload?", body: "It has not been published. The file is removed for good.", action: "Delete upload", danger: true }))) return;
            setBusy("delete");
            const res = await deleteVersionAction(id, slotId);
            setBusy("");
            if (!res.ok) return setError(res.error);
            router.refresh();
          }}
          className="rounded-full border border-ink/20 px-5 py-3 text-[14px] font-semibold hover:border-ink"
        >
          Delete upload
        </button>
        {!allTicked && <span className="text-[13px] text-muted">Tick all {REVIEW_CHECKLIST.length} points to approve.</span>}
      </div>
    </section>
  );
}
