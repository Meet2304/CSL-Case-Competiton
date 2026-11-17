"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ListFilter, Plus, Search, X } from "lucide-react";
import { AccountList } from "@/components/customer/AccountList";
import { ManageAsset } from "@/components/customer/ManageAsset";
import { RelationBadge, useAssetDetail } from "@/components/customer/assetDetail";
import { AssetSummary } from "@/components/customer/AssetSummary";
import { UnclaimedAssets, useWaitingClaims } from "@/components/customer/UnclaimedAssets";
import { useViewer } from "@/components/customer/Viewer";
import { useHash } from "@/components/shared/useHashTab";
import { Money } from "@/components/ui/Money";
import { SelectMenu } from "@/components/ui/SelectMenu";
import { cn } from "@/lib/format";
import {
  accountsOf,
  assetGroupOf,
  assetGroups,
  assetMatches,
  assetsFor,
  assetSummary,
  canManage,
  type PersonAsset,
} from "@/lib/household";
import { routes } from "@/lib/routes";

type Group = "personal" | "joint" | "shared";
type Filter = "all" | Group;

/** Whose an account is; every account falls into exactly one group. */
const filters: { id: Filter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "Everything you can see" },
  { id: "personal", label: "Personal", hint: "Yours alone, or held for your child" },
  { id: "joint", label: "Joint", hint: "Owned with someone else" },
  { id: "shared", label: "Shared with me", hint: "Shared by your family" },
];

/** The list's two tabs: what you own, and what you owe (cards). */
type Kind = "assets" | "debts";
const kinds: { id: Kind; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "debts", label: "Debts" },
];
const kindOf = (i: PersonAsset): Kind => (assetGroupOf(i.account) === "owed" ? "debts" : "assets");

const groupOf = (i: PersonAsset): Group =>
  i.relation === "shared"
    ? "shared"
    : i.relation === "owned" && i.account.owners.length > 1
      ? "joint"
      : "personal";

const MANAGE = "manage-";
const UNCLAIMED = "unclaimed";
const CLAIM = "claim-";

/**
 * Assets and Debts: a summary of what the person owns, then every account they can
 * see — their own, ones they manage for a child, and ones family shares with
 * them — in two tabs, Assets and Debts, each grouped by type, with one line
 * to narrow it: whose (All / Personal / Joint / Shared with me) and a search.
 * Owners name beneficiaries from each
 * account's Manage panel (`#manage-<id>`), so other pages can link straight
 * to it.
 *
 * Adults' will lives under the same navigation entry (`routes.will`, in the
 * Assets and Debts menu), since the will is the plan for what they own.
 *
 * While a death in the household is being settled, another tab, Unclaimed
 * assets (`#unclaimed`), lists the deceased's accounts that can pass to this
 * person, each with a guided claim opened in place (`#claim-<id>`).
 */
export function MyAssets() {
  const { person, accounts, household, deceasedIds, loss } = useViewer();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [kind, setKind] = useState<Kind>("assets");
  const listId = useId();
  const [hash, setHash] = useHash();
  const searchId = useId();
  const detail = useAssetDetail();
  const waitingClaims = useWaitingClaims();
  const unclaimed = Boolean(loss) && (hash === UNCLAIMED || hash.startsWith(CLAIM));
  const tabs = [
    { id: "mine", label: "Assets and Debts", badge: 0, selected: !unclaimed, hash: null },
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
  // Filters and search apply within the open tab; the summary's tiles (in "What you own")
  // count assets only, so their numbers match the Assets tab.
  const inKind = items.filter((i) => kindOf(i) === kind);
  const kindCount = (k: Kind) => items.filter((i) => kindOf(i) === k).length;
  const count = (list: PersonAsset[], f: Filter) =>
    f === "all" ? list.length : list.filter((i) => groupOf(i) === f).length;
  const owned = items.filter((i) => kindOf(i) === "assets");
  const counts = (f: Filter) => count(owned, f);
  const totalOf = (g: Group) =>
    owned
      .filter((i) => groupOf(i) === g && !i.account.external)
      .reduce((s, i) => s + i.account.balance, 0);

  const shown = inKind.filter(
    (i) => (filter === "all" || groupOf(i) === filter) && assetMatches(i, query),
  );
  const byId = new Map(shown.map((i) => [i.account.id, i]));
  const sections = assetGroups
    .map((g) => ({ ...g, items: shown.filter((i) => assetGroupOf(i.account) === g.id) }))
    .filter((g) => g.items.length > 0);

  const tiles = (["personal", "joint", "shared"] as const).filter((g) => counts(g) > 0);

  // Wide: the summary is a column beside the list, so the accounts start at the top of the page.
  return (
    <div className="@container">
      {loss && (
        <div
          role="tablist"
          aria-label="Assets and Debts"
          className="no-scrollbar mb-5 flex gap-2 overflow-x-auto border-b border-pnc-line"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.selected}
              onClick={() => setHash(t.hash)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-3 py-3 text-md font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                t.selected
                  ? "text-pnc-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
                  : "text-pnc-muted hover:text-pnc-ink",
              )}
            >
              {t.label}
              {!!t.badge && (
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
              <div
                className={cn(
                  "grid border-t border-pnc-line",
                  tiles.length === 3 ? "@xl:grid-cols-3" : "@xl:grid-cols-2",
                )}
              >
                {tiles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={kind === "assets" && filter === r}
                    onClick={() => {
                      setKind("assets");
                      setFilter(filter === r && kind === "assets" ? "all" : r);
                    }}
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
            <header>
              <div className="flex items-end justify-between gap-3 border-b border-pnc-line px-3 @2xl:px-4">
                <h2 id="all-assets-title" className="sr-only">
                  Assets and debts
                </h2>
                <div role="tablist" aria-label="Assets and debts" className="flex gap-1">
                  {kinds.map((k) => {
                    const selected = kind === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={listId}
                        onClick={() => setKind(k.id)}
                        className={cn(
                          "relative flex items-center gap-2 px-3 py-3.5 text-md font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                          selected
                            ? "text-pnc-ink after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
                            : "text-pnc-muted hover:text-pnc-ink",
                        )}
                      >
                        {k.label}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs tabular-nums",
                            selected ? "bg-pnc-chip text-pnc-ink" : "bg-pnc-surface text-pnc-muted",
                          )}
                        >
                          {kindCount(k.id)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Link
                  href={routes.addAsset}
                  className="mb-2.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pnc-blue-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  <Plus className="size-4" aria-hidden="true" /> Add asset
                </Link>
              </div>

              {/* One line to narrow the list: whose accounts, then a search. */}
              <div className="flex items-center gap-2 border-b border-pnc-line px-5 py-2.5 @2xl:px-6">
                <SelectMenu
                  label="Show"
                  icon={<ListFilter className="size-4 text-pnc-muted" aria-hidden="true" />}
                  value={filter}
                  onChange={setFilter}
                  options={filters
                    .filter((f) => f.id === "all" || f.id === filter || count(inKind, f.id) > 0)
                    .map((f) => ({ ...f, count: count(inKind, f.id) }))}
                />
                <label
                  htmlFor={searchId}
                  className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-pnc-line bg-white px-3.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
                >
                  <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
                  <span className="sr-only">Search your {kind}</span>
                  <input
                    id={searchId}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                    placeholder={`Search ${kind}`}
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
              </div>
            </header>

            <p role="status" className="sr-only">
              {shown.length} {shown.length === 1 ? "account" : "accounts"} shown
            </p>

            <div id={listId} role="tabpanel" aria-label={kind === "assets" ? "Assets" : "Debts"}>
              {inKind.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-semibold text-pnc-ink">
                    {kind === "debts" ? "Nothing owed" : "No assets yet"}
                  </p>
                  <p className="mt-1 text-sm text-pnc-muted">
                    {kind === "debts"
                      ? "You don't have a balance on any card or loan."
                      : "Add one to see it here."}
                  </p>
                </div>
              ) : sections.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-semibold text-pnc-ink">Nothing matches</p>
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
            </div>
          </section>
        </div>
      )}
      <ManageAsset item={managing ?? null} onClose={() => setHash(null)} />
    </div>
  );
}
