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
  ListFilter,
  Network,
  PencilLine,
  Search,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { AddAssetFlow } from "@/components/customer/AddAssetFlow";
import { IconChip } from "@/components/ui/IconChip";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { addAssetGroups, type AddOption } from "@/data/addAsset";
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

/** Two full rows of four on wide screens. */
const PAGE_SIZE = 8;

const options = addAssetGroups.flatMap((g) => g.options.map((o) => ({ ...o, group: g })));
type Card = (typeof options)[number];

const matches = (o: AddOption, q: string) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${o.label} ${o.description} ${o.keywords ?? ""}`.toLowerCase();
  return words.every((w) => text.includes(w));
};

/**
 * Add an asset (`routes.addAsset`): every kind of asset a customer can bring
 * into Assets and Debts, as a grid of cards (four across on wide screens),
 * paged. The same one-line toolbar as Assets and Debts narrows it: a select
 * menu for the kind and a search. Each card opens a short demo flow.
 */
export function AddAsset() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState<AddOption | null>(null);
  const searchId = useId();

  const inGroup = (c: Card) => group === "all" || c.group.id === group;
  const shown = options.filter((c) => inGroup(c) && matches(c, query));
  const pager = usePagination(shown, PAGE_SIZE);
  const countOf = (id: string) =>
    options.filter((c) => (id === "all" || c.group.id === id) && matches(c, query)).length;

  // Any change to what's shown starts again from the first page.
  const narrow = (next: { query?: string; group?: string }) => {
    if (next.query !== undefined) setQuery(next.query);
    if (next.group !== undefined) setGroup(next.group);
    pager.setPage(1);
  };

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

      {/* One line to narrow the cards, as on Assets and Debts: what kind, then a search. */}
      <div className="flex items-center gap-2">
        <SelectMenu
          label="Show"
          icon={<ListFilter className="size-4 text-pnc-muted" aria-hidden="true" />}
          value={group}
          onChange={(g) => narrow({ group: g })}
          options={[
            { id: "all", label: "All", hint: "Every kind of asset", count: countOf("all") },
            ...addAssetGroups.map((g) => ({
              id: g.id,
              label: g.label,
              hint: g.intro,
              count: countOf(g.id),
            })),
          ]}
        />
        <label
          htmlFor={searchId}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-pnc-line bg-white px-3.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
        >
          <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
          <span className="sr-only">Search kinds of asset</span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => narrow({ query: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && narrow({ query: "" })}
            placeholder="Search asset types"
            title="Search by name, like a bank, a ticker or a kind of asset"
            className="min-w-0 flex-1 bg-transparent text-sm text-pnc-ink outline-none placeholder:text-pnc-muted [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => narrow({ query: "" })}
              aria-label="Clear search"
              className="grid size-6 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-5 rounded-lg bg-white px-6 py-10 text-center shadow-card">
          <p className="font-semibold text-pnc-ink">Nothing matches &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-sm text-pnc-muted">
            You can still add it by{" "}
            <button
              type="button"
              onClick={() => setOpen(options.find((o) => o.id === "value")!)}
              className="font-semibold text-pnc-link hover:underline"
            >
              entering its value yourself
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-5 grid grid-cols-1 gap-4 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
            {pager.pageItems.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className="group flex h-full w-full flex-col rounded-lg bg-white p-5 text-left shadow-card transition-shadow hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  <IconChip icon={optionIcons[c.id] ?? Gem} />
                  <span className="mt-4 block font-semibold text-pnc-ink group-hover:text-pnc-link">
                    {c.label}
                  </span>
                  <span className="mt-1 block flex-1 text-sm leading-relaxed text-pnc-muted">
                    {c.description}
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-2 border-t border-pnc-line pt-3 text-xs text-pnc-muted">
                    {c.group.label}
                    <ChevronRight className="size-4 text-pnc-link" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Pagination {...pager} noun="kinds of asset" />
          </div>
        </>
      )}

      <p className="mt-2 text-xs text-pnc-muted">
        You can enter a value in any currency, for example EUR 100 or GBP 100.
      </p>

      <AddAssetFlow option={open} onClose={() => setOpen(null)} />
    </div>
  );
}
