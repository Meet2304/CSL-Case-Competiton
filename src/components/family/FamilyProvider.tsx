"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useViewer } from "@/components/customer/Viewer";
import type { StoredFamily } from "@/data/household";
import type { BankAccount, FamilyState } from "@/data/types";
import { familyReducer, type FamilyAction } from "@/lib/family";
import { familyView } from "@/lib/household";
import { householdActions } from "@/lib/householdStore";

/** Family actions plus sharing and un-sharing an account the viewer owns. */
export type FamilyStoreAction =
  | FamilyAction
  | { type: "shareAccount"; accountId: string }
  | { type: "unshareAccount"; accountId: string }
  | { type: "renameFamily"; name: string };

type FamilyContextValue = {
  state: FamilyState;
  family: StoredFamily;
  dispatch: (action: FamilyStoreAction) => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

/** Applies an action to a stored family, as seen by `viewerId`. */
export function applyFamilyAction(
  f: StoredFamily,
  action: FamilyStoreAction,
  viewerId: string,
  accounts: BankAccount[],
): StoredFamily {
  switch (action.type) {
    case "shareAccount":
      return f.accountIds.includes(action.accountId)
        ? f
        : { ...f, accountIds: [...f.accountIds, action.accountId] };
    case "unshareAccount":
      return {
        ...f,
        accountIds: f.accountIds.filter((id) => id !== action.accountId),
        // Nobody keeps access to an account that's no longer shared.
        roles: f.roles.map((r) => {
          const access = { ...r.access };
          delete access[action.accountId];
          return { ...r, access };
        }),
      };
    case "renameFamily":
      return { ...f, familyName: action.name.trim() || f.familyName };
    default: {
      // Run the shared family rules on the stored family (no deaths overlaid, so none are saved).
      const next = familyReducer(familyView(f, viewerId, accounts, []), action);
      return { ...f, familyName: next.familyName, members: next.members, roles: next.roles };
    }
  }
}

/** One family, as the signed-in person sees it. Changes save to the household store. */
export function FamilyProvider({ familyId, children }: { familyId: string; children: ReactNode }) {
  const { person, household, accounts, deceasedIds } = useViewer();
  const family = household.families.find((f) => f.id === familyId);
  if (!family) return null;
  const state = familyView(family, person.id, accounts, deceasedIds);
  const dispatch = (action: FamilyStoreAction) =>
    householdActions.updateFamily(familyId, (f) =>
      applyFamilyAction(f, action, person.id, accounts),
    );
  return (
    <FamilyContext.Provider value={{ state, family, dispatch }}>{children}</FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside <FamilyProvider>");
  return ctx;
}
