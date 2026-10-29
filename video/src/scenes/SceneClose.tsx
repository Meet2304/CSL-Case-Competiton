import React from "react";
import { AbsoluteFill } from "remotion";
import { CUES } from "../config";
import { Backdrop } from "../components/Backdrop";
import { EndCard } from "../components/EndCard";
import type { SceneTiming } from "../timeline";
import { sec } from "./shared";

/** Scene 5: the four features connect, then resolve into the wordmark and the line. */
export const SceneClose: React.FC<SceneTiming> = ({ voStart, durationInFrames }) => {
  const c = CUES.close;
  const at = (s: number) => voStart + sec(s);
  return (
    <AbsoluteFill>
      <Backdrop />
      <EndCard
        nodesAt={at(c.nodes)}
        stagger={c.nodeStagger}
        convergeAt={at(c.converge)}
        tagline1At={at(c.tagline1)}
        tagline2At={at(c.tagline2)}
        teamAt={at(c.team)}
        end={durationInFrames}
      />
    </AbsoluteFill>
  );
};
