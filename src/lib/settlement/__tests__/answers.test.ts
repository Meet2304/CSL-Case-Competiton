// The advisor's answers to open questions feed back into the decision tree.
import { describe, expect, it } from "vitest";
import { MOCK_AS_OF } from "@/data/mock";
import { readinessReport } from "../simulate";
import { byHolding, clientFacts, lossPlan } from "./helpers";

describe("answering open questions", () => {
  it("routes Drew's IRA to life-expectancy payouts when a beneficiary is disabled", () => {
    const before = lossPlan("c-example");
    const q = before.openQuestions.find((x) =>
      x.keys.includes("h-ex-dira:beneficiaryDisabledOrIll"),
    );
    expect(q?.options.map((o) => o.value)).toEqual(["yes", "no"]);

    const after = lossPlan("c-example", {
      answers: { "h-ex-dira:beneficiaryDisabledOrIll": "yes" },
    });
    const ira = byHolding(after, "h-ex-dira")!;
    expect(ira.outcome.id).toBe("o.inherited-edb-life-expectancy");
    expect(ira.trace.at(-1)?.evidence).toBe("Confirmed by the advisor");
    expect(after.openQuestions.some((x) => x.key === q!.key)).toBe(false);
    expect(after.answered.map((x) => [x.key, x.answerLabel])).toContainEqual([
      q!.key,
      "Yes, at least one is",
    ]);
  });

  it("keeps the 10-year rule when the advisor says no", () => {
    const after = lossPlan("c-example", {
      answers: { "h-ex-dira:beneficiaryDisabledOrIll": "no" },
    });
    expect(byHolding(after, "h-ex-dira")!.outcome.id).toBe("o.inherited-ten-year");
    expect(byHolding(after, "h-ex-dira")!.overlays.map((o) => o.id)).not.toContain(
      "ov.disability-check",
    );
  });

  it("drops the reclamation watch when there were no federal benefits", () => {
    const after = lossPlan("c-placeholder", {
      answers: { "household:receivedFederalBenefits": "no" },
    });
    expect(after.household.map((h) => h.rule.id)).not.toContain("hh.reclamation");
    expect(after.openQuestions.some((q) => /federal benefits/.test(q.question))).toBe(false);
  });

  it("names a successor owner for the 529", () => {
    const before = lossPlan("c-placeholder");
    const q = before.openQuestions.find((x) => x.key === "h-pl-529:successor-owner")!;
    expect(q.options.map((o) => o.value)).toContain("Morgan Placeholder");
    // Sam is 16 and Dana is the attorney: neither is offered.
    expect(q.options.map((o) => o.value)).not.toContain("Sam Placeholder");
    expect(q.options.map((o) => o.value)).not.toContain("Dana Example");

    const after = lossPlan("c-placeholder", {
      answers: { "h-pl-529:successor-owner": "Morgan Placeholder" },
    });
    const plan529 = byHolding(after, "h-pl-529")!;
    expect(plan529.outcome.id).toBe("o.successor-owner");
    expect(plan529.passesToNames).toEqual(["Morgan Placeholder"]);
  });

  it("names the successor trustee in a what-if", () => {
    const f = clientFacts("c-placeholder");
    const r = readinessReport(f.c, f.p, "Morgan Placeholder", MOCK_AS_OF, {
      "h-pl-trust:successor-trustee": "Jamie Placeholder",
    });
    const trust = r.plan.accounts.find((a) => a.holding.id === "h-pl-trust")!;
    expect(trust.passesToNames).toEqual(["Jamie Placeholder"]);
    expect(r.plan.openQuestions.some((q) => /successor trustee/.test(q.question))).toBe(false);
  });

  it("ignores answers outside a fact's domain", () => {
    const after = lossPlan("c-example", {
      answers: { "h-ex-dira:beneficiaryDisabledOrIll": "maybe" },
    });
    expect(byHolding(after, "h-ex-dira")!.outcome.id).toBe("o.inherited-ten-year");
  });
});
