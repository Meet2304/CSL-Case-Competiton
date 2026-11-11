/**
 * The product film (`/film`): a guided, movie-style walk through the working
 * software. The real pages run in a frame; a camera zooms and cuts between
 * parts of them, and a cursor clicks through the same controls a person would.
 *
 * This file is the pure part: the shapes of the script, where the camera
 * should sit, and what has to be replayed to reach a shot. The script is in
 * src/data/film.ts and the player in src/components/film.
 */

/**
 * An element on a page of the app, found the way a person would describe it.
 * `text` matches the smallest visible element containing it (or, with `css`,
 * any element matching the selector whose text or label contains it);
 * `closest` then steps out to an ancestor, e.g. the card or row it sits in.
 */
export type Target = {
  css?: string;
  text?: string;
  /** The element's whole text must equal `text`. */
  exact?: boolean;
  closest?: string;
};

/** Something done on screen, in order, before the camera settles. */
export type Action =
  | { do: "click"; on: Target }
  | { do: "type"; into: Target; text: string }
  /** Wait until this appears (a page, a dialog, an answer). */
  | { do: "wait"; for: Target }
  /** Move the camera mid-way, so the viewer sees where the next click lands. */
  | { do: "look"; at: Target };

export type FilmPersona = "husband" | "wife" | "child1" | "advisor";

/** Whether the bank has recorded Husband's death yet. */
export type FilmWorld = "before" | "after";

/** A page of the app, who is signed in to it, and when. Shots in a scene share one page load. */
export type FilmScene = {
  as: FilmPersona;
  world: FilmWorld;
  /** Public path of the app page. */
  path: string;
  /** Something on the page that shows it has finished loading. */
  ready: Target;
};

export type FilmChapterId = "before" | "day" | "after" | "close";

export type FilmShot = {
  /** Also the shot's URL hash. */
  id: string;
  chapter: FilmChapterId;
  title: string;
  body: string;
  /** Which scene this shot is filmed in; a shot without one is a title card. */
  scene?: string;
  actions?: Action[];
  /** What the camera frames once the actions are done; the whole screen when omitted. */
  focus?: Target;
  /** A part inside the frame to ring. */
  mark?: Target;
  /** How far the camera may zoom in, as a multiple of the whole-screen view. */
  maxZoom?: number;
  /** Frame a tall element by its width and start at its top, instead of fitting all of it. */
  fit?: "width";
};

// ---------------------------------------------------------------------------
// Camera

export type Size = { w: number; h: number };
export type Rect = { x: number; y: number; w: number; h: number };
/** Where the screen sits on the stage: moved by (x, y) and scaled about its top-left corner. */
export type Camera = { x: number; y: number; scale: number };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Space kept around a framed element, in screen pixels. */
const PAD = 28;
/** How much of the stage the whole screen fills when nothing is in focus. */
const WIDE = 0.94;
export const DEFAULT_MAX_ZOOM = 2.4;

/**
 * Where to put the screen so `focus` (a box in screen pixels) fills the stage.
 * Never zooms out past the whole-screen view, never zooms in past `maxZoom`
 * times it, and never pans so far that the stage shows what is beyond the
 * screen's edge.
 */
export function frameFor(
  stage: Size,
  screen: Size,
  focus?: Rect,
  options: { maxZoom?: number; fit?: "width" } = {},
): Camera {
  const whole = Math.min(stage.w / screen.w, stage.h / screen.h) * WIDE;
  const along = (stageLen: number, screenLen: number, scale: number, centre: number) => {
    const length = screenLen * scale;
    // Smaller than the stage: centre it. Larger: keep the stage covered.
    if (length <= stageLen) return (stageLen - length) / 2;
    return clamp(stageLen / 2 - centre * scale, stageLen - length, 0);
  };
  if (!focus) {
    return {
      scale: whole,
      x: along(stage.w, screen.w, whole, screen.w / 2),
      y: along(stage.h, screen.h, whole, screen.h / 2),
    };
  }
  const byWidth = stage.w / (focus.w + PAD * 2);
  const byHeight = stage.h / (focus.h + PAD * 2);
  const wanted = options.fit === "width" ? byWidth : Math.min(byWidth, byHeight);
  const scale = clamp(wanted, whole, whole * (options.maxZoom ?? DEFAULT_MAX_ZOOM));
  // An element taller than the frame is shown from its top.
  const tall = (focus.h + PAD * 2) * scale > stage.h;
  const centreY = tall ? focus.y - PAD + stage.h / scale / 2 : focus.y + focus.h / 2;
  return {
    scale,
    x: along(stage.w, screen.w, scale, focus.x + focus.w / 2),
    y: along(stage.h, screen.h, scale, centreY),
  };
}

/** The part of `rect` that lies inside a `view` of this size (both in the same pixels). */
export function visiblePart(rect: Rect, view: Size): Rect {
  const x = clamp(rect.x, 0, view.w);
  const y = clamp(rect.y, 0, view.h);
  return {
    x,
    y,
    w: clamp(rect.x + rect.w, 0, view.w) - x,
    h: clamp(rect.y + rect.h, 0, view.h) - y,
  };
}

// ---------------------------------------------------------------------------
// Getting to a shot

export type ShotPlan =
  /** A title card: nothing to load. */
  | { kind: "card" }
  /** The next shot of the scene already on screen: play its actions as they are. */
  | { kind: "continue" }
  /**
   * Load the scene's page, then run the actions of these earlier shots
   * instantly so the page is in the state this shot starts from. `animate`
   * says whether this shot's own actions play out on screen (moving forward)
   * or are also run instantly (jumping in, or stepping back).
   */
  | { kind: "enter"; replay: number[]; animate: boolean };

export function planShot(shots: FilmShot[], from: number | null, to: number): ShotPlan {
  const shot = shots[to];
  if (!shot.scene) return { kind: "card" };
  const forward = from !== null && to === from + 1;
  if (forward && shots[from].scene === shot.scene) return { kind: "continue" };
  let start = to;
  while (start > 0 && shots[start - 1].scene === shot.scene) start--;
  const replay = Array.from({ length: to - start }, (_, i) => start + i);
  return { kind: "enter", replay, animate: forward };
}
