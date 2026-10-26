"use client";

import { FileCheck2, FilePen, FileX, Sparkles } from "lucide-react";
import { customer as demoCustomer } from "@/data/mock";
import type { AdvisorCustomer, WillStatus as Status } from "@/data/types";
import { willAdvice, type WillPriority } from "@/lib/advisor";
import { cn, formatDate } from "@/lib/format";
import { readWillUpdated, useWillStatus } from "@/lib/will/storage";

const statusStyle: Record<Status, { label: string; icon: typeof FileCheck2; className: string }> = {
  "on-file": { label: "Will on file", icon: FileCheck2, className: "text-pnc-positive" },
  "in-progress": { label: "Will in progress", icon: FilePen, className: "text-pnc-orange-600" },
  none: { label: "No will", icon: FileX, className: "text-pnc-muted" },
};

const priorityStyle: Record<WillPriority, string> = {
  high: "bg-attention-bg text-attention ring-attention-line",
  medium: "bg-pnc-orange/10 text-pnc-orange-600 ring-pnc-orange/30",
  low: "bg-pnc-blue-50 text-pnc-blue-700 ring-pnc-blue-600/20",
};

/**
 * A customer's will status plus the assistant's recommendation. The demo
 * customer's status is live: it reflects a will saved in this browser by the
 * `customer` login (see `lib/will/storage.ts`).
 */
export function WillStatus({
  customer,
  compact = false,
}: {
  customer: AdvisorCustomer;
  compact?: boolean;
}) {
  const live = useWillStatus(customer.will.status);
  const isDemo = customer.id === demoCustomer.id;
  const status = isDemo ? live : customer.will.status;
  const updated =
    isDemo && live !== customer.will.status ? readWillUpdated() : customer.will.updated;
  const advice = willAdvice(customer, status);
  const { label, icon: Icon, className } = statusStyle[status];

  return (
    <div className={cn("space-y-1", compact && "flex flex-wrap items-center gap-x-2 space-y-0")}>
      <span
        className={cn("flex items-center gap-1 text-xs font-semibold whitespace-nowrap", className)}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
        {status === "on-file" && updated && !compact && (
          <span className="font-normal text-pnc-muted"> · {formatDate(updated, "monthDay")}</span>
        )}
      </span>
      {advice && (
        <details className={compact ? "open:basis-full" : undefined}>
          <summary
            className={cn(
              "inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 [&::-webkit-details-marker]:hidden",
              priorityStyle[advice.priority],
            )}
          >
            <Sparkles className="size-3" aria-hidden="true" />
            Recommend · {advice.priority}
          </summary>
          {/* Expands in place: an absolutely positioned popover would be clipped by the scrolling table. */}
          <div className="mt-1.5 rounded-md bg-pnc-blue-50 p-2.5 text-xs leading-relaxed text-pnc-ink">
            <p className="mb-1.5 flex items-center gap-1 font-semibold text-pnc-blue-700">
              <Sparkles className="size-3.5" aria-hidden="true" /> Assistant suggestion
            </p>
            <ul className="list-disc space-y-1 pl-4">
              {advice.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}
