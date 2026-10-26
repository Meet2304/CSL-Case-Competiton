"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Money } from "@/components/ui/Money";
import type { AdvisorCustomer } from "@/data/types";
import { openLoss } from "@/lib/advisor";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

type Hit = { customer: AdvisorCustomer; via?: string };

/** Clients whose name, family member or segment matches, best matches first. */
function search(customers: AdvisorCustomer[], query: string): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: (Hit & { rank: number })[] = [];
  for (const c of customers) {
    const name = c.name.toLowerCase();
    if (name.startsWith(q) || name.includes(` ${q}`)) hits.push({ customer: c, rank: 0 });
    else if (name.includes(q)) hits.push({ customer: c, rank: 1 });
    else {
      const member = c.household.find((m) => m.name.toLowerCase().includes(q));
      if (member)
        hits.push({ customer: c, via: `${member.relationship}: ${member.name}`, rank: 2 });
      else if (c.segment.toLowerCase().includes(q))
        hits.push({ customer: c, via: c.segment, rank: 3 });
    }
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, 8);
}

/**
 * Find a client by their name or a family member's, then open their summary.
 * Arrow keys move through results, Enter opens, Escape clears; "/" focuses it.
 */
export function ClientSearch({
  customers,
  className,
}: {
  customers: AdvisorCustomer[];
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const hits = useMemo(() => search(customers, query), [customers, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (hit: Hit | undefined) => {
    if (!hit) return;
    setOpen(false);
    router.push(routes.advisorClient(hit.customer.id));
  };

  const showList = open && query.trim() !== "";

  return (
    <div className={cn("relative", className)}>
      <label className="flex items-center gap-2 rounded-full border border-pnc-line bg-white px-4 py-2.5 shadow-card focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15">
        <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
        <span className="sr-only">Search clients</span>
        <input
          ref={input}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          value={query}
          placeholder="Search clients or family members"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(hits[active]);
            } else if (e.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-pnc-ink outline-none placeholder:text-pnc-muted"
        />
        <kbd className="hidden rounded border border-pnc-line px-1.5 text-[11px] text-pnc-muted @3xl:inline">
          /
        </kbd>
      </label>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching clients"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-md bg-white py-1 shadow-raised ring-1 ring-pnc-line"
        >
          {hits.length === 0 ? (
            <li className="px-4 py-3 text-sm text-pnc-muted">No clients match “{query}”.</li>
          ) : (
            hits.map((hit, i) => {
              const loss = openLoss(hit.customer);
              return (
                <li
                  key={hit.customer.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(hit)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-2.5",
                    i === active && "bg-pnc-blue-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-pnc-ink">
                      {hit.customer.name}
                    </span>
                    <span className="block truncate text-xs text-pnc-muted">
                      {hit.via ?? hit.customer.segment}
                      {loss && <span className="font-semibold text-attention"> · recent loss</span>}
                    </span>
                  </span>
                  <Money
                    value={hit.customer.relationshipValue}
                    compact
                    className="shrink-0 text-sm font-semibold"
                  />
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
