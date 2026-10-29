import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Database, Scale } from "lucide-react";
import type { Box } from "../captures";
import { projectBox, type Camera } from "../camera";
import { C, EASE_OUT, FONT } from "../theme";

type Source = {
  at: number;
  title: string;
  detail: string;
  chip?: string;
  tone: "bank" | "law";
};

const CARD = { x: 200, w: 580 };
/** Card tops and heights: the rulebook card holds two lines and the version chip. */
const TOPS = [300, 512];
const height = (s: Source) => (s.chip ? 226 : 150);

/** A point on a cubic Bezier at t (0–1). */
function bezier(p: [number, number][], t: number): [number, number] {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((k) => w.reduce((sum, wi, i) => sum + wi * p[i][k], 0)) as [number, number];
}

/**
 * The two sources every advisor answer is grounded in, as cards that slide in
 * and connect to the Findoe panel with animated lines. Colours follow the app's
 * own source pills: blue for bank records, purple for the legal library.
 */
export const DataSourcePanel: React.FC<{
  sources: [Source, Source];
  /** The Findoe panel (page box) the lines run to. */
  target: Box;
  camera: Camera;
  until: number;
}> = ({ sources, target, camera, until }) => {
  const frame = useCurrentFrame();
  if (frame < sources[0].at || frame > until + 14) return null;
  const leave = interpolate(frame, [until, until + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const t = projectBox(target, camera);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: leave }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {sources.map((s, i) => {
          const y0 = TOPS[i] + height(s) / 2;
          const x0 = CARD.x + CARD.w;
          const x1 = t.x - 4;
          // Converge gently on the panel, a little towards its middle.
          const y1 = Math.min(t.y + t.h - 60, Math.max(t.y + 60, y0 + (i === 0 ? 40 : -40)));
          const c = (x1 - x0) * 0.45;
          const pts: [number, number][] = [
            [x0, y0],
            [x0 + c, y0],
            [x1 - c, y1],
            [x1, y1],
          ];
          const d = `M ${x0} ${y0} C ${x0 + c} ${y0}, ${x1 - c} ${y1}, ${x1} ${y1}`;
          const draw = interpolate(frame, [s.at + 8, s.at + 26], [0, 1], {
            easing: Easing.bezier(0.45, 0, 0.2, 1),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const color = s.tone === "bank" ? C.blue600 : "#8b6fd1";
          // A pulse travelling along the line once it is drawn.
          const pulse = bezier(pts, ((((frame - s.at - 26) % 40) + 40) % 40) / 40);
          return (
            <g key={s.title}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - draw}
                opacity={0.95}
              />
              {draw >= 1 ? (
                <circle
                  cx={pulse[0]}
                  cy={pulse[1]}
                  r={7}
                  fill={C.white}
                  stroke={color}
                  strokeWidth={3}
                />
              ) : null}
              <circle cx={x1} cy={y1} r={7 * draw} fill={color} />
            </g>
          );
        })}
      </svg>
      {sources.map((s, i) => {
        const show = interpolate(frame, [s.at, s.at + 14], [0, 1], {
          easing: Easing.bezier(...EASE_OUT),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const bank = s.tone === "bank";
        const Icon = bank ? Database : Scale;
        return (
          <div
            key={s.title}
            style={{
              position: "absolute",
              left: CARD.x,
              top: TOPS[i],
              width: CARD.w,
              height: height(s),
              borderRadius: 22,
              background: C.white,
              border: `2px solid ${bank ? "#c9dcf5" : C.lawLine}`,
              boxShadow: "0 24px 60px rgba(3, 12, 32, 0.45)",
              padding: "30px 34px",
              boxSizing: "border-box",
              display: "flex",
              gap: 26,
              opacity: show,
              translate: `${(1 - show) * -50}px 0px`,
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                flexShrink: 0,
                borderRadius: 20,
                background: bank ? C.blue50 : C.lawBg,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon size={40} color={bank ? C.blue700 : C.law} strokeWidth={2} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 25, fontWeight: 500, color: C.muted, lineHeight: 1.3 }}>
                {s.detail}
              </div>
              {s.chip ? (
                <div
                  style={{
                    marginTop: 4,
                    alignSelf: "flex-start",
                    padding: "5px 14px",
                    borderRadius: 999,
                    background: C.lawBg,
                    border: `1px solid ${C.lawLine}`,
                    color: C.law,
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  {s.chip}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
