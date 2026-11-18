"use client";

import { useState } from "react";
import { tourGlow, tourLoss } from "@/data/tour";
import type { FrameId, StageLayout } from "@/lib/tour";
import { castPoint, castScale } from "./Cast";

const EASE = "cubic-bezier(0.6, 0, 0.2, 1)";
/** How long John's name takes to rise from the family moment to above the three screens. */
export const RISE_MS = 1400;
/** When the lines to the three screens start to draw, after the name starts to rise. */
export const LINES_DELAY_MS = 950;

/** Where his name's middle sits in the family moment, in that moment's box units. */
const NAME_AT = { x: 550, y: 57.5 };
/** His name's size in the family moment, and the years' below it, in box units. */
const NAME_PX = 28;
const YEARS_PX = 14;

/** Who hears of John's death, and on which of the three screens. */
const reaches: { id: FrameId; slot: "third1" | "third2" | "third3" }[] = [
  { id: "husband", slot: "third1" },
  { id: "wife", slot: "third2" },
  { id: "advisor", slot: "third3" },
];

/**
 * John's name. When he dies it appears above the family with the years he
 * lived (`cast`); on the next press it rises above the three screens his
 * death changes (`top`), the years fade, and a line runs from him to each
 * screen. One element throughout, so the move is one calm glide.
 */
export function Memorial({
  state,
  layout,
}: {
  /** `cast`: above the family as he dies; `top`: risen above the three screens; `off`: not on stage. */
  state: "off" | "cast" | "top";
  layout: StageLayout;
}) {
  // Off stage, the name fades where it last was.
  const [last, setLast] = useState<"cast" | "top">(state === "top" ? "top" : "cast");
  if (state !== "off" && state !== last) setLast(state);
  const place = state === "off" ? last : state;
  const risen = place === "top";
  const shown = state !== "off";

  const area = layout.cast;
  const cs = castScale(area);
  const W = area.x * 2 + area.w;
  const castSize = NAME_PX * cs;
  const topSize = Math.min(Math.max(W * 0.04, 36), 56) * 0.62;
  const k = risen ? topSize / castSize : 1;
  const low = castPoint(area, NAME_AT);
  const at = risen ? layout.memorial.top : { x: low.x, y: low.y + (shown ? 0 : 8 * cs) };
  const top = layout.memorial.top;
  const from = { x: top.x, y: top.y + topSize * 0.62 + 12 };
  const years = `${tourLoss.born.slice(0, 4)} – ${tourLoss.date.slice(0, 4)}`;

  return (
    <div aria-hidden={!shown} className="pointer-events-none absolute inset-0 z-10">
      {/* A line from him to each screen, once he has risen. */}
      <svg className="absolute inset-0 size-full overflow-visible">
        {reaches.map(({ id, slot }, i) => {
          const r = layout.slots[slot];
          const x = r.x + r.w / 2;
          const y = r.y - layout.nameH + 4;
          const bend = (y - from.y) * 0.6;
          const drawn = state === "top";
          return (
            <path
              key={id}
              d={`M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${x} ${y - bend}, ${x} ${y}`}
              pathLength={1}
              fill="none"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeDasharray="1 1"
              className="tour-motion transition-[stroke-dashoffset,opacity] ease-out"
              style={{
                stroke: `color-mix(in srgb, ${tourGlow[id]} 60%, var(--color-pnc-line))`,
                strokeDashoffset: drawn ? 0 : 1,
                opacity: drawn ? 1 : 0,
                transitionDuration: drawn ? "900ms" : "250ms",
                transitionDelay: drawn ? `${LINES_DELAY_MS + i * 160}ms` : "0ms",
              }}
            />
          );
        })}
      </svg>

      {/* His name, its middle at `at`, and the years he lived below it. */}
      <div
        className="tour-motion absolute left-0 top-0"
        style={{
          transformOrigin: "0 0",
          transform: `translate(${at.x}px, ${at.y}px) scale(${k})`,
          opacity: shown ? 1 : 0,
          transition: [
            `transform ${RISE_MS}ms ${EASE}`,
            shown ? `opacity 1400ms ease ${risen ? 0 : 500}ms` : "opacity 600ms ease",
          ].join(", "),
        }}
      >
        <p
          className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-[Georgia,'Times_New_Roman',serif] leading-tight"
          style={{
            fontSize: castSize,
            color: risen ? "var(--color-pnc-muted)" : "var(--color-pnc-navy)",
            transition: `color ${RISE_MS}ms ease`,
          }}
        >
          {tourLoss.personName}
        </p>
        <p
          className="absolute left-0 -translate-x-1/2 whitespace-nowrap pl-[0.35em] tracking-[0.35em] text-pnc-muted"
          style={{
            top: castSize * 0.625 + 4 * cs,
            fontSize: YEARS_PX * cs,
            lineHeight: 1.43,
            opacity: risen ? 0 : 1,
            transition: risen ? "opacity 450ms ease" : "opacity 700ms ease 700ms",
          }}
        >
          {years}
        </p>
      </div>
    </div>
  );
}
