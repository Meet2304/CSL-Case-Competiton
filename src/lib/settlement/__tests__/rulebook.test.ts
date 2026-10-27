import { describe, expect, it } from "vitest";
import { rulebook, UNVERIFIED_SOURCE_IDS } from "@/data/settlement";
import type { DecisionNode, OutcomeNode } from "@/data/types";
import { FACT_DOMAINS } from "../facts";

const nodes = Object.values(rulebook.nodes);
const decisions = nodes.filter((n): n is DecisionNode => n.kind === "decision");
const outcomes = nodes.filter((n): n is OutcomeNode => n.kind === "outcome");
const actions = Object.values(rulebook.actions);

describe("rulebook integrity", () => {
  it("cites only sources that exist", () => {
    const cited = [
      ...nodes.flatMap((n) => n.sources),
      ...actions.flatMap((a) => a.sources),
      ...rulebook.overlays.flatMap((o) => o.sources),
      ...rulebook.household.flatMap((h) => h.sources),
    ];
    for (const id of cited) expect(rulebook.sources[id], id).toBeDefined();
  });

  it("gives every source an https url, a citation and a summary", () => {
    for (const s of Object.values(rulebook.sources)) {
      expect(s.url, s.id).toMatch(/^https:\/\//);
      expect(s.citation.trim(), s.id).not.toBe("");
      expect(s.summary.trim(), s.id).not.toBe("");
    }
  });

  it("references only actions that exist", () => {
    const used = [
      ...outcomes.flatMap((o) => o.actions),
      ...rulebook.overlays.flatMap((o) => o.actions),
      ...rulebook.household.flatMap((h) => h.actions),
    ];
    for (const id of used) expect(rulebook.actions[id], id).toBeDefined();
  });

  it("cites at least one source on every node", () => {
    for (const n of nodes) expect(n.sources.length, n.id).toBeGreaterThan(0);
  });

  it("branches on every value of a decision's fact, exactly once", () => {
    for (const d of decisions) {
      const domain = FACT_DOMAINS[d.fact];
      expect(domain, `${d.id} branches on ${d.fact}, which has no domain`).toBeDefined();
      const whens = d.branches.map((b) => b.when);
      expect(new Set(whens).size, `${d.id} has duplicate branches`).toBe(whens.length);
      expect([...whens].sort(), d.id).toEqual([...domain!].sort());
    }
  });

  it("links every branch to a node, reaches every node, and has no cycles", () => {
    for (const d of decisions)
      for (const b of d.branches)
        expect(rulebook.nodes[b.next], `${d.id} → ${b.next}`).toBeDefined();

    const reached = new Set<string>();
    const visit = (id: string, path: string[]) => {
      expect(path, `cycle at ${id}`).not.toContain(id);
      reached.add(id);
      const n = rulebook.nodes[id];
      if (n.kind === "decision") for (const b of n.branches) visit(b.next, [...path, id]);
    };
    visit(rulebook.rootNodeId, []);
    expect([...reached].sort()).toEqual(Object.keys(rulebook.nodes).sort());
  });

  it("cites a source for every dated action", () => {
    for (const a of actions.filter((a) => a.deadline))
      expect(a.sources.length, a.id).toBeGreaterThan(0);
  });

  it("pins the list of sources not yet verified", () => {
    expect([...UNVERIFIED_SOURCE_IDS].sort()).toEqual(
      [
        "pa-register-of-wills",
        "irs-pub-559",
        "irs-pub-590b",
        "irc-1014",
        "pnc-cd-agreement",
        "plan-529",
      ].sort(),
    );
  });

  it("uses only known placeholders, and none about an account in household rules", () => {
    const allowed = ["{decedent}", "{survivor}", "{account}"];
    const texts = [
      ...outcomes.flatMap((o) => [o.title, o.summary, o.plain]),
      ...decisions.flatMap((d) => [d.question, ...d.branches.map((b) => b.label)]),
      ...actions.flatMap((a) => [a.label, a.detail]),
      ...rulebook.overlays.flatMap((o) => [o.detail, ...(o.asks ?? []).map((a) => a.question)]),
    ];
    for (const t of texts)
      for (const p of t.match(/\{[^}]*\}/g) ?? []) expect(allowed, t).toContain(p);

    for (const h of rulebook.household) {
      const own = [h.detail, ...(h.asks ?? []).map((a) => a.question)];
      const viaActions = h.actions.flatMap((id) => [
        rulebook.actions[id].label,
        rulebook.actions[id].detail,
      ]);
      for (const t of [...own, ...viaActions]) expect(t, h.id).not.toContain("{account}");
    }
  });
});
