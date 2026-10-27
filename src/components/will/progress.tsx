"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Circle, CircleCheck, CircleDot } from "lucide-react";
import { sectionMeta } from "@/components/will/sections";
import { cn } from "@/lib/format";
import { screenTitles, sections, type SectionProgress } from "@/lib/will/flow";

/**
 * The will planner's progress bar: the eight sections as numbered steps
 * across the top, a bar showing how much is done, and a dropdown on each
 * section listing its steps, so any step opens in two clicks. Status is
 * always given in text as well as by the step's look.
 */

export function statusText(p: SectionProgress): string {
  if (p.status === "complete") return "Done";
  if (p.status === "started") return `${p.done.length} of ${p.screens.length} answered`;
  return "Not started";
}

/** One section's marker: a check once done, otherwise its number. */
export function StepDot({ part, current = false }: { part: SectionProgress; current?: boolean }) {
  const complete = part.status === "complete";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
        current
          ? "bg-pnc-blue-700 text-white ring-2 ring-pnc-orange ring-offset-2 ring-offset-white"
          : complete
            ? "bg-pnc-blue-700 text-white"
            : part.status === "started"
              ? "bg-white text-pnc-blue-700 ring-2 ring-pnc-blue-700/50"
              : "bg-white text-pnc-muted ring-1 ring-pnc-line",
      )}
    >
      {complete ? <Check className="size-4" strokeWidth={3} /> : part.section + 1}
    </span>
  );
}

/** A slim bar for how much of the will is answered. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Will progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% complete`}
      className={cn("h-1.5 overflow-hidden rounded-full bg-pnc-blue-50", className)}
    >
      <div
        className="h-full rounded-full bg-pnc-blue-700 transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * The bar across the top of the planner. Sections with more than one step
 * open a dropdown of those steps; single-step sections open directly.
 */
export function WillStepper({
  title,
  parts,
  current,
  screen,
  percent,
  onGo,
}: {
  title: string;
  parts: SectionProgress[];
  current: number;
  screen: string;
  percent: number;
  onGo: (screen: string) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const baseId = useId();
  const part = parts[current];
  const step = Math.max(0, part.screens.indexOf(screen));

  // Close the dropdown on a click anywhere else.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (s: string) => {
    setOpen(null);
    onGo(s);
  };

  function onMenuKey(e: KeyboardEvent<HTMLLIElement>, section: number) {
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-step]")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape" && open === section) {
      setOpen(null);
      document.getElementById(`${baseId}-trigger-${section}`)?.focus();
    } else if (e.key === "ArrowDown" && items.length) items[(at + 1) % items.length].focus();
    else if (e.key === "ArrowUp" && items.length)
      items[(at - 1 + items.length) % items.length].focus();
    else return;
    e.preventDefault();
  }

  return (
    <nav
      ref={root}
      aria-label="Will sections"
      className="rounded-lg border border-pnc-line bg-pnc-surface/70"
    >
      <p className="pt-3 text-center text-xs font-semibold uppercase tracking-wider text-pnc-blue-700">
        {title}
      </p>
      <ol className="relative mt-2 grid grid-cols-8 px-1 @2xl:px-3">
        {parts.map((p, i) => {
          const meta = sectionMeta[sections[i]];
          const isCurrent = i === current;
          const many = p.screens.length > 1;
          const expanded = open === i;
          const menuId = `${baseId}-menu-${i}`;
          return (
            <li
              key={i}
              className="flex justify-center @2xl:relative"
              onKeyDown={(e) => onMenuKey(e, i)}
            >
              <button
                id={`${baseId}-trigger-${i}`}
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                aria-expanded={many ? expanded : undefined}
                aria-controls={many && expanded ? menuId : undefined}
                onClick={() => (many ? setOpen(expanded ? null : i) : go(p.screens[0]))}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1.5 rounded-md px-1.5 pb-1.5 pt-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-pnc-link @2xl:px-2.5",
                  expanded
                    ? "bg-white shadow-card ring-1 ring-pnc-blue-700/40"
                    : "hover:bg-white/80",
                )}
              >
                <StepDot part={p} current={isCurrent} />
                <span
                  aria-hidden="true"
                  className={cn(
                    "hidden items-center gap-0.5 whitespace-nowrap @2xl:flex",
                    isCurrent
                      ? "font-semibold text-pnc-ink"
                      : p.status === "todo"
                        ? "text-pnc-muted"
                        : "text-pnc-ink",
                  )}
                >
                  {meta.short}
                  {many && (
                    <ChevronDown
                      className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
                    />
                  )}
                </span>
                <span className="sr-only">
                  Section {i + 1}: {meta.label}, {statusText(p).toLowerCase()}
                </span>
              </button>

              {expanded && (
                <div
                  id={menuId}
                  className={cn(
                    "absolute inset-x-2 top-full z-30 mt-1 rounded-lg bg-white p-1.5 text-left shadow-raised ring-1 ring-pnc-line motion-safe:animate-reveal @2xl:inset-x-auto @2xl:w-64",
                    i === 0
                      ? "@2xl:left-0"
                      : i === parts.length - 1
                        ? "@2xl:right-0"
                        : "@2xl:left-1/2 @2xl:-translate-x-1/2",
                  )}
                >
                  <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold text-pnc-muted">
                    {meta.label} · {p.done.length} of {p.screens.length} done
                  </p>
                  <ul>
                    {p.screens.map((s) => {
                      const done = p.done.includes(s);
                      const here = s === screen;
                      return (
                        <li key={s}>
                          <button
                            type="button"
                            data-step
                            aria-current={here ? "step" : undefined}
                            onClick={() => go(s)}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-pnc-ink outline-none hover:bg-pnc-surface focus-visible:bg-pnc-blue-50",
                              here && "bg-pnc-blue-50 font-semibold",
                            )}
                          >
                            {done ? (
                              <CircleCheck
                                className="size-4 shrink-0 text-pnc-positive"
                                aria-hidden="true"
                              />
                            ) : here ? (
                              <CircleDot
                                className="size-4 shrink-0 text-pnc-blue-700"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle
                                className="size-4 shrink-0 text-pnc-line"
                                aria-hidden="true"
                              />
                            )}
                            {screenTitles[s]}
                            {done && <span className="sr-only">, done</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Narrow layouts show numbers only, so name the open section underneath. */}
      <p
        aria-hidden="true"
        className="mt-1 text-center text-sm font-semibold text-pnc-ink @2xl:hidden"
      >
        {sectionMeta[sections[current]].label}
        {part.screens.length > 1 && (
          <span className="font-normal text-pnc-muted">
            {" "}
            · Step {step + 1} of {part.screens.length}
          </span>
        )}
      </p>

      <div className="flex items-center gap-3 px-4 pb-3 pt-2.5">
        <ProgressBar percent={percent} className="flex-1" />
        <span aria-hidden="true" className="text-xs font-semibold tabular-nums text-pnc-muted">
          {percent}%
        </span>
      </div>
    </nav>
  );
}
