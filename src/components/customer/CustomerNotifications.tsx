"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cake,
  CircleCheck,
  HeartHandshake,
  ScrollText,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";
import type { Nudge } from "@/lib/nudges";
import { cn } from "@/lib/format";

const icons: Record<Nudge["kind"] | "loss", LucideIcon> = {
  will: ScrollText,
  beneficiary: UserRoundPlus,
  family: Users,
  birthday: Cake,
  loss: HeartHandshake,
};

const toneLabel: Record<Nudge["tone"], string> = {
  important: "Needs attention",
  suggested: "Suggested",
  info: "For your information",
};

export type CustomerNotice = Omit<Nudge, "kind"> & { kind: Nudge["kind"] | "loss" };

/**
 * The customer's notifications: planning reminders (write your will, name a
 * beneficiary), family heads-ups and, after a loss, the way to the next
 * steps. A fixed-height card that scrolls, with a hint when there's more.
 */
export function CustomerNotifications({
  notices,
  className,
}: {
  notices: CustomerNotice[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="customer-notices-title"
      className={cn("flex flex-col rounded-lg bg-white shadow-card", className)}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-pnc-line px-5 py-4">
        <h2 id="customer-notices-title" className="font-semibold text-pnc-ink">
          Notifications
        </h2>
        {notices.length > 0 && (
          <span className="rounded-full bg-pnc-chip px-2 py-0.5 text-xs font-semibold tabular-nums text-pnc-ink">
            {notices.length}
            <span className="sr-only">
              {" "}
              {notices.length === 1 ? "notification" : "notifications"}
            </span>
          </span>
        )}
      </header>

      {notices.length === 0 ? (
        <div className="grid flex-1 place-items-center px-6 py-10 text-center">
          <div>
            <CircleCheck className="mx-auto size-8 text-pnc-positive" aria-hidden="true" />
            <p className="mt-2 font-semibold text-pnc-ink">You&apos;re all set</p>
            <p className="mt-1 text-sm text-pnc-muted">
              Your will and beneficiaries are in order. We&apos;ll let you know if anything changes.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea label="Notifications" className="flex-1">
          <ul className="divide-y divide-pnc-line">
            {notices.map((n) => {
              const Icon = icons[n.kind];
              const important = n.tone === "important" || n.kind === "loss";
              return (
                <li key={n.id} className={cn("px-5 py-4", important && "bg-attention-bg/60")}>
                  <div className="flex gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        important
                          ? "bg-white text-attention ring-1 ring-attention-line"
                          : n.tone === "suggested"
                            ? "bg-pnc-orange/10 text-pnc-orange-600"
                            : "bg-pnc-blue-50 text-pnc-blue-700",
                      )}
                    >
                      <Icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-pnc-ink">
                        <span className="sr-only">{toneLabel[n.tone]}: </span>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-pnc-muted">{n.body}</p>
                      <Link
                        href={n.action.href}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                      >
                        {n.action.label} <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
