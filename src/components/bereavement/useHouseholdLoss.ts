"use client";

import { useViewer } from "@/components/customer/Viewer";
import { useBereavement } from "@/lib/bereavement";

/** A death the bank has recorded of someone else in the signed-in person's household. */
export function useHouseholdLoss() {
  const state = useBereavement();
  const { loss } = useViewer();
  return { state, loss, firstName: loss?.personName.split(" ")[0] };
}
