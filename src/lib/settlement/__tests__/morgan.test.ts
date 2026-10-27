// Golden test: Riley Placeholder's death (2026-10-23). Survivor Morgan (spouse), Pennsylvania.
import { describe, expect, it } from "vitest";
import { advisorCustomers } from "@/data/advisor";
import { byHolding, lossPlan } from "./helpers";

const plan = lossPlan("c-placeholder");

describe("Morgan Placeholder — Riley's death", () => {
  it("knows who died and who survives", () => {
    expect(plan.deceased).toMatchObject({ name: "Riley Placeholder", dateOfDeath: "2026-10-23" });
    expect(plan.survivor).toEqual({
      name: "Morgan Placeholder",
      relationshipToDeceased: "spouse",
    });
    expect(plan.state).toBe("PA");
  });

  it.each([
    ["h-pl-chk", "survivorship", "o.survivorship-deposit", ["Morgan Placeholder"]],
    ["h-pl-mm", "survivorship", "o.survivorship-deposit", ["Morgan Placeholder"]],
    ["h-pl-cd", "survivorship", "o.survivorship-deposit", ["Morgan Placeholder"]],
    ["h-pl-brk", "beneficiary-claim", "o.tod-claim", ["Morgan Placeholder"]],
    [
      "h-pl-ira",
      "spousal-retirement-options",
      "o.spousal-retirement-options",
      ["Morgan Placeholder"],
    ],
    ["h-pl-roth", "designation-update", "o.designation-update", []],
    ["h-pl-trust", "successor-trustee", "o.successor-trustee", ["Morgan Placeholder"]],
    ["h-pl-529", "successor-owner", "o.successor-owner-missing", []],
    ["h-pl-visa", "closes-estate-pays", "o.closes-estate-pays", []],
    ["h-pl-life", "insurer-claim", "o.insurer-claim", ["Morgan Placeholder"]],
  ])("%s → %s (%s)", (id, route, outcome, passesTo) => {
    const a = byHolding(plan, id)!;
    expect(a.outcome.route).toBe(route);
    expect(a.outcome.id).toBe(outcome);
    expect(a.passesToNames).toEqual(passesTo);
    expect(a.outcome.probate).toBe(false);
  });

  it("applies the right overlays", () => {
    const ov = (id: string) => byHolding(plan, id)!.overlays.map((o) => o.id);
    expect(ov("h-pl-mm")).toContain("ov.fdic-grace");
    expect(byHolding(plan, "h-pl-mm")!.attention).toBe(true);
    expect(ov("h-pl-chk")).not.toContain("ov.fdic-grace");
    expect(ov("h-pl-cd")).toContain("ov.cd-waiver");
    // Riley was 61: no year-of-death RMD.
    expect(ov("h-pl-ira")).not.toContain("ov.yod-rmd");
    expect(ov("h-pl-life")).toContain("ov.held-outside");
  });

  it("adds up the totals", () => {
    expect(plan.totals).toEqual({
      outsideProbate: 7_786_400,
      uninterrupted: 3_276_800,
      probate: 0,
      debts: -8_400,
      heldOutsidePnc: 1_000_000,
      needsReview: 0,
    });
    // Everything at PNC, plus Morgan's own Roth, is the relationship value.
    const c = advisorCustomers.find((x) => x.id === "c-placeholder")!;
    expect(plan.totals.outsideProbate + plan.totals.debts + 642_000).toBe(c.relationshipValue);
  });

  it("applies the household rules", () => {
    const ids = plan.household.map((h) => h.rule.id);
    for (const id of [
      "hh.flag",
      "hh.reclamation",
      "hh.ssa",
      "hh.final-1040",
      "hh.fiduciary",
      "hh.portability",
      "hh.pa-inheritance",
    ])
      expect(ids).toContain(id);
    for (const id of ["hh.estate-income", "hh.form-706", "hh.pa-letters", "hh.pa-small-estate"])
      expect(ids).not.toContain(id);
  });

  it("lists the seven deadlines in order, each once", () => {
    expect(plan.deadlines.map((d) => [d.due, d.action.id, d.action.deadline!.kind])).toEqual([
      ["2027-01-23", "pa-it-discount", "opportunity"],
      ["2027-04-15", "final-1040", "statutory"],
      ["2027-04-23", "fdic-review", "recommended"],
      ["2027-07-23", "pa-it-return", "statutory"],
      ["2027-07-23", "portability", "opportunity"],
      ["2028-10-23", "ssa-lump-sum", "statutory"],
      ["2031-10-23", "portability-late", "opportunity"],
    ]);
    expect(plan.deadlines.find((d) => d.action.id === "fdic-review")!.accountIds).toEqual([
      "h-pl-mm",
    ]);
  });

  it("raises the open questions", () => {
    const qs = plan.openQuestions.map((q) => q.question);
    expect(qs.some((q) => /federal benefits/.test(q))).toBe(true);
    expect(qs.some((q) => /Who should own 529 College Savings x0018 now/.test(q))).toBe(true);
  });

  it("estimates the gross estate under the exclusion", () => {
    expect(plan.assumptions.some((a) => a.startsWith("Estimated gross estate"))).toBe(true);
    expect(plan.household.some((h) => h.rule.id === "hh.form-706")).toBe(false);
  });

  it("notes Sam as the contingent on Riley's IRA without making them a taker", () => {
    const ira = byHolding(plan, "h-pl-ira")!;
    expect(ira.facts.beneficiaryCount.value).toBe(1);
    expect(ira.facts.beneficiaryStatus.evidence).toMatch(/contingent: Sam Placeholder/);
  });

  it("explains every outcome with a trace and sources", () => {
    for (const a of plan.accounts) {
      expect(a.trace.length, a.holding.id).toBeGreaterThan(0);
      expect(a.sources.length, a.holding.id).toBeGreaterThan(0);
      expect(a.summary).not.toMatch(/\{/);
      expect(a.plain).not.toMatch(/\{/);
    }
  });
});
