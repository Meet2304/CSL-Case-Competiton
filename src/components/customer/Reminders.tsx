"use client";

import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import type { Nudge } from "@/lib/nudges";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

const toneDot: Record<Nudge["tone"], string> = {
  important: "bg-attention",
  suggested: "bg-pnc-orange",
  info: "bg-pnc-blue-700",
};

/**
 * Planning reminders as a short list, most important first. Each one says
 * what's missing, why it matters, and links straight to where to fix it.
 */
export function Reminders({ nudges, limit = 3 }: { nudges: Nudge[]; limit?: number }) {
  if (!nudges.length) return null;
  const shown = nudges.slice(0, limit);
  return (
    <section aria-labelledby="reminders-title" className="rounded-lg bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-4 @2xl:px-5">
        <h2 id="reminders-title" className="flex items-center gap-2 font-semibold text-pnc-ink">
          <BellRing className="size-4 text-pnc-orange-600" aria-hidden="true" />
          Protect your family
          <span className="rounded-full bg-pnc-chip px-2 text-xs font-semibold text-pnc-ink">
            {nudges.length}
          </span>
        </h2>
        {nudges.length > shown.length && (
          <Link href={routes.plan} className="text-sm font-semibold text-pnc-link hover:underline">
            See all
          </Link>
        )}
      </header>
      <ul className="divide-y divide-pnc-line">
        {shown.map((n) => (
          <li
            key={n.id}
            className="flex flex-wrap items-start gap-x-3 gap-y-2 px-4 py-3.5 @2xl:px-5"
          >
            <span
              className={cn("mt-2 size-2 shrink-0 rounded-full", toneDot[n.tone])}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1 basis-56">
              <p className="font-medium text-pnc-ink">{n.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-pnc-muted">{n.body}</p>
            </div>
            <Link
              href={n.action.href}
              className="ml-5 inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link @md:ml-0"
            >
              {n.action.label} <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
