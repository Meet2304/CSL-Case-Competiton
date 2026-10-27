"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import { Shimmer } from "./shimmer";

export type StepStatus = "pending" | "active" | "done";

/**
 * The assistant's working steps as a collapsible timeline. Open while it
 * works; folds itself away once the answer is ready (the reader can reopen
 * it any time).
 */
export function ChainOfThought({
  running,
  title,
  doneTitle,
  children,
  defaultOpen,
}: {
  running: boolean;
  /** Shown (shimmering) while running, e.g. "Working on it". */
  title: string;
  /** Shown once done, e.g. "Worked through 4 steps in 1.6s". */
  doneTitle: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? running);
  const [wasRunning, setWasRunning] = useState(running);
  const id = useId();

  // Adjusting state during render: fold away the moment work finishes.
  if (wasRunning !== running) {
    setWasRunning(running);
    setOpen(running);
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md py-0.5 text-pnc-muted hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
      >
        {running ? <Shimmer>{title}</Shimmer> : <span>{doneTitle}</span>}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <ol id={id} hidden={!open} className="mt-2.5 space-y-0">
        {children}
      </ol>
    </div>
  );
}

const ring: Record<StepStatus, string> = {
  pending: "bg-white text-pnc-line ring-pnc-line",
  active: "bg-pnc-blue-50 text-pnc-blue-700 ring-pnc-blue-600/30",
  done: "bg-pnc-positive-bg text-pnc-positive ring-pnc-positive/25",
};

/** One step on the timeline: an icon, what it is, and an optional detail below. */
export function ChainOfThoughtStep({
  icon: Icon,
  label,
  status,
  children,
}: {
  icon: LucideIcon;
  label: ReactNode;
  status: StepStatus;
  children?: ReactNode;
}) {
  return (
    <li className="group/step relative flex gap-3 pb-3 last:pb-0">
      {/* The connecting line between steps. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[0.6875rem] top-6 w-px bg-pnc-line group-last/step:hidden"
      />
      <span
        className={cn(
          "relative grid size-[1.375rem] shrink-0 place-items-center rounded-full ring-1",
          ring[status],
        )}
      >
        {status === "done" ? (
          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
        ) : status === "active" ? (
          <LoaderCircle className="size-3 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="size-3" aria-hidden="true" />
        )}
        <span className="sr-only">
          {status === "done" ? "Done: " : status === "active" ? "In progress: " : "Next: "}
        </span>
      </span>
      <div className={cn("min-w-0 flex-1 pt-px", status === "pending" && "opacity-50")}>
        <p className={cn("leading-snug", status === "active" ? "text-pnc-ink" : "text-pnc-muted")}>
          {status === "active" && typeof label === "string" ? <Shimmer>{label}</Shimmer> : label}
        </p>
        {children && status !== "pending" && <div className="mt-1.5">{children}</div>}
      </div>
    </li>
  );
}

/** Small pills for what a step found (accounts walked, rules matched...). */
export function ChainOfThoughtResults({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-md bg-pnc-surface px-2 py-0.5 text-xs text-pnc-ink ring-1 ring-pnc-line"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Keeps a "1.6s" timer running while `running`, then freezes it. */
export function useElapsed(startedAt: number | undefined, running: boolean): number {
  const [now, setNow] = useState(() => startedAt ?? 0);
  useEffect(() => {
    if (!running || startedAt === undefined) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [running, startedAt]);
  return startedAt === undefined ? 0 : Math.max(0, now - startedAt);
}
