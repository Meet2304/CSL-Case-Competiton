// Golden test: Drew Example's death (2026-10-19). Drew was 78; survivor Avery (child), Pennsylvania.
import { describe, expect, it } from "vitest";
import { byHolding, lossPlan } from "./helpers";

const plan = lossPlan("c-example");
const overlayIds = (id: string) => byHolding(plan, id)!.overlays.map((o) => o.id);
const due = (actionId: string) => plan.deadlines.find((d) => d.action.id === actionId)?.due;

describe("Avery Example — Drew's death", () => {
  it("names Avery as Drew's child", () => {
    expect(plan.survivor).toEqual({ name: "Avery Example", relationshipToDeceased: "child" });
  });

  it("puts Drew's IRA under the 10-year rule with annual RMDs", () => {
    const ira = byHolding(plan, "h-ex-dira")!;
    expect(ira.outcome.id).toBe("o.inherited-ten-year");
    expect(ira.passesToNames).toEqual(["Avery Example", "Quinn Example"]);
    for (const id of [
      "ov.yod-rmd",
      "ov.annual-rmds",
      "ov.separate-accounts",
      "ov.disability-check",
    ])
      expect(overlayIds("h-ex-dira")).toContain(id);
  });

  it("pays Drew's checking to the POD beneficiary", () => {
    const chk = byHolding(plan, "h-ex-dchk")!;
    expect(chk.outcome.id).toBe("o.pod-claim");
    expect(chk.passesToNames).toEqual(["Avery Example"]);
  });

  it("sends Drew's brokerage through Pennsylvania probate", () => {
    const brk = byHolding(plan, "h-ex-dbrk")!;
    expect(brk.outcome.id).toBe("o.probate-pa");
    expect(brk.outcome.route).toBe("probate");
    expect(overlayIds("h-ex-dbrk")).toContain("ov.step-up");
    expect(overlayIds("h-ex-dbrk")).not.toContain("ov.pa-3101b");
    expect(brk.passesToNames).toEqual(["Estate of Drew Example"]);
  });

  it("flags Avery's own IRA that names Drew", () => {
    expect(byHolding(plan, "h-ex-ira")!.outcome.id).toBe("o.designation-update");
  });

  it("leaves Avery's other accounts out of the plan", () => {
    expect(byHolding(plan, "h-ex-chk")).toBeUndefined();
    expect(byHolding(plan, "h-ex-brk")).toBeUndefined();
  });

  it("adds up the totals", () => {
    expect(plan.totals.outsideProbate).toBe(454_200);
    expect(plan.totals.probate).toBe(181_000);
    expect(plan.totals.uninterrupted).toBe(0);
  });

  it("applies the household rules for a probate estate with no spouse", () => {
    const ids = plan.household.map((h) => h.rule.id);
    for (const id of ["hh.estate-income", "hh.pa-letters", "hh.fiduciary"])
      expect(ids).toContain(id);
    for (const id of ["hh.pa-small-estate", "hh.ssa", "hh.portability"])
      expect(ids).not.toContain(id);
  });

  it("dates the deadlines", () => {
    expect(due("yod-rmd")).toBe("2027-12-31");
    expect(due("separate-accounts")).toBe("2027-12-31");
    expect(due("annual-rmds")).toBe("2027-12-31");
    expect(due("ten-year-end")).toBe("2036-12-31");
    expect(due("pa-it-discount")).toBe("2027-01-19");
    expect(due("final-1040")).toBe("2027-04-15");
    expect(due("pa-it-return")).toBe("2027-07-19");
  });

  it("states the required-beginning-date assumption", () => {
    expect(plan.assumptions.some((a) => /Drew was 78; we assume/.test(a))).toBe(true);
  });

  it("asks about disability for the adult heirs", () => {
    expect(plan.openQuestions.some((q) => /disabled or chronically ill/.test(q.question))).toBe(
      true,
    );
  });
});
