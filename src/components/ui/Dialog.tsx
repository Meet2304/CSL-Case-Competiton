"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * A modal built on the native <dialog> element, so focus is trapped, the page
 * behind is inert and Escape closes it. `side="right"` slides in as a panel
 * for longer tasks (e.g. managing a family); the default is a centered card.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  side = "center",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  side?: "center" | "right";
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "bg-white p-0 text-pnc-ink shadow-raised backdrop:bg-pnc-navy/45 open:flex open:flex-col",
        side === "right"
          ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-3xl motion-safe:open:animate-reveal"
          : "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg rounded-xl motion-safe:open:animate-reveal",
        className,
      )}
    >
      {open && (
        <>
          <header className="flex shrink-0 items-start gap-3 border-b border-pnc-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={`${id}-title`} className="font-display text-xl font-medium text-pnc-ink">
                {title}
              </h2>
              {description && (
                <p id={`${id}-desc`} className="mt-0.5 text-sm text-pnc-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              <X className="size-4.5" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </>
      )}
    </dialog>
  );
}
