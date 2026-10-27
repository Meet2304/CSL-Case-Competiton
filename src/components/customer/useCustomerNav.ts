"use client";

import { useViewer } from "./Viewer";
import { useNudges } from "./useNudges";

/** What the customer navigation adapts to: who's signed in, reminders, and a recent loss. */
export function useCustomerNav() {
  const { first, isMinor, loss } = useViewer();
  const reminders = useNudges().filter((n) => n.tone !== "info").length;
  return {
    first,
    reminders,
    /** Adults get a Next steps page while a death in the household is being settled. */
    nextSteps: Boolean(loss) && !isMinor,
  };
}
