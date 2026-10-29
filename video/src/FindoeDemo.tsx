import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { FPS, TRANSITION_FRAMES } from "./config";
import type { DemoProps } from "./metadata";
import { SceneAdvisor } from "./scenes/SceneAdvisor";
import { SceneClose } from "./scenes/SceneClose";
import { SceneFamily } from "./scenes/SceneFamily";
import { SceneOpen } from "./scenes/SceneOpen";
import { SceneWidow } from "./scenes/SceneWidow";
import { C } from "./theme";
import { buildTimeline } from "./timeline";

const crossfade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
  />
);

/** The full demo: five scenes laid out around the measured voiceover. */
export const FindoeDemo: React.FC<DemoProps> = ({ vo }) => {
  const t = buildTimeline(vo);
  const s = t.scenes;
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="1 Open" durationInFrames={s.open.durationInFrames}>
          <SceneOpen {...s.open} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence name="2 Family" durationInFrames={s.family.durationInFrames}>
          <SceneFamily {...s.family} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence name="3 Widow" durationInFrames={s.widow.durationInFrames}>
          <SceneWidow {...s.widow} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence
          name="4 Advisor + AI"
          durationInFrames={s.advisor.durationInFrames}
        >
          <SceneAdvisor {...s.advisor} />
        </TransitionSeries.Sequence>
        {crossfade()}
        <TransitionSeries.Sequence name="5 Close" durationInFrames={s.close.durationInFrames}>
          <SceneClose {...s.close} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {t.vo.map((line) => (
        <Sequence
          key={line.id}
          name={`VO ${line.id}`}
          from={line.from}
          durationInFrames={line.durationInFrames}
          premountFor={FPS}
        >
          <Audio src={staticFile(`vo/${line.id}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
