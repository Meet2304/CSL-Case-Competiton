import type { ReactNode } from "react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import { cn, formatDate } from "@/lib/format";
import type { balanceSheet } from "@/lib/portfolio";

/**
 * The home page's balance sheet, laid out like the private-bank portfolio
 * view: PNC assets, PNC liabilities, external accounts and net value in one
 * row. `children` sits underneath (the "all accounts" dropdown).
 */
export function PortfolioSummary({
  sheet,
  children,
  className,
}: {
  sheet: ReturnType<typeof balanceSheet>;
  children?: ReactNode;
  className?: string;
}) {
  const figures = [
    { label: "PNC Assets", value: sheet.assets },
    { label: "PNC Liabilities", value: sheet.liabilities },
    { label: "External Accounts", value: sheet.external },
    { label: "Net Value", value: sheet.net, net: true },
  ];

  return (
    <section
      aria-labelledby="portfolio-summary-title"
      className={cn("@container flex flex-col rounded-lg bg-white shadow-card", className)}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 @2xl:px-6">
        <div>
          <h2
            id="portfolio-summary-title"
            className="font-display text-xl font-medium text-pnc-ink"
          >
            Portfolio Summary
          </h2>
          <p className="mt-0.5 text-xs text-pnc-muted">As of {formatDate(MOCK_AS_OF)}</p>
        </div>
        <MockBadge />
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 pb-5 pt-5 @2xl:px-6 @xl:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="min-w-0">
            <dt
              className={cn(
                "text-sm font-semibold text-pnc-ink",
                f.net && "underline decoration-pnc-line underline-offset-4",
              )}
            >
              {f.label}
            </dt>
            <dd className="mt-1 text-pnc-ink">
              <Money value={f.value} className={cn(f.net && "font-semibold")} />
            </dd>
          </div>
        ))}
      </dl>
      {children && <div className="mt-auto">{children}</div>}
    </section>
  );
}
