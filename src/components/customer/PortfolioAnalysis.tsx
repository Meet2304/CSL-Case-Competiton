"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import { cn, formatCompactMoney, formatDate } from "@/lib/format";
import { accountLabel } from "@/lib/household";
import {
  monthLabel,
  projectPortfolio,
  type PortfolioAnalysis,
  type PortfolioGroup,
} from "@/lib/portfolio";
import { routes } from "@/lib/routes";

/** Series colors, in the validated fixed order (see the chart tokens in globals.css). */
const fill: Record<PortfolioGroup, string> = {
  cash: "bg-chart-cash",
  retirement: "bg-chart-retirement",
  investments: "bg-chart-investments",
};
const stroke: Record<PortfolioGroup, string> = {
  cash: "stroke-chart-cash",
  retirement: "stroke-chart-retirement",
  investments: "stroke-chart-investments",
};

/** Whole percent; one decimal only under 1% so a small share never reads as "0%". */
const pct = (x: number, signed = false) =>
  `${signed && x > 0 ? "+" : ""}${(x * 100).toFixed(Math.abs(x) < 0.01 && x !== 0 ? 1 : 0)}%`;
const pctFine = (x: number) => `${x > 0 ? "+" : ""}${(x * 100).toFixed(2)}%`;

/**
 * Portfolio Analysis on the home page: total value and today's change, the
 * allocation as a donut, the value over time as a line, three headline
 * figures, and a "Dive deeper" panel with every account's share and change.
 */
export function PortfolioAnalysisCard({
  analysis: p,
  className,
}: {
  analysis: PortfolioAnalysis;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const accounts = p.holdings.length;

  return (
    <section
      aria-labelledby="portfolio-analysis-title"
      className={cn("@container rounded-lg bg-white shadow-card", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 pt-5 @2xl:px-6">
        <div className="min-w-0">
          <h2
            id="portfolio-analysis-title"
            className="font-display text-xl font-medium text-pnc-ink"
          >
            Portfolio Analysis
          </h2>
          <Link
            href={routes.assets}
            className="mt-0.5 inline-block text-sm font-semibold text-pnc-link hover:underline"
          >
            {p.investmentCount > 0
              ? `${p.investmentCount} Investment ${p.investmentCount === 1 ? "Account" : "Accounts"}`
              : `${accounts} ${accounts === 1 ? "Account" : "Accounts"}`}
          </Link>
        </div>
        <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-6 gap-y-0.5 text-right">
          <dt className="text-left text-sm text-pnc-ink">Total Value</dt>
          <dd className="font-display text-xl font-semibold text-pnc-ink">
            <Money value={p.total} />
          </dd>
          <dt className="text-left text-xs text-pnc-muted">Day Change</dt>
          <dd
            className={cn(
              "text-xs font-semibold",
              p.dayChange > 0 ? "text-pnc-positive" : "text-pnc-muted",
            )}
          >
            <Money value={p.dayChange} signed /> ({pctFine(p.dayChangePct)})
          </dd>
          <dd className="col-span-2 mt-1 flex items-center justify-end gap-2 text-2xs text-pnc-muted">
            As of {formatDate(MOCK_AS_OF)} <MockBadge />
          </dd>
        </dl>
      </header>

      {accounts === 0 ? (
        <p className="px-5 py-6 text-sm text-pnc-muted @2xl:px-6">No accounts yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 items-center gap-6 px-5 py-5 @2xl:grid-cols-[13rem_minmax(0,1fr)] @2xl:px-6">
            <Allocation groups={p.groups} />
            <ValueChart series={p.series} holdings={p.holdings} />
          </div>

          {/* High-level analysis: three figures, then the full breakdown on request. */}
          <dl className="grid grid-cols-1 border-t border-pnc-line @lg:grid-cols-3">
            <Insight label="12-month change">
              <Money value={p.yearChange} signed /> ({pct(p.yearChangePct, true)})
            </Insight>
            {p.largest && (
              <Insight label="Largest holding">
                {p.largest.label} · {pct(p.largest.share)}
              </Insight>
            )}
            <Insight label="Cash on hand">{pct(p.cashShare)} of portfolio</Insight>
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pnc-line px-3 py-2 @2xl:px-4">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-pnc-link hover:bg-pnc-blue-50 focus-visible:outline-2 focus-visible:outline-pnc-link"
            >
              {open ? "Hide analysis" : "Dive deeper"}
              <ChevronDown
                className={cn("size-4 transition-transform", open && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            <Link
              href={routes.assets}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-pnc-link hover:underline"
            >
              Open Assets and Debts <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div id={panelId} hidden={!open} className="border-t border-pnc-line">
            <Breakdown analysis={p} />
          </div>
        </>
      )}
    </section>
  );
}

function Insight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-pnc-line px-5 py-3 not-last:border-b @lg:not-last:border-b-0 @lg:not-last:border-r @2xl:px-6">
      <dt className="text-xs text-pnc-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-pnc-ink">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Allocation donut

const R = 48;
const C = 2 * Math.PI * R;
const GAP = 2; // surface gap between segments, in SVG units

function Allocation({ groups }: { groups: PortfolioAnalysis["groups"] }) {
  const [active, setActive] = useState<PortfolioGroup | null>(null);
  const shown = groups.find((g) => g.id === active);
  const gap = groups.length > 1 ? GAP : 0;
  // Where each segment starts along the ring, as a share of the circumference.
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((s, g) => s + g.share, 0));

  return (
    <div className="flex items-center gap-5 @2xl:flex-col @2xl:items-stretch">
      <div className="relative mx-auto size-36 shrink-0 @2xl:size-40">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" className="stroke-pnc-chip" />
          {groups.map((g, i) => {
            const len = Math.max(g.share * C - gap, 0.5);
            return (
              <circle
                key={g.id}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth={active === g.id ? 18 : 14}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-starts[i] * C}
                className={cn(stroke[g.id], "cursor-pointer transition-[stroke-width]")}
                onPointerEnter={() => setActive(g.id)}
                onPointerLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="font-display text-2xl font-semibold text-pnc-ink">
            {shown ? pct(shown.share) : "100%"}
          </span>
          <span className="text-2xs text-pnc-muted">{shown ? shown.label : "of Portfolio"}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {groups.map((g) => (
          <li
            key={g.id}
            onPointerEnter={() => setActive(g.id)}
            onPointerLeave={() => setActive(null)}
            className={cn(
              "flex items-baseline justify-between gap-3 rounded px-1.5 py-0.5 text-sm",
              active === g.id && "bg-pnc-surface",
            )}
          >
            <span className="flex min-w-0 items-center gap-2 text-pnc-ink">
              <span
                className={cn("size-2.5 shrink-0 rounded-full", fill[g.id])}
                aria-hidden="true"
              />
              {g.label}
              <span className="text-xs text-pnc-muted">{pct(g.share)}</span>
            </span>
            <Money value={g.value} compact className="shrink-0 font-semibold text-pnc-ink" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value over time

const ranges = [
  { id: "3M", months: 3 },
  { id: "6M", months: 6 },
  { id: "1Y", months: 12 },
] as const;

/** Clean tick values (1, 2 or 5 × a power of ten) spanning `min`..`max`. */
function ticks(min: number, max: number): number[] {
  const span = max - min || Math.max(Math.abs(max) * 0.02, 1);
  const raw = span / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.max(Math.ceil(max / step) * step, lo + step);
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(v);
  return out;
}

/**
 * The portfolio's value over the chosen range, then the same span ahead: the
 * expected path as a dashed line and the strong-to-weak range as a faint band
 * around it, from today's point. One color throughout; hover any month.
 */
function ValueChart({
  series: all,
  holdings,
}: {
  series: number[];
  holdings: PortfolioAnalysis["holdings"];
}) {
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("1Y");
  const [hover, setHover] = useState<number | null>(null);
  const months = ranges.find((r) => r.id === range)!.months;
  const past = all.slice(-(months + 1));
  const ahead = projectPortfolio(holdings, months);
  const today = months;
  const n = 2 * months + 1;
  const labels = Array.from({ length: n }, (_, i) => monthLabel(MOCK_AS_OF, i - today));
  const ys = ticks(Math.min(...past, ...ahead.weak), Math.max(...past, ...ahead.strong));
  const lo = ys[0];
  const hi = ys.at(-1)!;
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  const path = (values: number[], from: number) =>
    values.map((v, i) => `${i ? "L" : "M"}${x(from + i)},${y(v)}`).join(" ");
  const pastLine = path(past, 0);
  const expectedLine = path(ahead.expected, today);
  const band = `${path(ahead.strong, today)} ${[...ahead.weak]
    .reverse()
    .map((v, i) => `L${x(n - 1 - i)},${y(v)}`)
    .join(" ")} Z`;

  const point = hover ?? today;
  const future = point > today;
  const valueAt = (i: number) => (i > today ? ahead.expected[i - today] : past[i]);
  // Axis labels: the start, halfway back, today, halfway ahead and the end.
  const half = months / 2;
  const marks = [0, today - half, today, today + half, n - 1].filter((i) => Number.isInteger(i));

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setHover(Math.round(f * (n - 1)));
  };
  const step = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const from = hover ?? today;
    setHover(Math.min(Math.max(from + (e.key === "ArrowLeft" ? -1 : 1), 0), n - 1));
  };

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-pnc-muted">Value over time</p>
        <div role="group" aria-label="Time range" className="flex rounded-full bg-pnc-chip p-0.5">
          {ranges.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => {
                setRange(r.id);
                setHover(null);
              }}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                range === r.id ? "bg-white text-pnc-ink shadow-card" : "text-pnc-muted",
              )}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-3 h-44 pr-14">
        {/* Gridlines and y-axis labels, on the right as in the portfolio view. */}
        {ys.map((v) => (
          <div
            key={v}
            className="absolute inset-x-0 border-t border-pnc-line"
            style={{ top: `${y(v)}%` }}
          >
            <span className="absolute right-0 -translate-y-1/2 bg-white pl-2 text-2xs tabular-nums text-pnc-muted">
              {formatCompactMoney(v)}
            </span>
          </div>
        ))}

        <div className="relative h-full">
          {/* Today: where the record ends and the projection begins. */}
          <div
            className="pointer-events-none absolute inset-y-0 border-l border-pnc-muted/30"
            style={{ left: `${x(today)}%` }}
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            <path d={`${pastLine} L${x(today)},100 L0,100 Z`} className="fill-chart-cash/10" />
            <path d={band} className="fill-chart-cash/[0.07]" />
            <path
              d={pastLine}
              fill="none"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-chart-cash"
            />
            <path
              d={expectedLine}
              fill="none"
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-chart-cash"
            />
          </svg>

          {hover !== null && hover !== today && (
            <div
              className="pointer-events-none absolute inset-y-0 border-l border-pnc-muted/50"
              style={{ left: `${x(point)}%` }}
            />
          )}
          <span
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-cash ring-2 ring-white"
            style={{ left: `${x(point)}%`, top: `${y(valueAt(point))}%` }}
          />
          {hover !== null && (
            <div
              className={cn(
                // Beside the point: above it, or below when the point is near the top.
                "pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-pnc-navy px-2.5 py-1.5 text-xs text-white shadow-raised",
                y(valueAt(point)) > 40 ? "-mt-3 -translate-y-full" : "mt-3",
                point === 0 ? "" : point === n - 1 ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: `${x(point)}%`, top: `${y(valueAt(point))}%` }}
            >
              <span className="block text-white/75">
                {point === today ? "Today" : labels[point]}
                {future && " · projected"}
              </span>
              <Money value={valueAt(point)} className="font-semibold" />
              {future && (
                <span className="mt-0.5 block text-white/75">
                  <Money value={ahead.strong[point - today]} compact /> strong ·{" "}
                  <Money value={ahead.weak[point - today]} compact /> weak
                </span>
              )}
            </div>
          )}

          <div
            role="img"
            tabIndex={0}
            aria-label={`Portfolio value over the last ${months} months, from ${formatCompactMoney(past[0])} to ${formatCompactMoney(past[today])}, and projected ${months} months ahead: ${formatCompactMoney(ahead.expected[months])} expected, between ${formatCompactMoney(ahead.weak[months])} and ${formatCompactMoney(ahead.strong[months])}. Use the arrow keys to read each month.`}
            onPointerMove={pick}
            onPointerLeave={() => setHover(null)}
            onKeyDown={step}
            onBlur={() => setHover(null)}
            className="absolute inset-0 cursor-crosshair rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pnc-link"
          />
        </div>
      </div>

      <div className="relative mr-14 mt-1.5 h-4 text-2xs text-pnc-muted">
        {marks.map((i) => (
          <span
            key={i}
            className={cn(
              "absolute whitespace-nowrap",
              i === 0 ? "" : i === n - 1 ? "-translate-x-full" : "-translate-x-1/2",
              i === today && "font-semibold text-pnc-ink",
            )}
            style={{ left: `${x(i)}%` }}
          >
            {i === today ? "Today" : labels[i]}
          </span>
        ))}
      </div>

      {/* Legend: what each mark means. Values are on hover and in the table below. */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-pnc-muted">
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden="true">
            <path d="M1 2h14" strokeWidth="2" strokeLinecap="round" className="stroke-chart-cash" />
          </svg>
          Actual
        </li>
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 4" className="h-1 w-4" aria-hidden="true">
            <path
              d="M1 2h14"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              className="stroke-chart-cash"
            />
          </svg>
          Expected
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-chart-cash/15" aria-hidden="true" />
          Strong to weak markets
        </li>
        <li className="ml-auto">Illustrative, not a forecast</li>
      </ul>

      <table className="sr-only">
        <caption>Portfolio value by month, then projected</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Value or expected</th>
            <th scope="col">Strong</th>
            <th scope="col">Weak</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={i}>
              <th scope="row">{i === today ? `${l} (today)` : l}</th>
              <td>
                <Money value={valueAt(i)} />
              </td>
              <td>{i > today && <Money value={ahead.strong[i - today]} />}</td>
              <td>{i > today && <Money value={ahead.weak[i - today]} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dive deeper: every account's share and change

function Breakdown({ analysis: p }: { analysis: PortfolioAnalysis }) {
  const label = Object.fromEntries(p.groups.map((g) => [g.id, g.label]));
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-pnc-surface/70 text-left text-xs font-semibold text-pnc-muted">
          <th scope="col" className="px-5 py-2 font-semibold @2xl:px-6">
            Account
          </th>
          <th scope="col" className="hidden px-3 py-2 font-semibold @xl:table-cell">
            Share
          </th>
          <th scope="col" className="px-3 py-2 text-right font-semibold">
            Value
          </th>
          <th scope="col" className="hidden px-3 py-2 text-right font-semibold @lg:table-cell">
            12 months
          </th>
          <th scope="col" className="px-5 py-2 text-right font-semibold @2xl:px-6">
            Today
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-pnc-line">
        {p.holdings.map((h) => {
          const share = p.total > 0 ? h.value / p.total : 0;
          const year = h.history[0] > 0 ? h.yearChange / h.history[0] : 0;
          return (
            <tr key={h.account.id}>
              <th scope="row" className="px-5 py-3 text-left font-normal @2xl:px-6">
                <span className="flex items-center gap-2">
                  <span
                    className={cn("size-2.5 shrink-0 rounded-full", fill[h.group])}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-pnc-ink">
                      {accountLabel(h.account)}
                    </span>
                    <span className="block text-xs text-pnc-muted">{label[h.group]}</span>
                  </span>
                </span>
              </th>
              <td className="hidden px-3 py-3 @xl:table-cell">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-pnc-chip">
                    <span
                      className={cn("block h-full rounded-full", fill[h.group])}
                      style={{ width: `${share * 100}%` }}
                    />
                  </span>
                  <span className="text-xs tabular-nums text-pnc-muted">{pct(share)}</span>
                </span>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-pnc-ink">
                <Money value={h.value} />
              </td>
              <td className="hidden px-3 py-3 text-right @lg:table-cell">
                <Money value={h.yearChange} signed className="text-pnc-ink" />
                <span className="block text-xs text-pnc-muted">{pct(year, true)}</span>
              </td>
              <td className="px-5 py-3 text-right @2xl:px-6">
                <Money
                  value={h.dayChange}
                  signed
                  className={h.dayChange > 0 ? "text-pnc-positive" : "text-pnc-muted"}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
