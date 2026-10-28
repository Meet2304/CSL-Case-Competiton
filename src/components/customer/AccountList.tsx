"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Money } from "@/components/ui/Money";
import type { BankAccount } from "@/data/types";
import { cn, formatDate } from "@/lib/format";
import { firstName, kindLabels, personById } from "@/lib/household";

/** "Wife" or "Husband (deceased)". */
export function nameList(deceasedIds: string[]) {
  return (ids: string[]) =>
    ids
      .map((id) => {
        const n = firstName(personById(id)?.name ?? "Someone");
        return deceasedIds.includes(id) ? `${n} (deceased)` : n;
      })
      .join(" and ");
}

/**
 * Accounts as a quiet list: name, a one-line detail (ownership, beneficiary,
 * who shared it), and the balance. Accounts with activity expand to show it.
 */
export function AccountList({
  accounts,
  detail,
  badge,
  action,
}: {
  accounts: BankAccount[];
  detail: (a: BankAccount) => ReactNode;
  /** Optional pill after the account name (e.g. "Shared"). */
  badge?: (a: BankAccount) => ReactNode;
  /** Optional control beside the balance (e.g. a "Manage" button). */
  action?: (a: BankAccount) => ReactNode;
}) {
  return (
    <ul className="divide-y divide-pnc-line">
      {accounts.map((a) => (
        <AccountItem
          key={a.id}
          account={a}
          detail={detail(a)}
          badge={badge?.(a)}
          action={action?.(a)}
        />
      ))}
    </ul>
  );
}

function AccountItem({
  account: a,
  detail,
  badge,
  action,
}: {
  account: BankAccount;
  detail: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const activity = a.transactions ?? [];
  return (
    <li>
      <div className="flex items-start gap-3 px-4 py-3 @2xl:px-5">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pnc-ink">
            {a.name}
            {a.last4 && <span className="ml-1 text-xs font-normal text-pnc-muted">x{a.last4}</span>}
            {badge}
          </p>
          {/* Type and detail share a line, so a list shows more accounts at once. */}
          <div className="mt-0.5 text-sm text-pnc-muted">
            {kindLabels[a.kind]}
            {a.external && " · held outside PNC"}
            {detail != null && <> · {detail}</>}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <Money value={a.balance} className="pt-0.5 text-base font-semibold @2xl:text-lg" />
          {action}
          {activity.length > 0 ? (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? "Hide" : "Show"} recent activity for ${a.name}`}
              className="grid size-8 place-items-center rounded-full text-pnc-link hover:bg-pnc-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              <ChevronDown
                className={cn("size-5 transition", open && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          ) : (
            // Keeps every balance in the same column.
            <span className="size-8" aria-hidden="true" />
          )}
        </div>
      </div>
      {open && (
        <div id={panelId} className="bg-pnc-surface/60 px-4 pb-3 @2xl:px-5">
          <p className="pb-1 pt-2 text-xs font-semibold text-pnc-muted">Recent activity</p>
          <ul className="divide-y divide-pnc-line text-sm">
            {activity.map((t) => (
              <li key={t.id} className="flex items-baseline gap-3 py-2">
                <span className="w-20 shrink-0 text-pnc-muted">
                  {formatDate(t.date, "monthDay")}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t.description}
                  {t.status === "Pending" && (
                    <span className="ml-2 text-xs italic text-pnc-muted">Pending</span>
                  )}
                </span>
                <Money value={t.amount} signed className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
