"use client";

import { useMemo } from "react";
import { advisorCustomers, routineNotifications } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import {
  advisorStats,
  buildNotifications,
  needsAttention,
  sortByAttention,
  withRecordedLosses,
} from "@/lib/advisor";
import { useBereavement } from "@/lib/bereavement";

/**
 * The advisor's customer book, including any deaths the bank has recorded.
 * Memoized on the recorded losses so list identities stay stable between renders.
 */
export function useAdvisorBook() {
  const { losses } = useBereavement();
  return useMemo(() => {
    const book = withRecordedLosses(advisorCustomers, losses);
    const customers = sortByAttention(book);
    const notifications = buildNotifications(book, routineNotifications, MOCK_AS_OF);
    return {
      customers,
      notifications,
      stats: advisorStats(book, MOCK_AS_OF),
      urgentCount: notifications.filter((n) => n.urgent).length,
      attentionCount: customers.filter(needsAttention).length,
      recorded: losses,
    };
  }, [losses]);
}
