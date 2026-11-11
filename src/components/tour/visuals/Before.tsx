"use client";

import { Check, TriangleAlert, Umbrella } from "lucide-react";
import { Money } from "@/components/ui/Money";
import {
  accountLabel,
  childIds,
  familyIds,
  husbandAccountIds,
  ownAccount,
  sharedAccountIds,
  tourAccounts,
  tourPeople,
  type TourAccountId,
} from "@/data/tour";
import { cn } from "@/lib/format";
import { beneficiaryOf, husbandMoney, visibleTo } from "@/lib/tour";
import { Avatar, Sheet, TourButton, Visual, useTour } from "../parts";

// ---------------------------------------------------------------------------
// Every asset in one view

export function OneViewVisual() {
  const { groups, assets, net } = husbandMoney();
  return (
    <Visual person="husband" when="before a loss">
      <Sheet className="p-6 @[600px]:p-10">
        <p className="text-md text-pnc-muted">Everything Husband owns at PNC</p>
        <p className="mt-1 font-display text-4xl font-medium @[600px]:text-6xl">
          <Money value={net} />
        </p>
        <div className="mt-8 flex h-3 gap-0.5 overflow-hidden rounded-full">
          {groups.map((g) => (
            <span
              key={g.label}
              className={g.tone}
              style={{ width: `${(g.total / assets) * 100}%` }}
            />
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 @[600px]:grid-cols-4">
          {groups.map((g) => (
            <div key={g.label}>
              <dt className="flex items-center gap-2 text-sm text-pnc-muted">
                <span className={cn("size-2 rounded-full", g.tone)} aria-hidden="true" />
                {g.label}
              </dt>
              <dd className="mt-0.5 text-lg font-semibold">
                <Money value={g.total} />
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-sm text-pnc-muted">Owed on cards</dt>
            <dd className="mt-0.5 text-lg font-semibold">
              <Money value={tourAccounts.card.balance} />
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex items-center gap-4 border-t border-pnc-line pt-6">
          <Umbrella className="size-8 shrink-0 text-pnc-blue-700" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">{tourAccounts.life.name}</p>
            <p className="text-md text-pnc-muted">Held with another company</p>
          </div>
          <Money value={tourAccounts.life.balance} className="ml-auto text-xl font-semibold" />
        </div>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// Gaps: who each account passes to

export function GapsVisual() {
  const { state, dispatch } = useTour();
  return (
    <Visual person="husband" when="before a loss">
      <Sheet>
        <p className="px-6 pb-3 pt-5 text-md text-pnc-muted">Who each account passes to</p>
        <ul className="divide-y divide-pnc-line border-t border-pnc-line">
          {husbandAccountIds.map((id) => (
            <li
              key={id}
              className="flex min-h-[4.5rem] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-md font-semibold">{accountLabel(id)}</p>
                <Money value={tourAccounts[id].balance} className="text-sm text-pnc-muted" />
              </div>
              {beneficiaryOf(state, id) ? (
                <span className="flex items-center gap-2 text-md">
                  <Avatar person="wife" className="size-7" /> Wife
                </span>
              ) : (
                <span className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-md font-semibold text-attention">
                    <TriangleAlert className="size-5" aria-hidden="true" /> No one named
                  </span>
                  {id === "savings" && (
                    <TourButton tone="orange" onClick={() => dispatch({ type: "nameBeneficiary" })}>
                      Name Wife
                    </TourButton>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// Sharing: who in the family can see each account

const dot = "mx-auto grid size-7 place-items-center rounded-full";

export function SharingVisual() {
  const { state, dispatch } = useTour();
  return (
    <Visual person="husband" when="family admin">
      <Sheet className="px-4 py-5 @[600px]:px-8">
        <table className="w-full">
          <thead>
            <tr>
              <th scope="col" className="text-left align-bottom text-md font-normal text-pnc-muted">
                <span className="block pb-3">Who can see it</span>
              </th>
              {familyIds.map((id) => (
                <th key={id} scope="col" className="w-[3.75rem] pb-3 font-normal @[600px]:w-28">
                  <span className="flex flex-col items-center gap-1">
                    <Avatar person={id} className="size-9 @[600px]:size-12" />
                    <span className="text-xs font-semibold @[600px]:text-sm">
                      {tourPeople[id].name}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-pnc-line border-t border-pnc-line">
            {sharedAccountIds.map((account) => (
              <tr key={account}>
                <th
                  scope="row"
                  className="py-2.5 pr-2 text-left text-sm font-semibold @[600px]:text-md"
                >
                  {accountLabel(account)}
                </th>
                {familyIds.map((id) => {
                  const child = childIds.find((c) => c === id);
                  if (!child) {
                    return (
                      <td key={id}>
                        <span className={cn(dot, "bg-pnc-blue-700 text-white")}>
                          <Check className="size-4" aria-label="Can see it" />
                        </span>
                      </td>
                    );
                  }
                  const on = state.childAccess[child].includes(account);
                  return (
                    <td key={id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${tourPeople[id].name} can see ${accountLabel(account)}`}
                        onClick={() => dispatch({ type: "toggleAccess", child, account })}
                        className={cn(
                          dot,
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                          on
                            ? "bg-pnc-blue-700 text-white"
                            : "border-2 border-pnc-line bg-white hover:border-pnc-link",
                        )}
                      >
                        {on && <Check className="size-4" aria-hidden="true" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// What a child sees: only what is theirs or shared, never what is hidden

function AccountRow({ id, note }: { id: TourAccountId; note: string }) {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-md font-semibold">{accountLabel(id)}</p>
        <p className="text-sm text-pnc-muted">{note}</p>
      </div>
      <Money value={tourAccounts[id].balance} className="text-lg font-semibold" />
    </li>
  );
}

export function PreviewVisual() {
  const { state, dispatch } = useTour();
  const child = state.previewAs;
  const shared = visibleTo(state, child);
  return (
    <Visual person={child} when="signed in to PNC">
      <div className="mb-4 flex gap-2" role="group" aria-label="Preview as">
        {childIds.map((id) => (
          <TourButton
            key={id}
            tone={child === id ? "navy" : "quiet"}
            aria-pressed={child === id}
            onClick={() => dispatch({ type: "previewAs", child: id })}
          >
            {tourPeople[id].name}
          </TourButton>
        ))}
      </div>
      <Sheet className="min-h-[9.75rem]">
        <ul className="divide-y divide-pnc-line">
          <AccountRow id={ownAccount[child]} note="Your account" />
          {shared.map((id) => (
            <AccountRow key={id} id={id} note="Shared by your family" />
          ))}
        </ul>
      </Sheet>
    </Visual>
  );
}
