import { Easing, interpolate } from "remotion";
import type { Box } from "./captures";
import { EASE_IN_OUT } from "./theme";

/** Where the browser frame sits in the 1920x1080 composition. */
export const FRAME = { x: 160, y: 70, w: 1600, h: 900, chrome: 46, radius: 18 } as const;
/** The page viewport inside the frame (below the chrome bar). */
export const VIEWPORT = { x: FRAME.x, y: FRAME.y + FRAME.chrome, w: FRAME.w, h: FRAME.h } as const;
/** Captures are 1920x1080 CSS px; at zoom 1 they fill the viewport exactly. */
export const PAGE = { w: 1920, h: 1080 } as const;
const BASE = VIEWPORT.w / PAGE.w;

/** A camera over a capture: `zoom` 1 shows the whole page; (cx, cy) is the page point at the centre. */
export type Camera = { zoom: number; cx: number; cy: number };
/** A camera keyframe at a local frame. */
export type CamKey = Camera & { at: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keeps the page covering the whole viewport (no empty edges). */
export function clampCamera(c: Camera): Camera {
  const zoom = Math.max(1, c.zoom);
  const hw = PAGE.w / 2 / zoom;
  const hh = PAGE.h / 2 / zoom;
  return { zoom, cx: clamp(c.cx, hw, PAGE.w - hw), cy: clamp(c.cy, hh, PAGE.h - hh) };
}

/** A camera centred on `b` at `zoom`, nudged by (dx, dy) page px. */
export function focus(b: Box, zoom: number, dx = 0, dy = 0): Camera {
  return clampCamera({ zoom, cx: b.x + b.w / 2 + dx, cy: b.y + b.h / 2 + dy });
}

/** The largest zoom (up to `max`) that still shows `b` with a margin around it. */
export function fit(b: Box, margin = 0.18, max = 2.4): Camera {
  const zoom = Math.min(max, PAGE.w / (b.w * (1 + margin)), PAGE.h / (b.h * (1 + margin)));
  return focus(b, zoom);
}

/** The camera at `frame`, easing between keyframes (zoom eases in log space so pushes feel even). */
export function cameraAt(frame: number, keys: CamKey[]): Camera {
  if (frame <= keys[0].at) return clampCamera(keys[0]);
  const last = keys[keys.length - 1];
  if (frame >= last.at) return clampCamera(last);
  const i = keys.findIndex((k) => k.at > frame);
  const a = keys[i - 1];
  const b = keys[i];
  const p = interpolate(frame, [a.at, b.at], [0, 1], {
    easing: Easing.bezier(...EASE_IN_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ca = clampCamera(a);
  const cb = clampCamera(b);
  return clampCamera({
    zoom: Math.exp(Math.log(ca.zoom) + (Math.log(cb.zoom) - Math.log(ca.zoom)) * p),
    cx: ca.cx + (cb.cx - ca.cx) * p,
    cy: ca.cy + (cb.cy - ca.cy) * p,
  });
}

/** The CSS transform that places a 1920x1080 page layer under `cam`. */
export function pageTransform(cam: Camera): string {
  const s = BASE * cam.zoom;
  return `translate(${VIEWPORT.w / 2 - cam.cx * s}px, ${VIEWPORT.h / 2 - cam.cy * s}px) scale(${s})`;
}

/** A page point in composition coordinates. */
export function project(p: { x: number; y: number }, cam: Camera) {
  const s = BASE * cam.zoom;
  return {
    x: VIEWPORT.x + VIEWPORT.w / 2 + (p.x - cam.cx) * s,
    y: VIEWPORT.y + VIEWPORT.h / 2 + (p.y - cam.cy) * s,
  };
}

/** A page box in composition coordinates. */
export function projectBox(b: Box, cam: Camera): Box {
  const s = BASE * cam.zoom;
  const p = project(b, cam);
  return { x: p.x, y: p.y, w: b.w * s, h: b.h * s };
}

/** Blends two boxes (used to morph a glow ring from one element to the next). */
export function lerpBox(a: Box, b: Box, t: number): Box {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}
