import { describe, expect, it } from "vitest";
import { willsOnFile } from "@/data/estate";
import { seedFamilies } from "@/data/household";
import { beneficiarySteps, transferPlan } from "@/lib/estate";
import { currentAccounts, type HouseholdState } from "@/lib/household";

const seed: HouseholdState = { families: seedFamilies, designations: {} };
const plan = transferPlan(currentAccounts(seed), "p-jordan", willsOnFile["p-jordan"]);
const of = (id: string) => plan.shares.find((s) => s.personId === id)!;
const routes = (id: string) =>
  Object.fromEntries(of(id).receives.map((r) => [r.account.id, r.route]));

describe("John's wealth transfer", () => {
  it("sends joint and beneficiary accounts to Maya, outside the will", () => {
    expect(routes("p-casey")).toMatchObject({
      "acct-joint-checking": "joint",
      "acct-jordan-ira": "beneficiary",
      "acct-jordan-life": "beneficiary",
    });
  });

  it("follows the will: the savings gift to the children, the rest 50/25/25", () => {
    expect(routes("p-avery")["acct-jordan-savings"]).toBe("gift");
    expect(routes("p-riley")["acct-jordan-savings"]).toBe("gift");
    const brokerage = (id: string) =>
      of(id).receives.find((r) => r.account.id === "acct-jordan-brokerage")!.amount;
    expect(brokerage("p-casey")).toBe(563_250);
    expect(brokerage("p-avery")).toBe(281_625);
    expect(brokerage("p-riley")).toBe(281_625);
  });

  it("charges the card debt to the residuary beneficiaries in the same shares, to the cent", () => {
    const debt = (id: string) => of(id).takesOn.reduce((s, b) => s + b.amount, 0);
    expect(debt("p-casey") + debt("p-avery") + debt("p-riley")).toBeCloseTo(12_846.19, 2);
    expect(debt("p-casey")).toBeCloseTo(6_423.1, 2);
    expect(plan.totalDebts).toBeCloseTo(12_846.19, 2);
  });

  it("passes every one of John's accounts to someone", () => {
    const passed = new Set(plan.shares.flatMap((s) => s.receives.map((r) => r.account.id)));
    expect([...passed].sort()).toEqual(
      [
        "acct-joint-checking",
        "acct-jordan-brokerage",
        "acct-jordan-ira",
        "acct-jordan-life",
        "acct-jordan-savings",
      ].sort(),
    );
  });
});

describe("next steps for each beneficiary", () => {
  const ctx = {
    name: (id: string) =>
      ({ "p-casey": "Maya", "p-avery": "David", "p-riley": "Alexis" })[id] ?? id,
    executor: "Maya",
    custodianOf: (id: string) => (id === "p-avery" || id === "p-riley" ? "Maya" : undefined),
    isSpouse: (id: string) => id === "p-casey",
  };
  const steps = (id: string) => beneficiarySteps(of(id), ctx);

  it("takes Maya through what passes outside the will first, then the will", () => {
    const s = steps("p-casey");
    expect(s[0]).toMatch(/^Retitle Joint Checking x0001 into Maya's name alone/);
    expect(s.some((x) => x.includes("roll it into her own IRA"))).toBe(true);
    expect(s.some((x) => x.includes("with the insurer"))).toBe(true);
    expect(s.some((x) => x.startsWith("Once Maya has letters testamentary, transfer 50% of"))).toBe(
      true,
    );
    expect(s.at(-1)).toMatch(/Cash Rewards Visa x0003 is paid from Maya's share/);
  });

  it("puts a child's share in a custodial account their custodian manages", () => {
    const s = steps("p-riley");
    expect(s[0]).toMatch(/open a custodial account for Alexis that Maya manages/);
    expect(s[0]).toContain("Savings x0002");
  });
});
