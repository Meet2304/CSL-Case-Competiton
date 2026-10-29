import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { box, center, clipSrc, clips, union } from "../captures";
import { cameraAt, focus, projectBox, type CamKey } from "../camera";
import { CUES } from "../config";
import { AgentSpotlight } from "../components/AgentSpotlight";
import { Backdrop } from "../components/Backdrop";
import { BrowserFrame } from "../components/BrowserFrame";
import { Callout, Tag } from "../components/Callout";
import { Cursor } from "../components/Cursor";
import type { SceneTiming } from "../timeline";
import { Shot, sec, shotOpacities } from "./shared";

const AGENT = clips["s3-agent"];

/**
 * Scene 3, the widow after a loss: sign on as the wife, one list of everything
 * Husband left, then Ask Findoe about his IRA (a real screen recording of the
 * agent answering), then the claim and its tracker.
 */
export const SceneWidow: React.FC<SceneTiming> = ({ voStart, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = CUES.widow;
  const at = (s: number) => voStart + sec(s);
  const ev = AGENT.events;
  /** A moment in the agent clip, as a local frame. */
  const clip = (s: number) => at(c.clipStart) + sec(s);
  const clipEnd = clip(AGENT.duration) - 1;

  const chip = box("s3-signon", "chip");
  const button = box("s3-signon", "button");
  const list = box("s3-unclaimed", "list");
  const panel = box("s3-answer", "panel");
  const signonCam = (f: number) =>
    cameraAt(f, [
      { at: 0, ...focus(union(chip, button), 1.2, -60, 0) },
      { at: at(c.toUnclaimed), ...focus(union(chip, button), 1.24, -60, 0) },
    ]);
  const pageKeys: CamKey[] = [
    { at: at(c.toUnclaimed), zoom: 1.12, cx: 960, cy: 520 },
    { at: at(3.2), ...focus(list, 1.3, 0, -80) },
    { at: at(c.clipStart - 1.1), ...focus(list, 1.34, 0, -80) },
    { at: at(c.clipStart), zoom: 1, cx: 960, cy: 540 },
    { at: clip(ev.launcherClick + 0.12), zoom: 1, cx: 960, cy: 540 },
    // Into the panel's input while she types the question...
    { at: clip(ev.inputClick + 0.05), zoom: 1.95, cx: 1428, cy: 803 },
    { at: clip(ev.send + 0.1), zoom: 1.95, cx: 1428, cy: 803 },
    // ...up to her question and Findoe's search steps...
    { at: clip(ev.send + 0.9), zoom: 1.95, cx: 1428, cy: 300 },
    { at: clip(ev.answered - 0.9), zoom: 1.95, cx: 1428, cy: 300 },
    // ...and down to what the claim asks for and what happens next.
    { at: clip(ev.answered + 0.5), zoom: 1.95, cx: 1428, cy: 560 },
    { at: at(c.toClaim), zoom: 1.98, cx: 1428, cy: 570 },
  ];
  const pageCam = (f: number) => cameraAt(f, pageKeys);
  const claimArea = union(
    box("s3-claim", "title"),
    box("s3-claim", "progress"),
    box("s3-claim", "confirm"),
  );
  const claimCam = (f: number) =>
    cameraAt(f, [
      { at: at(c.toClaim), ...focus(claimArea, 1.34) },
      { at: durationInFrames, ...focus(claimArea, 1.42, 0, 20) },
    ]);

  const [signon, filled, unclaimed, agentClip, answer, claim, claimDone] = shotOpacities(frame, [
    { id: "s3-signon", start: 0 },
    { id: "s3-signon-filled", start: at(c.chipClick) + 2 },
    { id: "s3-unclaimed", start: at(c.toUnclaimed), xf: 10 },
    { id: "s3-unclaimed", start: at(c.clipStart) },
    { id: "s3-answer", start: clipEnd },
    { id: "s3-claim", start: at(c.toClaim), xf: 10 },
    { id: "s3-claim-done", start: at(c.confirmClick) + 2 },
  ]);
  const spotFrom = clip(ev.launcherClick + 0.45);
  const spotTo = at(c.toClaim) - 4;
  const url =
    frame < at(c.toUnclaimed) + 5
      ? "findoe.vercel.app"
      : frame < at(c.toClaim) + 5
        ? "findoe.vercel.app/assets#unclaimed"
        : "findoe.vercel.app/assets#claim";

  return (
    <AbsoluteFill>
      <Backdrop />
      <BrowserFrame
        url={url}
        layers={[
          {
            key: "signon",
            content: <Shot id="s3-signon" />,
            camera: signonCam(frame),
            opacity: signon,
          },
          {
            key: "filled",
            content: <Shot id="s3-signon-filled" />,
            camera: signonCam(frame),
            opacity: filled,
          },
          {
            key: "unclaimed",
            content: <Shot id="s3-unclaimed" />,
            camera: pageCam(frame),
            opacity: unclaimed,
          },
          {
            key: "agent",
            camera: pageCam(frame),
            opacity: agentClip,
            content: (
              <Sequence
                from={at(c.clipStart)}
                durationInFrames={clipEnd - at(c.clipStart) + 1}
                layout="none"
              >
                <Video
                  src={clipSrc("s3-agent")}
                  muted
                  style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}
                />
              </Sequence>
            ),
          },
          {
            key: "answer",
            content: <Shot id="s3-answer" />,
            camera: pageCam(frame),
            opacity: answer,
          },
          {
            key: "claim",
            content: <Shot id="s3-claim" />,
            camera: claimCam(frame),
            opacity: claim,
          },
          {
            key: "claim-done",
            content: <Shot id="s3-claim-done" />,
            camera: claimCam(frame),
            opacity: claimDone,
          },
        ]}
        overlay={
          <>
            <Callout
              camera={pageCam(frame)}
              keys={[
                { at: at(c.listRing), box: list },
                { at: at(c.jointRing), box: box("s3-unclaimed", "rowJoint") },
                { at: at(c.iraRing), box: box("s3-unclaimed", "rowIra") },
              ]}
              until={at(c.clipStart - 0.4)}
              label="Everything he left"
              pad={8}
            />
            <AgentSpotlight box={panel} camera={pageCam(frame)} from={spotFrom} to={spotTo} />
            <Callout
              camera={pageCam(frame)}
              keys={[
                {
                  at: at(c.claimListRing),
                  box: union(box("s3-answer", "asks"), box("s3-answer", "claimList")),
                },
              ]}
              until={spotTo}
              pad={8}
            />
            <Callout
              camera={claimCam(frame)}
              keys={[{ at: at(c.toClaim) + 10, box: box("s3-claim", "progress") }]}
              until={durationInFrames}
              label="Claim and track"
              align="end"
              pad={12}
            />
          </>
        }
      >
        <Tag
          text="Ask Findoe"
          at={spotFrom + 10}
          until={spotTo}
          anchor={projectBox(panel, pageCam(frame))}
          side="left"
        />
        <Cursor
          from={0}
          to={at(c.toUnclaimed) + 4}
          keys={[
            { at: 0, x: center(button).x + 60, y: center(button).y + 40, cam: signonCam },
            { at: at(c.chipClick) - 5, ...center(chip), cam: signonCam, click: at(c.chipClick) },
            {
              at: at(c.signOnClick) - 5,
              ...center(button),
              cam: signonCam,
              click: at(c.signOnClick),
            },
          ]}
        />
        <Cursor
          from={at(c.clipStart - 0.9)}
          to={clip(ev.send + 0.6)}
          keys={[
            { at: at(c.clipStart - 0.8), x: 1420, y: 820, cam: pageCam },
            {
              at: clip(ev.launcherClick) - 5,
              ...center(box("s3-unclaimed", "launcher")),
              cam: pageCam,
              click: clip(ev.launcherClick),
            },
            {
              at: clip(ev.inputClick) - 4,
              ...center(box("s3-answer", "input")),
              cam: pageCam,
              click: clip(ev.inputClick),
            },
          ]}
        />
        <Cursor
          from={at(c.toClaim) + 8}
          to={durationInFrames}
          keys={[
            { at: at(c.toClaim) + 8, x: 760, y: 900, cam: claimCam },
            {
              at: at(c.confirmClick) - 5,
              x: 437,
              y: 973,
              cam: claimCam,
              click: at(c.confirmClick),
            },
            { at: at(c.confirmClick + 0.8), x: 560, y: 1010, cam: claimCam },
          ]}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
