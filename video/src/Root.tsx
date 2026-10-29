import React from "react";
import { Composition, Folder } from "remotion";
import { FindoeDemo } from "./FindoeDemo";
import { calculateDemoMetadata, sceneMetadata } from "./metadata";
import { SceneAdvisor } from "./scenes/SceneAdvisor";
import { SceneClose } from "./scenes/SceneClose";
import { SceneFamily } from "./scenes/SceneFamily";
import { SceneOpen } from "./scenes/SceneOpen";
import { SceneWidow } from "./scenes/SceneWidow";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FindoeDemo"
        component={FindoeDemo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={2370}
        defaultProps={{
          vo: {
            "01-open": 3.74,
            "02-family": 18.29,
            "03-widow": 18.91,
            "04a-advisor": 11.52,
            "04b-engine": 18.16,
            "05-close": 4.34,
          },
        }}
        calculateMetadata={calculateDemoMetadata}
      />
      {/* Each scene on its own timeline, timed from the same voiceover. */}
      <Folder name="Scenes">
        <Composition
          id="Scene1-Open"
          component={SceneOpen}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={140}
          defaultProps={{ durationInFrames: 140, voStart: 9, voStart2: 0 }}
          calculateMetadata={sceneMetadata("open")}
        />
        <Composition
          id="Scene2-Family"
          component={SceneFamily}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={573}
          defaultProps={{ durationInFrames: 573, voStart: 6, voStart2: 0 }}
          calculateMetadata={sceneMetadata("family")}
        />
        <Composition
          id="Scene3-Widow"
          component={SceneWidow}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={591}
          defaultProps={{ durationInFrames: 591, voStart: 6, voStart2: 0 }}
          calculateMetadata={sceneMetadata("widow")}
        />
        <Composition
          id="Scene4-Advisor"
          component={SceneAdvisor}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={927}
          defaultProps={{ durationInFrames: 927, voStart: 6, voStart2: 362 }}
          calculateMetadata={sceneMetadata("advisor")}
        />
        <Composition
          id="Scene5-Close"
          component={SceneClose}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={196}
          defaultProps={{ durationInFrames: 196, voStart: 33, voStart2: 0 }}
          calculateMetadata={sceneMetadata("close")}
        />
      </Folder>
    </>
  );
};
