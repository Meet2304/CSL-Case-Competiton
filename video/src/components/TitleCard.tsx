import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, EASE_OUT, FONT } from "../theme";
import { FindoeMark } from "./FindoeMark";

/** The opening card: the Findoe wordmark resolves over the navy stage. */
export const TitleCard: React.FC<{ out: number }> = ({ out }) => {
  const frame = useCurrentFrame();
  const mark = interpolate(frame, [2, 26], [0, 1], {
    easing: Easing.bezier(...EASE_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const word = interpolate(frame, [10, 36], [0, 1], {
    easing: Easing.bezier(...EASE_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave = interpolate(frame, [out - 10, out], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: leave,
        scale: String(interpolate(frame, [0, out], [1, 1.03])),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div
          style={{
            opacity: mark,
            scale: String(interpolate(mark, [0, 1], [0.82, 1])),
            filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.35))",
          }}
        >
          <FindoeMark size={150} spin={interpolate(mark, [0, 1], [-30, 0])} />
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 168,
            color: C.white,
            letterSpacing: `${interpolate(word, [0, 1], [0.12, -0.02])}em`,
            opacity: word,
            translate: `${interpolate(word, [0, 1], [-18, 0])}px 0px`,
            lineHeight: 1,
          }}
        >
          Findoe
        </div>
      </div>
    </AbsoluteFill>
  );
};
