"use client";

import { useState } from "react";
import { Lock, Zap } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { tourProducts } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { productIds, type ProductId } from "@/lib/tour";
import { BOX, CLOSING_D, castPoint, castScale, closingCentre, closingSpots } from "./Cast";
import { ECO, ecoFrame } from "./Ecosystem";

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
/** Up a little sooner than across, so the circles fly to the dots on a gentle curve. */
const EASE_Y = "cubic-bezier(0.5, 0, 0.25, 1)";

/** How long each part takes to move in each mode, and how far apart they set off. */
const MOVE = { diagram: 1100, dots: 1100, vision: 1300, finale: 1100 };
const STAGGER = { diagram: 70, dots: 70, vision: 120, finale: 0 };

/** The diagram's circles become the dots (and back) in about this long, the last one included. */
export const MORPH_MS = MOVE.dots + STAGGER.dots * 3;
/** At the end, the bubble has settled this long after the four start to gather. */
export const FINALE_MS = 2100;

/** How wide the one bubble is drawn at the end, in the family moments' box units. */
const FINALE_D = 330;

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

/** The second line in the diagram's first two circles. */
const subLines: Partial<Record<ProductId, { text: string; icon: "zap" | "lock" }>> = {
  will: { text: "Super fast", icon: "zap" },
  family: { text: "with access control", icon: "lock" },
};

export type ProductsMode = "diagram" | "dots" | "vision" | "finale";

/**
 * The four parts of Findoe. On the first stop they are the four circles of
 * the ecosystem diagram (its labels are drawn by `Ecosystem`); on the next
 * press they fly, in order, to four small dots at the top left. Through the
 * story the part on stage is filled (blue for the family's, orange for the
 * advisor's), the rest are pale, and none is lit between acts. At the end they
 * grow and gather around the family, one on each side, and finally merge into
 * one bubble: PNC's AI ecosystem, powered by Findoe.
 */
export function Products({
  active,
  mode,
  dotsH,
  area,
}: {
  active: ProductId | null;
  /** `diagram`: the opening; `dots`: the story; `vision`: around the family; `finale`: one bubble. */
  mode: ProductsMode;
  /** Height of the band at the top. */
  dotsH: number;
  /** Where the family is drawn, to place the four around them. */
  area: Rect;
}) {
  const eco = ecoFrame(area);
  const cs = castScale(area);
  const big = CLOSING_D * cs;
  // The bubble sits in the middle of the stage, at the height the family stood.
  const centre = castPoint(area, { x: BOX.w / 2, y: closingCentre.y });
  const merged = FINALE_D * cs;
  // Each dot's place along the row: after the names before it.
  const dockXs = productIds.map(
    (_, i) =>
      25 + productIds.slice(0, i).reduce((sum, id) => sum + widthOf(tourProducts[id].name), 0),
  );
  const finale = mode === "finale";
  // The mode the four came from: flying in from the diagram or the close, they keep their color
  // until they are nearly at the dots.
  const [seen, setSeen] = useState({ mode, active, from: mode });
  if (seen.mode !== mode || seen.active !== active) setSeen({ mode, active, from: seen.mode });
  const landing = mode === "dots" && seen.from !== "dots";
  // Out of the bubble, the advisor's part takes its own colors back once it is clear of the others.
  const parting = mode === "vision" && seen.from === "finale";

  return (
    <>
      <ol
        aria-label="Parts of Findoe"
        className="pointer-events-none absolute inset-0 z-20 m-0 p-0"
      >
        {productIds.map((id, i) => {
          const p = tourProducts[id];
          const advisor = id === "advisory";
          const on = mode !== "dots" || active === id;
          const move = MOVE[mode];
          const delay = i * STAGGER[mode];

          // Where the part sits and how it is drawn: a filled circle, a light ring around it
          // and, for the advisor's, an orange ring just inside its edge.
          let at: { x: number; y: number };
          let d: number;
          let ring = 0;
          let inner = 0;
          if (mode === "diagram") {
            at = eco.at(ECO.xs[i], 0);
            d = ECO.r * 2 * eco.s;
            ring = ECO.ring * eco.s;
            inner = advisor ? 6 * eco.s : 0;
          } else if (mode === "vision") {
            at = castPoint(area, closingSpots[id]);
            d = big;
            ring = Math.max(6, d * 0.057);
            inner = advisor ? Math.max(3, d * 0.0165) : 0;
          } else if (finale) {
            at = centre;
            // Plain discs of one blue, so where they overlap they read as one shape.
            d = merged * 0.92;
          } else {
            at = { x: dockXs[i], y: dotsH / 2 };
            d = 10;
          }
          const fill = !on
            ? "var(--color-pnc-line)"
            : finale
              ? "var(--color-pnc-blue-700)"
              : advisor
                ? mode === "dots"
                  ? "var(--color-pnc-orange)"
                  : "var(--tour-eco-cream)"
                : "var(--color-pnc-blue-700)";
          const ringColor = advisor && !finale ? "var(--tour-eco-halo)" : "var(--tour-eco-ring)";
          const timing = `${move}ms ${EASE} ${delay}ms`;
          const diagramText = eco.s * 30;
          return (
            <li
              key={id}
              aria-current={mode === "dots" && active === id ? "step" : undefined}
              className="tour-motion absolute list-none"
              style={{
                left: at.x,
                top: at.y,
                // Once gathered into the bubble, the four go; back out, they are there at once.
                opacity: finale ? 0 : 1,
                transition: [
                  `left ${timing}`,
                  `top ${move}ms ${EASE_Y} ${delay}ms`,
                  finale ? "opacity 200ms ease 1300ms" : "opacity 0ms",
                ].join(", "),
              }}
            >
              <span
                aria-hidden="true"
                className="absolute block rounded-full"
                style={{
                  width: d,
                  height: d,
                  left: -d / 2,
                  top: -d / 2,
                  backgroundColor: fill,
                  boxShadow: `inset 0 0 0 ${inner}px var(--tour-eco-orange), 0 0 0 ${ring}px ${ringColor}`,
                  transition: [
                    `width ${timing}`,
                    `height ${timing}`,
                    `left ${timing}`,
                    `top ${timing}`,
                    `box-shadow ${timing}`,
                    landing
                      ? `background-color 500ms ease ${move * 0.6 + delay}ms`
                      : parting
                        ? `background-color 400ms ease ${move * 0.7}ms`
                        : finale
                          ? "background-color 450ms ease 400ms"
                          : `background-color ${mode === "dots" ? 300 : 600}ms ease`,
                  ].join(", "),
                }}
              />
              {/* The small name beside the dot: it fades in as the dot lands. */}
              <span
                className="absolute top-0 -translate-y-1/2 whitespace-nowrap font-semibold"
                style={{
                  left: 11,
                  fontSize: DOT_FONT,
                  opacity: mode === "dots" ? 1 : 0,
                  color: on ? "var(--color-pnc-ink)" : "var(--color-pnc-muted)",
                  transition:
                    mode === "dots"
                      ? `opacity 450ms ease ${move - 250 + delay}ms, color 300ms ease`
                      : "opacity 150ms ease, color 300ms ease",
                }}
              >
                {p.name}
              </span>
              {/* Its name in the diagram: gone before the circle starts to shrink. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center font-display font-bold italic"
                style={{
                  width: ECO.r * 1.8 * eco.s,
                  fontSize: diagramText,
                  lineHeight: 1.22,
                  color: advisor ? "var(--color-pnc-ink)" : "white",
                  opacity: mode === "diagram" ? 1 : 0,
                  transition:
                    mode === "diagram"
                      ? `opacity 500ms ease ${move - 250 + delay}ms`
                      : "opacity 160ms ease",
                }}
              >
                {p.lines.map((l) => (
                  <span key={l} className="block whitespace-nowrap">
                    {l}
                  </span>
                ))}
                {subLines[id] && (
                  <span
                    className="mt-[0.4em] flex items-center gap-[0.3em] whitespace-nowrap font-normal"
                    style={{ fontSize: diagramText * 0.78 }}
                  >
                    {subLines[id].text}
                    {subLines[id].icon === "zap" ? (
                      <Zap
                        className="size-[0.95em] shrink-0"
                        strokeWidth={1.5}
                        style={{ color: "var(--tour-eco-zap)", fill: "var(--tour-eco-zap)" }}
                      />
                    ) : (
                      <Lock
                        className="size-[0.95em] shrink-0"
                        strokeWidth={2.5}
                        style={{ color: "var(--tour-eco-lock)" }}
                      />
                    )}
                  </span>
                )}
              </span>
              {/* Its name around the family, at the end. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-center font-display font-semibold italic leading-[1.15]"
                style={{
                  width: big * 0.8,
                  fontSize: Math.max(11, big * 0.12),
                  color: advisor ? "var(--color-pnc-ink)" : "white",
                  opacity: mode === "vision" ? 1 : 0,
                  transition:
                    mode === "vision" ? `opacity 700ms ease ${move}ms` : "opacity 200ms ease",
                }}
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

      {/* The close: the four are one. */}
      <div
        aria-hidden={!finale}
        className="tour-motion pointer-events-none absolute z-20 grid place-items-center rounded-full bg-pnc-blue-700 text-center text-white"
        style={{
          left: centre.x - merged / 2,
          top: centre.y - merged / 2,
          width: merged,
          height: merged,
          // The ring grows as the bubble settles, so the four become one without a seam.
          boxShadow: `0 0 0 ${finale ? merged * 0.057 : 0}px var(--tour-eco-ring)`,
          opacity: finale ? 1 : 0,
          transform: `scale(${finale ? 1 : 0.92})`,
          transition: finale
            ? [
                "opacity 250ms ease 950ms",
                "transform 1100ms cubic-bezier(0.22, 1.25, 0.36, 1) 950ms",
                "box-shadow 900ms ease 1000ms",
              ].join(", ")
            : "opacity 300ms ease, transform 300ms ease, box-shadow 300ms ease",
        }}
      >
        <div
          style={{
            width: merged * 0.8,
            opacity: finale ? 1 : 0,
            transition: finale ? "opacity 700ms ease 1350ms" : "opacity 150ms ease",
          }}
        >
          <p
            className="font-display font-bold italic leading-[1.1]"
            style={{ fontSize: merged * 0.083 }}
          >
            PNC&rsquo;s AI ecosystem
          </p>
          <p
            className="mt-[0.5em] flex items-center justify-center gap-[0.4em] italic text-white/90"
            style={{ fontSize: merged * 0.05 }}
          >
            powered by
            <FindoeLogo className="size-[1.15em]" />
            <span className="font-display font-semibold not-italic text-white">Findoe</span>
          </p>
          <p
            className="mx-auto mt-[1.1em] w-fit border-t border-white/30 pt-[0.9em] text-white/80"
            style={{ fontSize: merged * 0.04 }}
          >
            Care that carries on.
          </p>
        </div>
      </div>
    </>
  );
}
