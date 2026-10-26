"use client";

import { Lock } from "lucide-react";
import { Fragment } from "react";
import { FULL_ACCESS, NO_ACCESS } from "@/data/family";
import { assetCategories, type AssetAccess, type FamilyAsset } from "@/data/types";
import { isFull, normalizeAccess } from "@/lib/family";
import { cn } from "@/lib/format";
import { Checkbox } from "./parts";

type Column = { key: keyof AssetAccess; label: string; hint: string };

const visibility: Column[] = [
  { key: "view", label: "View balance", hint: "See the asset and its balance" },
  { key: "activity", label: "View activity", hint: "See transactions, statements and documents" },
];
const control: Column[] = [
  { key: "transact", label: "Transact", hint: "Move money, pay or trade" },
  { key: "manage", label: "Manage", hint: "Change settings, cards and beneficiaries" },
];
const columns = [...visibility, ...control];

/** Applies one checkbox change while keeping the permission set consistent. */
function toggle(current: AssetAccess, key: keyof AssetAccess | "full"): AssetAccess {
  if (key === "full") return isFull(current) ? NO_ACCESS : FULL_ACCESS;
  if (key === "view" && current.view) return NO_ACCESS; // hiding an asset removes everything
  return normalizeAccess({ ...current, [key]: !current[key] });
}

/**
 * Segmented access control: per-asset visibility and control checkboxes,
 * grouped by category. Table layout when the container is wide, stacked
 * cards when narrow (container queries, so it adapts inside the phone too).
 */
export function AccessMatrix({
  assets,
  value,
  onChange,
  readOnly = false,
  lockedIds,
}: {
  assets: FamilyAsset[];
  value: (assetId: string) => AssetAccess;
  onChange?: (assetId: string, next: AssetAccess) => void;
  readOnly?: boolean;
  /** Assets whose control is frozen by an in-progress legal process. */
  lockedIds: Set<string>;
}) {
  const groups = assetCategories
    .map((category) => ({ category, items: assets.filter((a) => a.category === category) }))
    .filter((g) => g.items.length > 0);

  const disabledFor = (asset: FamilyAsset, key: keyof AssetAccess | "full") =>
    readOnly ||
    ((lockedIds.has(asset.id) || asset.closed === true) &&
      (key === "transact" || key === "manage" || key === "full"));

  const label = (asset: FamilyAsset) => `${asset.name}${asset.last4 ? ` x${asset.last4}` : ""}`;

  return (
    <div className="@container">
      {/* Wide: one table per category, like a permissions matrix. */}
      <div className="hidden space-y-5 @2xl:block">
        {groups.map(({ category, items }) => (
          <table key={category} className="w-full table-fixed text-sm">
            <colgroup>
              <col />
              <col className="w-16" />
              {columns.map((c) => (
                <col key={c.key} className="w-24" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-pnc-surface">
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="rounded-tl-md px-4 py-2 text-left font-semibold text-pnc-ink"
                >
                  {category}
                </th>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="border-l border-pnc-line px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-pnc-muted"
                >
                  Visibility
                </th>
                <th
                  scope="colgroup"
                  colSpan={2}
                  className="rounded-tr-md border-l border-pnc-line px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-pnc-muted"
                >
                  Control
                </th>
              </tr>
              <tr className="border-b border-pnc-line text-xs text-pnc-muted">
                <th scope="col" className="px-4 py-2 text-left font-semibold">
                  Asset
                </th>
                <th scope="col" className="px-2 py-2 text-center font-semibold">
                  Full
                </th>
                {columns.map((c, i) => (
                  <th
                    key={c.key}
                    scope="col"
                    title={c.hint}
                    className={cn(
                      "px-2 py-2 text-center font-semibold",
                      (i === 0 || i === 2) && "border-l border-pnc-line",
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((asset) => {
                const access = value(asset.id);
                const locked = lockedIds.has(asset.id);
                return (
                  <tr key={asset.id} className="border-b border-pnc-line last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      <span className="block truncate text-pnc-ink" title={label(asset)}>
                        {label(asset)}
                      </span>
                      {(locked || asset.closed) && (
                        <span className="flex items-center gap-1 text-xs text-pnc-muted">
                          <Lock className="size-3" aria-hidden="true" />
                          {asset.closed ? "Closed" : "Control locked · legal process in progress"}
                        </span>
                      )}
                    </th>
                    <td className="px-2 py-2.5 text-center">
                      <Checkbox
                        aria-label={`Full access to ${label(asset)}`}
                        checked={isFull(access)}
                        disabled={disabledFor(asset, "full")}
                        onChange={() => onChange?.(asset.id, toggle(access, "full"))}
                      />
                    </td>
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-2 py-2.5 text-center",
                          (i === 0 || i === 2) && "border-l border-pnc-line",
                        )}
                      >
                        <Checkbox
                          aria-label={`${c.label}: ${label(asset)}`}
                          checked={access[c.key]}
                          disabled={disabledFor(asset, c.key)}
                          onChange={() => onChange?.(asset.id, toggle(access, c.key))}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </div>

      {/* Narrow: one card per asset with labelled toggles. */}
      <div className="space-y-5 @2xl:hidden">
        {groups.map(({ category, items }) => (
          <section key={category}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
              {category}
            </h4>
            <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
              {items.map((asset) => {
                const access = value(asset.id);
                const locked = lockedIds.has(asset.id);
                return (
                  <li key={asset.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-pnc-ink">
                          {label(asset)}
                        </span>
                        {(locked || asset.closed) && (
                          <span className="flex items-center gap-1 text-xs text-pnc-muted">
                            <Lock className="size-3" aria-hidden="true" />{" "}
                            {asset.closed ? "Closed" : "Control locked"}
                          </span>
                        )}
                      </span>
                      <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-pnc-ink">
                        <Checkbox
                          checked={isFull(access)}
                          disabled={disabledFor(asset, "full")}
                          onChange={() => onChange?.(asset.id, toggle(access, "full"))}
                        />
                        Full
                      </label>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {[
                        { title: "Visibility", cols: visibility },
                        { title: "Control", cols: control },
                      ].map(({ title, cols }) => (
                        <Fragment key={title}>
                          <p className="col-span-2 mt-1 text-[11px] font-semibold uppercase tracking-wide text-pnc-muted first:mt-0">
                            {title}
                          </p>
                          {cols.map((c) => (
                            <label
                              key={c.key}
                              className="flex items-center gap-2 text-sm text-pnc-ink"
                            >
                              <Checkbox
                                checked={access[c.key]}
                                disabled={disabledFor(asset, c.key)}
                                onChange={() => onChange?.(asset.id, toggle(access, c.key))}
                              />
                              {c.label}
                            </label>
                          ))}
                        </Fragment>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
