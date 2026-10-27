"use client";

import { createContext, useContext, type ReactNode } from "react";
import { buttonClass } from "@/components/will/ui";
import type { Errors } from "@/lib/will/flow";
import type { WillDraft } from "@/lib/will/types";

/** A family member the planner can suggest wherever the will names someone. */
export type FamilyPerson = { name: string; relationship: string };

/** Id of the <datalist> of family names rendered once by the planner. */
export const PEOPLE_LIST_ID = "will-family-people";

export type Planner = {
  draft: WillDraft;
  update: (fn: (d: WillDraft) => WillDraft) => void;
  errors: Errors;
  /** Account holder's full name (the testator). */
  accountHolder: string;
  /** Person id of the testator. */
  owner: string;
  people: FamilyPerson[];
  /** Go back one screen, if there is one. */
  previous?: () => void;
  /** Continue without validating ("Skip for now", "No thanks"). */
  skip: () => void;
  /** Jump to a screen; `returnToReview` brings "Save & Continue" back to the review page. */
  goTo: (screen: string, opts?: { returnToReview?: boolean }) => void;
  /** Leave the planner for the will overview. */
  exit: () => void;
};

export const PlannerContext = createContext<Planner | null>(null);

export function usePlanner(): Planner {
  const planner = useContext(PlannerContext);
  if (!planner) throw new Error("usePlanner must be used inside the will planner");
  return planner;
}

/** Previous / Save & Continue row at the bottom of every screen. */
export function NavButtons({
  extra,
  submitLabel = "Save & Continue",
}: {
  extra?: ReactNode;
  submitLabel?: string;
}) {
  const { previous } = usePlanner();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pnc-line pt-5">
      {previous ? (
        <button type="button" onClick={previous} className={buttonClass.secondary}>
          Previous
        </button>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-3">
        {extra}
        <button type="submit" className={buttonClass.primary}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
