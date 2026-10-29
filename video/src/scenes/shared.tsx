import React from "react";
import { Easing, Img, interpolate } from "remotion";
import { shotSrc, type ShotId } from "../captures";
import { FPS } from "../config";

/** Seconds to frames. */
export const sec = (s: number) => Math.round(s * FPS);

/** A capture still, at the 1920x1080 CSS size the boxes are measured in. */
export const Shot: React.FC<{ id: ShotId }> = ({ id }) => (
  <Img
    src={shotSrc(id)}
    style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}
  />
);

/** One shot in a scene's sequence: shown from `start`, crossfading in over `xf` frames (0 = cut). */
export type ShotSpan = { id: ShotId; start: number; xf?: number };

/**
 * Opacity of each shot at `frame`. Later shots fade in over earlier ones; a
 * shot is dropped once the one after it is fully in.
 */
export function shotOpacities(frame: number, spans: ShotSpan[]): number[] {
  return spans.map((s, i) => {
    if (frame < s.start) return 0;
    const next = spans[i + 1];
    if (next && frame >= next.start + (next.xf ?? 0)) return 0;
    const xf = s.xf ?? 0;
    if (xf === 0) return 1;
    return interpolate(frame, [s.start, s.start + xf], [0, 1], {
      easing: Easing.bezier(0.45, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });
}
