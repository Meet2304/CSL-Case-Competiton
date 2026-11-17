import { describe, expect, it } from "vitest";
import { findDemoUser } from "@/data/users";
import { tourGlow, tourPeople, tourScenes, tourStops, tourWillDraft } from "@/data/tour";
import { cameraFor, frameIds, planStop, stageLayout, viewportFor, type TourStop } from "@/lib/tour";
import { incompleteScreens } from "@/lib/will/flow";

const sizes: [number, number][] = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
];

describe("the tour's script", () => {
  it("has unique stop ids and only known scenes", () => {
    expect(new Set(tourStops.map((s) => s.id)).size).toBe(tourStops.length);
    for (const s of tourStops) if (s.scene) expect(tourScenes[s.scene], s.id).toBeDefined();
  });

  it("opens on a scene and ends on its closing line", () => {
    expect(tourStops[0].scene).toBeDefined();
    expect(tourStops.at(-1)!.scene).toBeUndefined();
    expect(tourStops.filter((s) => !s.scene)).toHaveLength(1);
  });

  it("acts only on screens that are on stage", () => {
    for (const s of tourStops) {
      const on = s.scene ? tourScenes[s.scene].frames : {};
      for (const step of s.steps ?? []) if ("in" in step) expect(on[step.in], s.id).toBeDefined();
      for (const id of Object.keys(s.focus ?? {}))
        expect(on[id as keyof typeof on], s.id).toBeDefined();
      if (s.quiet) expect(on[s.quiet], s.id).toBeDefined();
    }
  });

  it("signs in only as people the app knows", () => {
    for (const id of frameIds) expect(findDemoUser(tourPeople[id].userId), id).toBeDefined();
  });

  it("names only the family and the Bank Advisor", () => {
    const said = JSON.stringify([tourPeople, tourStops.map((s) => s.say)]);
    expect(said).not.toMatch(/\bAlex\b|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });

  it("tells John's family only after the advisor starts passing on his estate", () => {
    // Before the transfer the family has heard nothing; the handover scene starts it on stage.
    const handover = tourStops.findIndex((s) => s.id === "notified");
    tourStops.forEach((s, i) => {
      if (!s.scene) return;
      expect(tourScenes[s.scene].world, s.id).toBe(i <= handover ? "before" : "after");
    });
  });

  it("gives John a will with every question answered, so he can put it on file on stage", () => {
    expect(incompleteScreens(tourWillDraft)).toEqual([]);
  });

  it("gives every person their own color", () => {
    expect(new Set(frameIds.map((id) => tourGlow[id])).size).toBe(frameIds.length);
  });
});

describe("moving through the tour", () => {
  const stops: TourStop[] = [
    { id: "a", say: "", scene: "one" },
    { id: "b", say: "", scene: "one" },
    { id: "c", say: "", scene: "one" },
    { id: "d", say: "", scene: "two" },
    { id: "e", say: "" },
  ];

  it("plays the next stop of the same scene on the pages already there", () => {
    expect(planStop(stops, 0, 1)).toEqual({ kind: "continue" });
  });

  it("loads a new scene when moving into it, and plays its first stop out", () => {
    expect(planStop(stops, 2, 3)).toEqual({ kind: "enter", replay: [], animate: true });
  });

  it("rebuilds a stop from its scene's start when stepping back or jumping in", () => {
    expect(planStop(stops, 2, 1)).toEqual({ kind: "enter", replay: [0], animate: false });
    expect(planStop(stops, null, 2)).toEqual({ kind: "enter", replay: [0, 1], animate: false });
  });

  it("needs nothing loaded for the closing line", () => {
    expect(planStop(stops, 3, 4)).toEqual({ kind: "card" });
  });
});

describe("the stage", () => {
  it("keeps every card, and the name above it, on the stage", () => {
    for (const [w, h] of sizes) {
      const { slots, nameH } = stageLayout(w, h);
      for (const [id, r] of Object.entries(slots)) {
        expect(r.x, `${id} ${w}x${h}`).toBeGreaterThan(0);
        expect(r.y - nameH, `${id} ${w}x${h}`).toBeGreaterThan(0);
        expect(r.x + r.w, `${id} ${w}x${h}`).toBeLessThan(w);
        expect(r.y + r.h, `${id} ${w}x${h}`).toBeLessThan(h);
      }
    }
  });

  it("does not let side-by-side cards overlap", () => {
    for (const [w, h] of sizes) {
      const { slots } = stageLayout(w, h);
      expect(slots.left.x + slots.left.w, `${w}x${h}`).toBeLessThan(slots.right.x);
    }
  });

  it("gives a lone screen most of the stage", () => {
    for (const [w, h] of sizes) {
      const { solo } = stageLayout(w, h).slots;
      expect(solo.w * solo.h, `${w}x${h}`).toBeGreaterThan(w * h * 0.6);
    }
  });

  it("lays every page out at least as tall as a short laptop window", () => {
    for (const [w, h] of sizes) {
      const { slots } = stageLayout(w, h);
      for (const scene of Object.values(tourScenes))
        for (const f of Object.values(scene.frames)) {
          const page = viewportFor(slots[f!.slot], f!.width);
          expect(page.h, `${f!.path} ${w}x${h}`).toBeGreaterThanOrEqual(560);
        }
    }
  });
});

describe("the camera", () => {
  const view = { w: 1280, h: 800 };

  it("shows the whole page when nothing is in focus", () => {
    expect(cameraFor(view)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it("closes in on what is in focus, no further than allowed", () => {
    const cam = cameraFor(view, { x: 900, y: 100, w: 300, h: 200 });
    expect(cam.scale).toBe(1.7);
    expect(cameraFor(view, { x: 900, y: 100, w: 300, h: 200 }, { maxZoom: 1.2 }).scale).toBe(1.2);
  });

  it("never shows past the page's edge", () => {
    const cam = cameraFor(view, { x: 1200, y: 760, w: 60, h: 30 });
    expect(cam.x).toBeGreaterThanOrEqual(view.w - view.w * cam.scale);
    expect(cam.y).toBeGreaterThanOrEqual(view.h - view.h * cam.scale);
    expect(cam.x).toBeLessThanOrEqual(0);
    expect(cam.y).toBeLessThanOrEqual(0);
  });
});
