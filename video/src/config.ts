/**
 * Every timing in the video lives here.
 *
 * Scene lengths follow the voiceover: calculateMetadata measures each file in
 * public/vo/ and buildTimeline() lays the scenes out around the real audio.
 * Cue times are seconds from the start of that scene's voiceover line, picked
 * from the word timings of the current takes. If a line is re-recorded with
 * different wording, re-check its cues.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Crossfade between scenes, in frames (centred on the cut). */
export const TRANSITION_FRAMES = 12;

export const VO_LINES = [
  { id: "01-open", file: "vo/01-open.mp3", voice: "A" },
  { id: "02-family", file: "vo/02-family.mp3", voice: "A" },
  { id: "03-widow", file: "vo/03-widow.mp3", voice: "A" },
  { id: "04a-advisor", file: "vo/04a-advisor.mp3", voice: "B" },
  { id: "04b-engine", file: "vo/04b-engine.mp3", voice: "B" },
  { id: "05-close", file: "vo/05-close.mp3", voice: "B" },
] as const;

export type VoId = (typeof VO_LINES)[number]["id"];
export type VoDurations = Record<VoId, number>;

/** Spacing around the voiceover, in seconds. */
export const SPACING = {
  /** Silence before the first line, while the wordmark resolves. */
  lead: 0.3,
  /** Breathing room after a line, before the next scene's line starts. */
  gap: 0.4,
  /** Between the two advisor lines, which share a scene. */
  innerGap: 0.35,
  /** The closing feature nodes animate before "Findoe" is said. */
  closePreroll: 0.9,
  /** Hold on the end card after the last word. */
  tail: 1.1,
};

/** Fallback durations (seconds) for Studio before metadata resolves. Measured from public/vo/. */
export const DEFAULT_VO_DURATIONS: VoDurations = {
  "01-open": 3.74,
  "02-family": 18.29,
  "03-widow": 18.91,
  "04a-advisor": 11.52,
  "04b-engine": 18.16,
  "05-close": 4.34,
};

/**
 * Cue sheet. Each scene's cues are seconds from its own voiceover line
 * (scene 4: `advisor` cues from line 04a, `engine` cues from line 04b).
 */
export const CUES = {
  open: {
    // Scene-relative (seconds from the very start): the title card, then sign-on.
    titleOut: 1.75,
    chipClick: 2.55,
    signOnClick: 3.35,
  },
  family: {
    glanceRing: 1.1,
    lifePolicyRing: 4.2,
    panToNotifications: 6.5,
    beneficiaryRing: 8.5,
    willRing: 9.85,
    fixLink: 11.2,
    toFamily: 12.9,
    manageClick: 13.75,
    toMembers: 14.05,
    rolesTabClick: 14.75,
    toRoles: 14.95,
    rolesRing: 15.3,
  },
  widow: {
    chipClick: 0.45,
    signOnClick: 1.05,
    toUnclaimed: 1.45,
    listRing: 2.5,
    jointRing: 5.0,
    iraRing: 6.45,
    /** Clip time 0 lands here; its launcher click then falls on "She asks Findoe". */
    clipStart: 8.1,
    claimListRing: 14.9,
    toClaim: 16.15,
    confirmClick: 17.35,
  },
  advisor: {
    chipClick: 0.35,
    signOnClick: 0.95,
    toHome: 1.35,
    lossRing: 2.6,
    toClient: 4.5,
    figuresRing: 5.3,
    panToSteps: 7.6,
    stepsRing: 8.0,
    step1Ring: 9.6,
  },
  engine: {
    spotlight: 0.0,
    customerCard: 2.4,
    rulebookCard: 4.85,
    sourcesOut: 6.45,
    howIDecidedClick: 6.95,
    toDecided: 7.15,
    iraStepRing: 7.4,
    tree: 8.2,
    /** Seconds between decision-tree nodes. */
    treeStep: 0.55,
    pathSweep: 13.0,
    treeOut: 14.1,
    toQuestion: 14.55,
    questionRing: 15.1,
  },
  close: {
    // Seconds from the start of line 05; negative = during the pre-roll.
    nodes: -0.85,
    nodeStagger: 0.17,
    converge: -0.1,
    tagline1: 0.8,
    tagline2: 2.55,
    team: 3.3,
  },
} as const;
