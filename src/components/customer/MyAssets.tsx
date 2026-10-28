"use client";

import { useId, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { AccountList } from "@/components/customer/AccountList";
import { ManageAsset } from "@/components/customer/ManageAsset";
import { RelationBadge, useAssetDetail } from "@/components/customer/assetDetail";
import { AssetSummary } from "@/components/customer/AssetSummary";
import { UnclaimedAssets, useWaitingClaims } from "@/components/customer/UnclaimedAssets";
import { useViewer } from "@/components/customer/Viewer";
import { useHash } from "@/components/shared/useHashTab";
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
} from "@/lib/household";

type Group = "personal" | "shared";
type Filter = "all" | Group;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "personal", label: "Personal" },
  { id: "shared", label: "Shared" },
];

/** Personal: accounts you own, or hold for your child. Shared: what family shares with you. */
const groupOf = (r: AssetRelation): Group => (r === "shared" ? "shared" : "personal");

const MANAGE = "manage-";
const UNCLAIMED = "unclaimed";
const CLAIM = "claim-";

/**
 * My Assets: a summary of what the person owns, then every account they can
 * see — their own, ones they manage for a child, and ones family shares with
 * them — searchable and grouped by type. Owners name beneficiaries from each
 * account's Manage panel (`#manage-<id>`), so other pages can link straight
 * to it.
 *
 * While a death in the household is being settled, a second tab, Unclaimed
 * assets (`#unclaimed`), lists the deceased's accounts that can pass to this
 * person, each with a guided claim opened in place (`#claim-<id>`).
 */
export function MyAssets() {
  const { person, accounts, household, deceasedIds, loss } = useViewer();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [hash, setHash] = useHash();
  const searchId = useId();
  const detail = useAssetDetail();
  const waitingClaims = useWaitingClaims();
  const unclaimed = Boolean(loss) && (hash === UNCLAIMED || hash.startsWith(CLAIM));
  const tabs = [
    { id: "mine", label: "My assets", badge: 0, selected: !unclaimed, hash: null },
    {
      id: UNCLAIMED,
      label: "Unclaimed assets",
      badge: waitingClaims,
      selected: unclaimed,
      hash: UNCLAIMED,
    },
  ];

  const items = assetsFor(household, person.id, accounts, deceasedIds);
  const managing = hash.startsWith(MANAGE)
    ? items.find((i) => i.account.id === hash.slice(MANAGE.length) && canManage(i, person.id))
    : undefined;

  const summary = assetSummary(accountsOf(accounts, person.id).owned);
  const counts = (f: Filter) =>
    f === "all" ? items.length : items.filter((i) => groupOf(i.relation) === f).length;
  const totalOf = (g: Group) =>
    items
      .filter((i) => groupOf(i.relation) === g && !i.account.external)
      .reduce((s, i) => s + i.account.balance, 0);

  const shown = items.filter(
    (i) => (filter === "all" || groupOf(i.relation) === filter) && assetMatches(i, query),
  );
  const byId = new Map(shown.map((i) => [i.account.id, i]));
  const sections = assetGroups
    .map((g) => ({ ...g, items: shown.filter((i) => assetGroupOf(i.account) === g.id) }))
    .filter((g) => g.items.length > 0);

  const tiles = (["personal", "shared"] as const).filter((g) => counts(g) > 0);

  const sharedCount = counts("shared");

  // Wide: the summary is a column beside the list, so the accounts start at the top of the page.
  return (
    <div className="@container">
      {loss && (
        <div
          role="tablist"
          aria-label="My Assets"
          className="mb-5 flex gap-2 border-b border-pnc-line"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.selected}
              onClick={() => setHash(t.hash)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-3 text-md font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                t.selected
                  ? "text-pnc-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
                  : "text-pnc-muted hover:text-pnc-ink",
              )}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pnc-orange px-1.5 text-2xs font-bold text-white">
                  {t.badge}
                  <span className="sr-only"> waiting</span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {unclaimed ? (
        <UnclaimedAssets
          claimId={hash.startsWith(CLAIM) ? hash.slice(CLAIM.length) : undefined}
          onOpen={(id) => setHash(CLAIM + id)}
          onBack={() => setHash(UNCLAIMED)}
        />
      ) : (
        <div className="grid items-start gap-5 @3xl:grid-cols-[18rem_minmax(0,1fr)] @6xl:grid-cols-[22rem_minmax(0,1fr)]">
          <AssetSummary summary={summary} title="What you own" className="@3xl:sticky @3xl:top-4">
            {tiles.length > 1 && (
              <div className="grid border-t border-pnc-line @xl:grid-cols-2">
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

          <section
            aria-labelledby="all-assets-title"
            className="min-w-0 rounded-lg bg-white shadow-card"
          >
            {/* One row on wide screens: title, filters, then a compact search. */}
            <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-pnc-line px-5 py-3.5 @2xl:px-6">
              <div className="mr-auto min-w-0">
                <h2 id="all-assets-title" className="font-semibold text-pnc-ink">
                  All assets
                </h2>
                {sharedCount > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-pnc-muted">
                    <Users className="size-3.5 text-pnc-blue-700" aria-hidden="true" />
                    Includes {sharedCount} {sharedCount === 1 ? "account" : "accounts"} your family
                    shares with you
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor={searchId}
                  className="order-last flex w-full @3xl:w-40 @6xl:w-52 min-w-0 items-center gap-2 rounded-full border border-pnc-line bg-white px-3.5 py-1.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
                >
                  <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
                  <span className="sr-only">Search your assets</span>
                  <input
                    id={searchId}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                    placeholder="Search assets"
                    title="Search by name, number, type, owner or family"
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
                            onClick={() => setHash(`${MANAGE}${a.id}`)}
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
        </div>
      )}
      <ManageAsset item={managing ?? null} onClose={() => setHash(null)} />
    </div>
  );
}
