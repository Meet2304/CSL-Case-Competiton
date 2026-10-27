import { describe, expect, it } from "vitest";
import {
  answeredScreens,
  FIRST_SCREEN,
  percentDone,
  sectionProgress,
  sections,
} from "@/lib/will/flow";
import { emptyDraft, type WillDraft, type WillProgress } from "@/lib/will/types";

const progress = (answered: string[], furthest = 0): WillProgress => ({
  screen: FIRST_SCREEN,
  furthest,
  returnToReview: false,
  answered,
});

const withBasics = (): WillDraft => {
  const d = emptyDraft();
  return { ...d, basics: { ...d.basics, gender: "female", marital: "single" } };
};

describe("will progress", () => {
  it("starts with every section to do", () => {
    const parts = sectionProgress(emptyDraft(), undefined);
    expect(parts).toHaveLength(sections.length);
    expect(parts.every((p) => p.status === "todo" && p.screens.length > 0)).toBe(true);
    expect(percentDone(parts)).toBe(0);
  });

  it("completes a section once each applicable step is answered and valid", () => {
    const parts = sectionProgress(withBasics(), progress(["basics.details", "basics.marital"]));
    expect(parts[0].status).toBe("complete");
    expect(parts[1].status).toBe("todo");
    expect(percentDone(parts)).toBeGreaterThan(0);
  });

  it("does not count an answered step whose answers no longer validate", () => {
    const parts = sectionProgress(emptyDraft(), progress(["basics.details", "basics.marital"]));
    expect(parts[0].status).toBe("started");
    expect(parts[0].done).toEqual([]);
  });

  it("lets sections finish out of order", () => {
    const parts = sectionProgress(emptyDraft(), progress(["funeral"]));
    expect(parts[5].status).toBe("complete");
    expect(parts[0].status).toBe("todo");
  });

  it("skips steps that don't apply (no guardians without minor children)", () => {
    const parts = sectionProgress(emptyDraft(), undefined);
    expect(parts[1].screens).not.toContain("nominees.guardians");
  });

  it("reads older saves without an answered list from the furthest screen", () => {
    const old: WillProgress = { screen: "basics.marital", furthest: 1, returnToReview: false };
    expect([...answeredScreens(old)]).toEqual(["basics.details"]);
  });
});
