"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * A fixed-height list that scrolls on its own. When content overflows, soft
 * fades show there is more above or below, and a "More below" pill scrolls
 * the next screenful into view. The region is keyboard-focusable so it can be
 * scrolled without a mouse.
 */
export function ScrollArea({
  label,
  children,
  className,
  moreLabel = "More below",
}: {
  /** Accessible name of the scrolling region. */
  label: string;
  children: ReactNode;
  /** Sets the height (e.g. `h-[24rem]` or `flex-1`). */
  className?: string;
  moreLabel?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: true, bottom: true });

  const measure = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const top = el.scrollTop <= 1;
    const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
  }, []);

  // Re-measure when the content grows or shrinks (e.g. a row expands).
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    if (content.current) ro.observe(content.current);
    return () => ro.disconnect();
  }, [measure]);

  function scrollMore() {
    const el = viewport.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ top: el.clientHeight * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className={cn("relative min-h-0", className)}>
      <div
        ref={viewport}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        className="h-full overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link [scrollbar-color:var(--color-pnc-line)_transparent] [scrollbar-width:thin]"
      >
        <div ref={content}>{children}</div>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-6 bg-linear-to-b from-white to-transparent transition-opacity",
          edges.top ? "opacity-0" : "opacity-100",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-white via-white/80 to-transparent transition-opacity",
          edges.bottom ? "opacity-0" : "opacity-100",
        )}
      />
      {!edges.bottom && (
        <button
          type="button"
          onClick={scrollMore}
          tabIndex={-1}
          className="absolute bottom-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-pnc-link shadow-raised ring-1 ring-pnc-line hover:ring-pnc-link"
        >
          {moreLabel}{" "}
          <ChevronDown className="size-3.5 motion-safe:animate-bounce" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
