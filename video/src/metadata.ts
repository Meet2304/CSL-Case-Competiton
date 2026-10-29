import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { staticFile, type CalculateMetadataFunction } from "remotion";
import { VO_LINES, type VoDurations } from "./config";
import { buildTimeline, type SceneId, type SceneTiming } from "./timeline";

/** Measures one audio file's duration in seconds. */
async function audioDuration(src: string): Promise<number> {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  return input.computeDuration();
}

/** The real length of every voiceover line in public/vo/. */
export async function measureVoiceover(): Promise<VoDurations> {
  const entries = await Promise.all(
    VO_LINES.map(async (l) => [l.id, await audioDuration(staticFile(l.file))] as const),
  );
  return Object.fromEntries(entries) as VoDurations;
}

export type DemoProps = { vo: VoDurations };

/** Sizes the whole video to the voiceover. */
export const calculateDemoMetadata: CalculateMetadataFunction<DemoProps> = async () => {
  const vo = await measureVoiceover();
  return { durationInFrames: buildTimeline(vo).durationInFrames, props: { vo } };
};

/** Sizes a single scene (for previewing it on its own in Studio) from the same timeline. */
export const sceneMetadata =
  (id: SceneId): CalculateMetadataFunction<SceneTiming> =>
  async () => {
    const timing = buildTimeline(await measureVoiceover()).scenes[id];
    return {
      durationInFrames: timing.durationInFrames,
      props: {
        durationInFrames: timing.durationInFrames,
        voStart: timing.voStart,
        voStart2: timing.voStart2,
      },
    };
  };
