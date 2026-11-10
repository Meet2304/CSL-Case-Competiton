import { describe, expect, it } from "vitest";
import { rulebook } from "@/data/settlement";
import {
  claimSteps,
  sharedAccountIds,
  tourAccounts,
  tourChapters,
  tourPeople,
  tourSteps,
} from "@/data/tour";
import {
  advisorPlan,
  beneficiaryOf,
  benefitsReply,
  chapterStart,
  findoeAnswer,
  husbandMoney,
  initialTourState,
  routesFor,
  settlementSplit,
  tourReducer,
  visibleTo,
} from "@/lib/tour";

describe("tour script", () => {
  it("has unique step ids and a step for every chapter", () => {
    expect(new Set(tourSteps.map((s) => s.id)).size).toBe(tourSteps.length);
    for (const c of tourChapters) expect(chapterStart(c.id)).toBeGreaterThanOrEqual(0);
  });

  it("keeps each step to a headline and a sentence or two", () => {
    for (const s of tourSteps) {
      expect(s.title.split(" ").length, s.id).toBeLessThanOrEqual(8);
      expect(s.body.split(" ").length, s.id).toBeLessThanOrEqual(20);
    }
  });

  it("names people by role only", () => {
    expect(Object.values(tourPeople).map((p) => p.name)).toEqual([
      "Husband",
      "Wife",
      "Child 1",
      "Child 2",
      "Bank Advisor",
    ]);
    // Everything the tour can say, in every state the viewer can reach.
    const said = JSON.stringify([
      tourSteps,
      claimSteps,
      ...[false, true].flatMap((beneficiaryNamed) => [
        routesFor({ beneficiaryNamed }),
        advisorPlan({ beneficiaryNamed }),
        advisorPlan({ beneficiaryNamed, benefits: "yes" }),
        findoeAnswer("claim-ira", { beneficiaryNamed }),
        findoeAnswer("savings", { beneficiaryNamed }),
      ]),
      (["yes", "no", "unsure"] as const).map(benefitsReply),
    ]);
    expect(said).not.toMatch(/Alex|Dana|Morgan|Avery|Jamie|Taylor|Placeholder|Example|Sample/);
  });
});

describe("what happens to the accounts Husband leaves", () => {
  it("cites only sources that exist in the rulebook", () => {
    for (const beneficiaryNamed of [false, true]) {
      const ids = [
        ...routesFor({ beneficiaryNamed }).flatMap((r) => r.sources),
        findoeAnswer("claim-ira", { beneficiaryNamed }).lawSourceId,
        findoeAnswer("savings", { beneficiaryNamed }).lawSourceId,
      ];
      for (const id of ids) expect(rulebook.sources[id], id).toBeDefined();
    }
  });

  it("sends Savings through the estate until a beneficiary is named", () => {
    const named = tourReducer(initialTourState, { type: "nameBeneficiary" });
    const before = settlementSplit(initialTourState);
    const after = settlementSplit(named);
    const savings = tourAccounts.savings.balance;
    expect(beneficiaryOf(initialTourState, "savings")).toBeUndefined();
    expect(beneficiaryOf(named, "savings")).toBe("wife");
    expect(before.viaEstate.map((r) => r.account)).toContain("savings");
    expect(after.toWife.map((r) => r.account)).toContain("savings");
    expect(after.direct - before.direct).toBeCloseTo(savings);
    expect(before.estate - after.estate).toBeCloseTo(savings);
  });

  it("splits exactly the money Husband owns at PNC", () => {
    const split = settlementSplit(initialTourState);
    expect(split.direct + split.estate).toBeCloseTo(husbandMoney().assets);
    expect(split.direct).toBeCloseTo(tourAccounts.joint.balance + tourAccounts.ira.balance);
    expect(split.outside).toBe(tourAccounts.life.balance);
  });

  it("changes the answer about Savings with the beneficiary", () => {
    expect(findoeAnswer("savings", { beneficiaryNamed: false }).sentences[0]).toMatch(/estate/);
    expect(findoeAnswer("savings", { beneficiaryNamed: true }).sentences[0]).toMatch(
      /passes directly to you/,
    );
  });
});

describe("Bank Advisor plan", () => {
  it("starts with condolences and ends by asking about federal benefits", () => {
    const plan = advisorPlan(initialTourState);
    expect(plan[0].id).toBe("condolences");
    expect(plan.at(-1)?.needsAnswer).toBe(true);
  });

  it("turns the answer into a step, or drops it", () => {
    const yes = advisorPlan({ beneficiaryNamed: false, benefits: "yes" });
    expect(yes.at(-1)?.id).toBe("benefits");
    expect(yes.at(-1)?.needsAnswer).toBeUndefined();
    const no = advisorPlan({ beneficiaryNamed: false, benefits: "no" });
    expect(no.some((s) => s.id === "benefits")).toBe(false);
    const unsure = advisorPlan({ beneficiaryNamed: false, benefits: "unsure" });
    expect(unsure.at(-1)?.needsAnswer).toBe(true);
  });
});

describe("family access and the claim", () => {
  it("shows a child only what they were given", () => {
    expect(visibleTo(initialTourState, "child1")).toEqual(["joint"]);
    expect(visibleTo(initialTourState, "child2")).toEqual([]);
    const shared = tourReducer(initialTourState, {
      type: "toggleAccess",
      child: "child2",
      account: sharedAccountIds[1],
    });
    expect(visibleTo(shared, "child2")).toEqual([sharedAccountIds[1]]);
    expect(visibleTo(shared, "child1")).toEqual(["joint"]);
  });

  it("cannot send a claim before every step is done, or change it afterwards", () => {
    expect(tourReducer(initialTourState, { type: "sendClaim" }).claimSent).toBe(false);
    const filled = claimSteps.reduce(
      (s, step) => tourReducer(s, { type: "toggleClaimStep", id: step.id }),
      initialTourState,
    );
    const sent = tourReducer(filled, { type: "sendClaim" });
    expect(sent.claimSent).toBe(true);
    expect(tourReducer(sent, { type: "toggleClaimStep", id: "form" })).toBe(sent);
  });

  it("restart clears what the viewer changed", () => {
    const changed = tourReducer(initialTourState, { type: "nameBeneficiary" });
    expect(tourReducer(changed, { type: "restart" })).toEqual(initialTourState);
  });
});
