"use client";

import Link from "next/link";
import { useState } from "react";
import { ScrollText, X } from "lucide-react";
import { IconChip } from "@/components/ui/IconChip";
import { sectionsDone } from "@/components/will/WillPlanner";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import { sections } from "@/lib/will/flow";
import { useMyWillStatus, useSavedWill } from "@/lib/will/storage";

/**
 * Accounts-dashboard nudge shown until the customer has a will on file. Opens
 * the Will tab of the Family page. "Not now" hides it until the next visit.
 */
export function WillReminder({ variant }: { variant: "web" | "mobile" }) {
  const status = useMyWillStatus();
  const saved = useSavedWill();
  const [hidden, setHidden] = useState(false);
  if (status === "on-file" || hidden) return null;

  const done = sectionsDone(saved?.progress);
  const started = status === "in-progress" && done > 0;
  const web = variant === "web";

  return (
    <section
      aria-label="Will reminder"
      className={cn(
        "relative flex flex-wrap items-center gap-x-5 gap-y-3 bg-white shadow-card",
        web ? "rounded-md px-5 py-4" : "rounded-2xl px-4 py-4",
      )}
    >
      <IconChip icon={ScrollText} size={web ? "md" : "sm"} />
      <div className={cn("min-w-0 flex-1", web ? "basis-72" : "basis-48 pr-6")}>
        <p className="font-semibold text-pnc-ink">
          {started ? "Your will is almost done" : "Add a will to protect your family"}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-pnc-muted">
          {started
            ? `${done} of ${sections.length} sections finished. Your answers are saved.`
            : "Name who inherits, who raises your children and who handles your estate. Free, about 20 minutes."}
        </p>
        {started && (
          <div
            className="mt-2 h-1.5 max-w-64 overflow-hidden rounded-full bg-pnc-chip"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-pnc-blue-700"
              style={{ width: `${(done / sections.length) * 100}%` }}
            />
          </div>
        )}
      </div>
      <div className={cn("flex items-center gap-4", !web && "basis-full pl-[3.25rem]")}>
        <Link
          href={routes.familyWill}
          className="inline-flex items-center justify-center rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800"
        >
          {started ? "Finish your will" : "Start your will"}
        </Link>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="text-sm font-semibold text-pnc-muted hover:text-pnc-ink"
        >
          Not now
        </button>
      </div>
      {web && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setHidden(true)}
          className="absolute right-2 top-2 rounded-full p-1.5 text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </section>
  );
}
