/**
 * The advisor's next steps for one client, decided by the settlement rulebook.
 *
 * After a death, every action the rulebook plans — per account and per
 * household — is grouped into a short, ranked list: what to do, why, by when
 * and who does it, with the decision path behind each step. Before a death,
 * the same rules run as a what-if and every gap becomes a fix. Questions the
 * rulebook can't answer from our records become steps too, and the advisor's
 * answers flow back into the plan.
 *
 * Pure: the UI passes in the advisor's answers, done steps and sign-offs.
 */
import type { ActionOwner, SettlementRoute } from "@/data/types";
import {
  assetRecommendations,
  engagementPlan,
  lossBriefing,
  lossPlan,
  whoKnows,
  type ClientFacts,
} from "@/lib/assistant";
import { daysBetween, firstName, formatCompactMoney, formatDate, relativeDay } from "@/lib/format";
import type { Casework } from "@/lib/settlement/casework";
import type {
  AccountPlan,
  AnsweredQuestion,
  OpenQuestion,
  PlannedAction,
  SettlementPlan,
} from "@/lib/settlement/engine";
import { label } from "@/lib/settlement/facts";
import { ownerLabel } from "@/lib/settlement/labels";
import { pendingReviews, type ReviewState } from "@/lib/settlement/reviews";
import { readinessReport, type ReadinessReport } from "@/lib/settlement/simulate";

export type StepKind =
  "relationship" | "question" | "deadline" | "account" | "handoff" | "signoff" | "fix" | "advice";

export type StepWhen = { label: string; tone: "now" | "soon" | "later" };

export type NextStep = {
  id: string;
  kind: StepKind;
  title: string;
  /** One or two sentences: why this step, in the advisor's terms. */
  why: string;
  when: StepWhen;
  owner: string;
  accountIds: string[];
  /** Rulebook source ids behind the step. */
  rules: string[];
  /** How the rulebook got here: one line per account or decision. */
  path: string[];
  /** The individual tasks inside this step, with who does each. */
  tasks: string[];
  /** For question steps: what to ask, with the answers to pick from. */
  question?: OpenQuestion;
  /** Questions and sign-offs complete themselves; everything else the advisor ticks off. */
  checkable: boolean;
  rank: number;
  due?: string;
};

export type Situation = {
  eyebrow: string;
  headline: string;
  summary: string;
  stats: { label: string; value: string; tone: "default" | "attention" | "positive" }[];
  tone: "loss" | "exposed" | "gaps" | "ready";
};

export type Guidance = {
  situation: Situation;
  /** Open steps, most important first. */
  steps: NextStep[];
  /** Steps the advisor has ticked off. */
  done: NextStep[];
  /** The settlement plan for an open loss. */
  plan?: SettlementPlan;
  /** The what-if for the client themself, when there's no open loss. */
  readiness?: ReadinessReport;
  questions: OpenQuestion[];
  answered: AnsweredQuestion[];
};

const uniq = <T>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) === i);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const money = formatCompactMoney;

/** One line per account: the answers the tree took, ending in the outcome. */
export function decisionPath(a: AccountPlan): string {
  return `${label(a.holding)}: ${a.trace.map((t) => t.answer).join(" → ")} → ${a.title}`;
}

// Quick wins first: what keeps working with a form, before what needs a court.
const ROUTE_ORDER: SettlementRoute[] = [
  "survivorship",
  "successor-trustee",
  "closes-estate-pays",
  "beneficiary-claim",
  "spousal-retirement-options",
  "inherited-retirement",
  "insurer-claim",
  "successor-owner",
  "designation-update",
  "probate",
  "needs-review",
  "not-affected",
];

const list = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

/** One advisor-level step per outcome: what the accounts on that route need, in plain words. */
function outcomeTitle(accounts: AccountPlan[], s: string, d: string): string {
  const a = accounts[0];
  const n = accounts.length;
  const names = list(accounts.map((x) => x.holding.name.replace(/\s*\(.*\)$/, "")));
  const to = list(uniq(accounts.flatMap((x) => x.passesToNames)).map(firstName));
  switch (a.outcome.route) {
    case "survivorship":
      return `Retitle ${n === 1 ? a.holding.name : `${n} joint accounts`} to ${s}`;
    case "beneficiary-claim":
      return `Transfer ${names} to ${to || "the beneficiaries"}`;
    case "spousal-retirement-options":
      return `Help ${s} decide how to take over ${d}'s ${a.holding.name}`;
    case "inherited-retirement":
      return `Set up inherited IRAs from ${names}${to ? ` for ${to}` : ""}`;
    case "successor-trustee":
      return `Confirm ${to || "the successor trustee"} as trustee of ${names}`;
    case "successor-owner":
      return `Make ${to || "the new owner"} the owner of ${names}`;
    case "closes-estate-pays":
      return `Close ${d}'s ${names}`;
    case "insurer-claim":
      return `Help ${s} file the ${names} claim`;
    case "designation-update":
      return `Update the beneficiary on ${firstName(a.holding.owners[0])}'s ${names}`;
    case "probate":
      return `Prepare ${names} for the estate`;
    default:
      return `Confirm how ${names} ${n === 1 ? "passes" : "pass"}`;
  }
}

const HANDOFF_OWNERS: ActionOwner[] = ["attorney", "tax-advisor", "executor"];
const PLANNING_FACTS = /:(beneficiaryDisabledOrIll|decedentPastRequiredBeginningDate)$/;
const BASICS = ["flag-death", "death-certificate"];

function lossSteps(
  f: ClientFacts,
  plan: SettlementPlan,
  reviews: ReviewState,
  questions: OpenQuestion[],
): NextStep[] {
  const steps: NextStep[] = [];
  const s = firstName(plan.survivor.name);
  const d = firstName(plan.deceased.name);
  const days = daysBetween(plan.deceased.dateOfDeath, f.today);
  const briefing = lossBriefing(f);
  const accountName = (id: string) =>
    plan.accounts.find((a) => a.holding.id === id)?.holding.name ?? id;

  // People first.
  steps.push({
    id: "call",
    kind: "relationship",
    title: `Call ${s} to offer condolences`,
    why: `${d} died ${relativeDay(plan.deceased.dateOfDeath, f.today)}. Lead with care — no account talk unless ${s} brings it up.`,
    when: { label: days <= 14 ? "Today" : "This week", tone: "now" },
    owner: "You",
    accountIds: [],
    rules: [],
    path: briefing ? [briefing.opening, ...briefing.doList.slice(0, 3)] : [],
    tasks: [],
    checkable: true,
    rank: 0,
  });

  // Then what the rulebook can't decide without the advisor.
  for (const q of questions)
    steps.push({
      id: `q:${q.key}`,
      kind: "question",
      title: q.question,
      why: q.accountIds.length
        ? `The rulebook needs this to decide ${q.accountIds.map(accountName).join(", ")}. Until then it assumes the cautious option.`
        : "The rulebook needs this for the household checklist. Until then it assumes the cautious option.",
      when: { label: "Unblocks the plan", tone: "now" },
      owner: "You",
      accountIds: q.accountIds,
      rules: [],
      path: [`Ask ${whoKnows(q.key, f)}.`],
      tasks: [],
      question: q,
      checkable: false,
      rank: 1,
    });

  // Household rules still waiting on a question are covered by that question's step.
  const waiting = (rule: { asks?: { fact: string }[] }) =>
    (rule.asks ?? []).some((a) => questions.some((q) => q.keys.includes(`household:${a.fact}`)));
  const householdActions = plan.household.filter((x) => !waiting(x.rule)).flatMap((x) => x.actions);
  const allActions = [...plan.accounts.flatMap((a) => a.actions), ...householdActions];

  // Recording the death unlocks everything else.
  if (allActions.some((pa) => BASICS.includes(pa.action.id)))
    steps.push({
      id: "act:basics",
      kind: "account",
      title: "Flag the death and request a certified death certificate",
      why: `Flagging stops fraud on ${d}'s accounts and keeps joint accounts working for ${s}. Each claim needs a certified certificate.`,
      when: { label: "Today", tone: "now" },
      owner: "Operations",
      accountIds: [],
      rules: ["pnc-death-claims"],
      path: [],
      tasks: [],
      checkable: true,
      rank: 0.5,
    });

  // Dated steps coming up in the next four months.
  for (const dl of plan.deadlines) {
    const left = daysBetween(f.today, dl.due!);
    if (left < 0 || left > 120) continue;
    const kind = dl.action.deadline!.kind;
    steps.push({
      id: `due:${dl.action.id}`,
      kind: "deadline",
      title: dl.label,
      why: `${dl.action.deadline!.label}${kind === "statutory" ? " — set by law" : kind === "opportunity" ? " — missing it costs a benefit" : ""}. Counted from ${d}'s date of death.`,
      when: {
        label: `By ${formatDate(dl.due!, "monthDay")} · ${relativeDay(dl.due!, f.today)}`,
        tone: left <= 30 ? "now" : "soon",
      },
      owner: ownerLabel(dl.action.owner, s),
      accountIds: dl.accountIds,
      rules: dl.action.sources,
      path: [
        `Date of death ${formatDate(plan.deceased.dateOfDeath, "medium")} → ${dl.action.deadline!.label} on ${formatDate(dl.due!, "medium")}`,
      ],
      tasks: [],
      checkable: true,
      rank: left <= 30 ? 2 : 4,
      due: dl.due,
    });
  }

  // Undated work the bank, the client or the advisor does (dated work is a deadline step).
  const isOwn = (pa: PlannedAction) =>
    !pa.due && !BASICS.includes(pa.action.id) && !HANDOFF_OWNERS.includes(pa.action.owner);

  // What other professionals own is gathered into one briefing each.
  const handoffs = new Map<ActionOwner, PlannedAction[]>();
  for (const pa of allActions) {
    if (pa.due || !HANDOFF_OWNERS.includes(pa.action.owner)) continue;
    const list = handoffs.get(pa.action.owner) ?? [];
    if (!list.some((x) => x.action.id === pa.action.id)) list.push(pa);
    handoffs.set(pa.action.owner, list);
  }

  // Account work: one step per outcome, so three joint accounts are one retitle.
  // An account still waiting on a question is covered by that question's step.
  const groups = new Map<string, AccountPlan[]>();
  for (const a of [...plan.accounts].sort(
    (x, y) =>
      ROUTE_ORDER.indexOf(x.outcome.route) - ROUTE_ORDER.indexOf(y.outcome.route) ||
      y.holding.value - x.holding.value,
  )) {
    if (!a.actions.some(isOwn) || questions.some((q) => q.accountIds.includes(a.holding.id)))
      continue;
    groups.set(a.outcome.id, [...(groups.get(a.outcome.id) ?? []), a]);
  }
  householdActions.filter(isOwn).forEach((pa) => {
    // Household work with no account of its own (e.g. the estate account) joins probate.
    const probate = [...groups.values()].find((g) => g[0].outcome.route === "probate");
    if (!probate)
      steps.push({
        id: `act:${pa.action.id}`,
        kind: "account",
        title: pa.label,
        why: pa.detail,
        when: { label: "This month", tone: "later" },
        owner: ownerLabel(pa.action.owner, s),
        accountIds: [],
        rules: pa.action.sources,
        path: [],
        tasks: [],
        checkable: true,
        rank: 3.5,
      });
  });
  for (const [outcomeId, accounts] of groups) {
    const tasks = uniq(
      accounts.flatMap((a) =>
        a.actions.filter(isOwn).map((pa) => `${pa.label} · ${ownerLabel(pa.action.owner, s)}`),
      ),
    );
    const lead = accounts[0];
    const quick = lead.outcome.survivorAccess === "uninterrupted";
    steps.push({
      id: `act:${outcomeId}`,
      kind: "account",
      title: outcomeTitle(accounts, s, d),
      why: accounts.length === 1 ? lead.summary : `${lead.title}. ${lead.summary}`,
      when: quick ? { label: "This week", tone: "soon" } : { label: "This month", tone: "later" },
      owner: ownerLabel(lead.actions.find(isOwn)?.action.owner ?? "advisor", s),
      accountIds: accounts.map((a) => a.holding.id),
      rules: uniq(accounts.flatMap((a) => a.sources)),
      path: accounts.map(decisionPath),
      tasks,
      checkable: true,
      rank: lead.outcome.route === "designation-update" ? 3.5 : 3,
    });
  }

  // What other professionals own: one briefing each, not a list of their tasks.
  const executorIsSurvivor = f.p.members
    .find((m) => m.name === plan.survivor.name)
    ?.roles.some((r) => r.startsWith("Executor"));
  for (const [owner, list] of handoffs) {
    const title =
      owner === "attorney"
        ? `Brief ${f.attorney?.name ?? "the estate attorney"} on ${plural(list.length, "item")}`
        : owner === "tax-advisor"
          ? `Brief the tax advisor on ${plural(list.length, "item")}`
          : executorIsSurvivor
            ? `Walk ${s} through ${plural(list.length, "executor task")}`
            : `Send the executor ${plural(list.length, "task")}`;
    steps.push({
      id: `handoff:${owner}`,
      kind: "handoff",
      title,
      why: `${list
        .slice(0, 3)
        .map((x) => x.label)
        .join("; ")}${list.length > 3 ? `; and ${list.length - 3} more` : ""}.`,
      when: { label: "This month", tone: "later" },
      owner: "You",
      accountIds: uniq(list.flatMap((x) => x.accountIds)),
      rules: uniq(list.flatMap((x) => x.action.sources)),
      path: [],
      tasks: list.map((x) => x.label),
      checkable: true,
      rank: 5,
    });
  }

  const pending = pendingReviews(plan.reviewQueue, reviews, f.c.id);
  if (pending.length)
    steps.push({
      id: "signoff",
      kind: "signoff",
      title: `Get ${plural(pending.length, "step")} signed off`,
      why: "The rulebook marks steps a professional must review before they're final.",
      when: { label: "Before steps are final", tone: "later" },
      owner: "You",
      accountIds: [],
      rules: [],
      path: [],
      tasks: pending.map((p) => p.label),
      checkable: false,
      rank: 6,
    });

  return steps;
}

function planningSteps(
  f: ClientFacts,
  readiness: ReadinessReport,
  questions: OpenQuestion[],
): NextStep[] {
  const steps: NextStep[] = [];
  const engage = engagementPlan(f);
  const reviewSoon = daysBetween(f.today, f.c.nextReview);
  // When the engagement plan just says "Raise: <recommendation>", the recommendation's own step covers it.
  if (!engage.next.title.startsWith("Raise:"))
    steps.push({
      id: "engage",
      kind: "relationship",
      title: engage.next.title,
      why: engage.next.why,
      when: {
        label: engage.next.when,
        tone: engage.next.when === "This month" ? "later" : "soon",
      },
      owner: "You",
      accountIds: [],
      rules: [],
      path: engage.talkingPoints,
      tasks: [],
      checkable: true,
      rank: reviewSoon >= 0 && reviewSoon <= 14 ? 0 : 2.5,
    });

  for (const q of questions)
    steps.push({
      id: `q:${q.key}`,
      kind: "question",
      title: q.question,
      why: "The what-if needs this to be accurate. Until then it assumes the cautious option.",
      when: { label: "Sharpens the what-if", tone: "soon" },
      owner: "You",
      accountIds: q.accountIds,
      rules: [],
      path: [`Ask ${whoKnows(q.key, f)}.`],
      tasks: [],
      question: q,
      checkable: false,
      rank: 2,
    });

  const byId = (id: string) => readiness.plan.accounts.find((a) => a.holding.id === id);
  for (const finding of readiness.findings)
    steps.push({
      id: `fix:${finding.id}`,
      kind: "fix",
      title: finding.fix,
      why: `${finding.title}. ${finding.detail}`,
      when:
        finding.severity === "high"
          ? { label: "This month", tone: "soon" }
          : finding.severity === "medium"
            ? { label: "This quarter", tone: "later" }
            : { label: "When convenient", tone: "later" },
      owner: "You",
      accountIds: finding.holdingIds,
      rules: finding.sources,
      path: finding.holdingIds.flatMap((id) => {
        const a = byId(id);
        return a ? [decisionPath(a)] : [];
      }),
      tasks: [],
      checkable: true,
      rank: finding.severity === "high" ? 1 : finding.severity === "medium" ? 3 : 5,
    });

  // Advice the what-if doesn't already cover (beneficiary gaps are findings above).
  for (const r of assetRecommendations(f).filter((r) => r.category !== "Beneficiaries"))
    steps.push({
      id: `rec:${r.id}`,
      kind: "advice",
      title: r.title,
      why: r.rationale,
      when:
        r.priority === "Now"
          ? { label: "Now", tone: "now" }
          : r.priority === "This month"
            ? { label: "This month", tone: "soon" }
            : { label: "This quarter", tone: "later" },
      owner: "You",
      accountIds: [],
      rules: r.sources ?? [],
      path: r.basedOn,
      tasks: [],
      checkable: true,
      rank: r.priority === "Now" ? 1.5 : r.priority === "This month" ? 3 : 4,
    });
  return steps;
}

function lossSituation(f: ClientFacts, plan: SettlementPlan): Situation {
  const t = plan.totals;
  const s = firstName(plan.survivor.name);
  const d = firstName(plan.deceased.name);
  const next = plan.deadlines.find((x) => x.due! >= f.today);
  const executor = f.p.members
    .find((m) => m.name === plan.survivor.name)
    ?.roles.some((r) => r.startsWith("Executor"));
  const calm = !next || daysBetween(f.today, next.due!) > 7;
  return {
    eyebrow: "Where things stand",
    headline: `${plan.deceased.name} died ${relativeDay(plan.deceased.dateOfDeath, f.today)}`,
    summary: `${s} is ${d}'s ${plan.survivor.relationshipToDeceased}${executor ? " and the executor" : ""}. ${money(t.outsideProbate)} passes outside probate${t.uninterrupted ? `, ${money(t.uninterrupted)} of it with no paperwork at all` : ""}. ${t.probate > 0 ? `${money(t.probate)} goes through probate and waits for letters.` : "Nothing at PNC goes through probate."}${calm ? " Nothing is due this week." : ""}`,
    stats: [
      { label: "Passes outside probate", value: money(t.outsideProbate), tone: "positive" },
      {
        label: "Goes through probate",
        value: money(t.probate),
        tone: t.probate > 0 ? "attention" : "default",
      },
      {
        label: "Next date",
        value: next ? formatDate(next.due!, "monthDay") : "None",
        tone: "default",
      },
    ],
    tone: "loss",
  };
}

function planningSituation(f: ClientFacts, r: ReadinessReport): Situation {
  const first = f.first;
  const t = r.plan.totals;
  const names = r.findings.find((x) => x.id === "f.names-deceased");
  const headline = {
    ready: `${first}'s accounts would pass the way they're set up`,
    gaps: `A few gaps in ${first}'s plan`,
    exposed: `${first}'s family would be exposed today`,
  }[r.status];
  return {
    eyebrow: "Where things stand",
    headline,
    summary: `Last contact ${relativeDay(f.c.lastContact, f.today)}; next review ${formatDate(f.c.nextReview, "medium")}. If ${first} died today, ${t.probate > 0 ? `${money(t.probate)} would go through probate` : "nothing at PNC would go through probate"}${names ? ` and ${plural(names.holdingIds.length, "designation")} still name${names.holdingIds.length === 1 ? "s" : ""} someone who has died` : ""}.${r.findings[0] && r.findings[0].id !== "f.probate" && r.findings[0].id !== "f.names-deceased" ? ` Biggest gap: ${r.findings[0].title}.` : ""}`,
    stats: [
      { label: "Relationship", value: money(f.c.relationshipValue), tone: "default" },
      {
        label: "Would go through probate",
        value: money(t.probate),
        tone: t.probate > 0 ? "attention" : "positive",
      },
      { label: "Next review", value: formatDate(f.c.nextReview, "monthDay"), tone: "default" },
    ],
    tone: r.status,
  };
}

/** Everything the Next steps view and the assistant need for one client. */
export function guidanceFor(f: ClientFacts, casework: Casework, reviews: ReviewState): Guidance {
  const plan = lossPlan(f, casework.answers);
  const readiness = plan ? undefined : readinessReport(f.c, f.p, f.self, f.today, casework.answers);
  const source = plan ?? readiness!.plan;
  // While the client is alive, only facts about their accounts' beneficiaries matter. Who'd own
  // a 529 is a fix below, and whether benefits were paid only applies after a death.
  const questions = plan
    ? source.openQuestions
    : source.openQuestions.filter((q) => q.keys.every((k) => PLANNING_FACTS.test(k)));
  const all = (
    plan ? lossSteps(f, plan, reviews, questions) : planningSteps(f, readiness!, questions)
  ).sort((a, b) => a.rank - b.rank || (a.due ?? "").localeCompare(b.due ?? ""));
  return {
    situation: plan ? lossSituation(f, plan) : planningSituation(f, readiness!),
    steps: all.filter((s) => !casework.done.includes(s.id)),
    done: all.filter((s) => casework.done.includes(s.id)),
    plan,
    readiness,
    questions,
    answered: source.answered,
  };
}
