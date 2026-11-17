"use client";

import { tourGlow, tourLoss } from "@/data/tour";
import { cn } from "@/lib/format";
import type { FrameId, StageLayout } from "@/lib/tour";

const EASE = "cubic-bezier(0.6, 0, 0.2, 1)";
const RISE = 1300;

/** Who hears of John's death, and on which of the three screens. */
const reaches: { id: FrameId; slot: "third1" | "third2" | "third3" }[] = [
  { id: "husband", slot: "third1" },
  { id: "wife", slot: "third2" },
  { id: "advisor", slot: "third3" },
];

/**
 * John's name, alone. At first a small blue light rests above it; on the next
 * press the light and the name turn grey and rise to the top of the stage,
 * the years he lived appear, and a line runs from him to each of the three
 * screens his death changes.
 */
export function Memorial({
  state,
  layout,
}: {
  /** `center`: his name alone; `top`: risen above the three screens; `off`: not on stage. */
  state: "off" | "center" | "top";
  layout: StageLayout;
}) {
  const { center, top } = layout.memorial;
  const risen = state === "top";
  const at = risen ? top : center;
  const years = `${tourLoss.born.slice(0, 4)} – ${tourLoss.date.slice(0, 4)}`;
  const from = { x: top.x, y: top.y + 46 };

  return (
    <div aria-hidden={state === "off"} className="pointer-events-none absolute inset-0 z-10">
      {/* A line from him to each screen, once he has risen. */}
      <svg className="absolute inset-0 size-full overflow-visible">
        {reaches.map(({ id, slot }, i) => {
          const r = layout.slots[slot];
          const x = r.x + r.w / 2;
          const y = r.y - layout.nameH + 4;
          const bend = (y - from.y) * 0.6;
          return (
            <path
              key={id}
              d={`M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${x} ${y - bend}, ${x} ${y}`}
              pathLength={1}
              fill="none"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeDasharray="1 1"
              className="transition-[stroke-dashoffset,opacity] ease-out"
              style={{
                stroke: `color-mix(in srgb, ${tourGlow[id]} 60%, var(--color-pnc-line))`,
                strokeDashoffset: risen ? 0 : 1,
                opacity: risen ? 1 : 0,
                transitionDuration: risen ? "900ms" : "200ms",
                transitionDelay: risen ? `${RISE + 300 + i * 160}ms` : "0ms",
              }}
            />
          );
        })}
      </svg>

      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${at.x}px, ${at.y}px)`,
          opacity: state === "off" ? 0 : 1,
          transition: `transform ${RISE}ms ${EASE}, opacity 700ms ease`,
        }}
      >
        <div
          className="flex flex-col items-center"
          style={{
            transform: `translate(-50%, -50%) scale(${risen ? 0.62 : 1})`,
            transformOrigin: "50% 50%",
            transition: `transform ${RISE}ms ${EASE}`,
          }}
        >
          {/* The light: blue while he is here, grey once he is gone. */}
          <span
            className={cn(
              "block size-3.5 rounded-full transition-[background-color,box-shadow] duration-[1200ms]",
              risen
                ? "bg-pnc-muted/60 shadow-none"
                : "bg-pnc-blue-600 shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-pnc-blue-600)_16%,transparent),0_0_28px_6px_color-mix(in_srgb,var(--color-pnc-blue-600)_30%,transparent)]",
            )}
          />
          <p
            className={cn(
              "mt-5 whitespace-nowrap font-[Georgia,'Times_New_Roman',serif] text-[clamp(2.25rem,4vw,3.5rem)] leading-tight transition-colors duration-[1200ms]",
              risen ? "text-pnc-muted" : "text-pnc-navy",
            )}
          >
            {tourLoss.personName}
          </p>
          <p
            className={cn(
              "mt-1 whitespace-nowrap text-[clamp(1rem,1.5vw,1.35rem)] tracking-[0.35em] text-pnc-muted transition-opacity duration-700",
              risen ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDelay: risen ? `${RISE - 200}ms` : "0ms" }}
          >
            {years}
          </p>
        </div>
      </div>
    </div>
  );
}
