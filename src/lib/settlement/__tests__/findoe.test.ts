// Findoe's grounding: everything it may say comes from this context.
import { describe, expect, it } from "vitest";
import { findoeContext } from "@/lib/findoe/context";
import { guidanceFor } from "@/lib/nextSteps";
import { clientFacts } from "./helpers";

const none = { answers: {}, done: [] };

describe("Findoe context", () => {
  it("carries the rulebook's steps, dates, citations and open questions", () => {
    const f = clientFacts("c-placeholder");
    const ctx = findoeContext(f, guidanceFor(f, none, {}));
    expect(ctx).toContain("1. Call Morgan to offer condolences");
    expect(ctx).toContain("Retitle 3 joint accounts to Morgan");
    expect(ctx).toContain("20 Pa.C.S. § 6304");
    expect(ctx).toContain("Jan 23, 2027: PA inheritance tax 5% discount ends");
    expect(ctx).toContain("Who should own 529 College Savings x0018 now?");
    expect(ctx).toContain("Prefers phone");
    expect(ctx).not.toMatch(/undefined|NaN|\{decedent\}|\{survivor\}|\{account\}/);
  });

  it("reflects the advisor's answers", () => {
    const f = clientFacts("c-placeholder");
    const ctx = findoeContext(
      f,
      guidanceFor(
        f,
        { answers: { "h-pl-529:successor-owner": "Morgan Placeholder" }, done: [] },
        {},
      ),
    );
    expect(ctx).toContain("Who should own 529 College Savings x0018 now? → Morgan Placeholder");
    expect(ctx).toContain("Make Morgan the owner of 529 College Savings");
  });

  it("works for a client with no loss, from the what-if", () => {
    const f = clientFacts("c-fictional");
    const ctx = findoeContext(f, guidanceFor(f, none, {}));
    expect(ctx).toContain("What-if: if Harper died today");
    expect(ctx).toContain("Name beneficiaries on Brokerage Account x0033");
    expect(ctx.length).toBeLessThan(60_000);
  });
});
