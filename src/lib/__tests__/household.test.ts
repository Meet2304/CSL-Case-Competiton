import { describe, expect, it } from "vitest";
import { applyFamilyAction } from "@/components/family/FamilyProvider";
import { people, seedFamilies } from "@/data/household";
import {
  accountsOf,
  currentAccounts,
  familiesOf,
  familyView,
  householdAsFamily,
  personById,
  relationshipTo,
  sharedWith,
  type HouseholdState,
} from "@/lib/household";
import { nudgesFor } from "@/lib/nudges";
import { survivorPlan } from "@/lib/survivor";

const TODAY = "2026-10-26";
const seed: HouseholdState = { families: seedFamilies, designations: {} };
const jordan = personById("p-jordan")!;
const casey = personById("p-casey")!;
const avery = personById("p-avery")!;
const riley = personById("p-riley")!;

const nudges = (person = jordan, s = seed, deceasedIds: string[] = []) =>
  nudgesFor({
    person,
    accounts: currentAccounts(s),
    deceasedIds,
    will: "none",
    willSectionsDone: 0,
    totalSections: 6,
    today: TODAY,
  });

describe("household", () => {
  it("splits what a person owns from what they manage for a child", () => {
    const { owned, managed } = accountsOf(currentAccounts(seed), "p-casey");
    expect(owned.map((a) => a.id)).toContain("acct-joint-checking");
    expect(managed.map((a) => a.id)).toEqual(["acct-avery-checking"]);
  });

  it("applies the owner's beneficiary changes", () => {
    const s = { ...seed, designations: { "acct-jordan-savings": ["p-casey"] } };
    const savings = currentAccounts(s).find((a) => a.id === "acct-jordan-savings")!;
    expect(savings.beneficiaries).toEqual(["p-casey"]);
  });

  it("describes relationships from the viewer's side", () => {
    expect(relationshipTo(avery, jordan)).toBe("Parent");
    expect(relationshipTo(avery, riley)).toBe("Sibling");
    expect(relationshipTo(casey, jordan)).toBe("Spouse");
    expect(relationshipTo(casey, avery)).toBe("Child");
  });

  it("sees the household from anyone's side for the will planner", () => {
    const f = householdAsFamily("p-casey", currentAccounts(seed), []);
    expect(f.members.find((m) => m.id === "p-jordan")?.relationship).toBe("Spouse");
    expect(f.assets.every((a) => a.owners.includes("p-casey"))).toBe(true);
  });
});

describe("families", () => {
  it("lists only the families a person belongs to", () => {
    expect(familiesOf(seed, "p-jordan")).toHaveLength(1);
    const s = { ...seed, families: seedFamilies.filter((f) => f.id !== "fam-sample") };
    expect(familiesOf(s, "p-jordan")).toHaveLength(0);
  });

  it("shares with a member only what their role can see", () => {
    const shared = sharedWith(seed, "p-avery", currentAccounts(seed), []);
    expect(shared.map((x) => x.account.id)).toEqual(["acct-joint-checking"]);
    expect(sharedWith(seed, "p-riley", currentAccounts(seed), [])).toHaveLength(0);
  });

  it("marks a recorded death in the family view", () => {
    const view = familyView(seedFamilies[0], "p-casey", currentAccounts(seed), ["p-jordan"]);
    expect(view.members.find((m) => m.id === "p-jordan")?.status).toBe("Deceased");
  });

  it("removes role access when an account stops being shared", () => {
    const f = seedFamilies[0];
    const next = applyFamilyAction(
      f,
      { type: "unshareAccount", accountId: "acct-joint-checking" },
      "p-jordan",
      currentAccounts(seed),
    );
    expect(next.accountIds).not.toContain("acct-joint-checking");
    expect(next.roles.every((r) => !("acct-joint-checking" in r.access))).toBe(true);
  });

  it("adds a household person once, keeping their own id", () => {
    const f = seedFamilies[0];
    const action = {
      type: "addMember" as const,
      member: {
        id: "p-riley",
        name: "Child 2",
        email: "x@example.com",
        relationship: "Child" as const,
        roleId: "r-trusted",
      },
    };
    const next = applyFamilyAction(f, action, "p-jordan", currentAccounts(seed));
    expect(next.members.filter((m) => m.id === "p-riley")).toHaveLength(1);
  });
});

describe("nudges", () => {
  it("asks an adult for a will and the missing beneficiaries", () => {
    const ids = nudges().map((n) => n.id);
    expect(ids).toContain("will");
    expect(ids.filter((id) => id.startsWith("add-"))).toHaveLength(2);
  });

  it("stops asking once a beneficiary is named", () => {
    const s = {
      ...seed,
      designations: { "acct-jordan-savings": ["p-casey"], "acct-jordan-brokerage": ["p-casey"] },
    };
    expect(nudges(jordan, s).some((n) => n.id.startsWith("add-"))).toBe(false);
  });

  it("flags a beneficiary who has died", () => {
    const list = nudges(casey, seed, ["p-jordan"]);
    expect(list[0].tone).toBe("important");
  });

  it("gives Child 1 a heads-up before turning 18, and nothing to do", () => {
    const list = nudges(avery);
    expect(list.map((n) => n.tone)).toEqual(["info"]);
  });

  it("has nothing for a younger child or for someone who has died", () => {
    expect(nudges(riley)).toEqual([]);
    expect(nudges(jordan, seed, ["p-jordan"])).toEqual([]);
  });
});

describe("survivor plan", () => {
  const plan = (s = seed, you = casey) => survivorPlan(jordan, you, currentAccounts(s), TODAY);

  it("gives the spouse a flow for each account that passes to them", () => {
    const flows = plan()
      .filter((i) => i.route === "to-you" && i.flow)
      .map((i) => i.flow!.id);
    expect(flows.sort()).toEqual([
      "custodian:acct-riley-savings",
      "joint:acct-joint-checking",
      "retirement:acct-jordan-ira",
    ]);
  });

  it("sends accounts without a beneficiary through the estate", () => {
    const estate = plan().filter((i) => i.route === "estate");
    expect(estate.map((i) => i.id).sort()).toEqual([
      "acct-jordan-brokerage",
      "acct-jordan-savings",
    ]);
  });

  it("turns a beneficiary named before the death into a direct claim", () => {
    const s = { ...seed, designations: { "acct-jordan-savings": ["p-casey"] } };
    const item = plan(s).find((i) => i.accounts[0].id === "acct-jordan-savings")!;
    expect(item.route).toBe("to-you");
    expect(item.flow?.id).toBe("claim:acct-jordan-savings");
  });

  it("closes the credit card rather than passing it on", () => {
    expect(plan().find((i) => i.id === "acct-jordan-card")?.route).toBe("close");
  });

  it("never asks a child to take over as custodian", () => {
    expect(plan(seed, avery).some((i) => i.id.startsWith("custodian:"))).toBe(false);
  });

  it("covers every account Husband owned", () => {
    const covered = plan().flatMap((i) => i.accounts.map((a) => a.id));
    const owned = people.length && accountsOf(currentAccounts(seed), "p-jordan").owned;
    for (const a of owned || []) expect(covered).toContain(a.id);
  });
});
