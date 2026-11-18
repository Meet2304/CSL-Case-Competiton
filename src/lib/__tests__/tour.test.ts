import { describe, expect, it } from "vitest";
import { findDemoUser } from "@/data/users";
import {
  iraDecisions,
  tourGlow,
  tourPeople,
  tourScenes,
  tourStops,
  tourWillDraft,
} from "@/data/tour";
import {
  cameraFor,
  frameIds,
  pageToStage,
  planStop,
  pointerMoves,
  productOf,
  stageLayout,
  viewportFor,
  worldOrder,
  type TourScene,
  type TourStop,
} from "@/lib/tour";
import { incompleteScreens } from "@/lib/will/flow";

const sizes: [number, number][] = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
];

describe("the tour's script", () => {
  it("has unique stop ids, and each stop is either a scene or a moment with the family", () => {
    expect(new Set(tourStops.map((s) => s.id)).size).toBe(tourStops.length);
    for (const s of tourStops) {
      expect(Boolean(s.scene) !== Boolean(s.cast), s.id).toBe(true);
      if (s.scene) expect(tourScenes[s.scene], s.id).toBeDefined();
    }
  });

  it("opens on the ecosystem and closes on the family, the four parts of Findoe becoming one", () => {
    expect(tourStops[0].cast).toBe("title");
    expect(tourStops.slice(-3).map((s) => s.cast)).toEqual(["circle", "vision", "finale"]);
  });

  it("plays at most one click or typing per press, besides a run of quick clicks", () => {
    // John sharing with David is one motion, played on one press: tick, tick, save.
    const oneMotion = new Set(["share"]);
    for (const s of tourStops) {
      if (oneMotion.has(s.id)) {
        expect(pointerMoves(s), s.id).toBe(3);
        continue;
      }
      const clicks = (s.steps ?? []).filter(
        (x) => x.do === "click" && !("quick" in x && x.quick),
      ).length;
      expect(clicks, s.id).toBeLessThanOrEqual(1);
      // Filling a form is the one place two fields are typed in one press.
      if (clicks) expect(pointerMoves(s), s.id).toBe(1);
    }
  });

  it("lights a part of Findoe on every screen, and none between acts", () => {
    for (const s of tourStops) {
      if (s.cast) expect(productOf(s, tourScenes), s.id).toBeNull();
      else if (!s.memorial) expect(productOf(s, tourScenes), s.id).not.toBeNull();
    }
  });

  it("acts only on screens that are on stage", () => {
    for (const [id, scene] of Object.entries(tourScenes))
      for (const step of scene.setup ?? [])
        if ("in" in step) expect(scene.frames[step.in], id).toBeDefined();
    for (const s of tourStops) {
      const on = s.scene ? tourScenes[s.scene].frames : {};
      for (const step of s.steps ?? []) if ("in" in step) expect(on[step.in], s.id).toBeDefined();
      for (const id of Object.keys(s.focus ?? {}))
        expect(on[id as keyof typeof on], s.id).toBeDefined();
    }
  });

  it("signs in only as people the app knows", () => {
    for (const id of frameIds) expect(findDemoUser(tourPeople[id].userId), id).toBeDefined();
  });

  it("names only the family and the Bank Advisor", () => {
    const said = JSON.stringify([tourPeople, tourStops.map((s) => s.notes)]);
    expect(said).not.toMatch(/\bAlex\b|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });

  it("moves the story forward in order: John prepares, he dies, the advisor acts, Maya claims", () => {
    const worlds = tourStops.flatMap((s) =>
      s.scene ? [worldOrder.indexOf(tourScenes[s.scene].world)] : [],
    );
    expect(worlds).toEqual([...worlds].sort((a, b) => a - b));
    // The family hears only once the advisor starts passing on John's estate, on stage.
    const told = tourStops.findIndex((s) => s.scene && tourScenes[s.scene].world === "after");
    const notified = tourStops.findIndex((s) => s.id === "notified");
    expect(notified).toBeLessThan(told);
    expect(tourStops.slice(notified, told).every((s) => s.scene === "transfer")).toBe(true);
  });

  it("remembers John between his own act and the bank's", () => {
    const at = (id: string) => tourStops.findIndex((s) => s.id === id);
    expect(at("loss")).toBeGreaterThan(0);
    expect(at("loss") + 1).toBe(at("passed"));
    expect(at("passed")).toBeLessThan(at("alert"));
  });

  it("grows each scene that keeps people on stage out of the scene just before it", () => {
    for (const [id, scene] of Object.entries(tourScenes)) {
      for (const [who, f] of Object.entries(scene.frames))
        if (f!.keep) expect(scene.from, `${id} ${who}`).toBeDefined();
      if (!scene.from) continue;
      expect(tourScenes[scene.from], id).toBeDefined();
      const first = tourStops.findIndex((s) => s.scene === id);
      expect(tourStops[first - 1].scene, id).toBe(scene.from);
      for (const [leaving, into] of Object.entries(scene.merge ?? {})) {
        expect(
          tourScenes[scene.from].frames[leaving as keyof typeof scene.frames],
          id,
        ).toBeDefined();
        expect(scene.frames[into as keyof typeof scene.frames], id).toBeDefined();
      }
    }
  });

  it("explains Findoe's answer with the rulebook's own decisions", () => {
    expect(iraDecisions.steps.length).toBeGreaterThan(1);
    expect(iraDecisions.outcome).not.toBe("");
  });

  it("gives John a will with every question answered, so he can put it on file on stage", () => {
    expect(incompleteScreens(tourWillDraft)).toEqual([]);
  });

  it("gives every person their own color", () => {
    expect(new Set(frameIds.map((id) => tourGlow[id])).size).toBe(frameIds.length);
  });
});

describe("moving through the tour", () => {
  const frame = { slot: "solo" as const, path: "/", ready: { text: "x" }, width: 1280 };
  const scenes: Record<string, TourScene> = {
    one: { world: "before", product: null, frames: { husband: frame } },
    two: {
      world: "before",
      product: null,
      from: "one",
      frames: { husband: { ...frame, keep: true }, wife: frame },
    },
    three: { world: "before", product: null, frames: { wife: frame } },
  };
  const stops: TourStop[] = [
    { id: "a", scene: "one" },
    { id: "b", scene: "one", steps: [{ do: "pause", ms: 1 }] },
    { id: "c", scene: "one" },
    { id: "d", scene: "two" },
    { id: "e", cast: "circle" },
    { id: "f", scene: "three" },
  ];

  it("plays the next stop of the same scene on the pages already there", () => {
    expect(planStop(stops, scenes, 0, 1)).toEqual({ kind: "continue" });
  });

  it("only moves the camera when stepping back over stops that changed nothing", () => {
    expect(planStop(stops, scenes, 2, 1)).toEqual({ kind: "refocus" });
  });

  it("keeps the people already on stage when a scene grows out of the one before", () => {
    expect(planStop(stops, scenes, 2, 3)).toEqual({
      kind: "enter",
      replay: [],
      animate: true,
      carry: ["husband"],
    });
  });

  it("loads a new scene when moving into it, and plays its first stop out", () => {
    expect(planStop(stops, scenes, 4, 5)).toEqual({
      kind: "enter",
      replay: [],
      animate: true,
      carry: [],
    });
  });

  it("rebuilds a stop from its scene's start when stepping back over a change, or jumping in", () => {
    expect(planStop(stops, scenes, 2, 0)).toEqual({
      kind: "enter",
      replay: [],
      animate: false,
      carry: [],
    });
    expect(planStop(stops, scenes, null, 2)).toEqual({
      kind: "enter",
      replay: [0, 1],
      animate: false,
      carry: [],
    });
    expect(planStop(stops, scenes, 4, 3)).toEqual({
      kind: "enter",
      replay: [],
      animate: false,
      carry: [],
    });
  });

  it("needs nothing loaded for a moment with the family", () => {
    expect(planStop(stops, scenes, 3, 4)).toEqual({ kind: "cast" });
  });
});

describe("the stage", () => {
  it("keeps every card, and the name above it, on the stage and below the dots", () => {
    for (const [w, h] of sizes) {
      const { slots, nameH, dotsH } = stageLayout(w, h);
      for (const [id, r] of Object.entries(slots)) {
        expect(r.x, `${id} ${w}x${h}`).toBeGreaterThan(0);
        expect(r.y - nameH, `${id} ${w}x${h}`).toBeGreaterThan(dotsH);
        expect(r.x + r.w, `${id} ${w}x${h}`).toBeLessThan(w);
        expect(r.y + r.h, `${id} ${w}x${h}`).toBeLessThan(h);
      }
    }
  });

  it("does not let three cards overlap, and keeps John's name above them", () => {
    for (const [w, h] of sizes) {
      const { slots, memorial, nameH } = stageLayout(w, h);
      expect(slots.third1.x + slots.third1.w, `${w}x${h}`).toBeLessThan(slots.third2.x);
      expect(slots.third2.x + slots.third2.w, `${w}x${h}`).toBeLessThan(slots.third3.x);
      expect(memorial.top.y, `${w}x${h}`).toBeLessThan(slots.third1.y - nameH);
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
      expect(solo.w * solo.h, `${w}x${h}`).toBeGreaterThan(w * h * 0.55);
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
    expect(cam.scale).toBe(1.45);
    expect(cameraFor(view, { x: 900, y: 100, w: 300, h: 200 }, { maxZoom: 1.2 }).scale).toBe(1.2);
  });

  it("finds where a box on a page lands on the stage", () => {
    const card = { x: 100, y: 50, w: 640, h: 400 };
    // A page laid out twice as wide as its card, with no zoom: everything is half size.
    expect(
      pageToStage(card, 1280, { x: 0, y: 0, scale: 1 }, { x: 200, y: 100, w: 40, h: 20 }),
    ).toEqual({ x: 200, y: 100, w: 20, h: 10 });
  });

  it("never shows past the page's edge", () => {
    const cam = cameraFor(view, { x: 1200, y: 760, w: 60, h: 30 });
    expect(cam.x).toBeGreaterThanOrEqual(view.w - view.w * cam.scale);
    expect(cam.y).toBeGreaterThanOrEqual(view.h - view.h * cam.scale);
    expect(cam.x).toBeLessThanOrEqual(0);
    expect(cam.y).toBeLessThanOrEqual(0);
  });
});
