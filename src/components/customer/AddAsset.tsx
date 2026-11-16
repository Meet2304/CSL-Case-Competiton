"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  Bitcoin,
  Car,
  ChartCandlestick,
  ChevronRight,
  Coins,
  FileUp,
  Gem,
  Globe,
  Hash,
  House,
  Landmark,
  Network,
  PencilLine,
  Search,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { AddAssetFlow } from "@/components/customer/AddAssetFlow";
import { IconChip } from "@/components/ui/IconChip";
import { addAssetGroups, type AddOption } from "@/data/addAsset";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

export const optionIcons: Record<string, LucideIcon> = {
  banks: Landmark,
  "crypto-wallets": Wallet,
  "web-sync": Globe,
  stocks: ChartCandlestick,
  "crypto-tickers": Bitcoin,
  "real-estate": House,
  vehicles: Car,
  metals: Coins,
  appraise: Sparkles,
  "qty-price": Hash,
  value: PencilLine,
  import: FileUp,
  portfolio: Network,
};

const matches = (o: AddOption, q: string) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${o.label} ${o.description} ${o.keywords ?? ""}`.toLowerCase();
  return words.every((w) => text.includes(w));
};

/**
 * Add an asset (`routes.addAsset`): every kind of asset a customer can bring
 * into Assets and Debts, grouped by how it's added, each a row that opens a short
 * demo flow. A search box narrows the list; on wide screens an index of the
 * groups sits beside it.
 */
export function AddAsset() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<AddOption | null>(null);
  const searchId = useId();
  const groups = addAssetGroups
    .map((g) => ({ ...g, options: g.options.filter((o) => matches(o, query)) }))
    .filter((g) => g.options.length > 0);

  return (
    <div className="@container">
      <nav aria-label="Breadcrumb" className="mb-4 hidden text-sm @3xl:block">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href={routes.assets} className="font-semibold text-pnc-link hover:underline">
              Assets and Debts
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5 text-pnc-muted" />
          </li>
          <li aria-current="page" className="font-semibold text-pnc-ink">
            Add an asset
          </li>
        </ol>
      </nav>

      <div className="grid items-start gap-5 @4xl:grid-cols-[15rem_minmax(0,1fr)]">
        {/* The index: what can be added, at a glance. Wide screens only. */}
        <nav
          aria-label="Kinds of asset"
          className="sticky top-4 hidden rounded-lg bg-white py-2 shadow-card @4xl:block"
        >
          <ul>
            {addAssetGroups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`add-${g.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="flex w-full items-center justify-between gap-2 px-5 py-2.5 text-left text-sm font-semibold text-pnc-ink hover:bg-pnc-surface hover:text-pnc-link focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
                >
                  {g.label}
                  <span className="text-xs font-normal tabular-nums text-pnc-muted">
                    {g.options.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          <label
            htmlFor={searchId}
            className="flex items-center gap-2.5 rounded-full border border-pnc-line bg-white px-4 py-2.5 shadow-card focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
          >
            <Search className="size-4.5 shrink-0 text-pnc-muted" aria-hidden="true" />
            <span className="sr-only">Search kinds of asset</span>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="Search for a bank, a ticker or a kind of asset"
              className="min-w-0 flex-1 bg-transparent text-md text-pnc-ink outline-none placeholder:text-pnc-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="grid size-7 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </label>

          {groups.length === 0 ? (
            <div className="rounded-lg bg-white px-6 py-10 text-center shadow-card">
              <p className="font-semibold text-pnc-ink">Nothing matches &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-sm text-pnc-muted">
                You can still add it by{" "}
                <button
                  type="button"
                  onClick={() =>
                    setOpen(addAssetGroups.flatMap((g) => g.options).find((o) => o.id === "value")!)
                  }
                  className="font-semibold text-pnc-link hover:underline"
                >
                  entering its value yourself
                </button>
                .
              </p>
            </div>
          ) : (
            groups.map((g) => (
              <section
                key={g.id}
                id={`add-${g.id}`}
                aria-labelledby={`add-${g.id}-title`}
                className="scroll-mt-4 rounded-lg bg-white shadow-card"
              >
                <header className="border-b border-pnc-line px-5 py-4 @2xl:px-6">
                  <h2
                    id={`add-${g.id}-title`}
                    className="font-display text-lg font-medium text-pnc-ink"
                  >
                    {g.label}
                  </h2>
                  {g.intro && <p className="mt-0.5 text-sm text-pnc-muted">{g.intro}</p>}
                </header>
                <ul className="divide-y divide-pnc-line">
                  {g.options.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setOpen(o)}
                        className="group flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link @2xl:px-6"
                      >
                        <IconChip icon={optionIcons[o.id] ?? Gem} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-pnc-ink group-hover:text-pnc-link">
                            {o.label}
                          </span>
                          <span className="block text-sm text-pnc-muted">{o.description}</span>
                        </span>
                        <ChevronRight
                          className={cn("size-5 shrink-0 text-pnc-link")}
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}

          <p className="px-1 text-xs text-pnc-muted">
            You can enter a value in any currency, for example EUR 100 or GBP 100.
          </p>
        </div>
      </div>

      <AddAssetFlow option={open} onClose={() => setOpen(null)} />
    </div>
  );
}
