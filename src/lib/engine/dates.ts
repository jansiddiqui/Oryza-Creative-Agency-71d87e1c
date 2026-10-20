const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;

const toUTC = (iso: string) => Date.parse(iso + "T00:00:00Z");

export function addDays(iso: string, n: number): string {
  return new Date(toUTC(iso) + n * DAY_MS).toISOString().slice(0, 10);
}

/** 1-based day number of `iso` in a plan starting on `start` (0 if missing). */
export function dayOf(start: string, iso?: string): number {
  if (!iso) return 0;
  return Math.round((toUTC(iso) - toUTC(start)) / DAY_MS) + 1;
}

export function fmtDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
}

export function weekdayName(iso: string): string {
  return WEEKDAYS[new Date(toUTC(iso)).getUTCDay()];
}

export function monthName(m: number): string {
  return MONTHS_FULL[m - 1];
}

/** Next Monday on or after the given date (ISO), using IST calendar dates. */
export function nextMonday(from: Date = new Date()): string {
  const ist = new Date(from.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const wd = new Date(toUTC(ist)).getUTCDay();
  const add = wd === 1 ? 7 : (8 - wd) % 7;
  return addDays(ist, add);
}
