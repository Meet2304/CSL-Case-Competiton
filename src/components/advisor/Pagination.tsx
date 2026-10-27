"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

/** Client-side pagination over an in-memory list. */
export function usePagination<T>(items: T[], pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(1);
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    pageCount,
    setPage,
    pageItems: items.slice(start, start + pageSize),
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
  };
}

/** Page numbers to show: always the first and last, the current page and its neighbours. */
function pageList(page: number, count: number): (number | "gap")[] {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["gap" as const, n] : [n]));
}

export function Pagination({
  page,
  pageCount,
  setPage,
  from,
  to,
  total,
  noun = "customers",
  compact = false,
}: Omit<ReturnType<typeof usePagination>, "pageItems"> & { noun?: string; compact?: boolean }) {
  const step =
    "inline-flex h-8 items-center gap-1 rounded-md px-2 font-semibold text-pnc-link hover:bg-pnc-blue-50 disabled:text-pnc-line disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-pnc-link";
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-pnc-line px-5 py-3 text-sm text-pnc-muted"
    >
      <span aria-live="polite">
        Showing{" "}
        <span className="font-semibold text-pnc-ink">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-pnc-ink">{total}</span> {noun}
      </span>
      {pageCount > 1 && (
        <span className="flex items-center gap-1">
          <button
            type="button"
            className={step}
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {!compact && <span>Previous</span>}
          </button>
          {compact ? (
            <span className="px-1 tabular-nums">
              {page} / {pageCount}
            </span>
          ) : (
            pageList(page, pageCount).map((n, i) =>
              n === "gap" ? (
                <span key={`gap-${i}`} className="px-1" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={cn(
                    "size-8 rounded-md font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-pnc-link",
                    n === page
                      ? "bg-pnc-blue-700 text-white"
                      : "text-pnc-ink ring-1 ring-pnc-line hover:ring-pnc-link",
                  )}
                >
                  {n}
                </button>
              ),
            )
          )}
          <button
            type="button"
            className={step}
            onClick={() => setPage(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
          >
            {!compact && <span>Next</span>}
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </span>
      )}
    </nav>
  );
}
