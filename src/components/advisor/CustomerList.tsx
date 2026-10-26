"use client";

import { AttentionIcon } from "@/components/advisor/AttentionIcon";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { useCustomerJump } from "@/components/advisor/useCustomerJump";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { customerAnchor, openLoss } from "@/lib/advisor";
import { cn, daysBetween, formatDate, relativeDay } from "@/lib/format";

const PAGE_SIZE = 6;
const REVIEW_SOON_DAYS = 14;

/** Paginated "Your Customers" list for the phone advisor dashboard. */
export function CustomerList({ customers }: { customers: AdvisorCustomer[] }) {
  const pager = usePagination(customers, PAGE_SIZE);
  useCustomerJump(customers, PAGE_SIZE, pager.setPage);

  return (
    <>
      <ul>
        {pager.pageItems.map((c) => {
          const loss = openLoss(c);
          const untilReview = daysBetween(MOCK_AS_OF, c.nextReview);
          const reviewSoon = untilReview >= 0 && untilReview <= REVIEW_SOON_DAYS;
          return (
            <li
              key={c.id}
              id={customerAnchor(c.id)}
              className={cn(
                "relative flex scroll-mt-20 items-start gap-3 border-b border-pnc-line px-4 py-3.5 last:border-b-0 target:bg-pnc-blue-50",
                loss && "bg-attention-bg before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-attention",
              )}
            >
              {/* Fixed-width slot keeps names aligned whether or not a row is flagged. */}
              <span className="flex w-8 shrink-0 justify-center pt-0.5">
                {loss && <AttentionIcon label={`Needs attention: loss of ${loss.relationship.toLowerCase()}`} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-pnc-link">{c.name}</p>
                <p className="truncate text-xs text-pnc-muted">
                  {c.segment} · {c.accountCount} accounts
                </p>
                {loss && (
                  <p className="mt-1 whitespace-nowrap text-xs font-semibold text-attention">
                    Loss of {loss.relationship.toLowerCase()} · {formatDate(loss.date, "monthDay")}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-right">
                <Money value={c.relationshipValue} compact className="block text-[15px] font-bold" />
                <span className={cn("text-xs", reviewSoon ? "font-semibold text-pnc-orange-600" : "text-pnc-muted")}>
                  Review {reviewSoon ? relativeDay(c.nextReview, MOCK_AS_OF) : formatDate(c.nextReview, "monthDay")}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <Pagination {...pager} compact />
    </>
  );
}
