import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { project, type Camera } from "../camera";
import { C } from "../theme";

/**
 * Be at page point (x, y) by local frame `at`, seen through `cam` (the camera of
 * the shot that point belongs to), and optionally click at frame `click`.
 */
export type CursorKey = {
  at: number;
  x: number;
  y: number;
  cam: (frame: number) => Camera;
  click?: number;
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * An arrow cursor that glides between page points at a human pace (with a
 * slight arc) and clicks with a small press and ripple. Each point is projected
 * through its own shot's camera every frame, so the cursor stays on its target
 * while the camera moves and carries on smoothly across a change of shot.
 */
export const Cursor: React.FC<{ keys: CursorKey[]; from: number; to: number }> = ({
  keys,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const at = (k: CursorKey) => project({ x: k.x, y: k.y }, k.cam(frame));

  let pos = at(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame >= b.at) {
      pos = at(b);
      continue;
    }
    // Leave the previous point a little after arriving there (or after clicking it).
    const depart = Math.max(a.at, a.click ?? a.at) + 4;
    const pa = at(a);
    if (frame > depart) {
      const pb = at(b);
      const p = ease(Math.min(1, (frame - depart) / Math.max(1, b.at - depart)));
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const arc = Math.sin(Math.PI * p) * len * 0.06;
      pos = { x: pa.x + dx * p + (-dy / len) * arc, y: pa.y + dy * p + (dx / len) * arc };
    } else {
      pos = pa;
    }
    break;
  }

  const clicks = keys.filter((k) => k.click !== undefined);
  const press = clicks.reduce((s, k) => {
    const c = k.click as number;
    return Math.min(
      s,
      interpolate(frame, [c - 2, c + 1, c + 7], [1, 0.84, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }, 1);
  const fade = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {clicks.map((k) => {
        const t = frame - (k.click as number);
        if (t < 0 || t > 16) return null;
        const p = at(k);
        const r = interpolate(t, [0, 16], [8, 40], { easing: Easing.bezier(0.16, 1, 0.3, 1) });
        return (
          <div
            key={k.click}
            style={{
              position: "absolute",
              left: p.x - r,
              top: p.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `3px solid ${C.orange}`,
              opacity: interpolate(t, [0, 16], [0.75, 0]) * fade,
              boxSizing: "border-box",
            }}
          />
        );
      })}
      <svg
        width={34}
        height={42}
        viewBox="0 0 34 42"
        style={{
          position: "absolute",
          left: pos.x - 3,
          top: pos.y - 2,
          transformOrigin: "3px 2px",
          scale: String(press),
          opacity: fade,
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
        }}
      >
        <path
          d="M3 2 L3 33 L11 25.5 L16.5 38 L22 35.6 L16.6 23.4 L27.5 23.4 Z"
          fill={C.white}
          stroke={C.navy}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
