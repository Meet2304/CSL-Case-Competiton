import React from "react";
import { Easing, Img, interpolate, useCurrentFrame } from "remotion";
import type { Box } from "../captures";
import { C } from "../theme";

/**
 * Keeps one element of a capture sharp and softly blurs and veils the rest of
 * the page, so neighbouring rows (other placeholder clients, dates) stay out of
 * focus. Render it inside a BrowserFrame layer, on top of the same still: it
 * works in page coordinates, so it follows that layer's camera.
 */
export const FocusBlur: React.FC<{ src: string; box: Box; from: number; pad?: number }> = ({
  src,
  box,
  from,
  pad = 8,
}) => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [from, from + 12], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (on <= 0) return null;
  const x = box.x - pad;
  const y = box.y - pad;
  const r = box.x + box.w + pad;
  const b = box.y + box.h + pad;
  // Everything except the focused box (even-odd: the inner rectangle is a hole).
  const outside = `polygon(evenodd, 0 0, 1920px 0, 1920px 1080px, 0 1080px, 0 0, ${x}px ${y}px, ${x}px ${b}px, ${r}px ${b}px, ${r}px ${y}px, ${x}px ${y}px)`;
  const layer: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
    clipPath: outside,
  };
  return (
    <>
      <Img src={src} style={{ ...layer, filter: "blur(5px)", opacity: on }} />
      <div style={{ ...layer, background: C.surface, opacity: 0.45 * on }} />
    </>
  );
};
