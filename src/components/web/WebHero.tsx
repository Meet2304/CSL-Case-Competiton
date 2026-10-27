import type { ReactNode } from "react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { MOCK_AS_OF } from "@/data/mock";
import { cn, formatDate } from "@/lib/format";

/** The blue faceted band under the top nav: date line + page title. */
export function WebHero({
  title,
  subtitle,
  showDate = true,
  aside,
  className,
}: {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  /** Right side of the band on wide screens (e.g. a search field); wraps below on narrow ones. */
  aside?: ReactNode;
  /** Extra classes for the inner container (e.g. more bottom padding for overlapping cards). */
  className?: string;
}) {
  return (
    <section className="relative isolate text-white">
      <FacetBackdrop className="-z-10" />
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 pb-8 pt-6 sm:px-6",
          className,
        )}
      >
        <div className="min-w-0">
          {showDate && <p className="text-sm text-white/85">{formatDate(MOCK_AS_OF, "long")}</p>}
          <h1 className="mt-1 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/85">{subtitle}</p>}
        </div>
        {aside}
      </div>
    </section>
  );
}
