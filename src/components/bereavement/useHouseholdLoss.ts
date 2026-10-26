"use client";

import { SELF_HOUSEHOLD_ID } from "@/data/bereavement";
import { lossFor, useBereavement } from "@/lib/bereavement";

/** The loss the bank has recorded for the signed-in customer's household, if any. */
export function useHouseholdLoss() {
  const state = useBereavement();
  const loss = lossFor(state, SELF_HOUSEHOLD_ID);
  return { state, loss, firstName: loss?.memberName.split(" ")[0] };
}
