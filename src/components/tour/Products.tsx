"use client";

import type { CSSProperties } from "react";
import { tourProducts } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import { productIds, type ProductId } from "@/lib/tour";
import { CLOSING_D, castPoint, castScale, closingSpots } from "./Cast";

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const MOVE = 1300;

/** The size of the names beside the dots. */
const DOT_FONT = 12;
let pen: CanvasRenderingContext2D | null = null;
/** How wide a name is drawn beside its dot, plus the gap to the next dot. The stage only draws in the browser. */
function widthOf(name: string) {
  pen ??= document.createElement("canvas").getContext("2d");
  if (!pen) return name.length * DOT_FONT * 0.56 + 28;
  pen.font = `600 ${DOT_FONT}px ${getComputedStyle(document.body).fontFamily}`;
  return pen.measureText(name).width + 34;
}

/**
 * The four parts of Findoe. Through the story they are four small dots at the
 * top left: the part on stage is filled (blue for the family's, orange for
 * the advisor's), the rest are pale, and none is lit between acts. At the end
 * they grow and gather around the family, one on each side.
 */
export function Products({
  active,
  vision,
  dotsH,
  area,
}: {
  active: ProductId | null;
  /** The close: the four surround the family. */
  vision: boolean;
  /** Height of the band at the top. */
  dotsH: number;
  /** Where the family is drawn, to place the four around them. */
  area: Rect;
}) {
  const big = CLOSING_D * castScale(area);
  // Each dot's place along the row: after the names before it.
  const dockXs = productIds.map(
    (_, i) =>
      25 + productIds.slice(0, i).reduce((sum, id) => sum + widthOf(tourProducts[id].name), 0),
  );
  return (
    <ol aria-label="Parts of Findoe" className="pointer-events-none absolute inset-0 z-20 m-0 p-0">
      {productIds.map((id, i) => {
        const p = tourProducts[id];
        const advisor = id === "advisory";
        const on = vision || active === id;
        const d = vision ? big : 10;
        const centre = vision ? castPoint(area, closingSpots[id]) : { x: dockXs[i], y: dotsH / 2 };
        const fill = !on
          ? "bg-pnc-line"
          : advisor
            ? vision
              ? "bg-white ring-[3px] ring-pnc-orange shadow-[0_0_0_10px_color-mix(in_srgb,var(--color-pnc-orange)_12%,transparent)]"
              : "bg-pnc-orange"
            : vision
              ? "bg-pnc-blue-700 shadow-[0_0_0_10px_var(--color-pnc-blue-50)]"
              : "bg-pnc-blue-700";
        return (
          <li
            key={id}
            aria-current={active === id ? "step" : undefined}
            className="absolute list-none"
            style={
              {
                left: centre.x,
                top: centre.y,
                transition: `left ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms, top ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms`,
              } as CSSProperties
            }
          >
            <span
              aria-hidden="true"
              className={cn("absolute block rounded-full", fill)}
              style={{
                width: d,
                height: d,
                left: -d / 2,
                top: -d / 2,
                transition: `width ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms, height ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms, left ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms, top ${MOVE}ms ${EASE} ${vision ? i * 120 : 0}ms, background-color 300ms ease`,
              }}
            />
            {/* The small name beside the dot. */}
            <span
              className={cn(
                "absolute top-0 -translate-y-1/2 whitespace-nowrap font-semibold transition-[opacity,color] duration-300",
                vision ? "opacity-0" : on ? "text-pnc-ink" : "text-pnc-muted/70",
              )}
              style={{ left: 11, fontSize: DOT_FONT }}
            >
              {p.name}
            </span>
            {/* The name inside the circle, at the end. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-center font-display font-semibold italic leading-[1.15] transition-opacity duration-700",
                vision ? "opacity-100 delay-[1200ms]" : "opacity-0",
                advisor ? "text-pnc-ink" : "text-white",
              )}
              style={{ width: big * 0.8, fontSize: Math.max(11, big * 0.12) }}
            >
              {p.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
