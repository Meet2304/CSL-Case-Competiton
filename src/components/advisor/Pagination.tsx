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
  const arrow =
    "grid size-8 place-items-center rounded-full text-pnc-link hover:bg-pnc-blue-50 disabled:text-pnc-line disabled:hover:bg-transparent";
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-pnc-line px-5 py-3 text-sm text-pnc-muted"
    >
      <span>
        {from}–{to} of {total} {noun}
      </span>
      <span className="flex items-center gap-1">
        <button type="button" className={arrow} onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeft className="size-5" />
        </button>
        {compact ? (
          <span className="px-1 tabular-nums">
            {page} / {pageCount}
          </span>
        ) : (
          Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "size-8 rounded-full font-semibold tabular-nums",
                n === page ? "bg-pnc-blue-700 text-white" : "text-pnc-link hover:bg-pnc-blue-50",
              )}
            >
              {n}
            </button>
          ))
        )}
        <button type="button" className={arrow} onClick={() => setPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
          <ChevronRight className="size-5" />
        </button>
      </span>
    </nav>
  );
}
