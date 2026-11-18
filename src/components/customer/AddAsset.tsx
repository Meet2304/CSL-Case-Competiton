"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  Bitcoin,
  Briefcase,
  Car,
  ChartCandlestick,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileUp,
  Gem,
  Globe,
  Hash,
  House,
  Landmark,
  Network,
  Palette,
  PiggyBank,
  Plus,
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
import { PncMark } from "@/components/brand/PncLogo";
import { AddAssetFlow } from "@/components/customer/AddAssetFlow";
import { IconChip } from "@/components/ui/IconChip";
import { addAssetGroups, type AddGroup, type AddOption } from "@/data/addAsset";
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
  value: Plus,
  import: FileUp,
  portfolio: Network,
};

/**
 * The manual entry that always leads the "Manually Add Assets and Debts" row, whatever the
 * search.
 */
const OWN = "value";

const matches = (o: AddOption, q: string) => {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = `${o.label} ${o.description} ${o.category} ${o.keywords ?? ""}`.toLowerCase();
  return words.every((w) => text.includes(w));
};

/**
 * Add an asset (`routes.addAsset`): the three classes of asset (PNC accounts,
 * external accounts, manually added assets and debts) as three titled rows on
 * one page, each a horizontally scrolling strip of cards with arrow buttons.
 * One search filters every row. "Add your own asset" always leads the last row. Each card opens
 * a short demo flow.
 */
export function AddAsset() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<AddOption | null>(null);
  const searchId = useId();

  return (
    <div className="@container">
      <nav aria-label="Breadcrumb" className="mb-3 hidden text-sm @3xl:block">
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

      <label
        htmlFor={searchId}
        className="flex h-9 items-center gap-2 rounded-full border border-pnc-line bg-white px-3.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
      >
        <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
        <span className="sr-only">Search asset types</span>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="Search asset types"
          title="Search by name, like a bank, a ticker or a kind of asset"
          className="min-w-0 flex-1 bg-transparent text-sm text-pnc-ink outline-none placeholder:text-pnc-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="grid size-6 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </label>

      <div className="mt-5 space-y-6">
        {addAssetGroups.map((g) => (
          <ClassRow
            key={g.id}
            group={g}
            items={g.options.filter((o) => o.id === OWN || matches(o, query))}
            onOpen={setOpen}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-pnc-muted">
        You can enter a value in any currency, for example EUR 100 or GBP 100.
      </p>

      <AddAssetFlow option={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/** One class: its title and a strip of cards that scrolls sideways, with arrows to step. */
function ClassRow({
  group: g,
  items,
  onOpen,
}: {
  group: AddGroup;
  items: AddOption[];
  onOpen: (o: AddOption) => void;
}) {
  const pinned = items.find((o) => o.id === OWN);
  const rest = items.filter((o) => o.id !== OWN);
  const strip = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: true });
  const titleId = useId();

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const measure = () =>
      setEnds({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
    el.scrollTo({ left: 0 });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [items.length]);

  const step = (dir: 1 | -1) =>
    strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section aria-labelledby={titleId}>
      <header className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="flex items-center gap-2 font-display text-lg font-medium text-pnc-ink"
          >
            {g.id === "pnc" && <PncMark size={18} />}
            {g.label}
            <span className="rounded-full bg-pnc-chip px-2 py-0.5 font-sans text-xs tabular-nums text-pnc-muted">
              {items.length}
            </span>
          </h2>
          <p className="text-sm text-pnc-muted">{g.intro}.</p>
        </div>
        {!(ends.start && ends.end) && (
          <div className="flex shrink-0 gap-1.5">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => step(dir)}
                disabled={dir === -1 ? ends.start : ends.end}
                aria-label={`${dir === -1 ? "Previous" : "More"} in ${g.label}`}
                className="grid size-8 place-items-center rounded-full bg-white text-pnc-link shadow-card hover:bg-pnc-blue-50 disabled:text-pnc-line disabled:shadow-none disabled:hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
              >
                {dir === -1 ? (
                  <ChevronLeft className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-pnc-line px-4 py-6 text-center text-sm text-pnc-muted">
          Nothing here matches your search.
        </p>
      ) : (
        <div className="flex flex-col gap-2 @xl:flex-row @xl:gap-3">
          {/* "Add your own asset" sits in its own column, so it never scrolls out of view. */}
          {pinned && (
            <div className="shrink-0 py-1 @xl:w-64">
              <OptionCard option={pinned} own onOpen={() => onOpen(pinned)} />
            </div>
          )}
          <div className="relative min-w-0 flex-1">
            <ul
              ref={strip}
              className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 px-1 py-1"
            >
              {rest.map((o) => (
                <li key={o.id} className="w-64 shrink-0 snap-start">
                  <OptionCard option={o} own={false} onOpen={() => onOpen(o)} />
                </li>
              ))}
            </ul>
            {/* Soft edges say there's more to scroll to. */}
            {!ends.start && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-pnc-surface to-transparent"
              />
            )}
            {!ends.end && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-pnc-surface to-transparent"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function OptionCard({
  option: o,
  own,
  onOpen,
}: {
  option: AddOption;
  own: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex h-full w-full items-start gap-3 rounded-lg p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
        own
          ? "border-2 border-dashed border-pnc-link/50 bg-pnc-blue-50 hover:border-pnc-link"
          : "bg-white shadow-card transition-shadow hover:shadow-raised",
      )}
    >
      {own ? (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-blue-700 text-white">
          <Plus className="size-5" aria-hidden="true" />
        </span>
      ) : (
        <IconChip icon={optionIcons[o.id] ?? Gem} size="sm" />
      )}
      <span className="min-w-0">
        <span
          className={cn(
            "block text-sm font-semibold",
            own ? "text-pnc-link" : "text-pnc-ink group-hover:text-pnc-link",
          )}
        >
          {o.label}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-pnc-muted">
          {o.description}
        </span>
      </span>
    </button>
  );
}
