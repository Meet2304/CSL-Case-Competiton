"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import { sectionTitle } from "./parts";

/** One headline figure. `tone` marks figures that need attention. */
export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "attention" | "positive";
}) {
  return (
    <div
      className={cn(
        "rounded-md p-3.5 ring-1",
        tone === "attention"
          ? "bg-attention-bg ring-attention-line"
          : tone === "positive"
            ? "bg-pnc-positive-bg ring-transparent"
            : "bg-white ring-pnc-line",
      )}
    >
      <dt className="text-xs font-semibold text-pnc-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-display text-2xl font-medium",
          tone === "attention" ? "text-attention" : "text-pnc-ink",
        )}
      >
        {value}
      </dd>
      {sub && <dd className="mt-0.5 text-xs leading-snug text-pnc-muted">{sub}</dd>}
    </div>
  );
}

/** A titled section with an optional count and intro. */
export function PlanSection({
  id,
  title,
  count,
  aside,
  intro,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  aside?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h4 id={id} tabIndex={-1} className={cn(sectionTitle, "scroll-mt-24 outline-none")}>
          {title}
          {count !== undefined && (
            <span className="ml-2 align-middle text-sm font-semibold text-pnc-muted">{count}</span>
          )}
        </h4>
        {aside}
      </div>
      {intro && <p className="mt-1 max-w-3xl text-sm text-pnc-muted">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * A row that opens to show detail: title, a one-line summary of what's inside,
 * and the content only once opened. Controlled when `open` is passed.
 */
export function Disclosure({
  id,
  icon: Icon,
  title,
  summary,
  open: controlled,
  onToggle,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  summary?: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const toggle = () => {
    setOwn(!open);
    onToggle?.(!open);
  };
  return (
    <section id={id} className="scroll-mt-24 border-b border-pnc-line last:border-b-0">
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={toggle}
          className="flex w-full items-center gap-3 px-1 py-3.5 text-left hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
        >
          <Icon className="size-5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-pnc-ink">{title}</span>
            {summary && <span className="block text-sm text-pnc-muted">{summary}</span>}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-pnc-muted transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </h4>
      <div id={`${id}-panel`} hidden={!open} className="px-1 pb-5 pt-1">
        {open && children}
      </div>
    </section>
  );
}

/** Copies text and confirms it in a live region. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link"
      >
        {state === "copied" ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        {label}
      </button>
      <span role="status" className="text-xs text-pnc-muted">
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : ""}
      </span>
    </span>
  );
}
