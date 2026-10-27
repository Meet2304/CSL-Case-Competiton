"use client";

import { useId, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { AccountList } from "@/components/customer/AccountList";
import { ManageAsset } from "@/components/customer/ManageAsset";
import { RelationBadge, relationLabels, useAssetDetail } from "@/components/customer/assetDetail";
import { AssetSummary } from "@/components/customer/AssetSummary";
import { useViewer } from "@/components/customer/Viewer";
import { Money } from "@/components/ui/Money";
import { cn } from "@/lib/format";
import {
  accountsOf,
  assetGroupOf,
  assetGroups,
  assetMatches,
  assetsFor,
  assetSummary,
  canManage,
  type AssetRelation,
  type PersonAsset,
} from "@/lib/household";

type Filter = "all" | AssetRelation;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  ...(["owned", "managed", "shared"] as const).map((id) => ({ id, label: relationLabels[id] })),
];

/**
 * My Assets: a summary of what the person owns, then every account they can
 * see — their own, ones they manage for a child, and ones family shares with
 * them — searchable and grouped by type.
 */
export function MyAssets() {
  const { person, accounts, household, deceasedIds } = useViewer();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [managing, setManaging] = useState<PersonAsset | null>(null);
  const searchId = useId();
  const detail = useAssetDetail();

  const items = assetsFor(household, person.id, accounts, deceasedIds);
  const summary = assetSummary(accountsOf(accounts, person.id).owned);
  const counts = (r: Filter) =>
    r === "all" ? items.length : items.filter((i) => i.relation === r).length;
  const totalOf = (r: AssetRelation) =>
    items
      .filter((i) => i.relation === r && !i.account.external)
      .reduce((s, i) => s + i.account.balance, 0);

  const shown = items.filter(
    (i) => (filter === "all" || i.relation === filter) && assetMatches(i, query),
  );
  const byId = new Map(shown.map((i) => [i.account.id, i]));
  const sections = assetGroups
    .map((g) => ({ ...g, items: shown.filter((i) => assetGroupOf(i.account) === g.id) }))
    .filter((g) => g.items.length > 0);

  const tiles = (["owned", "managed", "shared"] as const).filter((r) => counts(r) > 0);

  return (
    <div className="@container space-y-5">
      <AssetSummary summary={summary} title="What you own">
        {tiles.length > 1 && (
          <div className="grid border-t border-pnc-line @xl:grid-cols-3">
            {tiles.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={filter === r}
                onClick={() => setFilter(filter === r ? "all" : r)}
                className="flex items-center justify-between gap-3 border-pnc-line px-5 py-3.5 text-left not-last:border-b hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link aria-pressed:bg-pnc-blue-50 @xl:not-last:border-b-0 @xl:not-last:border-r @2xl:px-6"
              >
                <span>
                  <span className="block text-xs text-pnc-muted">
                    {filters.find((f) => f.id === r)!.label}
                  </span>
                  <span className="block text-sm font-semibold text-pnc-ink">
                    {counts(r)} {counts(r) === 1 ? "account" : "accounts"}
                  </span>
                </span>
                <Money value={totalOf(r)} compact className="font-semibold text-pnc-ink" />
              </button>
            ))}
          </div>
        )}
      </AssetSummary>

      <section aria-labelledby="all-assets-title" className="rounded-lg bg-white shadow-card">
        <header className="space-y-3 border-b border-pnc-line px-5 py-4 @2xl:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="all-assets-title" className="font-semibold text-pnc-ink">
              All assets
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-pnc-muted">
              <Users className="size-4 text-pnc-blue-700" aria-hidden="true" />
              Includes accounts your family shares with you
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor={searchId}
              className="flex min-w-0 flex-1 basis-64 items-center gap-2 rounded-full border border-pnc-line bg-white px-4 py-2 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
            >
              <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
              <span className="sr-only">Search your assets</span>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                placeholder="Search by name, number, type, owner or family"
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
            <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5">
              {filters
                .filter((f) => f.id === "all" || counts(f.id) > 0)
                .map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-semibold ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                      filter === f.id
                        ? "bg-pnc-ink text-white ring-pnc-ink"
                        : "bg-white text-pnc-ink ring-pnc-line hover:ring-pnc-muted",
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "ml-1.5 tabular-nums",
                        filter === f.id ? "text-white/75" : "text-pnc-muted",
                      )}
                    >
                      {counts(f.id)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </header>

        <p role="status" className="sr-only">
          {shown.length} {shown.length === 1 ? "account" : "accounts"} shown
        </p>

        {sections.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-pnc-ink">No assets match</p>
            <p className="mt-1 text-sm text-pnc-muted">
              Try a different word, or{" "}
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="font-semibold text-pnc-link hover:underline"
              >
                show everything
              </button>
              .
            </p>
          </div>
        ) : (
          sections.map((g) => {
            const total = g.items
              .filter((i) => !i.account.external)
              .reduce((s, i) => s + i.account.balance, 0);
            return (
              <section
                key={g.id}
                aria-label={g.label}
                className="border-b border-pnc-line last:border-b-0"
              >
                <h3 className="flex items-baseline justify-between gap-3 bg-pnc-surface/70 px-5 py-2 text-xs font-semibold text-pnc-muted @2xl:px-6">
                  <span>
                    {g.label} · {g.items.length}
                  </span>
                  {g.id !== "insurance" && <Money value={total} className="text-pnc-ink" />}
                </h3>
                <AccountList
                  accounts={g.items.map((i) => i.account)}
                  detail={(a) => detail(byId.get(a.id)!)}
                  badge={(a) => <RelationBadge relation={byId.get(a.id)!.relation} />}
                  action={(a) => {
                    const item = byId.get(a.id)!;
                    // Only accounts this person may manage get the button; nothing hints at the rest.
                    if (!canManage(item, person.id)) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setManaging(item)}
                        className="ml-2 rounded-full border border-pnc-line px-3 py-1 text-sm font-semibold text-pnc-link hover:border-pnc-link hover:bg-pnc-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                      >
                        Manage<span className="sr-only"> {a.name}</span>
                      </button>
                    );
                  }}
                />
              </section>
            );
          })
        )}
      </section>
      <ManageAsset item={managing} onClose={() => setManaging(null)} />
    </div>
  );
}
