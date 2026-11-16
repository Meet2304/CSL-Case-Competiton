"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  Bitcoin,
  Briefcase,
  Car,
  ChartCandlestick,
  ChartLine,
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
  Palette,
  PencilLine,
  PiggyBank,
  Search,
  ShieldCheck,
  Sparkles,
  Sunset,
  Umbrella,
  Users,
  Wallet,
  Watch,
  X,
  type LucideIcon,
} from "lucide-react";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { PncMark } from "@/components/brand/PncLogo";
import { AddAssetFlow } from "@/components/customer/AddAssetFlow";
import { IconChip } from "@/components/ui/IconChip";
import { useHashTab } from "@/components/shared/useHashTab";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { addAssetGroups, type AddOption } from "@/data/addAsset";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

export const optionIcons: Record<string, LucideIcon> = {
  "pnc-deposit": PiggyBank,
  "pnc-investments": ChartLine,
  "pnc-retirement": Sunset,
  "pnc-trust": ShieldCheck,
  banks: Landmark,
  "joint-external": Users,
  workplace: Briefcase,
  "crypto-wallets": Wallet,
  insurance: Umbrella,
  "web-sync": Globe,
  "real-estate": House,
  vehicles: Car,
  jewelry: Watch,
  art: Palette,
  metals: Coins,
  appraise: Sparkles,
  stocks: ChartCandlestick,
  "crypto-tickers": Bitcoin,
  "qty-price": Hash,
  value: PencilLine,
  import: FileUp,
  portfolio: Network,
};

/** Three full rows of four on wide screens. */
const PAGE_SIZE = 12;

const classIds = addAssetGroups.map((g) => g.id);

const matches = (o: AddOption, q: string) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${o.label} ${o.description} ${o.category} ${o.keywords ?? ""}`.toLowerCase();
  return words.every((w) => text.includes(w));
};

/**
 * Add an asset (`routes.addAsset`): three classes of asset as tabs (PNC
 * accounts, external accounts, add manually; the open one is in the URL hash),
 * each a grid of cards four across on wide screens, twelve to a page. The same
 * one-line toolbar as Assets and Debts narrows the open class: a select menu
 * of its categories and a search. Each card opens a short demo flow.
 */
export function AddAsset() {
  const [tab, setTab] = useHashTab(classIds);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState<AddOption | null>(null);
  const searchId = useId();

  const current = addAssetGroups.find((g) => g.id === tab)!;
  const categories = [...new Set(current.options.map((o) => o.category))];
  const inClass = current.options.filter((o) => matches(o, query));
  const shown = inClass.filter((o) => category === "all" || o.category === category);
  const pager = usePagination(shown, PAGE_SIZE);
  // Where a search finds nothing here but something in another class.
  const elsewhere = addAssetGroups
    .filter((g) => g.id !== tab)
    .map((g) => ({ g, n: g.options.filter((o) => matches(o, query)).length }))
    .filter((x) => x.n > 0);

  // Any change to what's shown starts again from the first page.
  const narrow = (next: { query?: string; category?: string; tab?: string }) => {
    if (next.tab !== undefined) {
      setTab(next.tab);
      setCategory("all");
    }
    if (next.query !== undefined) setQuery(next.query);
    if (next.category !== undefined) setCategory(next.category);
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

      {/* The three classes, as tabs like the rest of the app. */}
      <div
        role="tablist"
        aria-label="Kinds of asset"
        className="no-scrollbar flex gap-2 overflow-x-auto border-b border-pnc-line"
      >
        {addAssetGroups.map((g) => {
          const selected = g.id === tab;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => narrow({ tab: g.id })}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-md font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                selected
                  ? "text-pnc-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
                  : "text-pnc-muted hover:text-pnc-ink",
              )}
            >
              {g.id === "pnc" && <PncMark size={16} />}
              {g.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs tabular-nums",
                  selected ? "bg-white text-pnc-ink shadow-card" : "bg-pnc-chip text-pnc-muted",
                )}
              >
                {g.options.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-pnc-muted">{current.intro}.</p>

      {/* One line to narrow the class, as on Assets and Debts: a category, then a search. */}
      <div className="mt-3 flex items-center gap-2">
        <SelectMenu
          label="Show"
          icon={<ListFilter className="size-4 text-pnc-muted" aria-hidden="true" />}
          value={category}
          onChange={(c) => narrow({ category: c })}
          options={[
            { id: "all", label: "All", count: inClass.length },
            ...categories.map((c) => ({
              id: c,
              label: c,
              count: inClass.filter((o) => o.category === c).length,
            })),
          ]}
        />
        <label
          htmlFor={searchId}
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-pnc-line bg-white px-3.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
        >
          <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
          <span className="sr-only">Search {current.label}</span>
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
          <p className="font-semibold text-pnc-ink">
            Nothing in {current.label} matches
            {query ? <> &ldquo;{query}&rdquo;</> : " this category"}
          </p>
          <p className="mt-1 text-sm text-pnc-muted">
            {elsewhere.length > 0 && query ? (
              <>
                Try{" "}
                {elsewhere.map(({ g, n }, i) => (
                  <span key={g.id}>
                    {i > 0 && " or "}
                    <button
                      type="button"
                      onClick={() => narrow({ tab: g.id })}
                      className="font-semibold text-pnc-link hover:underline"
                    >
                      {g.label} ({n})
                    </button>
                  </span>
                ))}
                , or add it manually by{" "}
              </>
            ) : (
              "You can still add it by "
            )}
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
                    <span className="flex items-center gap-1.5">
                      {tab === "pnc" && <PncMark size={14} />}
                      {c.category}
                    </span>
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
