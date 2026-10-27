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
    const self = loss.relationship === "Self";
    const contact = lossContact(c, loss);
    const died = `passed away on ${formatDate(loss.date, "medium")}. Reported via ${loss.reportedVia.toLowerCase()}.`;
    return [
      {
        id: `n-loss-${loss.id}`,
        kind: "loss" as const,
        customerId: c.id,
        title: self ? "Customer passed away" : "Loss of a family member",
        summary: self
          ? `${c.name} · passed away`
          : `${c.name} · ${loss.relationship.toLowerCase()} passed away`,
        body: self
          ? `${c.name} ${died} ${contact ? `Reach out to ${contact.name} (${contact.relationship.toLowerCase()}) and take the next steps below.` : "Work with the estate's executor on the next steps below."}`
          : `${loss.memberName}, ${firstName(c.name)}'s ${loss.relationship.toLowerCase()}, ${died} Reach out to ${firstName(c.name)} and take the next steps below.`,
        date: loss.date,
        urgent: true,
        steps: lossFollowUpSteps,
        outreach: contact ? outreachGuide(contact.name, loss.memberName).script : undefined,
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

// ---------------------------------------------------------------------------
// Deaths recorded by the bank. A death is recorded against one customer as a
// single unit; its impact on families is assessed afterwards from the
// household records, never entered at intake.

/** Short tag for a loss, e.g. "Loss of spouse" or "Customer passed away". */
export function lossTag(loss: LossEvent): string {
  return loss.relationship === "Self"
    ? "Customer passed away"
    : `Loss of ${loss.relationship.toLowerCase()}`;
}

/**
 * Who the advisor should contact about a loss: the primary customer, or —
 * when the primary customer is the one who died — their next of kin.
 */
export function lossContact(
  c: AdvisorCustomer,
  loss: LossEvent,
): { name: string; relationship: string } | undefined {
  if (loss.relationship !== "Self") return { name: c.name, relationship: "Customer" };
  const order = ["Spouse", "Child", "Parent", "Sibling"];
  const kin = [...c.household].sort(
    (a, b) => order.indexOf(a.relationship) - order.indexOf(b.relationship),
  )[0];
  return kin && { name: kin.name, relationship: kin.relationship };
}

/** Every individual the bank serves: primary customers and their household members. */
export function customerDirectory(customers: AdvisorCustomer[]): string[] {
  const names = new Set(customers.flatMap((c) => [c.name, ...c.household.map((m) => m.name)]));
  const last = (n: string) => n.split(" ").at(-1) ?? n;
  return [...names].sort((a, b) => last(a).localeCompare(last(b)) || a.localeCompare(b));
}

export type LossImpact = { customer: AdvisorCustomer; relationship: LossEvent["relationship"] };

/** How one customer's death affects each household they belong to. */
export function assessImpact(customers: AdvisorCustomer[], personName: string): LossImpact[] {
  return customers.flatMap<LossImpact>((c) => {
    if (c.name === personName) return [{ customer: c, relationship: "Self" }];
    const member = c.household.find((m) => m.name === personName);
    return member ? [{ customer: c, relationship: member.relationship }] : [];
  });
}

/** A death as recorded by the bank (see src/lib/bereavement.ts). */
type RecordedDeath = Pick<LossEvent, "date" | "reportedVia"> & { id: string; personName: string };

/** Adds the assessed impact of recorded deaths to the advisor's customer book. */
export function withRecordedLosses(
  customers: AdvisorCustomer[],
  recorded: RecordedDeath[],
): AdvisorCustomer[] {
  if (recorded.length === 0) return customers;
  const extra = new Map<string, LossEvent[]>();
  for (const r of recorded) {
    for (const { customer, relationship } of assessImpact(customers, r.personName)) {
      const event: LossEvent = {
        id: `rec-${r.id}-${customer.id}`,
        date: r.date,
        relationship,
        memberName: r.personName,
        reportedVia: r.reportedVia,
        followUpComplete: false,
      };
      extra.set(customer.id, [...(extra.get(customer.id) ?? []), event]);
    }
  }
  return customers.map((c) =>
    extra.has(c.id) ? { ...c, lossEvents: [...c.lossEvents, ...extra.get(c.id)!] } : c,
  );
}
