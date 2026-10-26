"use client";

import { Money } from "@/components/ui/Money";
import { WillExecutionCard } from "@/components/will/WillExecution";
import { assetCategories, type FamilyMember } from "@/data/types";
import { effectiveAccess } from "@/lib/family";
import { useFamily } from "./FamilyProvider";

/**
 * What a non-admin family member sees: only the assets shared with them, and
 * only the actions they are allowed to take. Access limits are confidential to
 * admins, so nothing here says "view only", mentions hidden assets, or shows
 * other members' roles or access.
 */
export function MemberFamilyView({ member }: { member: FamilyMember }) {
  const { state } = useFamily();
  const shared = state.assets
    .map((asset) => ({ asset, access: effectiveAccess(state, member, asset) }))
    .filter(({ access }) => access.view);

  if (shared.length === 0) {
    return (
      <div className="space-y-5">
        <WillExecutionCard viewer={member} />
        <p className="rounded-md border border-dashed border-pnc-line px-4 py-10 text-center text-sm text-pnc-muted">
          Accounts your family shares with you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Only appears for members a will on file names; others never see it. */}
      <WillExecutionCard viewer={member} />
      {assetCategories.map((category) => {
        const items = shared.filter(({ asset }) => asset.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
              {category}
            </h4>
            <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
              {items.map(({ asset, access }) => (
                <li
                  key={asset.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <span className="min-w-0 flex-1 basis-48 font-semibold text-pnc-ink">
                    {asset.name}
                    {asset.last4 && (
                      <span className="text-xs font-normal text-pnc-muted"> x{asset.last4}</span>
                    )}
                  </span>
                  {/* Only the actions this member can take are rendered — never a disabled or "locked" control. */}
                  {(access.activity || access.transact || access.manage) && (
                    <span className="flex gap-4 text-sm font-semibold">
                      {access.activity && (
                        <a href="#" className="text-pnc-link hover:underline">
                          Activity
                        </a>
                      )}
                      {access.transact && (
                        <a href="#" className="text-pnc-link hover:underline">
                          {asset.category === "Debts" ? "Pay" : "Transfer"}
                        </a>
                      )}
                      {access.manage && (
                        <a href="#" className="text-pnc-link hover:underline">
                          Manage
                        </a>
                      )}
                    </span>
                  )}
                  <Money value={asset.value} className="w-28 text-right font-semibold" />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
