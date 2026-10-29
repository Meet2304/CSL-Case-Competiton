import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Check, Landmark } from "lucide-react";
import type { Box } from "../captures";
import { C, EASE_OUT, FONT } from "../theme";
import { Tag } from "./Callout";

export type DecisionPath = {
  account: string;
  steps: { question: string; answer: string }[];
  outcome: string;
};

const X = 200;
/** Leaves room above the root for the feature tag. */
const TOP = 205;
const W = 640;
const GAP = 22;
const LINE_X = X + 46;

/** Rough height of a step card: a longer question wraps to two lines. */
const stepHeight = (q: string) => (q.length > 38 ? 128 : 100);

/**
 * One real path through the settlement rulebook, drawn node by node: the
 * account, each question the engine asked with the answer it found, and the
 * outcome. Labels come straight from the app (captures/manifest.json). Faint
 * stubs on each decision mark the branches not taken, without inventing labels.
 */
export const DecisionTree: React.FC<{
  path: DecisionPath;
  start: number;
  step: number;
  sweep: number;
  until: number;
  label: string;
}> = ({ path, start, step, sweep, until, label }) => {
  const frame = useCurrentFrame();
  if (frame < start - 2 || frame > until + 14) return null;
  const leave = interpolate(frame, [until, until + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Layout: root, steps, outcome.
  const nodes: { kind: "root" | "step" | "outcome"; top: number; h: number }[] = [];
  let y = TOP;
  nodes.push({ kind: "root", top: y, h: 80 });
  y += 80 + GAP;
  for (const s of path.steps) {
    const h = stepHeight(s.question);
    nodes.push({ kind: "step", top: y, h });
    y += h + GAP;
  }
  nodes.push({ kind: "outcome", top: y, h: 104 });

  const appearAt = (i: number) => start + i * step;
  const shown = (i: number) =>
    interpolate(frame, [appearAt(i), appearAt(i) + 12], [0, 1], {
      easing: Easing.bezier(...EASE_OUT),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  // The path sweep lights each node in turn, top to bottom.
  const sweepP = interpolate(frame, [sweep, sweep + 24], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lit = (i: number) => sweepP * (nodes.length - 1) >= i - 0.01 && frame >= sweep;
  const rootBox: Box = { x: X, y: nodes[0].top, w: W, h: nodes[0].h };

  return (
    <div style={{ position: "absolute", inset: 0, opacity: leave, fontFamily: FONT }}>
      {/* Connectors and branch stubs */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {nodes.slice(1).map((n, k) => {
          const i = k + 1;
          const prev = nodes[i - 1];
          const y0 = prev.top + prev.h;
          const y1 = n.top;
          const draw = interpolate(frame, [appearAt(i) - 7, appearAt(i) + 3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <line
              key={`c${i}`}
              x1={LINE_X}
              x2={LINE_X}
              y1={y0}
              y2={y0 + (y1 - y0) * draw}
              stroke={lit(i) ? C.orange : "rgba(255,255,255,0.9)"}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
        {nodes.map((n, i) =>
          n.kind !== "step" ? null : (
            <g key={`b${i}`} opacity={0.42 * shown(i)}>
              <line
                x1={X + W}
                x2={X + W + 74}
                y1={n.top + n.h / 2}
                y2={n.top + n.h / 2}
                stroke="#ffffff"
                strokeWidth={3}
                strokeDasharray="7 8"
              />
              <circle
                cx={X + W + 88}
                cy={n.top + n.h / 2}
                r={11}
                fill="none"
                stroke="#ffffff"
                strokeWidth={3}
              />
            </g>
          ),
        )}
      </svg>

      {nodes.map((n, i) => {
        const o = shown(i);
        const on = lit(i);
        const common: React.CSSProperties = {
          position: "absolute",
          left: X,
          top: n.top,
          width: W,
          height: n.h,
          borderRadius: 18,
          boxSizing: "border-box",
          opacity: o,
          translate: `0px ${(1 - o) * 18}px`,
          boxShadow: on
            ? "0 0 0 3px #ef6a00, 0 0 30px 4px rgba(239,106,0,0.45), 0 18px 40px rgba(2,10,30,0.45)"
            : "0 18px 40px rgba(2,10,30,0.45)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 28px 0 22px",
        };
        if (n.kind === "root")
          return (
            <div
              key="root"
              style={{ ...common, background: C.white, border: `2px solid ${C.line}` }}
            >
              <Chip>
                <Landmark size={28} color={C.blue700} strokeWidth={2.1} />
              </Chip>
              <span style={{ fontSize: 34, fontWeight: 700, color: C.ink }}>{path.account}</span>
            </div>
          );
        if (n.kind === "outcome")
          return (
            <div
              key="outcome"
              style={{ ...common, background: C.navy, border: "2px solid rgba(255,255,255,0.18)" }}
            >
              <Chip dark>
                <Check size={30} color={C.white} strokeWidth={3} />
              </Chip>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: C.orange,
                  }}
                >
                  Outcome
                </span>
                <span style={{ fontSize: 31, fontWeight: 600, color: C.white, lineHeight: 1.2 }}>
                  {path.outcome}
                </span>
              </span>
            </div>
          );
        const s = path.steps[i - 1];
        return (
          <div
            key={s.question}
            style={{ ...common, background: C.white, border: `2px solid ${C.line}` }}
          >
            <Chip
              positive
              pop={interpolate(frame, [appearAt(i) + 4, appearAt(i) + 12], [0.4, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            >
              <Check size={26} color={C.positive} strokeWidth={3} />
            </Chip>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 500, color: C.muted, lineHeight: 1.25 }}>
                {s.question}
              </span>
              <span style={{ fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>
                {s.answer}
              </span>
            </span>
          </div>
        );
      })}

      <Tag text={label} at={start + 8} until={until} anchor={rootBox} side="above" />
    </div>
  );
};

const Chip: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
  positive?: boolean;
  pop?: number;
}> = ({ children, dark, positive, pop = 1 }) => (
  <span
    style={{
      width: 50,
      height: 50,
      flexShrink: 0,
      borderRadius: 99,
      display: "grid",
      placeItems: "center",
      background: dark ? C.orange : positive ? C.positiveBg : C.blue50,
      scale: String(pop),
    }}
  >
    {children}
  </span>
);
