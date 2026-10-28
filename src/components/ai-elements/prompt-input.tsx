"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/format";

/** Starter questions as chips that scroll sideways. */
export function Suggestions({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="list">
      {children}
    </div>
  );
}

export function Suggestion({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="listitem"
      onClick={onClick}
      className="shrink-0 whitespace-nowrap rounded-full border border-pnc-line bg-white px-3 py-1.5 text-sm text-pnc-ink hover:border-pnc-muted hover:bg-pnc-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
    >
      {children}
    </button>
  );
}

/**
 * The message box: an auto-growing textarea over a toolbar. Enter sends,
 * Shift+Enter adds a line. While a reply streams, the button stops it.
 */
export function PromptInput({
  id,
  label,
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder,
  tools,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  busy: boolean;
  placeholder: string;
  /** Left side of the toolbar (e.g. the model in use). */
  tools?: ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to a few lines.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const canSend = value.trim() !== "" && !busy;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="rounded-2xl border border-pnc-line bg-white shadow-card transition-colors focus-within:border-pnc-muted focus-within:ring-4 focus-within:ring-pnc-blue-50"
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder={placeholder}
        className="block max-h-40 min-h-11 w-full resize-none bg-transparent px-4 pb-1 pt-3 text-md outline-none placeholder:text-pnc-muted"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="min-w-0 flex-1">{tools}</div>
        {busy && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop"
            title="Stop"
            className="grid size-8 place-items-center rounded-full bg-pnc-ink text-white hover:bg-pnc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
          >
            <Square className="size-3 fill-current" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send"
            disabled={!canSend}
            className={cn(
              "grid size-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
              canSend
                ? "bg-pnc-orange text-white hover:bg-pnc-orange-600"
                : "bg-pnc-chip text-pnc-muted",
            )}
          >
            <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
