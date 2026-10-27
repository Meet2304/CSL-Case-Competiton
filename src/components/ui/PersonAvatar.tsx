import { cn } from "@/lib/format";

// Each person gets their own illustration, picked from these by a hash of
// their id, so it looks random but never changes between visits or renders.
const skins = [
  "fill-avatar-skin-1",
  "fill-avatar-skin-2",
  "fill-avatar-skin-3",
  "fill-avatar-skin-4",
];
const hairs = [
  "fill-avatar-hair-1",
  "fill-avatar-hair-2",
  "fill-avatar-hair-3",
  "fill-avatar-hair-4",
];
const shirts = ["fill-pnc-orange", "fill-pnc-blue-600", "fill-pnc-positive", "fill-pnc-navy"];
const backgrounds = ["fill-pnc-blue-50", "fill-pnc-chip", "fill-pnc-positive-bg", "fill-mock-bg"];
const hairStyles = ["short", "long", "bun", "curly"] as const;

function hash(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const pick = <T,>(list: readonly T[], h: number, shift: number) =>
  list[(h >>> shift) % list.length];

/**
 * A flat vector portrait of a person (head, hair, shoulders) in a circle,
 * used for the signed-in profile. Decorative: give the surrounding control
 * its own label.
 */
export function PersonAvatar({ seed, className }: { seed: string; className?: string }) {
  const h = hash(seed);
  const skin = pick(skins, h, 0);
  const hair = pick(hairs, h, 3);
  const shirt = pick(shirts, h, 6);
  const bg = pick(backgrounds, h, 9);
  const style = pick(hairStyles, h, 12);
  const clip = `avatar-${h.toString(36)}`;

  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("shrink-0 rounded-full ring-2 ring-white/80", className)}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="40" height="40" className={bg} />
        {/* Hair that falls behind the head and shoulders. */}
        {style === "long" && (
          <path d="M10.5 18c0-6.6 4.3-11 9.5-11s9.5 4.4 9.5 11v12h-19z" className={hair} />
        )}
        {style === "bun" && <circle cx="20" cy="6.5" r="4" className={hair} />}
        {/* Shoulders and neck. */}
        <path d="M5 41c0-8.3 6.7-13.5 15-13.5S35 32.7 35 41z" className={shirt} />
        <rect x="16.8" y="21" width="6.4" height="7.5" rx="3" className={skin} />
        {/* Head. */}
        <circle cx="20" cy="16.5" r="7.5" className={skin} />
        {/* Hair on top of the head. */}
        {style === "curly" ? (
          <path
            d="M12 16c-1.2-3.3.6-7.4 3.6-8.3 1.3-2 4.1-2.8 6.3-1.7 2.5-.4 5 1.2 5.8 3.6 1.7 1.5 1.9 4.2.6 6.4-1.3-2.6-4.3-4.3-8.3-4.3S13.3 13.4 12 16z"
            className={hair}
          />
        ) : (
          <path
            d="M12.5 16c0-5 3.4-8.6 7.5-8.6s7.5 3.6 7.5 8.6c-1.6-2.7-4.2-4.2-7.5-4.2s-5.9 1.5-7.5 4.2z"
            className={hair}
          />
        )}
        {/* A quiet face: eyes and a small smile. */}
        <circle cx="17.3" cy="17.2" r="0.9" className="fill-pnc-ink" />
        <circle cx="22.7" cy="17.2" r="0.9" className="fill-pnc-ink" />
        <path
          d="M17.8 20.2c1.3 1.1 3.1 1.1 4.4 0"
          fill="none"
          strokeWidth="0.9"
          strokeLinecap="round"
          className="stroke-pnc-ink"
        />
      </g>
    </svg>
  );
}
