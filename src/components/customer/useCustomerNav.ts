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
    /** Everything to do under Assets and Debts: beneficiaries to name and the will. */
    assetReminders: due.filter((n) => n.kind === "beneficiary" || n.kind === "will").length,
    /** Beneficiaries to name or update, from each account's Manage panel. */
    beneficiaryReminders: due.filter((n) => n.kind === "beneficiary").length,
    /** Writing or finishing a will, on Your will (under Assets and Debts). */
    willReminders: due.filter((n) => n.kind === "will").length,
    /** Wills start at 18, so minors get no Your will page. */
    showWill: !isMinor,
  };
}
