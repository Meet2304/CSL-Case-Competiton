/**
 * The product story's engine (`/story`): one light canvas, one camera.
 *
 * The world is a 3 × 3 grid of plates. The family sits on the middle plate
 * and the story walks clockwise around them: John's view, getting ready, the
 * will, the shared family dashboard, back to the family for the loss, then
 * the advisor, the estate, Maya and the children. The last stop pulls back
 * until the whole circle is on screen at once.
 *
 * Nothing moves unless a key is pressed. A stop is a place the camera rests;
 * everything on screen is drawn from the number of the current stop alone, so
 * stepping back, or opening a link to any stop, needs no replay.
 */

export type PlateId =
  "john" | "prepare" | "will" | "kids" | "family" | "shared" | "maya" | "estate" | "advisor";

/** A plate is drawn at this size; the camera's widest ordinary shot is one plate. */
export const PLATE = { w: 1600, h: 900 };
const PITCH = { x: 2000, y: 1180 };

const cells: Record<PlateId, [col: number, row: number]> = {
  john: [0, 0],
  prepare: [1, 0],
  will: [2, 0],
  kids: [0, 1],
  family: [1, 1],
  shared: [2, 1],
  maya: [0, 2],
  estate: [1, 2],
  advisor: [2, 2],
};

export const plateIds = Object.keys(cells) as PlateId[];

export const WORLD = { w: PITCH.x * 2 + PLATE.w, h: PITCH.y * 2 + PLATE.h };

/** Top-left corner of a plate in the world. */
export function plateOrigin(id: PlateId): { x: number; y: number } {
  const [col, row] = cells[id];
  return { x: col * PITCH.x, y: row * PITCH.y };
}

/** A rectangle in world units. A camera view always has the plate's 16:9 shape. */
export type Rect = { x: number; y: number; w: number; h: number };

export type Stop = {
  id: string;
  /** The plate the camera is on, or the whole world for the closing shots. */
  plate: PlateId | "world";
  /** `data-focus` id of the part of the plate the camera closes in on. Omitted: the whole plate. */
  focus?: string;
};

const stop = <const Id extends string>(id: Id, plate: PlateId | "world", focus?: string) => ({
  id,
  plate,
  focus,
});

/** The story, one key press at a time. */
export const stops = [
  // The family, and the one person who holds the whole picture.
  stop("title", "family"),
  stop("smiths", "family"),
  stop("carries", "family", "carried"),

  // Before a loss: John's own view.
  stop("home", "john"),
  stop("assets", "john"),
  stop("outside", "john", "life-row"),

  // Getting ready: more than bank accounts, and no gaps.
  stop("add", "prepare"),
  stop("linked", "prepare", "linked-form"),
  stop("car", "prepare", "car-form"),
  stop("gaps", "prepare", "john-findoe"),
  stop("named", "prepare"),

  // The will.
  stop("will", "will"),
  stop("signed", "will"),

  // One family, and who sees what.
  stop("dashboard", "shared"),
  stop("access", "shared", "access-panel"),
  stop("granted", "shared", "access-panel"),
  stop("david", "shared", "david-phone"),

  // Back with the family: ready, then the loss.
  stop("together", "family"),
  stop("loss", "family", "loss-frame"),
  stop("word", "family"),

  // The advisor.
  stop("alert", "advisor"),
  stop("plan", "advisor"),
  stop("sources", "advisor", "findoe-dock"),

  // The estate: people first, then the will carried out.
  stop("estate", "estate"),
  stop("message", "estate", "messages"),
  stop("transfer", "estate"),

  // Maya.
  stop("condolence", "maya"),
  stop("claim", "maya"),
  stop("sent", "maya"),
  stop("ask", "maya", "maya-findoe"),
  stop("answer", "maya", "maya-findoe"),

  // The children.
  stop("children", "kids"),

  // The whole circle.
  stop("circle", "world"),
  stop("close", "world"),
] satisfies Stop[];

export type StopId = (typeof stops)[number]["id"];

export const lastStop = stops.length - 1;

const indexById = new Map<string, number>(stops.map((s, i) => [s.id, i]));

/** Where a stop sits in the story. */
export function stopIndex(id: StopId): number {
  return indexById.get(id)!;
}

/** The stop a URL hash names, or the first one. */
export function stopFromHash(hash: string): number {
  return indexById.get(hash.replace(/^#/, "")) ?? 0;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const nextStop = (i: number) => clamp(i + 1, 0, lastStop);
export const previousStop = (i: number) => clamp(i - 1, 0, lastStop);

/** The closing shot: every plate, with a little air around the world. */
export const worldView: Rect = (() => {
  const w = Math.max(WORLD.w, (WORLD.h * PLATE.w) / PLATE.h) * 1.06;
  const h = (w * PLATE.h) / PLATE.w;
  return { x: (WORLD.w - w) / 2, y: (WORLD.h - h) / 2, w, h };
})();

const ASPECT = PLATE.h / PLATE.w;

/**
 * A view that closes in on part of a plate (`r`, in the plate's own units):
 * the part sits in the middle with some air around it, never closer than a
 * third of a plate and never wider than a whole one, and the view stays on the plate.
 */
export function focusView(plate: PlateId, r: Rect, margin = 56): Rect {
  const o = plateOrigin(plate);
  const w = clamp(Math.max(r.w + margin * 2, (r.h + margin * 2) / ASPECT), PLATE.w / 3, PLATE.w);
  const h = w * ASPECT;
  // Centred on the part, but kept on the plate, so a close-up never drifts onto bare canvas.
  const x = clamp(r.x + r.w / 2 - w / 2, 0, PLATE.w - w);
  const y = clamp(r.y + r.h / 2 - h / 2, 0, PLATE.h - h);
  return { x: o.x + x, y: o.y + y, w, h };
}

/**
 * What the camera frames at a stop, in world units. `measure` finds a focus
 * on its plate (the page lays it out, so the camera follows the layout); a
 * focus it cannot find frames the whole plate.
 */
export function viewOf(
  index: number,
  measure?: (plate: PlateId, focus: string) => Rect | null,
): Rect {
  const s: Stop = stops[clamp(index, 0, lastStop)];
  if (s.plate === "world") return worldView;
  const r = s.focus && measure ? measure(s.plate, s.focus) : null;
  if (r) return focusView(s.plate, r);
  const o = plateOrigin(s.plate);
  return { x: o.x, y: o.y, w: PLATE.w, h: PLATE.h };
}

/** Whether a plate is lit at a stop: the camera is on it, or the whole world is in shot. */
export function plateLit(id: PlateId, index: number): boolean {
  const s: Stop = stops[clamp(index, 0, lastStop)];
  return s.plate === "world" || s.plate === id;
}

/**
 * The transform that shows a view in a window of the given size: the view is
 * centred and fits whole, so a window that is not 16:9 shows a little more of
 * the world rather than cutting the shot.
 */
export function fit(view: Rect, W: number, H: number) {
  const scale = Math.min(W / view.w, H / view.h);
  return {
    scale,
    x: W / 2 - (view.x + view.w / 2) * scale,
    y: H / 2 - (view.y + view.h / 2) * scale,
  };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The camera part-way between two views (`t` from 0 to 1). The centre glides,
 * the zoom changes evenly to the eye, and a long move lifts away from the
 * canvas in the middle, the way a camera on a crane would.
 */
export function fly(from: Rect, to: Rect, t: number): Rect {
  const e = ease(clamp(t, 0, 1));
  const cx = from.x + from.w / 2 + (to.x + to.w / 2 - from.x - from.w / 2) * e;
  const cy = from.y + from.h / 2 + (to.y + to.h / 2 - from.y - from.h / 2) * e;
  const travel = Math.hypot(
    to.x + to.w / 2 - from.x - from.w / 2,
    to.y + to.h / 2 - from.y - from.h / 2,
  );
  const lift = 1 + clamp((travel / Math.max(from.w, to.w)) * 0.16, 0, 0.3) * Math.sin(Math.PI * e);
  const w = from.w * Math.pow(to.w / from.w, e) * lift;
  const h = (w * PLATE.h) / PLATE.w;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** How long a move between two views takes, in milliseconds: longer for a longer way. */
export function flightTime(from: Rect, to: Rect): number {
  const travel = Math.hypot(
    to.x + to.w / 2 - from.x - from.w / 2,
    to.y + to.h / 2 - from.y - from.h / 2,
  );
  const zoom = Math.abs(Math.log(to.w / from.w));
  return Math.round(clamp(900 + travel * 0.32 + zoom * 500, 900, 2100));
}

// ---------------------------------------------------------------------------
// The thread: one line that runs clockwise through every plate, and closes.

/** The order the story visits the plates in, starting and ending with the family. */
export const threadOrder: PlateId[] = [
  "family",
  "john",
  "prepare",
  "will",
  "shared",
  "family",
  "advisor",
  "estate",
  "maya",
  "kids",
  "family",
];

/** How far outside a plate's edge the thread starts and ends, so it only runs through the gaps. */
const OUTSET = 70;

/** Where the thread leaves one plate for the next: the middle of the edge that faces it. */
function edges(a: PlateId, b: PlateId) {
  const oa = plateOrigin(a);
  const ob = plateOrigin(b);
  const across = Math.abs(ob.x - oa.x) / PITCH.x >= Math.abs(ob.y - oa.y) / PITCH.y;
  if (across) {
    const dir = Math.sign(ob.x - oa.x);
    const ya = oa.y + PLATE.h / 2;
    const yb = ob.y + PLATE.h / 2;
    return {
      from: { x: dir > 0 ? oa.x + PLATE.w + OUTSET : oa.x - OUTSET, y: ya },
      to: { x: dir > 0 ? ob.x - OUTSET : ob.x + PLATE.w + OUTSET, y: yb },
      across,
    };
  }
  const dir = Math.sign(ob.y - oa.y);
  const xa = oa.x + PLATE.w / 2;
  const xb = ob.x + PLATE.w / 2;
  return {
    from: { x: xa, y: dir > 0 ? oa.y + PLATE.h + OUTSET : oa.y - OUTSET },
    to: { x: xb, y: dir > 0 ? ob.y - OUTSET : ob.y + PLATE.h + OUTSET },
    across,
  };
}

/** Each leg of the thread as an SVG path through the gap between two plates, with the stop that draws it. */
export const threadLegs: { d: string; from: StopId }[] = (() => {
  // The first stop on the plate a leg arrives at draws that leg.
  const arrivals: StopId[] = [
    "home",
    "add",
    "will",
    "dashboard",
    "together",
    "alert",
    "estate",
    "condolence",
    "children",
    "circle",
  ];
  return arrivals.map((from, i) => {
    const { from: a, to: b, across } = edges(threadOrder[i], threadOrder[i + 1]);
    // An S-curve that leaves and arrives square to each edge.
    const c1 = across ? { x: (a.x + b.x) / 2, y: a.y } : { x: a.x, y: (a.y + b.y) / 2 };
    const c2 = across ? { x: (a.x + b.x) / 2, y: b.y } : { x: b.x, y: (a.y + b.y) / 2 };
    return { d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`, from };
  });
})();
