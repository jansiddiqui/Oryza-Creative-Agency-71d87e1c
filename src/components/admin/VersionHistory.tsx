"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VersionView } from "@/lib/admin/images-data";
import { deleteVersionAction, removeLiveAction, rollbackAction } from "@/app/admin/(panel)/images/actions";
import { StatusBadge, fmtWhen, sourceLabel } from "./AdminShell";

/** All versions of a slot: restore an earlier one in one click, take the live one off, or delete old ones. */
export function VersionHistory({ slotId, versions }: { slotId: string; versions: VersionView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setError("");
    setBusy(key);
    const res = await fn();
    setBusy("");
    if (!res.ok) return setError(res.error ?? "Something went wrong.");
    router.refresh();
  }

  if (!versions.length) return <p className="text-[15px] text-muted">No uploads yet. The site shows the brand fallback (or nothing) for this slot.</p>;
  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-800/30 bg-red-50 px-4 py-3 text-[14px] text-red-900">{error}</p>}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
        {versions.map((v) => (
          <li key={v.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-cream sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              {v.thumb && <img src={v.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <div className="min-w-0 flex-1 text-[14px]">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Version {v.version}</span>
                <StatusBadge status={v.status} />
                <span className="text-muted">{sourceLabel(v.source)}</span>
                {v.derivedFrom && <span className="text-muted">· made from the page header</span>}
              </p>
              <p className="mt-1 text-muted">
                Uploaded {fmtWhen(v.uploadedAt)} by {v.uploadedBy}
                {v.approvedAt && <> · approved {fmtWhen(v.approvedAt)} by {v.approvedBy}</>}
              </p>
              {v.credit && <p className="mt-1 text-muted">Credit: {v.credit}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {v.status === "live" && (
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => run(`remove-${v.id}`, () => removeLiveAction(slotId), "Take this image off the website? The slot goes back to the brand fallback. You can restore it later.")}
                  className="rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink"
                >
                  {busy === `remove-${v.id}` ? "Removing…" : "Remove from site"}
                </button>
              )}
              {v.status === "archived" && v.approvedAt && (
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => run(`rb-${v.id}`, () => rollbackAction(v.id, slotId))}
                  className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-paper"
                >
                  {busy === `rb-${v.id}` ? "Restoring…" : "Restore this version"}
                </button>
              )}
              {v.status === "archived" && (
                <button
                  type="button"
                  disabled={busy !== ""}
                  onClick={() => run(`del-${v.id}`, () => deleteVersionAction(v.id, slotId), `Delete version ${v.version} permanently?`)}
                  className="rounded-full border border-ink/20 px-4 py-2 text-[13px] font-semibold hover:border-ink"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
