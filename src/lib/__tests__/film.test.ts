import { describe, expect, it } from "vitest";
import { filmChapters, filmScenes, filmShots } from "@/data/film";
import { demoUsers } from "@/data/users";
import { frameFor, planShot, visiblePart, type FilmShot } from "@/lib/film";

const stage = { w: 1200, h: 600 };
const screen = { w: 1440, h: 860 };

describe("film script", () => {
  it("has unique shot ids, known scenes and a shot for every chapter", () => {
    expect(new Set(filmShots.map((s) => s.id)).size).toBe(filmShots.length);
    for (const s of filmShots) if (s.scene) expect(filmScenes[s.scene], s.id).toBeDefined();
    for (const c of filmChapters) expect(filmShots.some((s) => s.chapter === c.id)).toBe(true);
  });

  it("signs in only as people the app knows", () => {
    for (const scene of Object.values(filmScenes))
      expect(demoUsers.some((u) => u.userId === scene.as)).toBe(true);
  });

  it("keeps each caption to a headline and a sentence", () => {
    for (const s of filmShots) {
      expect(s.title.split(" ").length, s.id).toBeLessThanOrEqual(8);
      expect(s.body.split(" ").length, s.id).toBeLessThanOrEqual(14);
    }
  });

  it("names people by role only", () => {
    const said = JSON.stringify(filmShots.map((s) => [s.title, s.body]));
    expect(said).not.toMatch(/Alex|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });

  it("never shows the death before the bank has recorded it", () => {
    const recorded = filmShots.findIndex((s) => s.id === "notified");
    filmShots.forEach((s, i) => {
      if (!s.scene || s.id === "notified") return;
      expect(filmScenes[s.scene].world, s.id).toBe(i < recorded ? "before" : "after");
    });
  });
});

describe("camera", () => {
  it("shows the whole screen, centred, when nothing is in focus", () => {
    const c = frameFor(stage, screen);
    expect(c.scale * screen.h).toBeLessThan(stage.h);
    expect(c.x).toBeCloseTo((stage.w - screen.w * c.scale) / 2);
    expect(c.y).toBeCloseTo((stage.h - screen.h * c.scale) / 2);
  });

  it("centres a small element and stops at the zoom limit", () => {
    const whole = frameFor(stage, screen).scale;
    const focus = { x: 700, y: 400, w: 40, h: 20 };
    const c = frameFor(stage, screen, focus, { maxZoom: 2 });
    expect(c.scale).toBeCloseTo(whole * 2);
    expect(c.x + (focus.x + focus.w / 2) * c.scale).toBeCloseTo(stage.w / 2);
    expect(c.y + (focus.y + focus.h / 2) * c.scale).toBeCloseTo(stage.h / 2);
  });

  it("never pans past the edge of the screen", () => {
    for (const focus of [
      { x: 0, y: 0, w: 300, h: 100 },
      { x: 1140, y: 760, w: 300, h: 100 },
    ]) {
      const c = frameFor(stage, screen, focus);
      expect(c.x).toBeLessThanOrEqual(0);
      expect(c.y).toBeLessThanOrEqual(0);
      expect(c.x + screen.w * c.scale).toBeGreaterThanOrEqual(stage.w - 0.01);
      expect(c.y + screen.h * c.scale).toBeGreaterThanOrEqual(stage.h - 0.01);
    }
  });

  it("frames a tall element by its width, from the top", () => {
    const focus = { x: 1056, y: 0, w: 384, h: 860 };
    const whole = frameFor(stage, screen, focus);
    const byWidth = frameFor(stage, screen, focus, { fit: "width", maxZoom: 2 });
    expect(byWidth.scale).toBeGreaterThan(whole.scale);
    expect(byWidth.y).toBe(0);
  });

  it("keeps only the part of an element that is on screen", () => {
    expect(visiblePart({ x: -10, y: 800, w: 100, h: 200 }, screen)).toEqual({
      x: 0,
      y: 800,
      w: 90,
      h: 60,
    });
  });
});

describe("getting to a shot", () => {
  const shots: FilmShot[] = [
    { id: "card", chapter: "before", title: "", body: "" },
    { id: "a1", chapter: "before", title: "", body: "", scene: "a" },
    { id: "a2", chapter: "before", title: "", body: "", scene: "a" },
    { id: "a3", chapter: "before", title: "", body: "", scene: "a" },
    { id: "b1", chapter: "before", title: "", body: "", scene: "b" },
  ];

  it("plays the next shot of the same scene without reloading", () => {
    expect(planShot(shots, 1, 2)).toEqual({ kind: "continue" });
  });

  it("loads a new scene and plays its first shot when moving forward", () => {
    expect(planShot(shots, 0, 1)).toEqual({ kind: "enter", replay: [], animate: true });
    expect(planShot(shots, 3, 4)).toEqual({ kind: "enter", replay: [], animate: true });
  });

  it("replays the scene's earlier shots when jumping in or stepping back", () => {
    expect(planShot(shots, null, 3)).toEqual({ kind: "enter", replay: [1, 2], animate: false });
    expect(planShot(shots, 4, 3)).toEqual({ kind: "enter", replay: [1, 2], animate: false });
    expect(planShot(shots, 3, 2)).toEqual({ kind: "enter", replay: [1], animate: false });
  });

  it("needs nothing for a title card", () => {
    expect(planShot(shots, 1, 0)).toEqual({ kind: "card" });
  });
});
