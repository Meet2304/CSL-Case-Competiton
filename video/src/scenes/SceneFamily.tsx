import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { box, center, union } from "../captures";
import { cameraAt, focus, type CamKey } from "../camera";
import { CUES } from "../config";
import { Backdrop } from "../components/Backdrop";
import { BrowserFrame } from "../components/BrowserFrame";
import { Callout } from "../components/Callout";
import { Cursor } from "../components/Cursor";
import type { SceneTiming } from "../timeline";
import { Shot, sec, shotOpacities } from "./shared";

/**
 * Scene 2, the husband before a loss: every account in one view, the gaps
 * flagged in Notifications, then the family dashboard (shared accounts, the
 * household) and role-based access in Manage family.
 */
export const SceneFamily: React.FC<SceneTiming> = ({ voStart, durationInFrames }) => {
  const frame = useCurrentFrame();
  const c = CUES.family;
  const at = (s: number) => voStart + sec(s);

  const glance = box("s2-home", "glance");
  const notifications = box("s2-home", "notifications");
  const roles = union(
    box("s2-roles", "roleAdmin"),
    box("s2-roles", "roleOlder"),
    box("s2-roles", "roleYounger"),
  );

  const homeKeys: CamKey[] = [
    { at: 0, zoom: 1.12, cx: 960, cy: 482 },
    { at: at(0.4), zoom: 1.12, cx: 960, cy: 482 },
    { at: at(2.3), ...focus(glance, 1.55, 0, 10) },
    { at: at(4.0), ...focus(glance, 1.55, 0, 10) },
    { at: at(5.6), ...focus(glance, 1.62, 0, -24) },
    { at: at(c.panToNotifications), ...focus(glance, 1.62, 0, -24) },
    { at: at(c.panToNotifications + 1.0), ...focus(notifications, 2.2, 0, 10) },
    { at: at(c.toFamily + 0.4), ...focus(notifications, 2.28, 0, 10) },
  ];
  // The dashboard: open wide on the whole family, then push in on its accounts and people.
  const familyKeys: CamKey[] = [
    { at: at(c.toFamily), zoom: 1.1, cx: 960, cy: 520 },
    { at: at(c.householdRing - 0.1), zoom: 1.1, cx: 960, cy: 520 },
    { at: at(c.shareRing), zoom: 1.4, cx: 1000, cy: 470 },
    { at: at(c.toMembers + 0.2), zoom: 1.42, cx: 1000, cy: 470 },
  ];
  const rolesKeys: CamKey[] = [
    { at: at(c.toMembers), ...focus(roles, 1.5, -40, -30) },
    { at: durationInFrames, ...focus(roles, 1.62, -40, -30) },
  ];
  const homeCam = (f: number) => cameraAt(f, homeKeys);
  const familyCam = (f: number) => cameraAt(f, familyKeys);
  const rolesCam = (f: number) => cameraAt(f, rolesKeys);

  const [home, family, members, rolesShot] = shotOpacities(frame, [
    { id: "s2-home", start: 0 },
    { id: "s2-family", start: at(c.toFamily), xf: 10 },
    { id: "s2-members", start: at(c.toMembers), xf: 8 },
    { id: "s2-roles", start: at(c.toRoles), xf: 4 },
  ]);
  const onHome = frame < at(c.toFamily) + 10;

  return (
    <AbsoluteFill>
      <Backdrop />
      <BrowserFrame
        url={onHome ? "findoe.vercel.app/home" : "findoe.vercel.app/family#fam-sample"}
        layers={[
          { key: "home", content: <Shot id="s2-home" />, camera: homeCam(frame), opacity: home },
          {
            key: "family",
            content: <Shot id="s2-family" />,
            camera: familyCam(frame),
            opacity: family,
          },
          {
            key: "members",
            content: <Shot id="s2-members" />,
            camera: rolesCam(frame),
            opacity: members,
          },
          {
            key: "roles",
            content: <Shot id="s2-roles" />,
            camera: rolesCam(frame),
            opacity: rolesShot,
          },
        ]}
        overlay={
          <>
            <Callout
              camera={homeCam(frame)}
              keys={[
                { at: at(c.glanceRing), box: glance },
                { at: at(c.lifePolicyRing), box: box("s2-home", "lifePolicy") },
              ]}
              until={at(c.panToNotifications - 0.2)}
              label="All assets, one view"
              align="end"
              pad={12}
            />
            <Callout
              camera={homeCam(frame)}
              keys={[
                { at: at(c.beneficiaryRing), box: box("s2-home", "notifBeneficiary") },
                { at: at(c.willRing), box: box("s2-home", "notifWill") },
              ]}
              until={at(c.toFamily - 0.3)}
              label="Gap detection"
              side="left"
              pad={4}
            />
            <Callout
              camera={familyCam(frame)}
              keys={[
                { at: at(c.dashboardRing), box: box("s2-family", "stats") },
                { at: at(c.householdRing), box: box("s2-family", "people") },
                { at: at(c.shareRing), box: box("s2-family", "jointRow") },
              ]}
              until={at(c.manageClick - 0.15)}
              label="Family dashboard"
              pad={8}
            />
            <Callout
              camera={rolesCam(frame)}
              keys={[{ at: at(c.rolesRing), box: roles }]}
              until={durationInFrames}
              label="Role-based access"
              side="left"
              pad={6}
            />
          </>
        }
      >
        <Cursor
          from={at(c.shareRing - 0.6)}
          to={durationInFrames}
          keys={[
            { at: at(c.shareRing - 0.5), x: 1500, y: 760, cam: familyCam },
            {
              at: at(c.manageClick) - 5,
              ...center(box("s2-family", "manage")),
              cam: familyCam,
              click: at(c.manageClick),
            },
            {
              at: at(c.rolesTabClick) - 5,
              ...center(box("s2-members", "rolesTab")),
              cam: rolesCam,
              click: at(c.rolesTabClick),
            },
            { at: at(c.rolesRing + 0.9), x: 1700, y: 640, cam: rolesCam },
          ]}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
