/**
 * Deadline math on ISO `yyyy-mm-dd` strings, at noon UTC like src/lib/format.ts.
 * Never reads the clock: every date comes from the input.
 */
import type { DeadlineAnchor } from "@/data/types";

const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Adds calendar months, clamping to the month's last day (Aug 31 + 6 → Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIso(target);
}

export function resolveDeadline(anchor: DeadlineAnchor, dateOfDeath: string): string {
  const year = Number(dateOfDeath.slice(0, 4));
  switch (anchor.from) {
    case "dec-31":
      return `${year + anchor.yearsAfterDeath}-12-31`;
    case "apr-15":
      return `${year + anchor.yearsAfterDeath}-04-15`;
    case "date-of-death":
      return addMonths(dateOfDeath, anchor.months);
  }
}
