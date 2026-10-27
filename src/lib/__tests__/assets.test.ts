import { describe, expect, it } from "vitest";
import { seedFamilies } from "@/data/household";
import {
  accountsOf,
  assetMatches,
  assetsFor,
  assetSummary,
  canManage,
  canPayFrom,
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
    // Father: everything they own, Child 2's account (custodian), and Mother's accounts (admin).
    expect(manageable("p-jordan")).toEqual(
      expect.arrayContaining(["acct-jordan-savings", "acct-riley-savings", "acct-casey-roth"]),
    );
    // Child 1: their account is run by a custodian; the shared checking is view-only for the role.
    expect(manageable("p-avery")).toEqual([]);
  });

  it("totals balances at PNC and keeps outside policies apart", () => {
    const s = assetSummary(accountsOf(all, "p-jordan").owned);
    expect(s.net).toBeCloseTo(12_480.55 + 18_250 + 184_000 + 96_500 - 1_284.19, 2);
    expect(s.owed).toBeCloseTo(-1_284.19, 2);
    expect(s.outside.map((a) => a.id)).toEqual(["acct-jordan-life"]);
    expect(s.holdings.map((g) => g.id)).toEqual(["cash", "retirement", "investments"]);
  });

  it("pays bills only from cash accounts the person runs or may transact on", () => {
    const payable = (personId: string) =>
      assetsFor(seed, personId, all, [])
        .filter((i) => canPayFrom(i, personId))
        .map((i) => i.account.id);
    // Father: his own cash accounts and Child 2's account he's custodian of; never the IRA or card.
    expect(payable("p-jordan")).toEqual(
      expect.arrayContaining(["acct-joint-checking", "acct-jordan-savings", "acct-riley-savings"]),
    );
    expect(payable("p-jordan")).not.toContain("acct-jordan-ira");
    expect(payable("p-jordan")).not.toContain("acct-jordan-card");
    // Child 1 only sees the joint checking (no pay permission); Child 2's account is run by a custodian.
    expect(payable("p-avery")).toEqual([]);
    expect(payable("p-riley")).toEqual([]);
  });

  it("searches by name, number, owner and family", () => {
    const items = assetsFor(seed, "p-jordan", all, []);
    const find = (q: string) => items.filter((i) => assetMatches(i, q)).map((i) => i.account.id);
    expect(find("x0011")).toEqual(["acct-jordan-ira"]);
    expect(find("mother roth")).toEqual(["acct-casey-roth"]);
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
    expect(s.invited).toEqual([]);
  });

  it("gives members only what they can see, never a count of the rest", () => {
    const s = familySummary(family, "p-avery", all, []);
    expect(s.isAdmin).toBe(false);
    expect(s.visible.map((a) => a.id)).toEqual(["acct-joint-checking"]);
    expect(s.total).toBeCloseTo(12_480.55, 2);
  });

  it("tells admins about pending invites and a child turning 18", () => {
    const withInvite = {
      ...family,
      members: [
        ...family.members,
        {
          id: "m-guest",
          name: "Pat Example",
          email: "pat@example.com",
          relationship: "Other" as const,
          roleId: "r-younger-child",
          status: "Invited" as const,
        },
      ],
    };
    const ids = familyNudges({
      person: personById("p-jordan")!,
      families: [withInvite],
      deceasedIds: [],
      today: TODAY,
    }).map((n) => n.id);
    expect(ids.sort()).toEqual(["adult-fam-sample-p-avery", "invite-fam-sample-m-guest"].sort());
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
