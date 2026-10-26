"use client";

import { selfHousehold } from "@/data/bereavement";
import { lossFor, useBereavement } from "@/lib/bereavement";

/** A death the bank has recorded in the signed-in customer's household, if any. */
export function useHouseholdLoss() {
  const state = useBereavement();
  const loss = lossFor(state, selfHousehold);
  return { state, loss, firstName: loss?.personName.split(" ")[0] };
}
