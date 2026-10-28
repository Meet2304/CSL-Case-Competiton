"use client";

import { AttentionIcon } from "@/components/advisor/AttentionIcon";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { useCustomerJump } from "@/components/advisor/useCustomerJump";
import { WillStatus } from "@/components/advisor/WillStatus";
import Link from "next/link";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { customerAnchor, lossTag, openLoss } from "@/lib/advisor";
import { routes } from "@/lib/routes";
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
                "flex scroll-mt-20 items-start gap-3 border-b border-pnc-line px-4 py-3.5 last:border-b-0 target:bg-pnc-blue-50",
                loss && "bg-attention-bg",
              )}
            >
              {/* Fixed-width slot keeps names aligned whether or not a row is flagged. */}
              <span className="flex w-8 shrink-0 justify-center pt-0.5">
                {loss && (
                  <AttentionIcon label={`Needs attention: ${lossTag(loss).toLowerCase()}`} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={routes.advisorClient(c.id)}
                  className="block truncate text-[0.9375rem] font-semibold text-pnc-link"
                >
                  {c.name}
                </Link>
                <p className="truncate text-xs text-pnc-muted">
                  {c.segment} · {c.accountCount} accounts
                </p>
                {loss && (
                  <p className="mt-1 whitespace-nowrap text-xs font-semibold text-attention">
                    {lossTag(loss)} · {formatDate(loss.date, "monthDay")}
                  </p>
                )}
                <div className="mt-1">
                  <WillStatus customer={c} compact />
                </div>
              </div>
              <span className="shrink-0 text-right">
                <Money
                  value={c.relationshipValue}
                  compact
                  className="block text-[0.9375rem] font-bold"
                />
                <span
                  className={cn(
                    "text-xs",
                    reviewSoon ? "font-semibold text-pnc-orange-600" : "text-pnc-muted",
                  )}
                >
                  Review{" "}
                  {reviewSoon
                    ? relativeDay(c.nextReview, MOCK_AS_OF)
                    : formatDate(c.nextReview, "monthDay")}
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
