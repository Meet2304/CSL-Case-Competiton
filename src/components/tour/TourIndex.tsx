"use client";

import { useState } from "react";
import { ListOrdered, X } from "lucide-react";
import { tourSections, tourStops } from "@/data/tour";
import { cn } from "@/lib/format";

/** Where each section begins in the list of stops. */
const starts = tourSections.map((s) => tourStops.findIndex((stop) => stop.id === s.start));

/**
 * The tour's index, folded away at the right edge of the stage: the presenter
 * opens it and picks a section to go straight to its start. It is there for
 * recovering from a slip, so it stays out of sight until it is wanted, and it
 * never keeps the keys that move the tour on.
 */
export function TourIndex({ at, onPick }: { at: number; onPick: (stop: number) => void }) {
  const [open, setOpen] = useState(false);
  // The section the current stop belongs to: the last one that starts at or before it.
  const current = starts.findLastIndex((n) => n <= at);

  const close = () => setOpen(false);

  return (
    // Clicks here are the presenter's, not a press of → on the stage beneath.
    <div onClick={(e) => e.stopPropagation()}>
      {open && <div aria-hidden="true" className="fixed inset-0 z-40" onClick={close} />}

      <button
        type="button"
        aria-expanded={open}
        aria-controls="tour-index"
        onClick={(e) => {
          setOpen((v) => !v);
          // Keys go back to the stage: → and ← move the tour, not this button.
          e.currentTarget.blur();
        }}
        className={cn(
          "fixed right-0 top-1/2 z-50 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-pnc-line bg-white py-3 pl-3 pr-2.5 text-pnc-muted shadow-card transition-[color,opacity] hover:text-pnc-navy focus-visible:outline-2 focus-visible:outline-pnc-link",
          open ? "pointer-events-none opacity-0" : "opacity-60 hover:opacity-100",
        )}
      >
        <ListOrdered className="size-4" aria-hidden="true" />
        <span className="sr-only">Sections</span>
      </button>

      <nav
        id="tour-index"
        aria-label="Tour sections"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-pnc-line bg-white shadow-raised transition-transform duration-300 ease-[cubic-bezier(0.22,0.8,0.3,1)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-pnc-line py-4 pl-5 pr-3">
          <p className="font-display text-[0.9375rem] font-semibold text-pnc-navy">Sections</p>
          <button
            type="button"
            onClick={(e) => {
              close();
              e.currentTarget.blur();
            }}
            className="grid size-8 place-items-center rounded-full text-pnc-muted transition-colors hover:bg-pnc-blue-50 hover:text-pnc-navy focus-visible:outline-2 focus-visible:outline-pnc-link"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close sections</span>
          </button>
        </div>
        <ol className="flex-1 overflow-y-auto overscroll-contain p-2">
          {tourSections.map((s, i) => {
            const here = i === current;
            return (
              <li key={s.start}>
                <button
                  type="button"
                  aria-current={here ? "step" : undefined}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    close();
                    onPick(starts[i]);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-pnc-link",
                    here
                      ? "bg-pnc-blue-50 font-semibold text-pnc-blue-800"
                      : "text-pnc-ink hover:bg-pnc-blue-50/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                      here ? "bg-pnc-blue-700 text-white" : "bg-pnc-chip text-pnc-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
