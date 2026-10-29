import { staticFile } from "remotion";
import manifest from "../public/captures/manifest.json";

/** A rectangle in CSS pixels of the 1920x1080 capture viewport. */
export type Box = { x: number; y: number; w: number; h: number };

type Shots = typeof manifest.shots;
export type ShotId = keyof Shots;

/** The still (or clip) file for a capture. */
export const shotSrc = (id: ShotId) => staticFile(`captures/${manifest.shots[id].file}`);
export const clipSrc = (id: keyof typeof manifest.clips) =>
  staticFile(`captures/${manifest.clips[id].file}`);

/** The on-screen box of an element, as measured when the capture was taken. */
export function box<S extends ShotId>(shot: S, key: keyof Shots[S]["boxes"] & string): Box {
  const boxes = manifest.shots[shot].boxes as Record<string, Box>;
  const b = boxes[key];
  if (!b) throw new Error(`No box ${key} in ${shot}`);
  return b;
}

export const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** The smallest box holding all of `boxes`. */
export function union(...boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w));
  const btm = Math.max(...boxes.map((b) => b.y + b.h));
  return { x, y, w: r - x, h: btm - y };
}

export const clips = manifest.clips;
export const labels = manifest.labels;
export const decisionPath = manifest.decisionPath;
