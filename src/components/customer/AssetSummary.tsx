import type { ReactNode } from "react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import type { AssetGroup, assetSummary } from "@/lib/household";
import { cn, formatCompactMoney } from "@/lib/format";

type Summary = ReturnType<typeof assetSummary>;

export const groupTone: Record<AssetGroup, string> = {
  cash: "bg-pnc-blue-600",
  retirement: "bg-pnc-navy",
  investments: "bg-pnc-orange",
  insurance: "bg-pnc-muted",
  owed: "bg-pnc-negative",
};

/**
 * Money at a glance: one total, a bar showing how it splits, and a legend.
 * `children` sits under the legend (e.g. the "all accounts" dropdown).
 */
export function AssetSummary({
  summary,
  title = "Your money at a glance",
  caption,
  children,
  className,
}: {
  summary: Summary;
  title?: string;
  /** Overrides the default line under the total. */
  caption?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { net, holdings, owed, outside } = summary;
  const positive = holdings.reduce((s, g) => s + g.total, 0);
  const atPnc = summary.count - outside.length;

  return (
    <section
      aria-labelledby="asset-summary-title"
      className={cn("@container flex flex-col rounded-lg bg-white shadow-card", className)}
    >
      <div className="px-5 pb-5 pt-5 @2xl:px-6">
        <header className="flex items-center justify-between gap-3">
          <h2 id="asset-summary-title" className="text-sm font-semibold text-pnc-muted">
            {title}
          </h2>
          <MockBadge />
        </header>

        <p className="mt-3 font-display text-4xl font-medium tracking-tight text-pnc-ink @2xl:text-[2.75rem]">
          <Money value={net} />
        </p>
        <p className="mt-1 text-sm text-pnc-muted">
          {caption ?? (
            <>
              Across {atPnc} {atPnc === 1 ? "account" : "accounts"} at PNC
              {outside.length > 0 && (
                <>
                  {" · plus "}
                  {outside
                    .map((a) => `a ${formatCompactMoney(a.balance)} ${a.name.toLowerCase()}`)
                    .join(" and ")}{" "}
                  held outside PNC
                </>
              )}
            </>
          )}
        </p>

        {positive > 0 && (
          <>
            {/* Decorative: the legend below carries the same figures as text. */}
            <div
              aria-hidden="true"
              className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-pnc-chip"
            >
              {holdings.map((g) => (
                <span
                  key={g.id}
                  className={cn("h-full first:rounded-l-full last:rounded-r-full", groupTone[g.id])}
                  style={{ width: `${(g.total / positive) * 100}%` }}
                />
              ))}
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-2 @[22rem]:grid-cols-2 @[22rem]:gap-y-3 @xl:grid-cols-4">
              {holdings.map((g) => (
                <div
                  key={g.id}
                  className="flex min-w-0 items-baseline justify-between gap-3 @[22rem]:block"
                >
                  <dt className="flex items-center gap-1.5 text-xs text-pnc-muted">
                    <span
                      className={cn("size-2 shrink-0 rounded-full", groupTone[g.id])}
                      aria-hidden="true"
                    />
                    {g.label}
                    <span className="text-pnc-muted/80">
                      · {Math.round((g.total / positive) * 100)}%
                    </span>
                  </dt>
                  <dd className="font-semibold @[22rem]:mt-0.5 text-pnc-ink">
                    <Money value={g.total} />
                  </dd>
                </div>
              ))}
              {owed < 0 && (
                <div className="flex min-w-0 items-baseline justify-between gap-3 @[22rem]:block">
                  <dt className="flex items-center gap-1.5 text-xs text-pnc-muted">
                    <span
                      className="size-2 shrink-0 rounded-full ring-2 ring-inset ring-pnc-negative"
                      aria-hidden="true"
                    />
                    Owed on cards
                  </dt>
                  <dd className="font-semibold @[22rem]:mt-0.5">
                    <Money value={owed} />
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </section>
  );
}
