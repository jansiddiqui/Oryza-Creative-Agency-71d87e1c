import { Skeleton } from "@/components/admin/ops/ui";

/** Shown while an admin page loads: the shape of a page title, a row of cards and a list (no layout jump). */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="animate-rise">
      <Skeleton className="mb-2 h-8 w-48 max-md:hidden" />
      <Skeleton className="mb-6 h-4 w-72 max-w-full" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
