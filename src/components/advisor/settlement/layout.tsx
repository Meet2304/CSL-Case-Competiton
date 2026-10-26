"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
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

/** A titled section the jump nav can move focus to. */
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
 * In-page links to each section. Buttons, not `#` links: the client page keeps
 * its tab in the URL hash. Moves focus to the heading so keyboard and screen
 * reader users land where sighted users do.
 */
export function JumpNav({
  label,
  items,
}: {
  label: string;
  items: { id: string; title: string; count?: number }[];
}) {
  function go(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }
  return (
    <nav aria-label={label} className="no-scrollbar -mx-1 overflow-x-auto">
      <ul className="flex gap-1.5 px-1 py-0.5">
        {items.map((i) => (
          <li key={i.id} className="shrink-0">
            <button
              type="button"
              onClick={() => go(i.id)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pnc-ink ring-1 ring-pnc-line hover:text-pnc-link hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              {i.title}
              {i.count !== undefined && <span className="ml-1 text-pnc-muted">{i.count}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
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
