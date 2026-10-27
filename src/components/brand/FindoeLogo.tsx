import { cn } from "@/lib/format";

// A faceted four-point spark on a navy tile: a compass for "find", cut like
// the PNC facet backdrop, with one orange facet and a spark where it points.
const arms: { points: string; tone: string }[] = [
  { points: "12,3 10.3,10.3 12,12", tone: "fill-white" },
  { points: "12,3 13.7,10.3 12,12", tone: "fill-pnc-orange" },
  { points: "21,12 13.7,10.3 12,12", tone: "fill-white/85" },
  { points: "21,12 13.7,13.7 12,12", tone: "fill-white/55" },
  { points: "12,21 13.7,13.7 12,12", tone: "fill-white/70" },
  { points: "12,21 10.3,13.7 12,12", tone: "fill-white/40" },
  { points: "3,12 10.3,13.7 12,12", tone: "fill-white/60" },
  { points: "3,12 10.3,10.3 12,12", tone: "fill-white/90" },
];

/**
 * Findoe's logo. `thinking` turns the spark slowly while Findoe works
 * (respects reduced motion).
 */
export function FindoeLogo({
  className,
  thinking = false,
  title,
}: {
  className?: string;
  thinking?: boolean;
  /** Accessible name; omit when a visible "Findoe" label sits beside it. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("size-5 shrink-0", className)}
    >
      <rect width="24" height="24" rx="7" className="fill-pnc-navy" />
      <g
        className={cn(
          "origin-center [transform-box:fill-box]",
          thinking && "motion-safe:animate-[spin_2.4s_linear_infinite]",
        )}
      >
        {arms.map((a) => (
          <polygon key={a.points} points={a.points} className={a.tone} />
        ))}
      </g>
      <circle cx="18.6" cy="5.4" r="1.25" className="fill-pnc-orange" />
    </svg>
  );
}

/** Logo plus the "Findoe" wordmark. */
export function FindoeWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <FindoeLogo className="size-6" />
      <span className="font-display font-semibold tracking-tight text-pnc-ink">Findoe</span>
    </span>
  );
}
