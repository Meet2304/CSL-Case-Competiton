// Next steps and the agent are decided by the settlement rulebook.
import { describe, expect, it } from "vitest";
import { agentBriefing, agentReply, answerEffect } from "@/lib/agent";
import { guidanceFor } from "@/lib/nextSteps";
import { clientFacts } from "./helpers";

const none = { answers: {}, done: [] };

describe("next steps after a death", () => {
  const f = clientFacts("c-placeholder");
  const g = guidanceFor(f, none, {});

  it("puts people first, then what the rulebook needs, then the accounts", () => {
    expect(g.steps.slice(0, 5).map((s) => s.title)).toEqual([
      "Call Morgan to offer condolences",
      "Flag the death and request a certified death certificate",
      "Who should own 529 College Savings x0018 now?",
      "Did Riley receive Social Security or other federal benefits by direct deposit?",
      "Retitle 3 joint accounts to Morgan",
    ]);
  });

  it("groups account work by outcome, one step each", () => {
    const retitle = g.steps.find((s) => s.title === "Retitle 3 joint accounts to Morgan")!;
    expect([...retitle.accountIds].sort()).toEqual(["h-pl-cd", "h-pl-chk", "h-pl-mm"]);
    expect(retitle.path).toHaveLength(3);
    expect(retitle.rules).toContain("pa-6304");
    expect(retitle.tasks.some((t) => /penalty waiver/.test(t))).toBe(true);
  });

  it("leaves accounts waiting on a question to that question", () => {
    expect(g.steps.some((s) => s.accountIds.includes("h-pl-529") && s.kind === "account")).toBe(
      false,
    );
  });

  it("turns an answer into a concrete step", () => {
    const after = guidanceFor(
      f,
      { answers: { "h-pl-529:successor-owner": "Morgan Placeholder" }, done: [] },
      {},
    );
    expect(after.steps.map((s) => s.title)).toContain(
      "Make Morgan the owner of 529 College Savings",
    );
    const q = g.questions.find((x) => x.key === "h-pl-529:successor-owner")!;
    const lines = answerEffect(g, after, q, "Morgan Placeholder");
    expect(lines[0]).toBe("Got it: Morgan Placeholder.");
    expect(
      lines.some((l) =>
        /529 College Savings x0018 now: Successor owner takes over the 529/.test(l),
      ),
    ).toBe(true);
  });

  it("moves done steps out of the list", () => {
    const after = guidanceFor(f, { answers: {}, done: ["call"] }, {});
    expect(after.steps[0].id).toBe("act:basics");
    expect(after.done.map((s) => s.id)).toEqual(["call"]);
  });

  it("hands professional work off as one briefing each", () => {
    expect(g.steps.map((s) => s.title)).toContain("Brief Dana Example on 2 items");
    expect(g.steps.filter((s) => s.kind === "handoff").every((s) => s.tasks.length > 0)).toBe(true);
  });
});

describe("next steps before a death", () => {
  const f = clientFacts("c-fictional");
  const g = guidanceFor(f, none, {});

  it("turns what-if gaps into fixes and asks nothing that only applies after a death", () => {
    expect(g.readiness?.status).toBe("exposed");
    expect(g.steps[0].title).toBe("Name beneficiaries on Brokerage Account x0033");
    expect(g.questions).toEqual([]);
  });
});

describe("the agent", () => {
  const f = clientFacts("c-example");
  const g = guidanceFor(f, none, {});

  it("opens with what it did and what it needs", () => {
    const b = agentBriefing(f, g);
    expect(b.did).toMatch(/^I walked 4 accounts Drew was part of through the settlement rulebook/);
    expect(b.found).toMatch(/2 things I need you to confirm/);
    expect(b.reasoning).toContain(
      "Drew's Brokerage Account x0026: Sole owner → Brokerage → No designation on file → Pennsylvania → Goes through probate (Pennsylvania)",
    );
  });

  it("explains a step by the decisions behind it", () => {
    const step = g.steps.find(
      (s) => s.title === "Prepare Drew's Brokerage Account for the estate",
    )!;
    const a = agentReply(f, g, `Why: ${step.title}?`, {});
    expect(
      a.paragraphs.some((p) => p.startsWith("• Drew's Brokerage Account x0026: Sole owner")),
    ).toBe(true);
    expect(a.rules).toContain("pa-register-of-wills");
  });

  it("lists what to do next", () => {
    const a = agentReply(f, g, "What should I do next?", {});
    expect(a.paragraphs[1]).toBe("1. Call Avery to offer condolences — today.");
  });
});
