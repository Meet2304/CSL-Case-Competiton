import { describe, expect, it } from "vitest";
import { advisorCustomers } from "@/data/advisor";
import { people, seedFamilies } from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import { rulebook } from "@/data/settlement";
import type { WillStatus } from "@/data/types";
import { sortByAttention } from "@/lib/advisor";
import type { RecordedLoss } from "@/lib/bereavement";
import type { Reply } from "@/lib/findoe/answer";
import { advisorReply, advisorSuggestions } from "@/lib/findoe/advisor";
import { customerContext, customerReply, customerSuggestions } from "@/lib/findoe/customer";
import { currentAccounts, type HouseholdState } from "@/lib/household";
import { routes } from "@/lib/routes";

const seed: HouseholdState = { families: seedFamilies, designations: {} };
const person = (id: string) => people.find((p) => p.id === id)!;
const husbandDied: RecordedLoss = {
  id: "t1",
  personName: "Husband",
  date: "2026-10-20",
  reportedVia: "Phone call",
  recordedOn: "2026-10-21",
};

function ctxFor(id: string, opts: { loss?: boolean; will?: WillStatus; s?: HouseholdState } = {}) {
  const s = opts.s ?? seed;
  return customerContext({
    person: person(id),
    household: s,
    accounts: currentAccounts(s),
    deceasedIds: opts.loss ? ["p-jordan"] : [],
    will: opts.will ?? "none",
    nudges: [],
    loss: opts.loss ? husbandDied : undefined,
    today: MOCK_AS_OF,
  });
}

/** Every marker points at a source, every source is cited, and actions go somewhere real. */
function expectWellFormed(r: Reply) {
  const cited = [...r.text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  expect(r.sources.length).toBeGreaterThan(0);
  for (const n of cited) expect(n).toBeGreaterThanOrEqual(1);
  for (const n of cited) expect(n).toBeLessThanOrEqual(r.sources.length);
  expect(new Set(cited).size).toBe(r.sources.length);
  for (const s of r.sources) if (s.kind === "law") expect(rulebook.sources[s.key]).toBeDefined();
  const pages = Object.values(routes).filter((v) => typeof v === "string");
  for (const a of r.actions) {
    if (a.external) expect(a.href).toMatch(/^(https?:|tel:|mailto:)/);
    else
      expect(
        pages.some((p) => a.href === p || a.href.startsWith(`${p}#`) || a.href.startsWith(`${p}/`)),
      ).toBe(true);
  }
}

const questions = [
  "hi",
  "What should I do first?",
  "What happens to my accounts if I die?",
  "Which accounts are missing a beneficiary?",
  "Do I need a will?",
  "Who should I contact for help?",
  "Will my family owe taxes?",
  "Can I pay for the funeral from our accounts?",
  "Who can see my accounts?",
  "What do I have at PNC?",
  "What changes when I turn 18?",
  "What happens now?",
  "What can I claim?",
  "How do I claim the 401(k) Rollover IRA?",
  "What about the CD early withdrawal penalty?",
  "What's the weather like?",
];

describe("Findoe for customers", () => {
  for (const id of ["p-jordan", "p-casey", "p-avery", "p-riley"])
    for (const loss of [false, true]) {
      if (loss && id === "p-jordan") continue;
      it(`answers every question with cited sources (${id}${loss ? ", after a loss" : ""})`, () => {
        const ctx = ctxFor(id, { loss });
        for (const q of [...questions, ...customerSuggestions(ctx, routes.home)])
          expectWellFormed(customerReply(ctx, q));
      });
    }

  it("shows Husband which accounts would go through probate, and how to fix each", () => {
    const r = customerReply(ctxFor("p-jordan"), "What happens to my accounts if I die?");
    expect(r.text).toContain("Joint Checking x0001** passes straight to Wife");
    expect(r.text).toContain("2 accounts ($114,750.00) would go through probate");
    expect(r.actions.map((a) => a.href)).toEqual([
      routes.manageAsset("acct-jordan-savings"),
      routes.manageAsset("acct-jordan-brokerage"),
      routes.will,
    ]);
    expect(r.sources.some((s) => s.kind === "law" && s.key === "pa-6304")).toBe(true);
  });

  it("drops the will action once the will is on file", () => {
    const r = customerReply(ctxFor("p-jordan", { will: "on-file" }), "What happens if I die?");
    expect(r.actions.some((a) => a.href === routes.will)).toBe(false);
  });

  it("walks Wife through what to do first after Husband dies, gently", () => {
    const r = customerReply(ctxFor("p-casey", { loss: true }), "What should I do first?");
    expect(r.text).toMatch(/^I'm so sorry about Husband/);
    expect(r.text).toContain("Joint Checking is already yours");
    expect(r.text).toContain("Claim the 401(k) Rollover IRA");
    expect(r.text).toContain("Leave Savings x0002 and Brokerage Account x0012 to the executor");
    expect(r.actions[0].href).toBe(routes.unclaimedAssets);
  });

  it("tells a surviving spouse about the funeral payment rule and Social Security", () => {
    const ctx = ctxFor("p-casey", { loss: true });
    const funeral = customerReply(ctx, "Can I pay for the funeral?");
    expect(funeral.sources.map((s) => s.key)).toEqual(
      expect.arrayContaining(["pa-3101", "pa-act50-2025", "account:acct-jordan-savings"]),
    );
    const contacts = customerReply(ctx, "Who should I contact?");
    expect(contacts.sources.map((s) => s.key)).toContain("ssa-lump-sum");
  });

  it("lists what Wife can claim after Husband dies, and walks her through one claim", () => {
    const ctx = ctxFor("p-casey", { loss: true });
    const all = customerReply(ctx, "What can I claim?");
    for (const t of [
      "Joint Checking",
      "401(k) Rollover IRA",
      "Term Life Policy",
      "Child 2's Teen Savings",
    ])
      expect(all.text).toContain(`**${t}**`);
    expect(all.text).toContain("go through Husband's estate");
    expect(all.actions[0].href).toBe(routes.unclaimedAssets);

    const one = customerReply(ctx, "How do I claim the 401(k) Rollover IRA?");
    expect(one.text).toMatch(
      /^\*\*401\(k\) Rollover IRA\*\* can pass to you because Husband named/,
    );
    expect(one.text).toContain("What the claim asks for:");
    expect(one.actions[0].href).toBe(routes.claimAsset("retirement:acct-jordan-ira"));
    expect(one.sources.map((s) => s.key)).toContain("irs-pub-590b");
  });

  it("never shows a child the accounts their role can't see", () => {
    const hidden = ["Brokerage", "401(k)", "Roth", "Term Life", "Savings x0002", "Savings x0021"];
    for (const loss of [false, true]) {
      const ctx = ctxFor("p-avery", { loss });
      for (const q of questions) {
        const r = customerReply(ctx, q);
        const seen = `${r.text} ${r.sources.map((s) => (s.kind === "bank" ? `${s.title} ${s.detail}` : "")).join(" ")}`;
        for (const h of hidden)
          expect(seen, `${q} (${loss ? "after a loss" : "no loss"})`).not.toContain(h);
      }
    }
  });

  it("describes other members' access only to admins", () => {
    const admin = customerReply(ctxFor("p-jordan"), "Who can see my accounts?");
    expect(admin.text).toContain("**Child 1** (Older child): sees Joint Checking x0001");
    const member = customerReply(ctxFor("p-avery"), "Who can see my accounts?");
    expect(member.text).toContain("you can see Joint Checking x0001");
    expect(member.text).not.toContain("Admin");
    expect(member.text).not.toContain("Child 2");
  });

  it("suggests loss questions while a death is being settled", () => {
    expect(customerSuggestions(ctxFor("p-casey", { loss: true }), routes.home)[0]).toBe(
      "What should I do first?",
    );
    expect(customerSuggestions(ctxFor("p-jordan"), routes.assets)[0]).toBe(
      "Which accounts are missing a beneficiary?",
    );
  });
});

describe("Findoe for advisors", () => {
  const ctx = { customers: sortByAttention(advisorCustomers), today: MOCK_AS_OF };

  it("answers every suggestion with cited sources", () => {
    for (const q of [...advisorSuggestions(ctx), "What is portability?", "hello there"])
      expectWellFormed(advisorReply(ctx, q));
  });

  it("puts the most recent loss first and links to the client", () => {
    const r = advisorReply(ctx, "Who needs my attention today?");
    expect(r.text).toContain("**Morgan Placeholder**");
    expect(r.actions[0].href).toBe(routes.advisorClient("c-placeholder"));
    expect(r.sources.map((s) => s.key)).toContain("treas-210");
  });

  it("summarizes a client asked about by name", () => {
    const r = advisorReply(ctx, "Summarize Morgan Placeholder");
    expect(r.text).toMatch(/^\*\*Morgan Placeholder\*\* is a Private Bank client/);
  });
});
