"use client";

import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import type { StageLayout } from "@/lib/tour";

/**
 * The opening diagram, in its own units: the four circles sit on the line
 * y = 0 and the diagram's middle is x = 0. The circles themselves are the
 * four parts of Findoe (`Products.tsx`), so they can fly to the dots after.
 */
export const ECO = {
  /** Where each circle's centre sits along the row, in `productIds` order. */
  xs: [-713, -300, 150, 715],
  /** The circle, the light ring around it, and the bracket and dashed outlines further out. */
  r: 183,
  ring: 21,
  R: 218,
};
/** The diagram's extent, labels included. */
const ECO_W = 1880;
const ECO_H = 600;

/** How large the diagram is drawn on the stage, and where a point of it lands. */
export function ecoFrame(area: Rect) {
  const s = Math.min((area.w * 0.86) / ECO_W, (area.h * 0.62) / ECO_H);
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  return { s, at: (x: number, y: number) => ({ x: cx + x * s, y: cy + y * s }) };
}

/** How long the diagram takes to fade in, after the circles have flown back into it. */
export const ECO_IN_DELAY = 900;

const [c1, c2, c3, c4] = ECO.xs;
const { R } = ECO;

/** A rounded outline around two circles, drawn from the left middle, clockwise. */
const pill = (a: number, b: number) =>
  `M ${a - R} 0 A ${R} ${R} 0 0 1 ${a} ${-R} L ${b} ${-R} A ${R} ${R} 0 0 1 ${b + R} 0 ` +
  `A ${R} ${R} 0 0 1 ${b} ${R} L ${a} ${R} A ${R} ${R} 0 0 1 ${a - R} 0 Z`;

/**
 * The opening: around the four parts of Findoe, who they serve (the family,
 * and the bank advisor) and when (before a loss, and after it), with the
 * product's name small at the upper right. Shown on the first stop only; it
 * fades out quickly as the circles fly to the dots.
 */
export function Ecosystem({ shown, layout }: { shown: boolean; layout: StageLayout }) {
  const { s, at } = ecoFrame(layout.cast);
  const o = at(0, 0);
  const W = layout.cast.x * 2 + layout.cast.w;
  const H = layout.cast.y + layout.cast.h;
  const pad = Math.min(Math.max(Math.min(W, H) * 0.035, 22), 44);
  const fade = {
    opacity: shown ? 1 : 0,
    transition: shown
      ? `opacity 700ms ease ${ECO_IN_DELAY}ms`
      : "opacity 260ms cubic-bezier(0.4, 0, 1, 1)",
  };

  return (
    <div
      aria-hidden={!shown}
      className="tour-motion pointer-events-none absolute inset-0 z-[21]"
      style={fade}
    >
      {/* The product's name, quietly, at the upper right. */}
      <div
        className="absolute flex flex-col items-end text-right"
        style={{ right: pad, top: pad * 0.9 }}
      >
        <PrivateBankLogo tone="dark" size="sm" product={false} />
        <p className="mt-2.5 flex items-center gap-2">
          <FindoeLogo className="size-5" />
          <span className="font-display text-lg font-semibold leading-none tracking-tight text-pnc-navy">
            Findoe
          </span>
        </p>
        <p className="mt-1.5 text-xs text-pnc-muted">Care that carries on.</p>
      </div>

      {/* Who each part serves, and when. The circles are drawn by Products. */}
      <svg
        className="absolute overflow-visible"
        style={{ left: o.x - 1000 * s, top: o.y - 330 * s, width: 2000 * s, height: 660 * s }}
        viewBox="-1000 -330 2000 660"
      >
        <g fill="none" strokeWidth={3.5} strokeDasharray="11 11" className="tour-eco-dash">
          <path d={pill(c1, c2)} />
          <path d={pill(c3, c4)} />
        </g>
        {/* The family's bracket over the first three; the advisor's arc over the fourth. */}
        <path
          d={`M ${c1 - R} 0 A ${R} ${R} 0 0 1 ${c1} ${-R} L ${c3} ${-R} A ${R} ${R} 0 0 1 ${c3 + R} 0`}
          fill="none"
          strokeWidth={4}
          className="stroke-pnc-blue-700"
        />
        <line
          x1={-295}
          y1={-247}
          x2={-295}
          y2={-R}
          strokeWidth={4}
          className="stroke-pnc-blue-700"
        />
        <path
          d={`M ${c4 - R} 0 A ${R} ${R} 0 0 1 ${c4 + R} 0`}
          fill="none"
          strokeWidth={4}
          className="tour-eco-orange"
        />
        <line x1={722} y1={-244} x2={722} y2={-R} strokeWidth={4} className="tour-eco-orange" />
        {/* From the family's dashboard to the portal that settles what they hold. */}
        <line x1={-113} y1={-7} x2={-50} y2={-7} strokeWidth={4} className="stroke-pnc-blue-700" />
        <path d="M -33 -7 L -55 -20 L -55 6 Z" className="fill-pnc-blue-700" />

        <g
          textAnchor="middle"
          className={cn("fill-pnc-ink font-display")}
          style={{ fontSize: 46, fontWeight: 600 }}
        >
          <text x={-295} y={-262}>
            Family
          </text>
          <text x={729} y={-262}>
            Bank Advisor
          </text>
        </g>
        <g textAnchor="middle" className="fill-pnc-ink font-display" style={{ fontSize: 32 }}>
          <text x={-498} y={292}>
            Pre-Planning
          </text>
          <text x={428} y={280}>
            After loss
          </text>
        </g>
      </svg>
    </div>
  );
}
