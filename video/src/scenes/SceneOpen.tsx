import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { box, center, union } from "../captures";
import { cameraAt, focus, type CamKey } from "../camera";
import { CUES } from "../config";
import { Backdrop } from "../components/Backdrop";
import { BrowserFrame } from "../components/BrowserFrame";
import { Cursor } from "../components/Cursor";
import { TitleCard } from "../components/TitleCard";
import { EASE_OUT } from "../theme";
import type { SceneTiming } from "../timeline";
import { Shot, sec, shotOpacities } from "./shared";

/** Scene 1: the wordmark, then PNC sign-on — the cursor picks "husband" and signs on. */
export const SceneOpen: React.FC<SceneTiming> = () => {
  const frame = useCurrentFrame();
  const c = CUES.open;
  const out = sec(c.titleOut);
  const chipClick = sec(c.chipClick);
  const signOnClick = sec(c.signOnClick);
  const chip = box("s1-signon", "chip");
  const button = box("s1-signon", "button");

  const keys: CamKey[] = [
    { at: out - 10, zoom: 1, cx: 960, cy: 540 },
    { at: out + sec(2.4), ...focus(union(chip, button), 1.2, -60, 0) },
  ];
  const cam = (f: number) => cameraAt(f, keys);
  const [signon, filled] = shotOpacities(frame, [
    { id: "s1-signon", start: 0 },
    { id: "s1-signon-filled", start: chipClick + 2 },
  ]);
  const enter = interpolate(frame, [out - 12, out + 8], [0, 1], {
    easing: Easing.bezier(...EASE_OUT),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Backdrop />
      {frame < out + 2 ? <TitleCard out={out} /> : null}
      <AbsoluteFill style={{ opacity: enter, scale: String(0.965 + 0.035 * enter) }}>
        <BrowserFrame
          url="findoe.vercel.app"
          layers={[
            {
              key: "signon",
              content: <Shot id="s1-signon" />,
              camera: cam(frame),
              opacity: signon,
            },
            {
              key: "filled",
              content: <Shot id="s1-signon-filled" />,
              camera: cam(frame),
              opacity: filled,
            },
          ]}
        >
          <Cursor
            from={out}
            to={signOnClick + sec(1.2)}
            keys={[
              { at: out + 2, x: 1560, y: 900, cam },
              { at: chipClick - 5, ...center(chip), cam, click: chipClick },
              { at: signOnClick - 5, ...center(button), cam, click: signOnClick },
            ]}
          />
        </BrowserFrame>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
