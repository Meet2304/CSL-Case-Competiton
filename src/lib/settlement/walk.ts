import type { AccountFacts, OutcomeNode, Rulebook } from "@/data/types";

export type TraceStep = {
  nodeId: string;
  question: string;
  /** The branch label taken. */
  answer: string;
  /** The fact's evidence. */
  evidence: string;
  sources: string[];
};

/** Walks the decision tree from the root to an outcome, recording each decision taken. */
export function walk(
  facts: AccountFacts,
  book: Rulebook,
): { outcome: OutcomeNode; trace: TraceStep[] } {
  const trace: TraceStep[] = [];
  const visited = new Set<string>();
  let node = book.nodes[book.rootNodeId];
  while (node && node.kind === "decision") {
    if (visited.has(node.id)) throw new Error(`Cycle in rulebook at ${node.id}`);
    visited.add(node.id);
    const value = String(facts[node.fact].value);
    const branch = node.branches.find((b) => b.when === value);
    if (!branch) throw new Error(`No branch for ${node.id} = ${value}`);
    trace.push({
      nodeId: node.id,
      question: node.question,
      answer: branch.label,
      evidence: facts[node.fact].evidence,
      sources: node.sources,
    });
    node = book.nodes[branch.next];
  }
  if (!node) throw new Error("Rulebook branch points to a missing node");
  return { outcome: node, trace };
}
