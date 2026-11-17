"use client";

import { NO_ACCESS } from "@/data/family";
import { assetCategories, type AssetAccess, type FamilyAsset } from "@/data/types";
import { cn } from "@/lib/format";

type Column = { key: "view" | "balance"; label: string; hint: string };

const columns: Column[] = [
  { key: "view", label: "Account", hint: "Knows the account exists, without its balance" },
  { key: "balance", label: "Account and balances", hint: "Knows the account and sees its balance" },
];

/** The one option picked for an asset; null keeps it hidden from the role. */
const levelOf = (a: AssetAccess): Column["key"] | null =>
  a.balance ? "balance" : a.view ? "view" : null;

const accessFor = (level: Column["key"] | null): AssetAccess =>
  level ? { ...NO_ACCESS, view: true, balance: level === "balance" } : NO_ACCESS;

/**
 * One round radio button. Picking it sets the asset's visibility; clicking it
 * again when it's already picked clears it, hiding the asset from the role.
 */
function Radio({
  name,
  picked,
  disabled,
  label,
  onPick,
}: {
  name: string;
  picked: boolean;
  disabled?: boolean;
  label?: string;
  onPick: (on: boolean) => void;
}) {
  return (
    <input
      type="radio"
      name={name}
      aria-label={label}
      checked={picked}
      disabled={disabled}
      onChange={() => onPick(true)}
      onClick={() => picked && onPick(false)}
      className="size-4 cursor-pointer accent-pnc-blue-700 disabled:cursor-default disabled:opacity-60"
    />
  );
}

/**
 * What a role can see, asset by asset: one radio button per asset, either
 * that the account exists or the account and its balance (neither picked:
 * hidden), grouped by category. Roles never grant control, since
 * only an account's owners can move money or change it. Table layout when the
 * container is wide, stacked rows when narrow (container queries, so it adapts
 * inside the phone too).
 */
export function AccessMatrix({
  assets,
  value,
  onChange,
  readOnly = false,
}: {
  assets: FamilyAsset[];
  value: (assetId: string) => AssetAccess;
  onChange?: (assetId: string, next: AssetAccess) => void;
  readOnly?: boolean;
}) {
  const groups = assetCategories
    .map((category) => ({ category, items: assets.filter((a) => a.category === category) }))
    .filter((g) => g.items.length > 0);

  const label = (asset: FamilyAsset) => `${asset.name}${asset.last4 ? ` x${asset.last4}` : ""}`;

  return (
    <div className="@container">
      {/* Wide: one table per category, like a permissions matrix. */}
      <div className="hidden space-y-5 @xl:block">
        {groups.map(({ category, items }) => (
          <table key={category} className="w-full table-fixed text-sm">
            <colgroup>
              <col />
              {columns.map((c) => (
                <col key={c.key} className="w-[8.5rem]" />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-pnc-line bg-pnc-surface">
                <th
                  scope="col"
                  className="rounded-tl-md px-4 py-2 text-left font-semibold text-pnc-ink"
                >
                  {category}
                </th>
                {columns.map((c, i) => (
                  <th
                    key={c.key}
                    scope="col"
                    title={c.hint}
                    className={cn(
                      "border-l border-pnc-line px-2 py-2 text-center text-xs font-semibold text-pnc-muted",
                      i === columns.length - 1 && "rounded-tr-md",
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((asset) => {
                const level = levelOf(value(asset.id));
                return (
                  <tr key={asset.id} className="border-b border-pnc-line last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      <span className="block truncate text-pnc-ink" title={label(asset)}>
                        {label(asset)}
                      </span>
                    </th>
                    {columns.map((c) => (
                      <td key={c.key} className="border-l border-pnc-line px-2 py-2.5 text-center">
                        <Radio
                          name={`see-${asset.id}`}
                          label={`${c.label}: ${label(asset)}`}
                          picked={level === c.key}
                          disabled={readOnly}
                          onPick={(on) => onChange?.(asset.id, accessFor(on ? c.key : null))}
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

      {/* Narrow: one row per asset with its two options underneath. */}
      <div className="space-y-5 @xl:hidden">
        {groups.map(({ category, items }) => (
          <section key={category}>
            <h4 className="mb-2 text-xs font-semibold text-pnc-muted">{category}</h4>
            <ul className="divide-y divide-pnc-line overflow-hidden rounded-md border border-pnc-line">
              {items.map((asset) => {
                const level = levelOf(value(asset.id));
                return (
                  <li key={asset.id} className="px-3 py-3">
                    <p className="text-sm font-semibold text-pnc-ink">{label(asset)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                      {columns.map((c) => (
                        <label key={c.key} className="flex items-center gap-2 text-sm text-pnc-ink">
                          <Radio
                            name={`see-narrow-${asset.id}`}
                            picked={level === c.key}
                            disabled={readOnly}
                            onPick={(on) => onChange?.(asset.id, accessFor(on ? c.key : null))}
                          />
                          {c.label}
                        </label>
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
