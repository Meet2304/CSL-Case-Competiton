"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { MockBadge } from "@/components/mock/Mock";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { rulebook } from "@/data/settlement";
import { tourPeople, type TourPersonId, type TourStep } from "@/data/tour";
import { cn } from "@/lib/format";
import type { TourAction, TourState } from "@/lib/tour";

// ---------------------------------------------------------------------------
// Context

type TourContextValue = { state: TourState; dispatch: Dispatch<TourAction>; step: TourStep };

export const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const value = useContext(TourContext);
  if (!value) throw new Error("useTour must be used inside GuidedTour");
  return value;
}

// ---------------------------------------------------------------------------
// FitCanvas: a visual is laid out at a fixed width and then scaled to fit, so
// nothing on a step ever scrolls and the text grows with the screen.

/** Layout width of a visual on laptops and projectors, and on phones. */
const WIDE = 760;
const NARROW = 380;
const MAX_SCALE = 1.5;

export function FitCanvas({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      // On wide screens the stage has its own height and the visual must fit inside it.
      // On phones the page scrolls as a whole, so only the width matters.
      const fixed = window.matchMedia("(min-width: 64rem)").matches;
      const width = o.clientWidth < 600 ? NARROW : WIDE;
      i.style.width = `${width}px`;
      const height = i.offsetHeight;
      if (!o.clientWidth || !height) return;
      if (fixed) o.style.height = "";
      const scale = Math.min(
        o.clientWidth / width,
        fixed ? o.clientHeight / height : Infinity,
        MAX_SCALE,
      );
      const top = fixed ? Math.max((o.clientHeight - height * scale) / 2, 0) : 0;
      if (!fixed) o.style.height = `${height * scale}px`;
      i.style.transform = `translate(-50%, ${top}px) scale(${scale})`;
      i.style.visibility = "visible";
    };
    // Fires once on observe, then whenever the stage or the visual changes size.
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="relative w-full lg:h-full">
      <div ref={inner} className="@container invisible absolute left-1/2 top-0 origin-top">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces the visuals share

export function Avatar({ person, className }: { person: TourPersonId; className?: string }) {
  const p = tourPeople[person];
  return <PersonAvatar seed={p.id} look={p.look} className={cn("size-8", className)} />;
}

/**
 * The frame every visual sits in: whose screen this is and when, then the
 * visual itself. `figures` adds the mock-data label the prototype requires.
 */
export function Visual({
  person,
  when,
  figures = true,
  children,
}: {
  person?: TourPersonId;
  when?: string;
  figures?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {(person || figures) && (
        <div className="mb-4 flex min-h-8 items-center gap-2.5">
          {person && (
            <>
              <Avatar person={person} />
              <p className="text-md text-pnc-muted">
                <span className="font-semibold text-pnc-ink">{tourPeople[person].name}</span>
                {when && `, ${when}`}
              </p>
            </>
          )}
          {figures && <MockBadge className="ml-auto" />}
        </div>
      )}
      {children}
    </div>
  );
}

/** The one white surface a visual may use. Never put a Sheet inside a Sheet. */
export function Sheet({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg bg-white shadow-card", className)}>{children}</div>;
}

const buttonTones = {
  orange: "bg-pnc-orange text-white hover:bg-pnc-orange-600",
  navy: "bg-pnc-navy text-white hover:bg-pnc-blue-950",
  quiet: "bg-white text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link",
} as const;

export function TourButton({
  tone = "quiet",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof buttonTones }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link disabled:cursor-not-allowed disabled:opacity-40",
        buttonTones[tone],
        className,
      )}
    />
  );
}

/** A law or bank policy, shown as its formal citation and linked to the source. */
export function Citation({ id, className }: { id: string; className?: string }) {
  const source = rulebook.sources[id];
  if (!source) return null;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={source.summary}
      className={cn(
        "truncate text-sm text-pnc-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
        className,
      )}
    >
      {source.citation}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
