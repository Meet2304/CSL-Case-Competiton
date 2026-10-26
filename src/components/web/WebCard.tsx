import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/** White panel with a header row, matching the online banking dashboard cards. */
export function WebCard({
  title,
  subtitle,
  aside,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right side of the header row (e.g. a total or a "View All" link). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md bg-white shadow-card", className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-pnc-line px-5 py-4">
        <h2 className="text-lg font-semibold text-pnc-ink">
          {title}
          {subtitle && (
            <span className="ml-1.5 text-xs font-normal text-pnc-muted">{subtitle}</span>
          )}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
