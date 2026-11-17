/**
 * The guided tour's engine (`/tour`). The tour is a list of beats; each beat
 * changes the state of the stage a little, and the stage is drawn from that
 * state alone, so stepping back is as smooth as stepping forward.
 *
 * Nothing moves unless the presenter presses a key. A press plays one beat;
 * a beat with `auto` runs on into the next one after that many milliseconds,
 * which is how one press can move a pointer, click and show the result. A
 * beat without `auto` is a stop: the tour rests there until the next press.
 */
import { shareOrder, type TourAccountId, type TourCaptionId, type TourPersonId } from "@/data/tour";

// ---------------------------------------------------------------------------
// State

/** Whose screen a frame is. Alexa has no screen in the tour. */
export type FrameId = Exclude<TourPersonId, "child2">;
export const frameIds: FrameId[] = ["husband", "wife", "child1", "advisor"];

export type SlotId = "left" | "right" | "full" | "third1" | "third2" | "third3";

export type PageId =
  | "signin"
  | "assets"
  | "family"
  | "admin"
  | "kid"
  | "closed"
  | "condolence"
  | "alert"
  | "advHome"
  | "advClient"
  | "unclaimed"
  | "claim"
  | "howto";

export type FrameState = {
  slot: SlotId;
  shown: boolean;
  /** The person's glowing border and name. Off for the shared family dashboard. */
  border: boolean;
  page: PageId;
  /** `data-tour` id of the part of the page the camera closes in on. */
  zoom: string | null;
  /** `data-tour` id the pointer rests on; null hides the pointer. */
  cursor: string | null;
  /** Counts clicks, so each new one can ripple. */
  clicks: number;
};

/** Findoe's side of a conversation, as far as it has got. */
export type ChatState = { typed: boolean; sent: boolean; thought: number; answered: boolean };

export type TourState = {
  frames: Record<FrameId, FrameState>;
  caption: TourCaptionId;
  /** Sign-on: what John and Maya have typed, and whether they pressed the button. */
  typedUser: boolean;
  typedPass: boolean;
  signingOn: boolean;
  /** Family: the admin's settings panel, and what he has shared with David so far. */
  manageOpen: boolean;
  shared: TourAccountId[];
  /** The loss: where John's memorial sits, and whether word has gone out. */
  memorial: "off" | "center" | "source";
  flows: boolean;
  /** One screen picked out from the others. */
  spot: FrameId | null;
  advTab: "client" | "next";
  advChat: ChatState;
  claimStarted: boolean;
  /** Maya's claim: documents filled in so far, and where the claim stands. */
  docs: number;
  sending: boolean;
  jointClaim: "start" | "processing";
  mayaChat: ChatState;
  ended: boolean;
};

const frame = (slot: SlotId, page: PageId, shown: boolean): FrameState => ({
  slot,
  shown,
  border: true,
  page,
  zoom: null,
  cursor: null,
  clicks: 0,
});

const idleChat: ChatState = { typed: false, sent: false, thought: 0, answered: false };

export const initialTourState: TourState = {
  frames: {
    husband: frame("left", "signin", true),
    wife: frame("right", "signin", true),
    child1: frame("right", "kid", false),
    advisor: frame("third3", "alert", false),
  },
  caption: "signin",
  typedUser: false,
  typedPass: false,
  signingOn: false,
  manageOpen: false,
  shared: [],
  memorial: "off",
  flows: false,
  spot: null,
  advTab: "client",
  advChat: idleChat,
  claimStarted: false,
  docs: 0,
  sending: false,
  jointClaim: "start",
  mayaChat: idleChat,
  ended: false,
};

// ---------------------------------------------------------------------------
// The script

export type Beat = {
  /** Changes a copy of the state before it. */
  change: (s: TourState) => void;
  /** Run on to the next beat after this many milliseconds. */
  auto?: number;
};

const beat = (change: Beat["change"], auto?: number): Beat => ({ change, auto });

/** A click lands a moment before what it does, so the press can be seen. */
const PRESS = 320;

/** Move a pointer to something, click it, then show what the click did: three beats, one press. */
function click(
  who: FrameId,
  target: string,
  then: Beat["change"],
  after?: number,
  travel = 800,
): Beat[] {
  return [
    beat((s) => {
      s.frames[who].cursor = target;
    }, travel),
    beat((s) => {
      s.frames[who].clicks += 1;
    }, PRESS),
    beat(then, after),
  ];
}

const share = (account: TourAccountId, caption: TourCaptionId) =>
  click("husband", `share-${account}`, (s) => {
    s.shared = [...s.shared, account];
    s.caption = caption;
  });

/**
 * A question to Findoe, over two presses. The first sends it and Findoe works
 * through its steps, then rests so they can be read; the second brings the answer.
 */
function ask(
  chat: "advChat" | "mayaChat",
  who: FrameId,
  tour: string,
  captions: [TourCaptionId, TourCaptionId],
): Beat[] {
  const step = (n: number, auto?: number) =>
    beat((s) => {
      s[chat] = { ...s[chat], thought: n };
    }, auto);
  return [
    ...click(
      who,
      `${tour}-send`,
      (s) => {
        s[chat] = { ...s[chat], sent: true, thought: 1 };
        s.frames[who].zoom = `${tour}-findoe`;
        s.frames[who].cursor = null;
        s.caption = captions[0];
      },
      1100,
      650,
    ),
    step(2, 1100),
    step(3, 1100),
    step(4),
    beat((s) => {
      s[chat] = { ...s[chat], answered: true };
      s.caption = captions[1];
    }),
  ];
}

export const tourBeats: Beat[] = [
  // Two views: John and Maya sign on, each to their own dashboard.
  beat(() => {}),
  beat((s) => {
    s.typedUser = true;
  }, 1150),
  beat((s) => {
    s.typedPass = true;
  }, 1150),
  beat((s) => {
    s.frames.husband.cursor = "signon";
    s.frames.wife.cursor = "signon";
  }, 800),
  beat((s) => {
    s.frames.husband.clicks += 1;
    s.frames.wife.clicks += 1;
    s.signingOn = true;
  }, 850),
  beat((s) => {
    for (const id of ["husband", "wife"] as const) {
      s.frames[id].page = "assets";
      s.frames[id].cursor = null;
    }
    s.caption = "assets";
  }),

  // One family: the two screens become one dashboard.
  beat((s) => {
    for (const id of ["husband", "wife"] as const) {
      s.frames[id].slot = "full";
      s.frames[id].border = false;
      s.frames[id].page = "family";
    }
    s.caption = "family";
  }, 1300),
  beat((s) => {
    s.frames.wife.shown = false;
  }),
  beat((s) => {
    s.frames.husband.zoom = "fam-shared";
    s.caption = "shared";
  }),
  beat((s) => {
    s.frames.husband.zoom = "fam-people";
    s.caption = "children";
  }),

  // Access: John, an admin, decides what David sees.
  beat((s) => {
    Object.assign(s.frames.husband, { slot: "left", border: true, page: "admin", zoom: null });
    s.frames.child1.shown = true;
    s.caption = "admin";
  }),
  ...click("husband", "manage-btn", (s) => {
    s.manageOpen = true;
    s.caption = "manage";
  }),
  ...share(shareOrder[0], "share1"),
  ...share(shareOrder[1], "share2"),
  ...share(shareOrder[2], "share3"),

  // A loss: John dies, and three screens change.
  beat((s) => {
    s.frames.husband.shown = false;
    s.frames.husband.cursor = null;
    s.frames.child1.shown = false;
    s.memorial = "center";
    s.caption = "loss";
  }),
  // The light rises first; word goes out from where it comes to rest; then each screen answers.
  beat((s) => {
    s.memorial = "source";
    s.manageOpen = false;
    Object.assign(s.frames.husband, { slot: "third1", page: "closed" });
    Object.assign(s.frames.wife, { slot: "third2", page: "condolence", border: true });
    s.caption = "three";
  }, 1050),
  beat((s) => {
    s.flows = true;
  }, 750),
  beat((s) => {
    s.frames.husband.shown = true;
  }, 280),
  beat((s) => {
    s.frames.wife.shown = true;
  }, 280),
  beat((s) => {
    s.frames.advisor.shown = true;
  }),
  beat((s) => {
    s.spot = "husband";
    s.caption = "closed";
  }),
  beat((s) => {
    s.spot = "wife";
    s.caption = "condolence";
  }),
  beat((s) => {
    s.spot = "advisor";
    s.caption = "alert";
  }),

  // The advisor: from the alert to starting Maya's claim.
  beat((s) => {
    s.spot = null;
    s.frames.husband.shown = false;
    s.frames.wife.shown = false;
    s.flows = false;
    s.memorial = "off";
    Object.assign(s.frames.advisor, { slot: "full", page: "advHome" });
    s.caption = "advHome";
  }),
  ...click("advisor", "row-john", (s) => {
    s.frames.advisor.page = "advClient";
    s.frames.advisor.cursor = null;
    s.caption = "client";
  }),
  beat((s) => {
    s.frames.advisor.zoom = "readiness";
    s.caption = "readiness";
  }),
  beat((s) => {
    s.frames.advisor.zoom = "certificate";
    s.caption = "certificate";
  }),
  beat((s) => {
    s.frames.advisor.zoom = null;
    s.frames.advisor.cursor = "tab-next";
  }, 1250),
  beat((s) => {
    s.frames.advisor.clicks += 1;
  }, PRESS),
  beat((s) => {
    s.advTab = "next";
    s.caption = "nextSteps";
  }),
  ...click("advisor", "adv-input", (s) => {
    s.advChat = { ...s.advChat, typed: true };
    s.caption = "ask";
  }),
  ...ask("advChat", "advisor", "adv", ["thinking", "answer"]),
  ...click(
    "advisor",
    "initiate",
    (s) => {
      s.claimStarted = true;
    },
    1200,
  ),

  // Maya's claims: one account at PNC, one policy outside it.
  beat((s) => {
    s.frames.advisor.shown = false;
    Object.assign(s.frames.wife, { slot: "full", page: "unclaimed", shown: true, border: true });
    s.caption = "maya";
  }),
  ...click("wife", "claim-joint", (s) => {
    s.frames.wife.page = "claim";
    s.frames.wife.cursor = null;
    s.caption = "claim";
  }),
  beat((s) => {
    s.docs = 1;
    s.caption = "fills";
  }, 750),
  beat((s) => {
    s.docs = 2;
  }, 750),
  beat((s) => {
    s.docs = 3;
  }),
  ...click(
    "wife",
    "claim-send",
    (s) => {
      s.sending = true;
    },
    1000,
  ),
  beat((s) => {
    s.frames.wife.page = "unclaimed";
    s.frames.wife.cursor = null;
    s.sending = false;
    s.jointClaim = "processing";
    s.caption = "processing";
  }),
  ...click("wife", "claim-life", (s) => {
    s.frames.wife.page = "howto";
    s.frames.wife.cursor = null;
    s.caption = "howto";
  }),
  ...click("wife", "maya-input", (s) => {
    s.mayaChat = { ...s.mayaChat, typed: true };
    s.caption = "mayaAsk";
  }),
  ...ask("mayaChat", "wife", "maya", ["mayaThinking", "mayaAnswer"]),
  beat((s) => {
    s.frames.wife.zoom = null;
    s.ended = true;
    s.caption = "end";
  }),
];

/** The stage after each beat. */
export const tourStates: TourState[] = (() => {
  const states: TourState[] = [];
  let current = initialTourState;
  for (const b of tourBeats) {
    const next = structuredClone(current);
    b.change(next);
    states.push(next);
    current = next;
  }
  return states;
})();

/** Beats the tour rests on, waiting for a key press. */
export const tourStops: number[] = tourBeats.flatMap((b, i) => (b.auto === undefined ? [i] : []));

export const lastBeat = tourBeats.length - 1;

/**
 * Where a press of the forward key leads. From a stop, the next beat plays
 * (and may run on by itself); pressed again mid-run, it skips to the stop the
 * run was heading for.
 */
export function nextBeat(index: number): number {
  if (index >= lastBeat) return lastBeat;
  if (tourBeats[index].auto === undefined) return index + 1;
  return tourStops.find((stop) => stop > index) ?? lastBeat;
}

/** Where a press of the back key leads: the stop before this one. */
export function previousStop(index: number): number {
  return tourStops.findLast((stop) => stop < index) ?? 0;
}

/** The nearest stop at or before a beat, for opening the tour part-way through. */
export function stopAt(index: number): number {
  const clamped = Math.max(0, Math.min(lastBeat, Math.round(index) || 0));
  return tourStops.findLast((stop) => stop <= clamped) ?? 0;
}

/** What David can see on his own dashboard: his account, then what was shared. */
export function visibleToDavid(s: TourState): TourAccountId[] {
  return ["studentChecking", ...s.shared];
}

// ---------------------------------------------------------------------------
// Where screens sit on the stage

export type Rect = { x: number; y: number; w: number; h: number };

/** How wide a screen is laid out, in rem, before it is scaled to its slot. */
export const slotWidth: Record<SlotId, number> = {
  left: 40,
  right: 40,
  full: 72.5,
  third1: 27.5,
  third2: 27.5,
  third3: 27.5,
};

/** Pages with little on them are laid out narrower side by side, so they are drawn larger. */
export const pairWidth: Partial<Record<PageId, number>> = { admin: 37, kid: 37 };

/** How wide a frame's page is laid out, in rem. */
export function layoutWidth(f: Pick<FrameState, "slot" | "page">): number {
  const pair = f.slot === "left" || f.slot === "right";
  return (pair && pairWidth[f.page]) || slotWidth[f.slot];
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export type StageLayout = {
  slots: Record<SlotId, Rect>;
  /** Where John's memorial rests, and where it moves to once word goes out. */
  center: { x: number; y: number };
  source: { x: number; y: number };
  /** Height kept clear at the bottom for the caption. */
  captionH: number;
};

/**
 * Places every slot for a stage of the given size. Screens take as much room
 * as the stage allows without becoming too wide to read: a single screen up
 * to about 1.9:1, a pair close to square, three slightly tall.
 */
export function stageLayout(W: number, H: number): StageLayout {
  const pad = clamp(W * 0.026, 16, 48);
  const gap = clamp(W * 0.022, 14, 40);
  const top = 84; // the tour's own bar, then room for a name above each screen
  const captionH = clamp(H * 0.13, 92, 132);
  const availW = Math.max(200, W - pad * 2);
  const availH = Math.max(160, H - top - captionH - 8);

  const fullW = Math.min(availW, availH * 1.9);
  const full = { x: (W - fullW) / 2, y: top, w: fullW, h: availH };

  const halfW = Math.min((availW - gap) / 2, availH * 1.02);
  const pairX = (W - (halfW * 2 + gap)) / 2;
  const left = { x: pairX, y: top, w: halfW, h: availH };
  const right = { ...left, x: pairX + halfW + gap };

  const nodeH = clamp(H * 0.17, 96, 168);
  const thirdH = availH - nodeH;
  const thirdW = Math.min((availW - gap * 2) / 3, thirdH * 0.82);
  const thirdX = (W - (thirdW * 3 + gap * 2)) / 2;
  const third = (i: number) => ({
    x: thirdX + i * (thirdW + gap),
    y: top + nodeH,
    w: thirdW,
    h: thirdH,
  });

  return {
    slots: { left, right, full, third1: third(0), third2: third(1), third3: third(2) },
    center: { x: W / 2, y: top + availH * 0.44 },
    source: { x: W / 2, y: top + nodeH * 0.42 - 12 },
    captionH,
  };
}
