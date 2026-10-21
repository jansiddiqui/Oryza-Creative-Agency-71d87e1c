"use client";

import Link from "next/link";
import { btn, btnGhost } from "@/components/admin/ops/ui";

/** Something failed while loading an admin page. Nothing was changed; try again or go to Today. */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md rounded-xl border border-edge bg-surface p-6 text-center">
      <h1 className="font-display text-[22px]">This page could not load</h1>
      <p className="mt-2 text-[14px] text-text-2">Nothing was changed. It may be a brief connection problem — try again in a moment.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={btn}>Try again</button>
        <Link href="/admin/today" className={btnGhost}>Go to Today</Link>
      </div>
    </div>
  );
}
