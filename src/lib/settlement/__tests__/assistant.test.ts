// The simulated assistant sources legal facts from the settlement engine.
import { describe, expect, it } from "vitest";
import { advisorCustomers } from "@/data/advisor";
import { clientProfiles } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import {
  answerQuestion,
  assetRecommendations,
  dailyBrief,
  lossBriefing,
  suggestedQuestions,
} from "@/lib/assistant";
import { clientFacts } from "./helpers";

const morgan = clientFacts("c-placeholder");
const avery = clientFacts("c-example");

describe("assistant + settlement rulebook", () => {
  it("lists Morgan's seven key dates in order, with citations", () => {
    const a = answerQuestion(morgan, "What are the key deadlines?");
    expect(a.usedRulebook).toBe(true);
    const dated = a.paragraphs.slice(1);
    expect(dated).toHaveLength(7);
    expect(dated[0]).toMatch(/^Jan 23, 2027 — PA inheritance tax 5% discount ends/);
    expect(dated[6]).toMatch(/^Oct 23, 2031 — Last date for a late portability election/);
    expect(a.rules).toContain("pa-inheritance-tax");
  });

  it("never says a missed RMD is 'due by Dec 31'", () => {
    const text = JSON.stringify([assetRecommendations(avery), lossBriefing(avery)]);
    expect(text).not.toMatch(/due by Dec 31/);
    expect(text).toMatch(/tax-filing deadline or, at the latest, Dec 31, 2027/);
  });

  it("cites the rules behind loss recommendations", () => {
    const retitle = assetRecommendations(morgan).find((r) => r.id === "retitle");
    expect(retitle?.sources).toContain("pa-6304");
  });

  it("notes Sam as contingent, and labels Quinn a co-beneficiary", () => {
    const ira = assetRecommendations(morgan).find((r) => r.id === "ira-h-pl-ira");
    expect(ira?.actions.some((x) => /Sam is the contingent beneficiary/.test(x))).toBe(true);
    const quinn = lossBriefing(avery)?.heirs.find((h) => h.member.name === "Quinn Example");
    expect(quinn?.stake).toContain("Beneficiary of Drew's Traditional IRA x0024");
  });

  it("answers a what-if for a named person", () => {
    const a = answerQuestion(morgan, "What if Morgan died today?");
    expect(a.paragraphs[0]).toMatch(
      /^Exposed\. If Morgan died today, \$2\.27M would go through probate/,
    );
  });

  it("answers an open question from the plan without guessing", () => {
    const a = answerQuestion(
      morgan,
      "Did Riley receive Social Security or other federal benefits by direct deposit?",
    );
    expect(a.paragraphs[0]).toMatch(/^I don't have that in Morgan's records/);
  });

  it("explains a what-if finding from its 'Ask about this'", () => {
    const a = answerQuestion(morgan, "Why: $2.27M would go through probate?");
    expect(a.paragraphs.at(-1)).toMatch(/^Fix: /);
  });

  it("explains a recommendation whose title has a capitalized name", () => {
    const a = answerQuestion(morgan, "Why: Retitle 3 joint accounts to Morgan?");
    expect(a.rules).toContain("pa-6304");
  });

  it("always suggests the what-if", () => {
    expect(suggestedQuestions(morgan)).toContain("What if Morgan died today?");
    expect(suggestedQuestions(morgan)).toContain("What are the key deadlines?");
    expect(suggestedQuestions(morgan).length).toBeLessThanOrEqual(6);
  });

  it("adds readiness items to the daily brief", () => {
    const rows = advisorCustomers.map((c) => ({
      c,
      p: clientProfiles.find((p) => p.customerId === c.id)!,
    }));
    const items = dailyBrief(rows, MOCK_AS_OF).items.filter((i) => i.kind === "readiness");
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(3);
    for (const i of items) expect(i.text).toMatch(/would go through probate/);
  });
});
