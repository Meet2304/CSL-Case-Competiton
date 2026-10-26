import type { AdvisorCustomer, AdvisorNotification, LossEvent, WillStatus } from "@/data/types";
import { daysBetween, formatCompactMoney, formatDate } from "@/lib/format";

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

/**
 * Urgent loss notifications (newest first), then the assistant's
 * high-priority will recommendations, then routine ones.
 */
export function buildNotifications(
  customers: AdvisorCustomer[],
  routine: AdvisorNotification[],
  todayIso: string,
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
      },
    ];
  });
  const byDate = (a: AdvisorNotification, b: AdvisorNotification) => b.date.localeCompare(a.date);
  return [
    ...losses.sort(byDate),
    ...willNotifications(customers, todayIso),
    ...[...routine].sort(byDate),
  ];
}

// ---------------------------------------------------------------------------
// Will recommendations (advisor assistant). Every customer should have a will;
// the assistant ranks who needs one most from relationship value and household.

/** At or above this relationship value a missing will is high priority. */
export const WILL_HIGH_PRIORITY_VALUE = 5_000_000;
/** At or above this value (or with children) a missing will is medium priority. */
export const WILL_MEDIUM_PRIORITY_VALUE = 1_000_000;

export type WillPriority = "high" | "medium" | "low";
export type WillAdvice = { priority: WillPriority; reasons: string[] };

/**
 * Why and how urgently the advisor should raise a will with this customer, or
 * `undefined` when a will is already on file. `status` overrides the mock
 * record (the demo customer's live status comes from the browser).
 */
export function willAdvice(
  c: AdvisorCustomer,
  status: WillStatus = c.will.status,
): WillAdvice | undefined {
  if (status === "on-file") return undefined;
  const value = formatCompactMoney(c.relationshipValue);
  const hasChild = c.household.some((m) => m.relationship === "Child");
  const hasSpouse = c.household.some((m) => m.relationship === "Spouse");
  const loss = openLoss(c);

  const reasons: string[] = [];
  if (status === "in-progress") {
    reasons.push(
      `Started a will${c.will.updated ? ` on ${formatDate(c.will.updated, "medium")}` : ""} but hasn't finished it`,
    );
  }
  if (c.relationshipValue >= WILL_HIGH_PRIORITY_VALUE) {
    reasons.push(
      `${value} relationship — without a will, state intestacy law decides who inherits an estate this size`,
    );
  } else if (c.relationshipValue >= WILL_MEDIUM_PRIORITY_VALUE) {
    reasons.push(
      `${value} relationship — large enough that a will and a beneficiary review are strongly advised`,
    );
  } else {
    reasons.push(`${value} relationship — every customer benefits from a basic will`);
  }
  if (hasChild) reasons.push("Has a child — a will is where a guardian is named");
  if (loss?.relationship === "Spouse")
    reasons.push("Recently lost a spouse — any existing plan likely names them");
  else if (hasSpouse) reasons.push("Married — mirror wills can cover both spouses in one sitting");

  const priority: WillPriority =
    c.relationshipValue >= WILL_HIGH_PRIORITY_VALUE
      ? "high"
      : c.relationshipValue >= WILL_MEDIUM_PRIORITY_VALUE || hasChild
        ? "medium"
        : "low";
  return { priority, reasons };
}

export const willFollowUpSteps = [
  "Raise estate planning at the next review",
  "Point the customer to the Will tab on their Family page to start a free will",
  "Offer an introduction to a PNC trust & estate specialist",
];

/** One assistant suggestion per high-priority customer without a will on file. */
export function willNotifications(
  customers: AdvisorCustomer[],
  todayIso: string,
): AdvisorNotification[] {
  return customers
    .map((c) => ({ c, advice: willAdvice(c) }))
    .filter(({ advice }) => advice?.priority === "high")
    .sort((a, b) => b.c.relationshipValue - a.c.relationshipValue)
    .map(({ c, advice }) => ({
      id: `n-will-${c.id}`,
      kind: "will" as const,
      customerId: c.id,
      title: "Will recommended",
      summary: `${c.name} · ${formatCompactMoney(c.relationshipValue)} · ${c.will.status === "in-progress" ? "will not finished" : "no will on file"}`,
      body: `Assistant suggestion: ${firstName(c.name)} should have a will. ${advice!.reasons.join(". ")}. Next review ${formatDate(c.nextReview, "medium")}.`,
      date: todayIso,
      urgent: false,
      steps: willFollowUpSteps,
    }));
}

/** Anchor id for a customer's row, used by "View customer" links. */
export function customerAnchor(id: string): string {
  return `customer-${id}`;
}
