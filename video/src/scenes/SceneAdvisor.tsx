import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { box, center, decisionPath, labels, shotSrc, union } from "../captures";
import { cameraAt, focus, type CamKey } from "../camera";
import { CUES } from "../config";
import { AgentSpotlight } from "../components/AgentSpotlight";
import { Backdrop } from "../components/Backdrop";
import { BrowserFrame } from "../components/BrowserFrame";
import { Callout } from "../components/Callout";
import { Cursor } from "../components/Cursor";
import { DataSourcePanel } from "../components/DataSourcePanel";
import { DecisionTree } from "../components/DecisionTree";
import { FocusBlur } from "../components/FocusBlur";
import type { SceneTiming } from "../timeline";
import { Shot, sec, shotOpacities } from "./shared";

/**
 * Scene 4, the advisor and the engine: the loss flagged, where things stand,
 * the step-by-step plan, then the Findoe panel — its two sources, one real path
 * through the decision tree, and the question it asks instead of guessing.
 */
export const SceneAdvisor: React.FC<SceneTiming> = ({ voStart, voStart2, durationInFrames }) => {
  const frame = useCurrentFrame();
  const a = (s: number) => voStart + sec(s);
  const e = (s: number) => voStart2 + sec(s);
  const c = CUES.advisor;
  const g = CUES.engine;

  const chip = box("s4-signon", "chip");
  const button = box("s4-signon", "button");
  const panel = box("s4-client", "panel");
  const figures = union(box("s4-client", "outsideProbate"), box("s4-client", "probate"));
  const steps = union(box("s4-client", "doNext"), box("s4-client", "step1"));
  const question = box("s4-question", "question529");

  const signonCam = (f: number) =>
    cameraAt(f, [
      { at: 0, ...focus(union(chip, button), 1.2, -60, 0) },
      { at: a(c.toHome), ...focus(union(chip, button), 1.24, -60, 0) },
    ]);
  // Tight on Notifications: the customer table's dated column stays out of frame.
  const homeCam = (f: number) =>
    cameraAt(f, [
      { at: a(c.toHome), zoom: 2.15, cx: 1408, cy: 470 },
      { at: a(c.toClient), zoom: 2.35, cx: 1408, cy: 440 },
    ]);
  const panelView = { zoom: 1.2, cx: 1120, cy: 630 };
  const clientKeys: CamKey[] = [
    { at: a(c.toClient), ...focus(box("s4-client", "where"), 1.5, 0, 40) },
    { at: a(c.figuresRing - 0.1), ...focus(box("s4-client", "where"), 1.5, 0, 40) },
    { at: a(c.figuresRing + 1.1), ...focus(figures, 1.85, 200, -10) },
    { at: a(c.panToSteps), ...focus(figures, 1.85, 200, -10) },
    { at: a(c.panToSteps + 1.0), ...focus(steps, 1.6, 80, 60) },
    { at: e(-0.15), ...focus(steps, 1.64, 80, 60) },
    { at: e(0.85), ...panelView },
    { at: e(g.toQuestion), ...panelView },
    { at: e(g.toQuestion + 0.9), ...focus(question, 2.1, -60, 0) },
    { at: durationInFrames, ...focus(question, 2.18, -60, 0) },
  ];
  const clientCam = (f: number) => cameraAt(f, clientKeys);

  const [signon, filled, home, client, decided, questionShot] = shotOpacities(frame, [
    { id: "s4-signon", start: 0 },
    { id: "s4-signon-filled", start: a(c.chipClick) + 2 },
    { id: "s4-home", start: a(c.toHome), xf: 10 },
    { id: "s4-client", start: a(c.toClient), xf: 8 },
    { id: "s4-decided", start: e(g.toDecided) },
    { id: "s4-question", start: e(g.toQuestion), xf: 4 },
  ]);
  const url =
    frame < a(c.toHome) + 5
      ? "findoe.vercel.app"
      : frame < a(c.toClient) + 5
        ? "findoe.vercel.app/advisor"
        : "findoe.vercel.app/advisor/clients/c-placeholder";
  const cam = clientCam(frame);

  return (
    <AbsoluteFill>
      <Backdrop />
      <BrowserFrame
        url={url}
        layers={[
          {
            key: "signon",
            content: <Shot id="s4-signon" />,
            camera: signonCam(frame),
            opacity: signon,
          },
          {
            key: "filled",
            content: <Shot id="s4-signon-filled" />,
            camera: signonCam(frame),
            opacity: filled,
          },
          {
            key: "home",
            camera: homeCam(frame),
            opacity: home,
            content: (
              <>
                <Shot id="s4-home" />
                {/* Only the flagged loss stays sharp: no other placeholder clients or dates. */}
                <FocusBlur
                  src={shotSrc("s4-home")}
                  box={box("s4-home", "notifLoss")}
                  from={a(c.toHome) + 6}
                  pad={4}
                />
              </>
            ),
          },
          { key: "client", content: <Shot id="s4-client" />, camera: cam, opacity: client },
          { key: "decided", content: <Shot id="s4-decided" />, camera: cam, opacity: decided },
          {
            key: "question",
            content: <Shot id="s4-question" />,
            camera: cam,
            opacity: questionShot,
          },
        ]}
        overlay={
          <>
            <Callout
              camera={homeCam(frame)}
              keys={[{ at: a(c.lossRing), box: box("s4-home", "notifLoss") }]}
              until={a(c.toClient - 0.35)}
              label="Loss flagged"
              side="left"
              pad={4}
            />
            <Callout
              camera={cam}
              keys={[{ at: a(c.figuresRing), box: figures }]}
              until={a(c.panToSteps)}
              label="Full picture"
              side="right"
              pad={12}
            />
            <Callout
              camera={cam}
              keys={[{ at: a(c.stepsRing), box: steps }]}
              until={e(-0.3)}
              label="Step-by-step plan"
              align="end"
              pad={10}
            />
            <AgentSpotlight
              box={panel}
              camera={cam}
              from={e(g.spotlight)}
              to={durationInFrames}
              dim={0.5}
            />
            <Callout
              camera={cam}
              keys={[{ at: e(0.7), box: box("s4-client", "grounded") }]}
              until={e(g.sourcesOut)}
              pad={6}
              radius={10}
            />
            <Callout
              camera={cam}
              keys={[{ at: e(g.iraStepRing), box: box("s4-decided", "iraStep") }]}
              until={e(g.treeOut)}
              pad={6}
            />
            <Callout
              camera={cam}
              keys={[{ at: e(g.questionRing), box: question }]}
              until={durationInFrames}
              label="Asks, never guesses"
              side="left"
              pad={6}
            />
          </>
        }
      >
        <DataSourcePanel
          camera={cam}
          target={panel}
          until={e(g.sourcesOut)}
          sources={[
            {
              at: e(g.customerCard),
              title: "Customer data",
              detail: "Accounts, owners, beneficiaries",
              tone: "bank",
            },
            {
              at: e(g.rulebookCard),
              title: "Legal rulebook",
              detail: "Federal and Pennsylvania settlement rules",
              chip: labels.rulebookVersion,
              tone: "law",
            },
          ]}
        />
        <DecisionTree
          path={decisionPath}
          start={e(g.tree)}
          step={sec(g.treeStep)}
          sweep={e(g.pathSweep)}
          until={e(g.treeOut)}
          label="Deterministic decision tree"
        />
        <Cursor
          from={0}
          to={a(c.toHome) + 4}
          keys={[
            { at: 0, x: center(button).x + 60, y: center(button).y + 40, cam: signonCam },
            { at: a(c.chipClick) - 5, ...center(chip), cam: signonCam, click: a(c.chipClick) },
            {
              at: a(c.signOnClick) - 5,
              ...center(button),
              cam: signonCam,
              click: a(c.signOnClick),
            },
          ]}
        />
        <Cursor
          from={e(g.howIDecidedClick - 0.9)}
          to={e(g.tree - 0.1)}
          keys={[
            { at: e(g.howIDecidedClick - 0.8), x: 1420, y: 700, cam: clientCam },
            {
              at: e(g.howIDecidedClick) - 5,
              ...center(box("s4-client", "howIDecided")),
              cam: clientCam,
              click: e(g.howIDecidedClick),
            },
          ]}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
