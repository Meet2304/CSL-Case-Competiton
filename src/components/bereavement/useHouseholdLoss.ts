"use client";

import { useViewer } from "@/components/customer/Viewer";
import { useBereavement } from "@/lib/bereavement";
import { firstName } from "@/lib/format";

/** A death the bank has recorded of someone else in the signed-in person's household. */
export function useHouseholdLoss() {
  const state = useBereavement();
  const { loss } = useViewer();
  return { state, loss, firstName: loss ? firstName(loss.personName) : undefined };
}
