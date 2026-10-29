import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Box } from "../captures";
import { projectBox, type Camera } from "../camera";
import { C } from "../theme";

/**
 * Puts the Findoe agent in the spotlight: dims the rest of the page and lays a
 * soft glow around the agent panel. Render inside the viewport clip.
 */
export const AgentSpotlight: React.FC<{
  box: Box;
  camera: Camera;
  from: number;
  to: number;
  /** How dark the rest of the page gets (0–1). */
  dim?: number;
}> = ({ box, camera, from, to, dim = 0.42 }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to + 12) return null;
  const on = interpolate(frame, [from, from + 14, to, to + 12], [0, 1, 1, 0], {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const b = projectBox(box, camera);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: b.x,
          top: b.y,
          width: b.w,
          height: b.h,
          borderRadius: 16,
          boxShadow: `0 0 0 4000px rgba(6, 20, 44, ${dim * on})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: b.x - 6,
          top: b.y - 6,
          width: b.w + 12,
          height: b.h + 12,
          borderRadius: 20,
          border: `3px solid ${C.orange}`,
          boxShadow: "0 0 0 6px rgba(239,106,0,0.14), 0 0 46px 10px rgba(239,106,0,0.35)",
          opacity: on,
          boxSizing: "border-box",
        }}
      />
    </>
  );
};
