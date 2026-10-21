/** Plan date helpers for client operations. Pure. */
import { addDays } from "@/lib/engine/dates";

/** The default start date for the next month's plan (plans run 30 days). */
export const nextMonthStart = (prevStart: string) => addDays(prevStart, 30);

/** Renewal date default: one month after the start date, minus a day. */
export function defaultRenewal(start: string): string {
  const d = new Date(start + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  return addDays(d.toISOString().slice(0, 10), -1);
}
