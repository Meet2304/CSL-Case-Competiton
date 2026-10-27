import { describe, expect, it } from "vitest";
import type { ClientMember, Holding, HoldingType } from "@/data/types";
import { accountClassOf, deriveAccountFacts, type DerivationContext } from "../facts";

const members: ClientMember[] = [
  { name: "Pat Self", relationship: "Self", age: 63, status: "Living", roles: [] },
  { name: "Lee Spouse", relationship: "Spouse", age: 61, status: "Deceased", roles: [] },
  { name: "Kim Child", relationship: "Child", age: 16, status: "Living", roles: [] },
];
const ctx = (age = 61): DerivationContext => ({
  deceased: { name: "Lee Spouse", age },
  survivor: { name: "Pat Self" },
  members,
  state: "PA",
});
const holding = (patch: Partial<Holding>): Holding => ({
  id: "h",
  name: "Account",
  type: "Checking",
  value: 1000,
  ownership: "Individual",
  owners: ["Lee Spouse"],
  ...patch,
});

describe("accountClassOf", () => {
  const expected: [HoldingType, string][] = [
    ["Checking", "deposit"],
    ["Savings", "deposit"],
    ["Money market", "deposit"],
    ["CD", "cd"],
    ["Brokerage", "brokerage"],
    ["Traditional IRA", "ira-traditional"],
    ["401(k) rollover IRA", "ira-traditional"],
    ["Roth IRA", "ira-roth"],
    ["Inherited IRA", "ira-inherited"],
    ["Trust", "trust"],
    ["529 plan", "education-529"],
    ["Life insurance", "life-insurance"],
    ["Credit card", "credit-card"],
  ];
  it.each(expected)("%s → %s", (type, cls) => {
    expect(accountClassOf(holding({ type }))).toBe(cls);
  });
});

describe("decedentRole", () => {
  const role = (h: Partial<Holding>) => deriveAccountFacts(holding(h), ctx()).decedentRole.value;

  it("joint owner when a co-owner survives", () => {
    expect(role({ ownership: "Joint", owners: ["Pat Self", "Lee Spouse"] })).toBe("joint-owner");
  });
  it("sole owner", () => {
    expect(role({})).toBe("sole-owner");
  });
  it("co-trustee of a trust", () => {
    expect(role({ type: "Trust", ownership: "Trust", owners: ["Pat Self", "Lee Spouse"] })).toBe(
      "co-trustee",
    );
  });
  it("plan owner of a 529", () => {
    expect(role({ type: "529 plan", ownership: "Custodial", beneficiaries: ["Kim Child"] })).toBe(
      "plan-owner",
    );
  });
  it("named beneficiary on a living person's account", () => {
    expect(role({ type: "Roth IRA", owners: ["Pat Self"], beneficiaries: ["Lee Spouse"] })).toBe(
      "named-beneficiary",
    );
  });
  it("not involved", () => {
    expect(role({ owners: ["Pat Self"] })).toBe("not-involved");
  });
});

describe("beneficiaryStatus", () => {
  const status = (h: Partial<Holding>) =>
    deriveAccountFacts(holding(h), ctx()).beneficiaryStatus.value;

  it("not applicable without a designation", () => {
    expect(status({ beneficiaries: undefined })).toBe("not-applicable");
  });
  it("none on file for an empty list", () => {
    expect(status({ beneficiaries: [] })).toBe("none-on-file");
  });
  it("all deceased when every primary has died", () => {
    expect(status({ beneficiaries: ["Lee Spouse"] })).toBe("all-deceased");
  });
  it("living", () => {
    expect(status({ beneficiaries: ["Pat Self"] })).toBe("living");
  });
  it("living through a contingent when the primary has died", () => {
    expect(status({ beneficiaries: ["Lee Spouse"], contingentBeneficiaries: ["Kim Child"] })).toBe(
      "living",
    );
  });
});

describe("required beginning date", () => {
  const ira = holding({ type: "Traditional IRA", beneficiaries: ["Pat Self"] });
  const rbd = (age: number, h = ira) =>
    deriveAccountFacts(h, ctx(age)).decedentPastRequiredBeginningDate.value;

  it("61 → no", () => expect(rbd(61)).toBe("no"));
  it("73 → unknown", () => expect(rbd(73)).toBe("unknown"));
  it("78 → yes", () => expect(rbd(78)).toBe("yes"));
  it("Roth → no at any age", () => expect(rbd(78, { ...ira, type: "Roth IRA" })).toBe("no"));
});
