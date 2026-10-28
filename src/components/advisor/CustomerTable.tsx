"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import { AttentionIcon } from "@/components/advisor/AttentionIcon";
import { Pagination, usePagination } from "@/components/advisor/Pagination";
import { useCustomerJump } from "@/components/advisor/useCustomerJump";
import { WillStatus } from "@/components/advisor/WillStatus";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { customerAnchor, lossTag, needsAttention, openLoss } from "@/lib/advisor";
import { routes } from "@/lib/routes";
import { cn, daysBetween, formatDate, relativeDay } from "@/lib/format";

const PAGE_SIZE = 8;
/** Reviews this close get an orange "in N days" hint. */
const REVIEW_SOON_DAYS = 14;
/** Last contact older than this gets flagged as overdue. */
const STALE_CONTACT_DAYS = 90;

const th = "py-3 text-xs font-semibold uppercase tracking-wide text-pnc-muted whitespace-nowrap";

type Filter = "all" | "attention" | "review";

const reviewSoon = (c: AdvisorCustomer) => {
  const d = daysBetween(MOCK_AS_OF, c.nextReview);
  return d >= 0 && d <= REVIEW_SOON_DAYS;
};

const filters: { id: Filter; label: string; test: (c: AdvisorCustomer) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "attention", label: "Needs attention", test: needsAttention },
  { id: "review", label: `Review in ${REVIEW_SOON_DAYS} days`, test: reviewSoon },
];

/**
 * Paginated "Assigned Customers" table for the laptop advisor dashboard.
 * Every row opens the client (the name is the link; the whole row is a click
 * target). Expects customers already sorted with `sortByAttention`.
 */
export function CustomerTable({ customers }: { customers: AdvisorCustomer[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = customers.filter(filters.find((f) => f.id === filter)!.test);
  const pager = usePagination(shown, PAGE_SIZE);
  useCustomerJump(shown, PAGE_SIZE, pager.setPage);

  // A link to one customer's row (from the outreach banner) shows everyone, so the row exists.
  useEffect(() => {
    const show = () => {
      if (customers.some((c) => `#${customerAnchor(c.id)}` === window.location.hash))
        setFilter("all");
    };
    window.addEventListener("hashchange", show);
    return () => window.removeEventListener("hashchange", show);
  }, [customers]);

  /** Row click opens the client, unless the click was on the link itself. */
  function openRow(e: MouseEvent<HTMLTableRowElement>, id: string) {
    if ((e.target as HTMLElement).closest("a, button") || window.getSelection()?.toString()) return;
    router.push(routes.advisorClient(id));
  }

  return (
    <>
      <div
        role="group"
        aria-label="Filter customers"
        className="flex flex-wrap items-center gap-1.5 border-b border-pnc-line px-5 py-3"
      >
        {filters.map((f) => {
          const count = customers.filter(f.test).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFilter(f.id);
                pager.setPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                active ? "bg-pnc-ink text-white" : "text-pnc-ink hover:bg-pnc-surface",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded px-1.5 text-xs tabular-nums",
                  active
                    ? "bg-white/20"
                    : f.id === "attention" && count > 0
                      ? "bg-attention-bg text-attention"
                      : "bg-pnc-chip text-pnc-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        {/* Fixed layout keeps columns from shifting between pages. */}
        <table className="w-full min-w-[48rem] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-44" />
            <col className="w-10" />
          </colgroup>
          <thead className="border-b border-pnc-line bg-pnc-surface/70">
            <tr>
              <th scope="col" className={cn(th, "pl-4")}>
                <span className="sr-only">Needs attention</span>
              </th>
              <th scope="col" className={cn(th, "pr-4")}>
                Customer
              </th>
              <th scope="col" className={cn(th, "pr-4 text-right")}>
                Relationship
              </th>
              <th scope="col" className={cn(th, "pr-4")}>
                Last Contact
              </th>
              <th scope="col" className={cn(th, "pr-4")}>
                Next Review
              </th>
              <th scope="col" className={cn(th, "pr-4")}>
                Will
              </th>
              <th scope="col" className={cn(th, "pr-4")}>
                <span className="sr-only">Open</span>
              </th>
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
                  onClick={(e) => openRow(e, c.id)}
                  className={cn(
                    "group cursor-pointer scroll-mt-24 border-b border-pnc-line align-top transition-colors last:border-b-0 target:bg-pnc-blue-50",
                    loss ? "bg-attention-bg/60 hover:bg-attention-bg" : "hover:bg-pnc-blue-50/60",
                  )}
                >
                  <td className="py-4 pl-4 pr-2">
                    {loss && (
                      <AttentionIcon label={`Needs attention: ${lossTag(loss).toLowerCase()}`} />
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <Link
                      href={routes.advisorClient(c.id)}
                      className="block truncate font-semibold text-pnc-link underline decoration-pnc-link/30 underline-offset-4 group-hover:decoration-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                      title={`Open ${c.name}`}
                    >
                      {c.name}
                    </Link>
                    <span className="block text-xs leading-snug text-pnc-muted">
                      {[
                        c.segment,
                        ...c.household.map((m) => `${m.name} (${m.relationship.toLowerCase()})`),
                      ].join(" · ")}
                    </span>
                    {loss && (
                      <span className="mt-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-attention ring-1 ring-attention-line">
                        {lossTag(loss)} · {formatDate(loss.date, "monthDay")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <Money value={c.relationshipValue} compact className="font-semibold" />
                    <span className="block text-xs text-pnc-muted">{c.accountCount} accounts</span>
                  </td>
                  <td className="py-4 pr-4">
                    <time dateTime={c.lastContact} className="block text-pnc-ink">
                      {formatDate(c.lastContact, "monthDay")}
                    </time>
                    <span
                      className={cn(
                        "block text-xs",
                        sinceContact > STALE_CONTACT_DAYS
                          ? "font-semibold text-pnc-orange-600"
                          : "text-pnc-muted",
                      )}
                    >
                      {relativeDay(c.lastContact, MOCK_AS_OF)}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <time dateTime={c.nextReview} className="block text-pnc-ink">
                      {formatDate(c.nextReview, "medium")}
                    </time>
                    {untilReview >= 0 && untilReview <= REVIEW_SOON_DAYS && (
                      <span className="block text-xs font-semibold text-pnc-orange-600">
                        {relativeDay(c.nextReview, MOCK_AS_OF)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <WillStatus customer={c} />
                  </td>
                  <td className="py-4 pr-4 text-right" aria-hidden="true">
                    <ChevronRight className="ml-auto size-5 text-pnc-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pnc-link" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-pnc-muted">No customers match.</p>
      )}
      <Pagination {...pager} />
    </>
  );
}
