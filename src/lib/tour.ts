/**
 * The guided tour (`/tour`): the working app on a plain white stage. Each
 * person's screen is a card holding the real pages, signed in as that person,
 * with one soft color behind it; a pointer clicks the same controls a person
 * would. Nothing moves unless the presenter presses a key: a press plays one
 * stop of the script and then the stage rests.
 *
 * This file is the pure part: the shapes of the script, where the cards sit,
 * where each card's camera looks, and what has to be replayed to reach a
 * stop. The script is in src/data/tour.ts and the player in src/components/tour.
 */
import type { Action, Rect, Size, Target } from "@/lib/film";

/** Whose screen a card is. Alexa has no screen in the tour. */
export type FrameId = "husband" | "wife" | "child1" | "advisor";
export const frameIds: FrameId[] = ["husband", "wife", "child1", "advisor"];

/** Where a card sits: alone on the stage, or one of two side by side. */
export type SlotId = "solo" | "left" | "right";

/** Whether the family has been told of John's death yet. */
export type TourWorld = "before" | "after";

/** One person's screen in a scene: the page it opens on, and how wide that page is laid out. */
export type SceneFrame = {
  slot: SlotId;
  /** Public path of the app page. */
  path: string;
  /** Something on the page that shows it has finished loading. */
  ready: Target;
  /** The width the page is laid out at, in pixels, before it is scaled to its card. */
  width: number;
  /** Open the page signed out (the sign-on page), rather than as this person. */
  signedOut?: boolean;
};

/** The screens on stage together. Stops in a scene share one load of each page. */
export type TourScene = {
  world: TourWorld;
  frames: Partial<Record<FrameId, SceneFrame>>;
};

/** Something done on one person's screen, or a held moment. */
export type TourStep =
  | (Action & {
      in: FrameId;
      /** This click signs the person in through the app's own form. */
      signsIn?: boolean;
    })
  | { do: "pause"; ms: number };

/** What a card's camera frames once a stop's steps are done. */
export type TourFocus = { on: Target; maxZoom?: number; fit?: "width" };

export type TourStop = {
  /** Also the stop's URL hash. */
  id: string;
  /** One plain sentence about the stop, for screen readers and the presenter's notes. */
  say: string;
  /** Which scene the stop plays in; a stop without one is the closing line on the bare stage. */
  scene?: string;
  steps?: TourStep[];
  /** Where each card's camera rests; a card left out shows its whole screen. */
  focus?: Partial<Record<FrameId, TourFocus>>;
  /** This person's screen falls quiet: its color drains and its glow goes out. */
  quiet?: FrameId;
};

// ---------------------------------------------------------------------------
// Getting to a stop

export type StopPlan =
  /** The closing line: nothing to load. */
  | { kind: "card" }
  /** The next stop of the scene already on stage: play its steps as they are. */
  | { kind: "continue" }
  /**
   * Load the scene's pages, then run the steps of these earlier stops at once
   * so the pages are in the state this stop starts from. `animate` says
   * whether this stop's own steps play out on screen (moving forward) or are
   * also run at once (jumping in, or stepping back).
   */
  | { kind: "enter"; replay: number[]; animate: boolean };

export function planStop(stops: TourStop[], from: number | null, to: number): StopPlan {
  const stop = stops[to];
  if (!stop.scene) return { kind: "card" };
  const forward = from !== null && to === from + 1;
  if (forward && stops[from].scene === stop.scene) return { kind: "continue" };
  let start = to;
  while (start > 0 && stops[start - 1].scene === stop.scene) start--;
  const replay = Array.from({ length: to - start }, (_, i) => start + i);
  return { kind: "enter", replay, animate: forward };
}

// ---------------------------------------------------------------------------
// Where cards sit on the stage

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export type StageLayout = {
  slots: Record<SlotId, Rect>;
  /** Height kept above each card for the person's name. */
  nameH: number;
};

/**
 * Places every slot for a stage of the given size. The stage is nothing but
 * the cards, so they take all the room there is, less a margin wide enough
 * for the color behind them to fade out. A lone card is kept from becoming a
 * strip on very wide windows.
 */
export function stageLayout(W: number, H: number): StageLayout {
  const pad = clamp(Math.min(W, H) * 0.045, 28, 56);
  const nameH = clamp(H * 0.05, 40, 52);
  const gap = pad * 1.25;
  const top = pad * 0.55 + nameH;
  const availW = Math.max(240, W - pad * 2);
  const availH = Math.max(200, H - top - pad);

  const soloW = Math.min(availW, availH * 1.85);
  const solo = { x: (W - soloW) / 2, y: top, w: soloW, h: availH };

  const halfW = Math.min((availW - gap) / 2, availH * 1.1);
  const pairX = (W - (halfW * 2 + gap)) / 2;
  const left = { x: pairX, y: top, w: halfW, h: availH };
  const right = { ...left, x: pairX + halfW + gap };

  return { slots: { solo, left, right }, nameH };
}

/** The size of the page inside a card: laid out `width` wide, as tall as the card's shape allows. */
export function viewportFor(rect: Rect, width: number): Size {
  return { w: width, h: Math.round((rect.h * width) / rect.w) };
}

// ---------------------------------------------------------------------------
// Camera

/** Where a card's page sits inside the card: moved by (x, y) and scaled about its top-left corner. */
export type Camera = { x: number; y: number; scale: number };

/** Space kept around what the camera frames, in page pixels. */
const PAD = 24;
export const DEFAULT_MAX_ZOOM = 1.7;

/**
 * Where to put the page so `focus` (a box in page pixels) fills the card. It
 * never zooms out past the whole page, never in past `maxZoom`, and never
 * pans so far that the card shows what is beyond the page's edge.
 */
export function cameraFor(
  view: Size,
  focus?: Rect,
  options: { maxZoom?: number; fit?: "width" } = {},
): Camera {
  if (!focus || focus.w <= 0 || focus.h <= 0) return { x: 0, y: 0, scale: 1 };
  const byWidth = view.w / (focus.w + PAD * 2);
  const byHeight = view.h / (focus.h + PAD * 2);
  const wanted = options.fit === "width" ? byWidth : Math.min(byWidth, byHeight);
  const scale = clamp(wanted, 1, options.maxZoom ?? DEFAULT_MAX_ZOOM);
  const along = (length: number, centre: number) =>
    clamp(length / 2 - centre * scale, length - length * scale, 0);
  // Something taller than the card is shown from its top.
  const tall = (focus.h + PAD * 2) * scale > view.h;
  const centreY = tall ? focus.y - PAD + view.h / scale / 2 : focus.y + focus.h / 2;
  return { scale, x: along(view.w, focus.x + focus.w / 2), y: along(view.h, centreY) };
}
