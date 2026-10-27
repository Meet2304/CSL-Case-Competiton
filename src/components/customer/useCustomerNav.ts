"use client";

import { useViewer } from "./Viewer";
import { useNudges } from "./useNudges";

/** What the customer navigation adapts to: who's signed in, reminders, and a recent loss. */
export function useCustomerNav() {
  const { person, first, isMinor, loss } = useViewer();
  const due = useNudges().filter((n) => n.tone !== "info");
  return {
    personId: person.id,
    first,
    /** Beneficiaries to name or update, fixed from My Assets. */
    assetReminders: due.filter((n) => n.kind === "beneficiary").length,
    /** Writing or finishing a will, done on the Will page. */
    willReminders: due.filter((n) => n.kind === "will").length,
    /** Wills start at 18, so minors get no Will page. */
    showWill: !isMinor,
    /** Adults get a Next steps page while a death in the household is being settled. */
    nextSteps: Boolean(loss) && !isMinor,
  };
}
