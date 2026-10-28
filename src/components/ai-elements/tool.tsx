"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { cn } from "@/lib/format";

export type ToolState = "running" | "completed" | "error";

const badge: Record<ToolState, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-pnc-blue-50 text-pnc-blue-800" },
  completed: { label: "Completed", className: "bg-pnc-positive-bg text-pnc-positive" },
  error: { label: "Error", className: "bg-attention-bg text-attention" },
};

/**
 * A tool call the assistant made, shown as a compact card: the tool's name and
 * state, expanding to its input and output.
 */
export function Tool({
  name,
  state,
  input,
  output,
}: {
  /** e.g. "rulebook.walk". */
  name: string;
  state: ToolState;
  input: Record<string, string | number>;
  output?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const b = badge[state];
  return (
    <div className="overflow-hidden rounded-lg border border-pnc-line bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
      >
        <Wrench className="size-3.5 shrink-0 text-pnc-muted" aria-hidden="true" />
        <code className="min-w-0 flex-1 truncate font-mono font-semibold text-pnc-ink">{name}</code>
        <span className={cn("rounded-full px-2 py-0.5 font-semibold", b.className)}>{b.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-pnc-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={id}
        hidden={!open}
        className="space-y-2 border-t border-pnc-line px-3 py-2.5 text-xs"
      >
        <div>
          <p className="font-semibold uppercase tracking-wide text-pnc-muted">Input</p>
          <pre className="mt-1 overflow-x-auto rounded bg-pnc-surface px-2 py-1.5 font-mono text-[0.6875rem] leading-relaxed text-pnc-ink">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
        {output && (
          <div>
            <p className="font-semibold uppercase tracking-wide text-pnc-muted">Output</p>
            <div className="mt-1 text-pnc-ink">{output}</div>
          </div>
        )}
      </div>
    </div>
  );
}
