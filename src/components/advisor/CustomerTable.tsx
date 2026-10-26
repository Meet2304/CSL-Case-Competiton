"use client";

import { AttentionIcon } from "@/components/advisor/AttentionIcon";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { useCustomerJump } from "@/components/advisor/useCustomerJump";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { customerAnchor, openLoss } from "@/lib/advisor";
import { cn, daysBetween, formatDate, relativeDay } from "@/lib/format";

const PAGE_SIZE = 8;
/** Reviews this close get an orange "in N days" hint. */
const REVIEW_SOON_DAYS = 14;
/** Last contact older than this gets flagged as overdue. */
const STALE_CONTACT_DAYS = 90;

const th = "py-3 text-xs font-semibold uppercase tracking-wide text-pnc-muted whitespace-nowrap";

/**
 * Paginated "Your Customers" table for the laptop advisor dashboard.
 * Expects customers already sorted with `sortByAttention`.
 */
export function CustomerTable({ customers }: { customers: AdvisorCustomer[] }) {
  const pager = usePagination(customers, PAGE_SIZE);
  useCustomerJump(customers, PAGE_SIZE, pager.setPage);

  return (
    <>
      <div className="overflow-x-auto">
        {/* Fixed layout keeps columns from shifting between pages. */}
        <table className="w-full min-w-[42rem] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-16" />
            <col />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-32" />
          </colgroup>
          <thead className="border-b border-pnc-line bg-pnc-surface/60">
            <tr>
              <th scope="col" className={cn(th, "pl-5")}>
                <span className="sr-only">Needs attention</span>
              </th>
              <th scope="col" className={cn(th, "pr-4")}>Customer</th>
              <th scope="col" className={cn(th, "pr-4")}>Segment</th>
              <th scope="col" className={cn(th, "pr-4 text-right")}>Relationship</th>
              <th scope="col" className={cn(th, "pr-4")}>Last Contact</th>
              <th scope="col" className={cn(th, "pr-5")}>Next Review</th>
            </tr>
          </thead>
          <tbody>
            {pager.pageItems.map((c) => {
              const loss = openLoss(c);
              const sinceContact = daysBetween(c.lastContact, MOCK_AS_OF);
              const untilReview = daysBetween(MOCK_AS_OF, c.nextReview);
              return (
                <tr
                  key={c.id}
                  id={customerAnchor(c.id)}
                  className={cn(
                    "scroll-mt-24 border-b border-pnc-line align-top transition-colors last:border-b-0 target:bg-pnc-blue-50",
                    loss ? "bg-attention-bg/60 hover:bg-attention-bg" : "hover:bg-pnc-surface/70",
                  )}
                >
                  <td className="py-4 pl-5 pr-3">
                    {loss && <AttentionIcon label={`Needs attention: loss of ${loss.relationship.toLowerCase()}`} />}
                  </td>
                  <td className="py-4 pr-4">
                    <span className="block truncate font-semibold text-pnc-link" title={c.name}>
                      {c.name}
                    </span>
                    {c.household.length > 0 && (
                      <span className="block text-xs leading-snug text-pnc-muted">
                        {c.household.map((m) => `${m.name} (${m.relationship.toLowerCase()})`).join(" · ")}
                      </span>
                    )}
                    {loss && (
                      <span className="mt-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-attention ring-1 ring-attention-line">
                        Loss of {loss.relationship.toLowerCase()} · {formatDate(loss.date, "monthDay")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-pnc-muted">{c.segment}</td>
                  <td className="py-4 pr-4 text-right">
                    <Money value={c.relationshipValue} compact className="font-semibold" />
                    <span className="block text-xs text-pnc-muted">{c.accountCount} accounts</span>
                  </td>
                  <td className="py-4 pr-4">
                    <time dateTime={c.lastContact} className="block text-pnc-ink">
                      {formatDate(c.lastContact, "monthDay")}
                    </time>
                    <span className={cn("block text-xs", sinceContact > STALE_CONTACT_DAYS ? "font-semibold text-pnc-orange-600" : "text-pnc-muted")}>
                      {relativeDay(c.lastContact, MOCK_AS_OF)}
                    </span>
                  </td>
                  <td className="py-4 pr-5">
                    <time dateTime={c.nextReview} className="block text-pnc-ink">
                      {formatDate(c.nextReview, "medium")}
                    </time>
                    {untilReview >= 0 && untilReview <= REVIEW_SOON_DAYS && (
                      <span className="block text-xs font-semibold text-pnc-orange-600">{relativeDay(c.nextReview, MOCK_AS_OF)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination {...pager} />
    </>
  );
}
