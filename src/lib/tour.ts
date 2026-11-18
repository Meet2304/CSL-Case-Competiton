/**
 * The guided tour (`/tour`): one family's story on a plain white stage. Between
 * acts the stage shows the family themselves; within an act it shows the
 * working app, one card per person, signed in as them, with one soft color
 * behind it. A pointer with the person's name clicks the same controls they
 * would, and a spotlight leaves only the one thing that matters at full
 * strength. Four small dots at the top say which part of Findoe is on stage.
 * Nothing moves unless the presenter presses a key: a press plays one stop
 * (at most one click) and then the stage rests.
 *
 * This file is the pure part: the shapes of the script, where the cards sit,
 * where each card's camera looks, and what has to be replayed to reach a
 * stop. The script is in src/data/tour.ts and the player in src/components/tour.
 */
import type { Action, Rect, Size, Target } from "@/lib/film";

/** Whose screen a card is. */
export type FrameId = "husband" | "wife" | "child1" | "child2" | "advisor";
export const frameIds: FrameId[] = ["husband", "wife", "child1", "child2", "advisor"];

/** Where a card sits: alone, one of two side by side, or one of three under John's name. */
export type SlotId = "solo" | "left" | "right" | "third1" | "third2" | "third3";

/** The four parts of Findoe, shown as dots at the top of the stage. */
export type ProductId = "will" | "family" | "assets" | "advisory";
export const productIds: ProductId[] = ["will", "family", "assets", "advisory"];

/**
 * Where the story stands, which decides the demo state a scene's pages open on:
 * `before` John has put his affairs in order, `ready` once he has (his will on
 * file, a beneficiary named), `loss` once the bank has recorded his death,
 * `after` once his advisor has started passing his estate on.
 */
export type TourWorld = "before" | "ready" | "loss" | "after";
export const worldOrder: TourWorld[] = ["before", "ready", "loss", "after"];

/** One person's screen in a scene: the page it opens on, and how wide that page is laid out. */
export type SceneFrame = {
  slot: SlotId;
  /** Public path of the app page. */
  path: string;
  /** Something on the page that shows it has finished loading. */
  ready: Target;
  /** The width the page is laid out at, in pixels, before it is scaled to its card. */
  width: number;
  /**
   * Moving forward from the scene before (`TourScene.from`), keep the page this
   * person already has on screen, as they left it, rather than opening `path`.
   */
  keep?: boolean;
};

/** The screens on stage together. Stops in a scene share one load of each page. */
export type TourScene = {
  world: TourWorld;
  frames: Partial<Record<FrameId, SceneFrame>>;
  /** The part of Findoe the scene shows, unless a stop says otherwise. */
  product: ProductId | null;
  /**
   * The scene this one grows out of. Moving forward from it, everyone already
   * on stage stays there: their card glides to its new place and their page
   * changes behind the one showing, so nothing goes blank.
   */
  from?: string;
  /** Whose card, leaving, glides into whose as it fades: two views becoming one. */
  merge?: Partial<Record<FrameId, FrameId>>;
  /**
   * Run at once when the scene is opened directly (a jump, or a step back), to
   * put the pages where the scene before would have left them.
   */
  setup?: TourStep[];
};

/**
 * Something done on one person's screen, or a held moment. A `quick` click is
 * part of a run of clicks the viewer sees as one motion (a form's steps ticking
 * off one by one): no pointer travels to it and the camera stays where it is.
 */
export type TourStep = (Action & { in: FrameId; quick?: boolean }) | { do: "pause"; ms: number };

/**
 * What a card's camera frames once a stop's steps are done. Unless `spot` is
 * false, everything else on the page fades back so only this stays clear.
 */
export type TourFocus = {
  on: Target;
  maxZoom?: number;
  fit?: "width";
  spot?: boolean;
  /** Scroll this to the top of whatever holds it first, e.g. the start of an answer. */
  top?: Target;
  /** Room left around it inside the spotlight, in page pixels (10 unless set). */
  pad?: number;
};

/** A moment with the family, between the acts that show their screens. */
export type TourCast =
  /** The name of the product, before the story starts. */
  | "title"
  /** John, Maya, David and Alexa. */
  | "family"
  /** John forward, everything he looks after tied to him, the family behind. */
  | "carries"
  /** The family again, their accounts gathered into one family view. */
  | "gathered"
  /** Their advisor joins them, in touch with each of them. */
  | "advisor"
  /** John is gone: his tie to the advisor breaks. */
  | "loss"
  /** His name alone, with a small light above it. */
  | "memorial"
  /** Everyone, at the end. */
  | "circle"
  /** The four parts of Findoe gather around them. */
  | "vision"
  /** The four parts become one: PNC's AI ecosystem, powered by Findoe. Everyone else fades. */
  | "finale";

/**
 * A note beside a card that explains what the app is doing, tied by a line to
 * the part of the page it is about: a titled card, a short label, or the
 * decisions a rule took for one account.
 */
export type TourNote =
  | {
      kind: "card";
      icon: "data" | "law" | "cited";
      title: string;
      body: string;
      tag?: string;
      /** What on the page the note is about. */
      at: Target;
    }
  | { kind: "label"; text: string; at: Target }
  | {
      kind: "tree";
      title: string;
      account: string;
      steps: { question: string; answer: string }[];
      outcome: string;
      at: Target;
    };

export type TourStop = {
  /** Also the stop's URL hash. */
  id: string;
  /** Which scene the stop plays in. A stop without one is a moment with the family (`cast`). */
  scene?: string;
  cast?: TourCast;
  steps?: TourStep[];
  /** Where each card's camera rests; a card left out shows its whole screen. */
  focus?: Partial<Record<FrameId, TourFocus>>;
  /** One screen picked out: the others fade back. */
  spot?: FrameId;
  /** Notes beside one card, explaining what is on it. */
  notes?: { in: FrameId; items: TourNote[] };
  /** John's name and dates above the screens, once he has died. */
  memorial?: boolean;
  /** The part of Findoe on stage; defaults to the scene's, and to none for a moment with the family. */
  product?: ProductId | null;
};

/** The part of Findoe a stop shows, if any. */
export function productOf(stop: TourStop, scenes: Record<string, TourScene>): ProductId | null {
  if (stop.product !== undefined) return stop.product;
  return stop.scene ? scenes[stop.scene].product : null;
}

/** The clicks and typings a stop plays out with the pointer: one press, at most one of each. */
export function pointerMoves(stop: TourStop): number {
  return (stop.steps ?? []).filter(
    (s) => (s.do === "click" && !("quick" in s && s.quick)) || s.do === "type",
  ).length;
}

// ---------------------------------------------------------------------------
// Getting to a stop

export type StopPlan =
  /** A moment with the family: nothing to load. */
  | { kind: "cast" }
  /** The next stop of the scene already on stage: play its steps as they are. */
  | { kind: "continue" }
  /**
   * A step back within a scene over stops that only moved the camera: the
   * pages are already as this stop left them, so only the camera moves.
   */
  | { kind: "refocus" }
  /**
   * Load the scene's pages, then run the steps of these earlier stops at once
   * so the pages are in the state this stop starts from. `animate` says
   * whether this stop's own steps play out on screen (moving forward) or are
   * also run at once (jumping in, or stepping back). `carry` lists who stays
   * on stage from the scene before, keeping their card (moving forward only).
   */
  | { kind: "enter"; replay: number[]; animate: boolean; carry: FrameId[] };

export function planStop(
  stops: TourStop[],
  scenes: Record<string, TourScene>,
  from: number | null,
  to: number,
): StopPlan {
  const stop = stops[to];
  if (!stop.scene) return { kind: "cast" };
  const forward = from !== null && to === from + 1;
  const prev = from !== null ? stops[from].scene : undefined;
  if (forward && prev === stop.scene) return { kind: "continue" };
  if (
    from !== null &&
    to < from &&
    stops.slice(to, from + 1).every((s) => s.scene === stop.scene) &&
    stops.slice(to + 1, from + 1).every((s) => !s.steps?.length)
  )
    return { kind: "refocus" };
  let start = to;
  while (start > 0 && stops[start - 1].scene === stop.scene) start--;
  const replay = Array.from({ length: to - start }, (_, i) => start + i);
  const scene = scenes[stop.scene];
  const carry =
    forward && prev && scene.from === prev
      ? frameIds.filter((id) => scene.frames[id] && scenes[prev].frames[id])
      : [];
  return { kind: "enter", replay, animate: forward, carry };
}

// ---------------------------------------------------------------------------
// Where cards sit on the stage

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export type StageLayout = {
  slots: Record<SlotId, Rect>;
  /** Height kept above each card for the person's name. */
  nameH: number;
  /** The band at the top for the four dots. */
  dotsH: number;
  /** Where John's name rests alone, and where it rises to above three screens. */
  memorial: { center: { x: number; y: number }; top: { x: number; y: number } };
  /** Everything below the dots: where the moments with the family are drawn. */
  cast: Rect;
};

/**
 * Places every slot for a stage of the given size. The stage is nothing but
 * the cards, so they take all the room there is below the dots, less a margin
 * wide enough for the color behind them to fade out. A lone card is kept from
 * becoming a strip on very wide windows. Three cards sit lower, under the
 * space John's name rises into.
 */
export function stageLayout(W: number, H: number): StageLayout {
  const pad = clamp(Math.min(W, H) * 0.04, 24, 52);
  const nameH = clamp(H * 0.05, 40, 52);
  const dotsH = clamp(H * 0.05, 36, 48);
  const gap = pad * 1.25;
  const top = dotsH + pad * 0.35 + nameH;
  const availW = Math.max(240, W - pad * 2);
  const availH = Math.max(200, H - top - pad);

  const soloW = Math.min(availW, availH * 1.85);
  const solo = { x: (W - soloW) / 2, y: top, w: soloW, h: availH };

  const halfW = Math.min((availW - gap) / 2, availH * 1.1);
  const pairX = (W - (halfW * 2 + gap)) / 2;
  const left = { x: pairX, y: top, w: halfW, h: availH };
  const right = { ...left, x: pairX + halfW + gap };

  // Three screens, under the name: John's name and dates take the band above them.
  const nodeH = clamp(H * 0.12, 72, 132);
  const thirdTop = top + nodeH;
  const thirdH = Math.max(160, H - thirdTop - pad);
  const thirdW = Math.min((availW - gap * 2) / 3, thirdH * 0.9);
  const thirdX = (W - (thirdW * 3 + gap * 2)) / 2;
  const third = (i: number) => ({
    x: thirdX + i * (thirdW + gap),
    y: thirdTop,
    w: thirdW,
    h: thirdH,
  });

  return {
    slots: { solo, left, right, third1: third(0), third2: third(1), third3: third(2) },
    nameH,
    dotsH,
    memorial: {
      center: { x: W / 2, y: dotsH + (H - dotsH) * 0.46 },
      top: { x: W / 2, y: dotsH + nodeH * 0.38 },
    },
    cast: { x: 0, y: dotsH, w: W, h: H - dotsH },
  };
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
export const DEFAULT_MAX_ZOOM = 1.45;

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

/**
 * Where a box on a card's page lands on the stage, after the page is scaled
 * to the card and the card's camera has moved: for drawing notes beside it.
 */
export function pageToStage(card: Rect, pageWidth: number, camera: Camera, box: Rect): Rect {
  const scale = card.w / pageWidth;
  const s = scale * camera.scale;
  return {
    x: card.x + scale * camera.x + box.x * s,
    y: card.y + scale * camera.y + box.y * s,
    w: box.w * s,
    h: box.h * s,
  };
}
