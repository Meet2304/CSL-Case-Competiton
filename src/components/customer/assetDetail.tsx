"use client";

import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { nameList } from "@/components/customer/AccountList";
import { useViewer } from "@/components/customer/Viewer";
import type { AssetAccess } from "@/data/types";
import { firstName, personById, takesBeneficiary, type PersonAsset } from "@/lib/household";

export const accessText = (a: AssetAccess) =>
  a.manage
    ? "You can manage it"
    : a.transact
      ? "You can make payments and transfers"
      : a.activity
        ? "You can see the balance and activity"
        : "You can see the balance";

/**
 * The one-line detail under an account, from the signed-in person's side:
 * who it's joint with, its beneficiary (or that one is missing), who they
 * manage it for, or who shares it with them and what they may do.
 */
export function useAssetDetail(): (item: PersonAsset) => ReactNode {
  const { person, deceasedIds } = useViewer();
  const names = nameList(deceasedIds);

  return function assetDetail({ account: a, relation, family, access }: PersonAsset) {
    if (relation === "managed")
      return (
        <span className="text-pnc-ink">
          {firstName(personById(a.owners[0])?.name ?? "")}&apos;s account · you&apos;re the
          custodian until they turn 18
        </span>
      );
    if (relation === "shared")
      return (
        <span className="text-pnc-ink">
          {names(a.owners)}&apos;s · shared through {family?.familyName}
          {access && <span className="block text-pnc-muted">{accessText(access)}</span>}
        </span>
      );
    const others = a.owners.filter((o) => o !== person.id);
    if (others.length) return <span className="text-pnc-ink">Joint with {names(others)}</span>;
    if (a.custodian && a.custodian !== person.id)
      return (
        <span className="text-pnc-muted">Managed by {names([a.custodian])} until you turn 18</span>
      );
    if (!takesBeneficiary(a)) return null;
    const bens = a.beneficiaries ?? [];
    if (!bens.length)
      return <span className="font-medium text-pnc-orange-600">No beneficiary named</span>;
    const gone = bens.some((id) => deceasedIds.includes(id));
    return (
      <span className={gone ? "font-medium text-attention" : "text-pnc-ink"}>
        Beneficiary: {names(bens)}
      </span>
    );
  };
}

/** Short names for how a person holds an account, used for filters, headings and badges. */
export const relationLabels: Record<PersonAsset["relation"], string> = {
  owned: "Owned",
  managed: "Custodial",
  shared: "Shared",
};

/** Small pill beside a shared or custodial account's name. */
export function RelationBadge({ relation }: { relation: PersonAsset["relation"] }) {
  if (relation === "owned") return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-pnc-blue-50 px-2 py-0.5 align-middle text-[0.6875rem] font-semibold text-pnc-blue-800">
      {relation === "shared" && <Users className="size-3" aria-hidden="true" />}
      {relationLabels[relation]}
    </span>
  );
}
