"use client";

import { useId, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  ChevronDown,
  FileCheck,
  HeartCrack,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorNotification, AdvisorNotificationKind } from "@/data/types";
import { customerAnchor } from "@/lib/advisor";
import { cn, formatDate, relativeDay } from "@/lib/format";

const icons: Record<AdvisorNotificationKind, LucideIcon> = {
  loss: HeartCrack,
  review: CalendarClock,
  deposit: Banknote,
  document: FileCheck,
  will: Sparkles,
};

/**
 * Advisor notifications as a focused list: each item shows its title and a
 * one-line summary, and expands (one at a time) to the full message, next
 * steps and a link to the customer. Urgent (loss) items keep a red accent.
 */
export function NotificationList({
  notifications,
  className,
}: {
  notifications: AdvisorNotification[];
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const baseId = useId();

  return (
    <ul className={cn("divide-y divide-pnc-line", className)}>
      {notifications.map((n) => {
        const Icon = icons[n.kind];
        const open = openId === n.id;
        const panelId = `${baseId}-${n.id}`;
        return (
          <li key={n.id} className={cn(n.urgent && "bg-attention-bg")}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenId(open ? null : n.id)}
              className={cn(
                "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                n.urgent ? "hover:bg-attention-line/30" : "hover:bg-pnc-surface",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  n.urgent
                    ? "bg-white text-attention ring-1 ring-attention-line"
                    : "bg-pnc-chip text-pnc-blue-700",
                )}
              >
                <Icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm font-semibold",
                      n.urgent ? "text-attention" : "text-pnc-ink",
                    )}
                  >
                    {n.urgent && <span className="sr-only">Urgent: </span>}
                    {n.title}
                  </span>
                  <time
                    dateTime={n.date}
                    title={formatDate(n.date, "medium")}
                    className="shrink-0 text-xs text-pnc-muted"
                  >
                    {relativeDay(n.date, MOCK_AS_OF)}
                  </time>
                </span>
                {/* Up to two lines so the key fact ("spouse passed away") is never cut off. */}
                <span className="line-clamp-2 text-sm leading-snug text-pnc-muted">
                  {n.summary}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 text-pnc-muted transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>

            <div id={panelId} hidden={!open} className="px-5 pb-4 pl-[4.25rem] text-sm">
              <p className="leading-relaxed text-pnc-ink">{n.body}</p>
              {n.steps && (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
                    Suggested next steps
                  </p>
                  <ol className="mt-1.5 space-y-1.5">
                    {n.steps.map((s, i) => (
                      <li key={s} className="flex gap-2 leading-snug">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-attention ring-1 ring-attention-line">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              {n.outreach && (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
                    Suggested first call
                  </p>
                  <blockquote className="mt-1.5 rounded-md bg-white px-3 py-2 italic leading-relaxed text-pnc-ink ring-1 ring-attention-line">
                    {n.outreach}
                  </blockquote>
                </>
              )}
              <a
                href={`#${customerAnchor(n.customerId)}`}
                className="mt-3 inline-flex items-center gap-1 font-semibold text-pnc-link hover:underline"
              >
                {n.urgent ? "Go to customer" : "View customer"}{" "}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
