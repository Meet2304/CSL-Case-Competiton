import type { AdvisorCustomer, AdvisorNotification, LossEvent } from "@/data/types";
import { outreachGuide } from "@/data/bereavement";
import { daysBetween, formatDate } from "@/lib/format";

/** The most recent loss event the advisor has not finished following up on. */
export function openLoss(customer: AdvisorCustomer): LossEvent | undefined {
  return customer.lossEvents
    .filter((e) => !e.followUpComplete)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function needsAttention(customer: AdvisorCustomer): boolean {
  return openLoss(customer) !== undefined;
}

/**
 * Customers with an open loss event first (most recent loss on top), then
 * everyone else alphabetically by last name.
 */
export function sortByAttention(customers: AdvisorCustomer[]): AdvisorCustomer[] {
  const lastName = (c: AdvisorCustomer) => c.name.split(" ").at(-1) ?? c.name;
  return [...customers].sort((a, b) => {
    const la = openLoss(a);
    const lb = openLoss(b);
    if (la && lb) return lb.date.localeCompare(la.date);
    if (la) return -1;
    if (lb) return 1;
    return lastName(a).localeCompare(lastName(b));
  });
}

export const lossFollowUpSteps = [
  "Call to offer condolences and introduce yourself to the surviving family",
  "Review joint, beneficiary and trust accounts before any changes are made",
  "Pause routine marketing and automated outreach to the household",
];

const firstName = (name: string) => name.split(" ")[0];

/** Headline numbers for the advisor's summary strip. */
export function advisorStats(customers: AdvisorCustomer[], todayIso: string) {
  return {
    customers: customers.length,
    needAttention: customers.filter(needsAttention).length,
    totalValue: customers.reduce((sum, c) => sum + c.relationshipValue, 0),
    reviewsNext30Days: customers.filter((c) => {
      const d = daysBetween(todayIso, c.nextReview);
      return d >= 0 && d <= 30;
    }).length,
  };
}

/** Urgent loss notifications (newest first) followed by routine ones. */
export function buildNotifications(
  customers: AdvisorCustomer[],
  routine: AdvisorNotification[],
): AdvisorNotification[] {
  const losses: AdvisorNotification[] = customers.flatMap((c) => {
    const loss = openLoss(c);
    if (!loss) return [];
    return [
      {
        id: `n-loss-${loss.id}`,
        kind: "loss" as const,
        customerId: c.id,
        title: "Loss of a family member",
        summary: `${c.name} · ${loss.relationship.toLowerCase()} passed away`,
        body: `${loss.memberName}, ${firstName(c.name)}'s ${loss.relationship.toLowerCase()}, passed away on ${formatDate(loss.date, "medium")}. Reported via ${loss.reportedVia.toLowerCase()}. Reach out to ${firstName(c.name)} and take the next steps below.`,
        date: loss.date,
        urgent: true,
        steps: lossFollowUpSteps,
        outreach: outreachGuide(c.name, loss.memberName).script,
      },
    ];
  });
  const byDate = (a: AdvisorNotification, b: AdvisorNotification) => b.date.localeCompare(a.date);
  return [...losses.sort(byDate), ...[...routine].sort(byDate)];
}

/** Anchor id for a customer's row, used by "View customer" links. */
export function customerAnchor(id: string): string {
  return `customer-${id}`;
}

/** Recorded loss as entered by the bank (see src/lib/bereavement.ts). */
type RecordedLossInput = Pick<LossEvent, "date" | "relationship" | "memberName" | "reportedVia"> & {
  id: string;
  customerId: string;
};

/** Adds losses recorded by the bank to the advisor's customer book. */
export function withRecordedLosses(
  customers: AdvisorCustomer[],
  recorded: RecordedLossInput[],
): AdvisorCustomer[] {
  if (recorded.length === 0) return customers;
  return customers.map((c) => {
    const extra = recorded
      .filter((r) => r.customerId === c.id)
      .map<LossEvent>((r) => ({
        id: `rec-${r.id}`,
        date: r.date,
        relationship: r.relationship,
        memberName: r.memberName,
        reportedVia: r.reportedVia,
        followUpComplete: false,
      }));
    return extra.length ? { ...c, lossEvents: [...c.lossEvents, ...extra] } : c;
  });
}
