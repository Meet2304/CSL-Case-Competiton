// The engine must agree with the hand-labelled succession methods in the family seed.
import { describe, expect, it } from "vitest";
import { initialFamilyState } from "@/data/family";
import { MOCK_AS_OF } from "@/data/mock";
import type { SettlementRoute, SuccessionMethod } from "@/data/types";
import { settlementInputFromFamily } from "../adapters";
import { settlementPlan } from "../engine";

const allowed: Record<SuccessionMethod, SettlementRoute[]> = {
  joint: ["survivorship"],
  pod: ["beneficiary-claim"],
  tod: ["beneficiary-claim"],
  retirement: ["spousal-retirement-options", "inherited-retirement"],
  trust: ["successor-trustee"],
  estate: ["probate"],
  close: ["closes-estate-pays"],
};

const plan = settlementPlan(
  settlementInputFromFamily(initialFamilyState, "m-casey", MOCK_AS_OF, MOCK_AS_OF),
);
const caseyAssets = initialFamilyState.assets.filter(
  (a) => a.owners.includes("m-casey") && a.method,
);

describe("Sample family — Casey's death", () => {
  it("assumes Pennsylvania", () => {
    expect(plan.state).toBe("PA");
    expect(plan.assumptions).toContain("Assumes the family lives in Pennsylvania.");
  });

  it.each(caseyAssets.map((a) => [a.id, a.method!] as const))(
    "%s (%s) takes an allowed route",
    (id, method) => {
      const account = plan.accounts.find((p) => p.holding.id === id);
      // Assets with no class in the advisor model (e.g. real estate) aren't mapped.
      if (!account) return;
      expect(allowed[method]).toContain(account.outcome.route);
    },
  );

  it("routes the key seed assets", () => {
    const route = (id: string) => plan.accounts.find((p) => p.holding.id === id)?.outcome.route;
    expect(route("a-money-market")).toBe("probate");
    expect(route("a-brokerage")).toBe("beneficiary-claim");
    expect(route("a-ira")).toBe("spousal-retirement-options");
  });
});
