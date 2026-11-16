"use client";

import { NO_ACCESS } from "@/data/family";
import { assetCategories, type AssetAccess, type FamilyAsset } from "@/data/types";
import { cn } from "@/lib/format";

type Level = "hidden" | "balance" | "activity";

const levels: { id: Level; label: string }[] = [
  { id: "hidden", label: "Hidden" },
  { id: "balance", label: "Balance" },
  { id: "activity", label: "Balance and activity" },
];

const levelOf = (a: AssetAccess): Level =>
  a.activity ? "activity" : a.view ? "balance" : "hidden";

const accessFor = (level: Level): AssetAccess =>
  level === "hidden" ? NO_ACCESS : { ...NO_ACCESS, view: true, activity: level === "activity" };

/**
 * What a role can see, asset by asset: hidden, the balance, or the balance
 * and its activity. Roles only decide visibility; moving money or changing an
 * account is for its owners alone, so there is nothing else to set here.
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
    <div className="space-y-5">
      {groups.map(({ category, items }) => (
        <section key={category}>
          <h4 className="mb-2 text-xs font-semibold text-pnc-muted">{category}</h4>
          <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
            {items.map((asset) => {
              const current = levelOf(value(asset.id));
              return (
                <li
                  key={asset.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
                >
                  <span className="min-w-0 flex-1 basis-40 text-sm font-semibold text-pnc-ink">
                    {label(asset)}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={`What this role sees of ${label(asset)}`}
                    className="flex shrink-0 rounded-full bg-pnc-chip p-0.5"
                  >
                    {levels.map((l) => {
                      const on = current === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={readOnly}
                          onClick={() => onChange?.(asset.id, accessFor(l.id))}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pnc-link disabled:cursor-default",
                            on
                              ? l.id === "hidden"
                                ? "bg-white text-pnc-ink shadow-card"
                                : "bg-pnc-blue-700 text-white shadow-card"
                              : "text-pnc-muted enabled:hover:text-pnc-ink",
                          )}
                        >
                          {l.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
