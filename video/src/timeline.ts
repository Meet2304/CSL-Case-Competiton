import { FPS, SPACING, TRANSITION_FRAMES, type VoDurations, type VoId } from "./config.ts";

export type SceneId = "open" | "family" | "widow" | "advisor" | "close";

export type SceneTiming = {
  /** Frames this scene's sequence lasts (including its share of the crossfades). */
  durationInFrames: number;
  /** Local frame where the scene's (first) voiceover line starts. */
  voStart: number;
  /** Local frame of the second line (only the advisor scene has one). */
  voStart2: number;
};

export type Timeline = {
  durationInFrames: number;
  scenes: Record<SceneId, SceneTiming & { from: number }>;
  vo: { id: VoId; from: number; durationInFrames: number }[];
};

const f = (seconds: number) => Math.round(seconds * FPS);

/**
 * Lays the five scenes out around the measured voiceover. Scene boundaries sit
 * where the next scene's line starts; each crossfade is centred on its boundary.
 */
export function buildTimeline(d: VoDurations): Timeline {
  const t01 = SPACING.lead;
  const t02 = t01 + d["01-open"] + SPACING.gap;
  const t03 = t02 + d["02-family"] + SPACING.gap;
  const t04a = t03 + d["03-widow"] + SPACING.gap;
  const t04b = t04a + d["04a-advisor"] + SPACING.innerGap;
  const closeAt = t04b + d["04b-engine"] + SPACING.gap;
  const t05 = closeAt + SPACING.closePreroll;
  const end = t05 + d["05-close"] + SPACING.tail;

  const ids: SceneId[] = ["open", "family", "widow", "advisor", "close"];
  const bounds = [0, t02, t03, t04a, closeAt, end].map(f);
  const half = TRANSITION_FRAMES / 2;
  const voFirst = [t01, t02, t03, t04a, t05].map(f);

  const scenes = {} as Timeline["scenes"];
  ids.forEach((id, i) => {
    const from = i === 0 ? 0 : bounds[i] - half;
    const to = i === ids.length - 1 ? bounds[i + 1] : bounds[i + 1] + half;
    scenes[id] = {
      from,
      durationInFrames: to - from,
      voStart: voFirst[i] - from,
      voStart2: id === "advisor" ? f(t04b) - from : 0,
    };
  });

  const starts: Record<VoId, number> = {
    "01-open": t01,
    "02-family": t02,
    "03-widow": t03,
    "04a-advisor": t04a,
    "04b-engine": t04b,
    "05-close": t05,
  };
  const vo = (Object.keys(starts) as VoId[]).map((id) => ({
    id,
    from: f(starts[id]),
    durationInFrames: Math.ceil(d[id] * FPS),
  }));

  return { durationInFrames: f(end), scenes, vo };
}
