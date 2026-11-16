import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** "Assets and Debts › Your will": the way back up from a page under a nav section. */
export function PageBreadcrumb({
  trail,
  current,
}: {
  trail: { label: string; href: string }[];
  current: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((c) => (
          <li key={c.href} className="flex items-center gap-1.5">
            <Link href={c.href} className="font-semibold text-pnc-link hover:underline">
              {c.label}
            </Link>
            <ChevronRight className="size-3.5 text-pnc-muted" aria-hidden="true" />
          </li>
        ))}
        <li aria-current="page" className="font-semibold text-pnc-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}
