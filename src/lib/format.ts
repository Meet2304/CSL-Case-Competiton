// Locale and time zone are pinned so server and client render the same text.

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumSignificantDigits: 3,
});

export function formatMoney(value: number): string {
  return currency.format(value);
}

/** "$8.42M", "$412K" — for dense tables where cents are noise. */
export function formatCompactMoney(value: number): string {
  return compactCurrency.format(value);
}

const dateStyles = {
  short: { month: "2-digit", day: "2-digit", year: "numeric" },
  medium: { month: "short", day: "numeric", year: "numeric" },
  monthDay: { month: "short", day: "numeric" },
  long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export function formatDate(iso: string, style: keyof typeof dateStyles = "short"): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return date.toLocaleDateString("en-US", { timeZone: "UTC", ...dateStyles[style] });
}

/** Whole days from `fromIso` to `toIso` (negative when `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** "today", "yesterday", "3 days ago", "in 10 days", relative to `todayIso`. */
export function relativeDay(iso: string, todayIso: string): string {
  const d = daysBetween(todayIso, iso);
  if (d === 0) return "today";
  if (d === -1) return "yesterday";
  if (d === 1) return "tomorrow";
  return d < 0 ? `${-d} days ago` : `in ${d} days`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
