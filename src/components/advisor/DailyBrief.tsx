"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CalendarClock, HeartCrack, Landmark, type LucideIcon } from "lucide-react";
import { AssistantPanel } from "@/components/advisor/assistant/parts";
import { profileFor } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import type { AdvisorCustomer } from "@/data/types";
import { dailyBrief, type BriefItem } from "@/lib/assistant";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

const kinds: Record<BriefItem["kind"], { icon: LucideIcon; tab: string; tone: string }> = {
  loss: { icon: HeartCrack, tab: "loss", tone: "text-attention" },
  review: { icon: CalendarClock, tab: "engagement", tone: "text-pnc-blue-700" },
  cash: { icon: Landmark, tab: "assets", tone: "text-pnc-blue-700" },
};

/** Dashboard context: who needs the advisor today, and why, across the whole book. */
export function DailyBrief({
  customers,
  className,
}: {
  customers: AdvisorCustomer[];
  className?: string;
}) {
  const brief = useMemo(
    () =>
      dailyBrief(
        customers.flatMap((c) => {
          const p = profileFor(c.id);
          return p ? [{ c, p }] : [];
        }),
        MOCK_AS_OF,
      ),
    [customers],
  );

  return (
    <AssistantPanel title={brief.headline} className={className}>
      {brief.items.length === 0 ? (
        <p className="text-sm text-pnc-muted">Nothing needs you today.</p>
      ) : (
        <ul className="divide-y divide-pnc-blue-600/10 overflow-hidden rounded-md bg-white ring-1 ring-pnc-blue-600/10">
          {brief.items.slice(0, 6).map((item) => {
            const { icon: Icon, tab, tone } = kinds[item.kind];
            return (
              <li key={`${item.kind}-${item.customerId}`}>
                <Link
                  href={`${routes.advisorClient(item.customerId)}#${tab}`}
                  className="group flex items-start gap-3 px-4 py-3 hover:bg-pnc-surface/60"
                >
                  <Icon className={cn("mt-0.5 size-4.5 shrink-0", tone)} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="font-semibold text-pnc-ink">{item.name}</span>{" "}
                    <span className="text-pnc-ink">{item.text}</span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-pnc-link group-hover:underline @3xl:inline-flex">
                    {item.action} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AssistantPanel>
  );
}
