"use client";

import { useViewer } from "./Viewer";
import { useNudges } from "./useNudges";

/** What the customer navigation adapts to: who's signed in and their reminders. */
export function useCustomerNav() {
  const { person, first, isMinor } = useViewer();
  const due = useNudges().filter((n) => n.tone !== "info");
  return {
    personId: person.id,
    avatar: person.avatar,
    first,
    /** Beneficiaries to name or update, fixed from My Assets. */
    assetReminders: due.filter((n) => n.kind === "beneficiary").length,
    /** Writing or finishing a will, done on the Will page. */
    willReminders: due.filter((n) => n.kind === "will").length,
    /** Wills start at 18, so minors get no Will page. */
    showWill: !isMinor,
  };
}
