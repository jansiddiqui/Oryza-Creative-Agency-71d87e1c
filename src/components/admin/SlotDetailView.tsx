import Link from "next/link";
import type { ImageSlot } from "@/data/image-slots";
import { buildPrompt, NEGATIVE_PROMPT, sourceSize } from "@/lib/image-prompts";
import type { VersionView } from "@/lib/admin/images-data";
import { AdminTitle, StatusBadge, sourceLabel } from "./AdminShell";
import { CopyButton } from "./CopyButton";
import { ReviewPanel } from "./ReviewPanel";
import { SlotUploader } from "./SlotUploader";
import { VersionHistory } from "./VersionHistory";

const ratio = (r: [number, number]) => (r[0] === 1200 ? "1200×630" : `${r[0]}:${r[1]}`);
const publicPageExists = (page: string) => !page.startsWith("/industries/") || page === "/industries/schools";

export function SlotDetailView({ slot, versions }: { slot: ImageSlot; versions: VersionView[] }) {
  const live = versions.find((v) => v.status === "live");
  const pending = versions.find((v) => v.status === "uploaded");
  const prompt = buildPrompt(slot);
  const size = sourceSize(slot);
  const negative = NEGATIVE_PROMPT.join("; ");
  return (
    <>
      <Link href="/admin/images" className="text-[14px] font-semibold text-gold-700 underline-offset-4 hover:underline">← All images</Link>
      <AdminTitle
        title={slot.purpose}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={live ? "live" : pending ? "review" : "empty"} />
            <span className="font-mono text-[13px]">{slot.id}</span>
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="about-h" className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
          <h2 id="about-h" className="font-display text-2xl">About this slot</h2>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div>
              <dt className="font-semibold">Appears on</dt>
              <dd className="text-muted">
                {publicPageExists(slot.page) ? <Link href={slot.page} target="_blank" className="underline">{slot.page} ↗</Link> : <>{slot.page} (page coming in a later phase)</>}
                {" — "}
                {slot.placement}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Type</dt>
              <dd className="text-muted">{slot.type === "real-only" ? "Real photo only — no AI images" : "Illustrative — a real photo or an AI illustration (decorative scene only)"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Sizes made on approval</dt>
              <dd className="text-muted">
                {slot.aspects.map((a) => `${ratio(a.ratio)}${a.media ? " (phones)" : ""}: up to ${a.widths.join(", ")}px`).join(" · ")} — AVIF + WebP.
                Sizes larger than the upload are skipped, never stretched.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Upload at least</dt>
              <dd className="text-muted">{size.width}×{size.height}px ({size.ratio})</dd>
            </div>
            <div>
              <dt className="font-semibold">Alt text</dt>
              <dd className="text-muted">{slot.alt}</dd>
            </div>
            {live && (
              <div>
                <dt className="font-semibold">Live now</dt>
                <dd className="text-muted">Version {live.version} · {sourceLabel(live.source)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section aria-labelledby="prompt-h" className="rounded-2xl border border-line bg-cream/60 p-5 sm:p-6">
          <h2 id="prompt-h" className="font-display text-2xl">{prompt ? "Prompt" : "Real photo needed"}</h2>
          {prompt ? (
            <>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-[14px] text-ink-soft">
                <li>Copy the prompt into ChatGPT or Claude.</li>
                <li>Generate as a <strong>landscape 3:2</strong> image ({size.width}×{size.height} or larger).</li>
                <li>Pick the most natural result — no text, no odd hands, nothing that looks like a client or our team.</li>
                <li>Upload it below, set the focal point, tick the checklist, approve.</li>
              </ol>
              <div className="mt-4 rounded-xl border border-line bg-paper p-4">
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{prompt}</p>
                <div className="mt-3"><CopyButton text={prompt} label="Copy prompt" /></div>
              </div>
              <div className="mt-3 rounded-xl border border-line bg-paper p-4">
                <p className="text-[13px] font-semibold">Negative prompt</p>
                <p className="mt-1 text-[13px] text-muted">{negative}</p>
                <div className="mt-3"><CopyButton text={negative} label="Copy negative prompt" /></div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-[14px] text-ink-soft">
              This slot shows real work, people or places, so there is no AI prompt. Brief for the photo: {slot.subject}. Upload a real photo below.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 space-y-6">
        {pending && (
          <ReviewPanel
            key={pending.id}
            id={pending.id}
            slotId={slot.id}
            version={pending.version}
            originalUrl={pending.originalUrl}
            width={pending.originalWidth}
            height={pending.originalHeight}
            focal={pending.focal}
          />
        )}
        <SlotUploader slotId={slot.id} />
        <section aria-labelledby="history-h">
          <h2 id="history-h" className="mb-4 font-display text-2xl">Version history</h2>
          <VersionHistory slotId={slot.id} versions={versions} />
        </section>
      </div>
    </>
  );
}
