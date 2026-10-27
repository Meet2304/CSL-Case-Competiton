/**
 * The advisor's assistant as an agent over the settlement rulebook — SIMULATED.
 * It opens with what it worked out (the decision tree walked over every
 * account), asks the advisor for facts the tree needs, explains any next step
 * by the decisions behind it, and reports what an answer changed. Free-form
 * questions fall through to answerQuestion in ./assistant.
 */
import { rulebook } from "@/data/settlement";
import { answerQuestion, type Answer, type ClientFacts } from "@/lib/assistant";
import type { Answers, OpenQuestion } from "@/lib/settlement/engine";
import { label } from "@/lib/settlement/facts";
import { decisionPath, type Guidance, type NextStep } from "@/lib/nextSteps";

const firstName = (name: string) => name.split(" ")[0];
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export type Briefing = {
  /** What the agent did, in one sentence. */
  did: string;
  /** What it concluded. */
  found: string;
  /** How it decided: one line per account. */
  reasoning: string[];
};

export function agentBriefing(f: ClientFacts, g: Guidance): Briefing {
  const plan = g.plan ?? g.readiness!.plan;
  const n = plan.accounts.length;
  const questions = g.questions.length;
  const did = g.plan
    ? `I walked ${plural(n, "account")} ${firstName(plan.deceased.name)} was part of through the settlement rulebook (v${plan.rulebookVersion}).`
    : `I ran the settlement rulebook (v${plan.rulebookVersion}) as if ${f.first} died today, over ${plural(n, "account")}.`;
  const found = `That gives ${plural(g.steps.length, "next step")}${questions ? `, and ${questions === 1 ? "one thing" : `${questions} things`} I need you to confirm` : ""}.`;
  return { did, found, reasoning: plan.accounts.map(decisionPath) };
}

/** Explains one next step: why, how the rulebook got there, and the law behind it. */
function explainStep(step: NextStep): Answer {
  return {
    paragraphs: [
      step.why,
      ...(step.path.length
        ? [`${step.kind === "relationship" ? "How to go about it" : "How the rulebook got here"}:`]
        : []),
      ...step.path.map((p) => `• ${p}`),
      `When: ${step.when.label}. Owner: ${step.owner}.`,
    ],
    sources: [],
    rules: step.rules,
    followUps: ["What should I do next?", "What are the key deadlines?"],
    usedRulebook: step.rules.length > 0 || step.path.length > 0,
  };
}

/** The agent's reply to anything the advisor asks or clicks. */
export function agentReply(
  f: ClientFacts,
  g: Guidance,
  question: string,
  answers: Answers,
): Answer {
  const q = question.trim().toLowerCase();
  const why = question.match(/^why:\s*(.+?)\??$/i);
  const step =
    why &&
    [...g.steps, ...g.done].find((s) => s.title.toLowerCase() === why[1].trim().toLowerCase());
  if (step) return explainStep(step);

  if (/what (should|do) i do|next step|what now|where do i start|priorit/.test(q)) {
    const top = g.steps.slice(0, 5);
    return {
      paragraphs: top.length
        ? [
            `In order:`,
            ...top.map((s, i) => `${i + 1}. ${s.title} — ${s.when.label.toLowerCase()}.`),
            ...(g.steps.length > 5 ? [`Then ${g.steps.length - 5} more on the list.`] : []),
          ]
        : ["Everything on the list is done."],
      sources: [],
      rules: [...new Set(top.flatMap((s) => s.rules))],
      followUps: top[0] ? [`Why: ${top[0].title}?`] : [],
      usedRulebook: true,
    };
  }
  return answerQuestion(f, question, answers);
}

/** What changed in the plan after the advisor answered a question. */
export function answerEffect(
  before: Guidance,
  after: Guidance,
  q: OpenQuestion,
  answerLabel: string,
): string[] {
  const out: string[] = [`Got it: ${answerLabel}.`];
  const b = before.plan ?? before.readiness!.plan;
  const a = after.plan ?? after.readiness!.plan;
  for (const acc of a.accounts) {
    const was = b.accounts.find((x) => x.holding.id === acc.holding.id);
    if (was && was.outcome.id !== acc.outcome.id)
      out.push(`${label(acc.holding)} now: ${acc.title} (was: ${was.title}).`);
    else if (
      was &&
      was.passesToNames.join() !== acc.passesToNames.join() &&
      acc.passesToNames.length
    )
      out.push(`${label(acc.holding)} now passes to ${acc.passesToNames.join(", ")}.`);
  }
  const ids = (p: typeof a) => p.household.map((h) => h.rule.id);
  for (const id of ids(b).filter((x) => !ids(a).includes(x)))
    out.push(`${rulebook.household.find((h) => h.id === id)?.title ?? id} no longer applies.`);
  for (const id of ids(a).filter((x) => !ids(b).includes(x)))
    out.push(`${rulebook.household.find((h) => h.id === id)?.title ?? id} now applies.`);
  const added = after.steps.filter((s) => !before.steps.some((x) => x.id === s.id));
  const removed = before.steps.filter(
    (s) => !after.steps.some((x) => x.id === s.id) && s.id !== `q:${q.key}`,
  );
  if (added.length) out.push(`New step: ${added.map((s) => s.title).join("; ")}.`);
  if (removed.length) out.push(`No longer needed: ${removed.map((s) => s.title).join("; ")}.`);
  if (out.length === 1) out.push("That's what the plan already assumed, so nothing changes.");
  return out;
}
