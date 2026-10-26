import type { ReactNode } from "react";
import { cn } from "@/lib/format";

// Shared look for everything Findoe, the advisor's assistant, writes — so
// advisors can always tell generated guidance apart from account data.

/** Findoe's monogram. */
export function FindoeMonogram({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full bg-pnc-navy font-display text-[11px] font-semibold text-white",
        className,
      )}
    >
      F
    </span>
  );
}

/** "Findoe" mark, optionally with what this output is ("Findoe · Daily brief"). */
export function AssistantMark({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      title="Written by Findoe from the settlement rulebook and mock data"
      className={cn("inline-flex items-center gap-2 text-sm text-pnc-muted", className)}
    >
      <FindoeMonogram />
      <span>
        <span className="font-semibold text-pnc-ink">Findoe</span>
        {label && <span> · {label}</span>}
      </span>
    </span>
  );
}

/** Quiet panel that holds Findoe's output. */
export function AssistantPanel({
  title,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg bg-white p-4 shadow-card @3xl:p-5", className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <AssistantMark />
          {title && <h3 className="font-display text-lg font-medium text-pnc-ink">{title}</h3>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

export const priorityTone: Record<string, string> = {
  Now: "bg-attention-bg text-attention ring-attention-line",
  "This month": "bg-pnc-orange/10 text-pnc-orange-600 ring-pnc-orange/30",
  "This quarter": "bg-white text-pnc-blue-800 ring-pnc-blue-600/20",
};

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const tabButton = (selected: boolean) =>
  cn(
    "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors",
    selected
      ? "text-pnc-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
      : "text-pnc-muted hover:text-pnc-ink",
  );
