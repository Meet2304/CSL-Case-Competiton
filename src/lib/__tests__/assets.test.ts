import { describe, expect, it } from "vitest";
import { seedFamilies } from "@/data/household";
import {
  accountsOf,
  assetMatches,
  assetsFor,
  assetSummary,
  canManage,
  currentAccounts,
  familySummary,
  personById,
  type HouseholdState,
} from "@/lib/household";
import { familyNudges } from "@/lib/nudges";

const TODAY = "2026-10-26";
const seed: HouseholdState = { families: seedFamilies, designations: {} };
const all = currentAccounts(seed);

describe("my assets", () => {
  it("lists what a person owns, then manages, then what family shares with them", () => {
    const items = assetsFor(seed, "p-jordan", all, []);
    const relations = items.map((i) => i.relation);
    expect(relations.indexOf("managed")).toBeGreaterThan(relations.lastIndexOf("owned"));
    expect(relations.indexOf("shared")).toBeGreaterThan(relations.lastIndexOf("managed"));
    expect(items.find((i) => i.account.id === "acct-riley-savings")?.relation).toBe("managed");
    const shared = items.find((i) => i.account.id === "acct-casey-roth");
    expect(shared?.relation).toBe("shared");
    expect(shared?.family?.id).toBe("fam-sample");
  });

  it("shows a member only what their role lets them see", () => {
    const items = assetsFor(seed, "p-avery", all, []);
    expect(items.filter((i) => i.relation === "shared").map((i) => i.account.id)).toEqual([
      "acct-joint-checking",
    ]);
  });

  it("offers Manage only where the person may manage the account", () => {
    const manageable = (personId: string) =>
      assetsFor(seed, personId, all, [])
        .filter((i) => canManage(i, personId))
        .map((i) => i.account.id);
    // Jordan: everything they own, Riley's account (custodian), and Casey's accounts (admin).
    expect(manageable("p-jordan")).toEqual(
      expect.arrayContaining(["acct-jordan-savings", "acct-riley-savings", "acct-casey-roth"]),
    );
    // Avery: their account is run by a custodian; the shared checking is view-only for the role.
    expect(manageable("p-avery")).toEqual([]);
  });

  it("totals balances at PNC and keeps outside policies apart", () => {
    const s = assetSummary(accountsOf(all, "p-jordan").owned);
    expect(s.net).toBeCloseTo(12_480.55 + 18_250 + 184_000 + 96_500 - 1_284.19, 2);
    expect(s.owed).toBeCloseTo(-1_284.19, 2);
    expect(s.outside.map((a) => a.id)).toEqual(["acct-jordan-life"]);
    expect(s.holdings.map((g) => g.id)).toEqual(["cash", "retirement", "investments"]);
  });

  it("searches by name, number, owner and family", () => {
    const items = assetsFor(seed, "p-jordan", all, []);
    const find = (q: string) => items.filter((i) => assetMatches(i, q)).map((i) => i.account.id);
    expect(find("x0011")).toEqual(["acct-jordan-ira"]);
    expect(find("casey roth")).toEqual(["acct-casey-roth"]);
    expect(find("sample family")).toEqual(["acct-casey-savings", "acct-casey-roth"]);
    expect(find("")).toHaveLength(items.length);
  });
});

describe("family at a glance", () => {
  const family = seedFamilies[0];

  it("gives admins every shared account", () => {
    const s = familySummary(family, "p-jordan", all, []);
    expect(s.isAdmin).toBe(true);
    expect(s.visible).toHaveLength(family.accountIds.length);
    expect(s.invited.map((m) => m.id)).toEqual(["p-dana"]);
  });

  it("gives members only what they can see, never a count of the rest", () => {
    const s = familySummary(family, "p-avery", all, []);
    expect(s.isAdmin).toBe(false);
    expect(s.visible.map((a) => a.id)).toEqual(["acct-joint-checking"]);
    expect(s.total).toBeCloseTo(12_480.55, 2);
  });

  it("tells admins about pending invites and a child turning 18", () => {
    const ids = familyNudges({
      person: personById("p-jordan")!,
      families: seedFamilies,
      deceasedIds: [],
      today: TODAY,
    }).map((n) => n.id);
    expect(ids).toEqual(["adult-fam-sample-p-avery", "invite-fam-sample-p-dana"].sort());
  });

  it("says nothing to members about other people's access", () => {
    const notes = familyNudges({
      person: personById("p-avery")!,
      families: seedFamilies,
      deceasedIds: [],
      today: TODAY,
    });
    expect(notes).toEqual([]);
  });
});
