import type { AvatarLook } from "@/data/types";
import { cn } from "@/lib/format";

type HairStyle = "short" | "long" | "bun" | "curly" | "fringe";

type Look = {
  skin: string;
  hair: string;
  shirt: string;
  bg: string;
  style: HairStyle;
  /** Light stubble along the jaw. */
  stubble?: boolean;
  earrings?: boolean;
  /** A collar over the shirt. */
  collar?: boolean;
  /** Drawstrings, as on a hoodie. */
  hoodie?: boolean;
  /** Scale of the figure: under 1 reads as a younger, smaller person. */
  size?: number;
};

/** Fixed looks for the household's roles, so each profile reads at a glance. */
const looks: Record<AvatarLook, Look> = {
  husband: {
    skin: "fill-avatar-skin-2",
    hair: "fill-avatar-hair-1",
    shirt: "fill-pnc-navy",
    bg: "fill-pnc-blue-50",
    style: "short",
    stubble: true,
    collar: true,
  },
  wife: {
    skin: "fill-avatar-skin-2",
    hair: "fill-avatar-hair-2",
    shirt: "fill-pnc-orange",
    bg: "fill-mock-bg",
    style: "long",
    earrings: true,
  },
  teen: {
    skin: "fill-avatar-skin-2",
    hair: "fill-avatar-hair-2",
    shirt: "fill-pnc-blue-600",
    bg: "fill-pnc-positive-bg",
    style: "bun",
    hoodie: true,
    size: 0.95,
  },
  child: {
    skin: "fill-avatar-skin-2",
    hair: "fill-avatar-hair-3",
    shirt: "fill-pnc-positive",
    bg: "fill-pnc-blue-50",
    style: "fringe",
    size: 0.88,
  },
};

// Anyone without a set look gets one picked by a hash of their id, so it looks
// random but never changes between visits or renders.
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
const hairStyles: HairStyle[] = ["short", "long", "bun", "curly"];

function hash(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const pick = <T,>(list: readonly T[], h: number, shift: number) =>
  list[(h >>> shift) % list.length];

function seeded(seed: string): Look {
  const h = hash(seed);
  return {
    skin: pick(skins, h, 0),
    hair: pick(hairs, h, 3),
    shirt: pick(shirts, h, 6),
    bg: pick(backgrounds, h, 9),
    style: pick(hairStyles, h, 12),
  };
}

/**
 * A flat vector portrait of a person (head, hair, shoulders) in a circle,
 * used for profiles. `look` draws a household role (husband, wife, teen,
 * child); otherwise the portrait is picked from `seed`. Decorative: give the
 * surrounding control its own label.
 */
export function PersonAvatar({
  seed,
  look,
  className,
}: {
  seed: string;
  look?: AvatarLook;
  className?: string;
}) {
  const l = look ? looks[look] : seeded(seed);
  const clip = `avatar-${look ?? hash(seed).toString(36)}`;
  const size = l.size ?? 1;

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
        <rect width="40" height="40" className={l.bg} />
        {/* Smaller figures stand on the bottom edge, like a shorter person. */}
        <g transform={`translate(20 41) scale(${size}) translate(-20 -41)`}>
          {/* Hair that falls behind the head and shoulders. */}
          {l.style === "long" && (
            <path d="M10.5 18c0-6.6 4.3-11 9.5-11s9.5 4.4 9.5 11v12h-19z" className={l.hair} />
          )}
          {l.style === "bun" && <circle cx="20" cy="6.5" r="4" className={l.hair} />}
          {/* Shoulders and neck. */}
          <path d="M5 41c0-8.3 6.7-13.5 15-13.5S35 32.7 35 41z" className={l.shirt} />
          {l.collar && (
            <path d="M15.2 28.3 20 32.5l4.8-4.2-1.9-.8L20 29.9l-2.9-2.4z" className="fill-white" />
          )}
          {l.hoodie && (
            <path
              d="M18 30.5v4.2M22 30.5v4.2"
              strokeWidth="0.9"
              strokeLinecap="round"
              className="stroke-white"
            />
          )}
          <rect x="16.8" y="21" width="6.4" height="7.5" rx="3" className={l.skin} />
          {/* Head. */}
          <circle cx="20" cy="16.5" r="7.5" className={l.skin} />
          {l.stubble && (
            <path
              d="M13.1 17.6c.5 3.8 3.3 6.4 6.9 6.4s6.4-2.6 6.9-6.4c-1.2 2-3.6 3.3-6.9 3.3s-5.7-1.3-6.9-3.3z"
              className={cn(l.hair, "opacity-30")}
            />
          )}
          {l.earrings && (
            <>
              <circle cx="12.6" cy="19.4" r="0.9" className="fill-mock-line" />
              <circle cx="27.4" cy="19.4" r="0.9" className="fill-mock-line" />
            </>
          )}
          {/* Hair on top of the head. */}
          {l.style === "curly" ? (
            <path
              d="M12 16c-1.2-3.3.6-7.4 3.6-8.3 1.3-2 4.1-2.8 6.3-1.7 2.5-.4 5 1.2 5.8 3.6 1.7 1.5 1.9 4.2.6 6.4-1.3-2.6-4.3-4.3-8.3-4.3S13.3 13.4 12 16z"
              className={l.hair}
            />
          ) : l.style === "fringe" ? (
            <path
              d="M12.5 16c0-5 3.4-8.6 7.5-8.6s7.5 3.6 7.5 8.6c-.7-1.5-1.6-2.6-2.8-3.2-1.2 1.4-3.3 2.2-5.8 2.2-2 0-3.7-.5-4.9-1.4-.7.7-1.2 1.5-1.5 2.4z"
              className={l.hair}
            />
          ) : (
            <path
              d="M12.5 16c0-5 3.4-8.6 7.5-8.6s7.5 3.6 7.5 8.6c-1.6-2.7-4.2-4.2-7.5-4.2s-5.9 1.5-7.5 4.2z"
              className={l.hair}
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
      </g>
    </svg>
  );
}
