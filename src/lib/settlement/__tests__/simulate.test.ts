import { describe, expect, it } from "vitest";
import { advisorCustomers } from "@/data/advisor";
import { clientProfiles } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import { readinessReport, simulatablePeople } from "../simulate";
import { clientFacts } from "./helpers";

const morganFacts = clientFacts("c-placeholder");
const morgan = readinessReport(morganFacts.c, morganFacts.p, "Morgan Placeholder", MOCK_AS_OF);
const route = (id: string) => morgan.plan.accounts.find((a) => a.holding.id === id)?.outcome;

describe("What if Morgan Placeholder died today?", () => {
  it("is exposed", () => {
    expect(morgan.status).toBe("exposed");
  });

  it("finds the Roth still naming Riley", () => {
    const f = morgan.findings.find((x) => x.id === "f.names-deceased");
    expect(f?.holdingIds).toEqual(["h-pl-roth"]);
  });

  it("sends the Roth and the accounts still titled with Riley to probate", () => {
    const f = morgan.findings.find((x) => x.id === "f.probate")!;
    expect([...f.holdingIds].sort()).toEqual(["h-pl-cd", "h-pl-chk", "h-pl-mm", "h-pl-roth"]);
    expect(route("h-pl-roth")?.id).toBe("o.retirement-to-estate");
    expect(route("h-pl-chk")?.id).toBe("o.probate-pa");
    expect(morgan.plan.totals.probate).toBe(2_268_800);
  });

  it("makes Morgan the sole trustee and asks who succeeds", () => {
    const trust = morgan.plan.accounts.find((a) => a.holding.id === "h-pl-trust")!;
    expect(trust.facts.decedentRole.value).toBe("sole-trustee");
    expect(trust.outcome.id).toBe("o.successor-trustee");
    expect(
      morgan.plan.openQuestions.some((q) =>
        /successor trustee named in the trust/.test(q.question),
      ),
    ).toBe(true);
  });

  it("leaves Riley's own accounts alone", () => {
    for (const id of ["h-pl-brk", "h-pl-ira", "h-pl-529", "h-pl-visa"])
      expect(route(id), id).toBeUndefined();
  });

  it("picks Sam as the survivor", () => {
    expect(morgan.survivor).toBe("Sam Placeholder");
  });
});

describe("simulatablePeople", () => {
  it("lists living account owners only", () => {
    const people = simulatablePeople(morganFacts.p);
    expect(people).toContain("Morgan Placeholder");
    for (const n of ["Dana Example", "Jamie Placeholder", "Sam Placeholder", "Riley Placeholder"])
      expect(people).not.toContain(n);
  });
});

describe("generated households", () => {
  const generated = advisorCustomers
    .map((c) => ({ c, p: clientProfiles.find((p) => p.customerId === c.id)! }))
    .filter(
      ({ c }) => !["c-placeholder", "c-example", "c-fictional", "c-exampleton"].includes(c.id),
    );

  it("simulate without throwing and balance their totals", () => {
    for (const { c, p } of generated) {
      const r = readinessReport(c, p, c.name, MOCK_AS_OF);
      const t = r.plan.totals;
      const counted = r.plan.accounts
        .filter((a) => !a.holding.external && a.outcome.route !== "designation-update")
        .reduce((s, a) => s + a.holding.value, 0);
      expect(t.outsideProbate + t.probate + t.debts + t.needsReview, c.id).toBeCloseTo(counted, 2);
    }
  });

  it("include at least one household with no beneficiary on file", () => {
    expect(
      generated.some(({ c, p }) =>
        readinessReport(c, p, c.name, MOCK_AS_OF).findings.some((f) => f.id === "f.no-beneficiary"),
      ),
    ).toBe(true);
  });
});
