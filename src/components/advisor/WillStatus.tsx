"use client";

import { FileCheck2, FilePen, FileX } from "lucide-react";
import { customer as demoCustomer } from "@/data/mock";
import type { AdvisorCustomer, WillStatus as Status } from "@/data/types";
import { cn, formatDate } from "@/lib/format";
import { readWillUpdated, useWillStatus } from "@/lib/will/storage";

const statusStyle: Record<Status, { label: string; icon: typeof FileCheck2; className: string }> = {
  "on-file": { label: "Will on file", icon: FileCheck2, className: "text-pnc-positive" },
  "in-progress": { label: "Will in progress", icon: FilePen, className: "text-pnc-orange-600" },
  none: { label: "No will", icon: FileX, className: "text-pnc-muted" },
};

/**
 * A customer's will status. The demo
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
  const { label, icon: Icon, className } = statusStyle[status];

  return (
    <span
      className={cn("flex items-center gap-1 text-xs font-semibold whitespace-nowrap", className)}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
      {status === "on-file" && updated && !compact && (
        <span className="font-normal text-pnc-muted"> · {formatDate(updated, "monthDay")}</span>
      )}
    </span>
  );
}
