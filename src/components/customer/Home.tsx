"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AccountList } from "@/components/customer/AccountList";
import { relationLabels, useAssetDetail } from "@/components/customer/assetDetail";
import { AssetSummary } from "@/components/customer/AssetSummary";
import {
  CustomerNotifications,
  type CustomerNotice,
} from "@/components/customer/CustomerNotifications";
import { useNudges } from "@/components/customer/useNudges";
import { useViewer } from "@/components/customer/Viewer";
import { FamiliesCard } from "@/components/family/FamiliesCard";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import { cn } from "@/lib/format";
import {
  accountsOf,
  assetsFor,
  assetSummary,
  familiesOf,
  firstName,
  type PersonAsset,
} from "@/lib/household";
import { familyNudges } from "@/lib/nudges";
import { routes } from "@/lib/routes";

/**
 * A household member's home. Top row: their money at a glance (every account
 * one click away) beside their notifications. Below: the families they
 * belong to and their role in each. Responsive with container queries.
 */
export function Home() {
  const { person, isMinor, accounts, household, deceasedIds, loss } = useViewer();
  const nudges = useNudges();
  const items = assetsFor(household, person.id, accounts, deceasedIds);
  const summary = assetSummary(accountsOf(accounts, person.id).owned);

  const notices: CustomerNotice[] = [
    ...(loss && !isMinor
      ? [
          {
            id: "loss",
            kind: "loss" as const,
            tone: "important" as const,
            title: `Looking after ${firstName(loss.personName)}'s accounts`,
            body: "Their accounts that pass to you are on My Assets, each with a short guided claim. Nothing is urgent today.",
            action: { label: "See what passes to you", href: routes.unclaimedAssets },
          },
        ]
      : []),
    ...nudges,
    ...familyNudges({
      person,
      families: familiesOf(household, person.id),
      deceasedIds,
      today: MOCK_AS_OF,
    }),
  ];

  return (
    <div className="@container space-y-5">
      <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(0,1fr)_23rem]">
        <AssetSummary summary={summary} className="@4xl:min-h-[26rem]">
          <AllAccounts items={items} />
        </AssetSummary>
        <CustomerNotifications notices={notices} className="h-[26rem]" />
      </div>
      <FamiliesCard />
    </div>
  );
}

/** Every account, folded away under the summary until asked for. */
function AllAccounts({ items }: { items: PersonAsset[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const detail = useAssetDetail();
  const shared = items.filter((i) => i.relation === "shared").length;
  const groups = (["owned", "managed", "shared"] as const)
    .map((relation) => ({ relation, items: items.filter((i) => i.relation === relation) }))
    .filter((g) => g.items.length > 0);
  const byId = new Map(items.map((i) => [i.account.id, i]));

  if (items.length === 0)
    return (
      <p className="border-t border-pnc-line px-5 py-4 text-sm text-pnc-muted">No accounts yet.</p>
    );

  return (
    <div>
      {/* Whose money this is, at a glance: owned, custodial for a child, shared by family. */}
      <dl
        className="grid border-t border-pnc-line"
        style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
      >
        {groups.map((g) => (
          <div key={g.relation} className="border-pnc-line px-5 py-3 not-last:border-r @2xl:px-6">
            <dt className="text-xs text-pnc-muted">{relationLabels[g.relation]}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-pnc-ink">
              {g.items.length} {g.items.length === 1 ? "account" : "accounts"}
              <Money
                value={g.items
                  .filter((i) => !i.account.external)
                  .reduce((s, i) => s + i.account.balance, 0)}
                compact
                className="block text-xs font-normal text-pnc-muted"
              />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pnc-line px-3 py-2 @2xl:px-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-pnc-link hover:bg-pnc-blue-50 focus-visible:outline-2 focus-visible:outline-pnc-link"
        >
          {open ? "Hide accounts" : `Show all ${items.length} accounts`}
          {!open && shared > 0 && (
            <span className="font-normal text-pnc-muted">· incl. {shared} shared with you</span>
          )}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        <Link
          href={routes.assets}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-pnc-link hover:underline"
        >
          Open My Assets <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div id={panelId} hidden={!open} className="border-t border-pnc-line">
        {groups.map((g) => (
          <section key={g.relation} aria-label={relationLabels[g.relation]}>
            <h3 className="bg-pnc-surface/70 px-4 py-1.5 text-xs font-semibold text-pnc-muted @2xl:px-5">
              {relationLabels[g.relation]}
            </h3>
            <AccountList
              accounts={g.items.map((i) => i.account)}
              detail={(a) => detail(byId.get(a.id)!)}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
