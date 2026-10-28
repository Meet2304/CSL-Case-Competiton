"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Money } from "@/components/ui/Money";
import type { Transaction } from "@/data/types";
import { cn, formatDate } from "@/lib/format";

type AccountRowProps = {
  name: string;
  last4: string;
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number;
  transactions: Transaction[];
};

/** One account line on the dashboard; the chevron reveals recent activity. */
export function AccountRow({
  name,
  last4,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  transactions,
}: AccountRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-pnc-line last:border-b-0">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-5 py-4 sm:grid-cols-[1fr_9rem_8rem_auto]">
        <a href="#" className="text-[0.9375rem] font-semibold text-pnc-link hover:underline">
          {name} <span className="text-xs font-normal">x{last4}</span>
        </a>
        <span className="hidden text-sm text-pnc-muted sm:block">
          {primaryLabel}
          <span className="block text-xs">{secondaryLabel}</span>
        </span>
        <span className="text-right">
          <Money value={primaryValue} className="block text-lg font-semibold" />
          <Money value={secondaryValue} className="block text-xs text-pnc-muted" />
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} recent activity for ${name}`}
          className="rounded p-1 text-pnc-link hover:bg-pnc-blue-50"
        >
          <ChevronDown className={cn("size-5 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="bg-pnc-surface/60 px-5 pb-4">
          <p className="pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
            Recent activity
          </p>
          {transactions.length === 0 ? (
            <p className="text-sm text-pnc-muted">No recent activity.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-pnc-line first:border-t-0">
                    <td className="py-2 pr-3 text-pnc-muted">{formatDate(t.date)}</td>
                    <td className="py-2 pr-3">
                      {t.description}
                      {t.status === "Pending" && (
                        <span className="ml-2 text-xs italic text-pnc-muted">Pending</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Money value={t.amount} signed />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </li>
  );
}
