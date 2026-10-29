import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { Box } from "../captures";
import { VIEWPORT, lerpBox, projectBox, type Camera } from "../camera";
import { C, EASE_OUT, FONT } from "../theme";

/** The ring sits on `box` from local frame `at` (morphing from the previous box). */
export type RingKey = { at: number; box: Box };

const MORPH = 12;

/**
 * A soft glow ring around the element being described, with an optional short
 * feature tag. Boxes are page coordinates measured at capture time, so the ring
 * stays exactly on its element under any camera move. Successive keys morph the
 * ring from one element to the next.
 */
export const Callout: React.FC<{
  keys: RingKey[];
  until: number;
  camera: Camera;
  label?: string;
  labelAt?: number;
  /** Where the tag sits relative to the ring. */
  side?: "above" | "below" | "left" | "right";
  /** For tags above or below: line up with the ring's left (start) or right (end) edge. */
  align?: "start" | "end";
  pad?: number;
  radius?: number;
}> = ({ keys, until, camera, label, labelAt, side = "above", align, pad = 10, radius = 14 }) => {
  const frame = useCurrentFrame();
  const start = keys[0].at;
  if (frame < start - 1 || frame > until + 10) return null;

  // Current page box: morph towards each key as it arrives.
  let page = keys[0].box;
  for (let i = 1; i < keys.length; i++) {
    if (frame < keys[i].at) break;
    const t = interpolate(frame, [keys[i].at, keys[i].at + MORPH], [0, 1], {
      easing: Easing.bezier(0.45, 0, 0.2, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    page = lerpBox(keys[i - 1].box, keys[i].box, t);
  }
  const b = projectBox(page, camera);
  const appear = interpolate(frame, [start, start + 12], [0, 1], {
    easing: Easing.bezier(...EASE_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave = interpolate(frame, [until, until + 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = appear * leave;
  const grow = interpolate(appear, [0, 1], [1.05, 1]);
  const x = b.x - pad;
  const y = b.y - pad;
  const w = b.w + pad * 2;
  const h = b.h + pad * 2;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: radius,
          border: `3px solid ${C.orange}`,
          boxShadow: `0 0 0 6px rgba(239, 106, 0, 0.16), 0 0 34px 6px rgba(239, 106, 0, 0.38)`,
          opacity,
          scale: String(grow),
          boxSizing: "border-box",
        }}
      />
      {label ? (
        <Tag
          text={label}
          at={labelAt ?? start + 6}
          until={until}
          anchor={{ x, y, w, h }}
          side={side}
          align={align}
        />
      ) : null}
    </>
  );
};

/** A short feature tag: navy pill, orange dot. Placed beside its ring, kept inside the frame. */
export const Tag: React.FC<{
  text: string;
  at: number;
  until: number;
  anchor: Box;
  side: "above" | "below" | "left" | "right";
  align?: "start" | "end";
}> = ({ text, at, until, anchor, side, align = "start" }) => {
  const frame = useCurrentFrame();
  const show = interpolate(frame, [at, at + 12], [0, 1], {
    easing: Easing.bezier(...EASE_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hide = interpolate(frame, [until, until + 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const H = 58;
  const W = 32 + 18 + text.length * 16.2 + 30;
  let left = align === "end" ? anchor.x + anchor.w - W : anchor.x;
  let top = anchor.y - H - 16;
  if (side === "below" || (side === "above" && top < VIEWPORT.y + 12))
    top = anchor.y + anchor.h + 16;
  if (side === "left") {
    left = anchor.x - W - 18;
    top = anchor.y + anchor.h / 2 - H / 2;
  }
  if (side === "right") {
    left = anchor.x + anchor.w + 18;
    top = anchor.y + anchor.h / 2 - H / 2;
  }
  left = Math.max(VIEWPORT.x + 16, Math.min(left, VIEWPORT.x + VIEWPORT.w - W - 16));
  top = Math.max(VIEWPORT.y + 12, Math.min(top, VIEWPORT.y + VIEWPORT.h - H - 12));
  const drift = side === "below" ? -10 : 10;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        height: H,
        padding: "0 30px 0 26px",
        borderRadius: 999,
        background: C.navy,
        color: C.white,
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        boxShadow: "0 14px 34px rgba(4, 16, 38, 0.38)",
        border: "1px solid rgba(255,255,255,0.14)",
        opacity: show * hide,
        translate: `0px ${(1 - show) * drift}px`,
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: 99, background: C.orange }} />
      {text}
    </div>
  );
};
