/**
 * The settlement engine: for one death, walks every account through the
 * rulebook, layers on overlays and household rules, and returns a plan with
 * routes, dated deadlines, open questions, sign-offs and the source behind
 * every step. Pure and deterministic — no clock, no React, no model.
 */
import { ALWAYS_ASK_OVERLAYS, rulebook } from "@/data/settlement";
import type {
  AccountFacts,
  ClientMember,
  DeadlineKind,
  Holding,
  HouseholdRule,
  OutcomeNode,
  Overlay,
  ReviewLevel,
  RuleAction,
  Rulebook,
  SettlementRoute,
  StateCode,
} from "@/data/types";
import { daysBetween } from "@/lib/format";
import { holds, plainValues } from "./conditions";
import { resolveDeadline } from "./dates";
import {
  accountAssumptions,
  beneficiaryTakers,
  deriveAccountFacts,
  deriveHouseholdFacts,
  label,
  type DerivationContext,
} from "./facts";
import { walk, type TraceStep } from "./walk";

export type { TraceStep } from "./walk";

export type PlannedAction = {
  /** `${scope}:${actionId}`; scope = holding id or "household". */
  key: string;
  action: RuleAction;
  /** Label with placeholders filled. */
  label: string;
  /** Detail with placeholders filled. */
  detail: string;
  /** ISO due date, when the action has a deadline. */
  due?: string;
  accountIds: string[];
};

export type OpenQuestion = { key: string; question: string; accountIds: string[] };

export type AccountPlan = {
  holding: Holding;
  facts: AccountFacts;
  outcome: OutcomeNode;
  /** Outcome title, filled. */
  title: string;
  summary: string;
  plain: string;
  passesToNames: string[];
  trace: TraceStep[];
  overlays: Overlay[];
  actions: PlannedAction[];
  assumptions: string[];
  openQuestions: OpenQuestion[];
  review: ReviewLevel[];
  attention: boolean;
  /** Every source this account's outcome relies on, deduped in first-use order. */
  sources: string[];
};

export type SettlementTotals = {
  /** Value that passes without probate (survivorship, beneficiaries, trust, plan owner). */
  outsideProbate: number;
  /** Subset of outsideProbate the survivor can keep using with no paperwork at all. */
  uninterrupted: number;
  probate: number;
  /** Negative or 0. */
  debts: number;
  heldOutsidePnc: number;
  needsReview: number;
};

export type HouseholdItem = {
  rule: HouseholdRule;
  detail: string;
  actions: PlannedAction[];
};

export type ReviewItem = { key: string; label: string; levels: ReviewLevel[] };

export type SettlementPlan = {
  rulebookVersion: string;
  asOf: string;
  mode: "settlement" | "simulation";
  deceased: { name: string; age?: number; dateOfDeath: string };
  survivor: { name: string; relationshipToDeceased: string };
  state: StateCode;
  /** Accounts the decedent was involved in (never "not-affected"). */
  accounts: AccountPlan[];
  household: HouseholdItem[];
  /** Every dated action, ascending by due date. */
  deadlines: PlannedAction[];
  openQuestions: OpenQuestion[];
  reviewQueue: ReviewItem[];
  assumptions: string[];
  totals: SettlementTotals;
  /** Source ids, deduped, in first-use order. */
  sourcesUsed: string[];
};

export type SettlementInput = {
  mode: "settlement" | "simulation";
  asOf: string;
  deceased: { name: string; age?: number; dateOfDeath: string };
  survivor: { name: string; relationshipToDeceased: string };
  members: ClientMember[];
  holdings: Holding[];
  state: StateCode;
  /** Anything the adapter had to assume to build this input. */
  assumptions?: string[];
};

export const REVIEW_ORDER: ReviewLevel[] = [
  "advisor",
  "operations",
  "trust-officer",
  "attorney",
  "tax-advisor",
];
const KIND_ORDER: DeadlineKind[] = ["statutory", "opportunity", "recommended"];

export const routeLabels: Record<SettlementRoute, string> = {
  survivorship: "Passes to co-owner",
  "beneficiary-claim": "Beneficiary claim",
  "spousal-retirement-options": "Spouse's IRA options",
  "inherited-retirement": "Inherited IRA",
  "successor-trustee": "Successor trustee",
  "successor-owner": "New plan owner",
  probate: "Probate",
  "closes-estate-pays": "Closes · estate pays",
  "insurer-claim": "Insurance claim",
  "designation-update": "Update beneficiary",
  "not-affected": "Not affected",
  "needs-review": "Needs review",
};

export const routeLabel = (route: SettlementRoute) => routeLabels[route];

const firstName = (name: string) => name.split(" ")[0];
const uniq = <T>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) === i);
const orderReview = (levels: ReviewLevel[]) => REVIEW_ORDER.filter((l) => levels.includes(l));

type Fill = (text: string) => string;

function filler(input: SettlementInput, h?: Holding): Fill {
  return (text) =>
    text
      .replaceAll("{decedent}", firstName(input.deceased.name))
      .replaceAll("{survivor}", firstName(input.survivor.name))
      .replaceAll("{account}", h ? label(h) : "the account");
}

function plan(
  action: RuleAction,
  scope: string,
  fill: Fill,
  dateOfDeath: string,
  accountIds: string[],
): PlannedAction {
  return {
    key: `${scope}:${action.id}`,
    action,
    label: fill(action.label),
    detail: fill(action.detail),
    due: action.deadline ? resolveDeadline(action.deadline.anchor, dateOfDeath) : undefined,
    accountIds,
  };
}

/** Works out what happens to every account for one death. */
export function settlementPlan(input: SettlementInput, book: Rulebook = rulebook): SettlementPlan {
  // 1. Context: the deceased is marked as such (idempotent).
  const members = input.members.map<ClientMember>((m) =>
    m.name === input.deceased.name && m.status !== "Deceased"
      ? { ...m, status: "Deceased", died: m.died ?? input.deceased.dateOfDeath }
      : m,
  );
  const ctx: DerivationContext = {
    deceased: input.deceased,
    survivor: input.survivor,
    members,
    state: input.state,
  };
  const dod = input.deceased.dateOfDeath;
  const sourcesUsed: string[] = [];
  const cite = (ids: string[]) =>
    ids.forEach((id) => sourcesUsed.includes(id) || sourcesUsed.push(id));

  // 2–6. One plan per holding the decedent was involved in.
  const accounts: AccountPlan[] = [];
  for (const h of input.holdings) {
    const facts = deriveAccountFacts(h, ctx);
    const { outcome, trace } = walk(facts, book);
    if (outcome.route === "not-affected") continue;
    const fill = filler(input, h);
    const values = plainValues(facts);

    const matched = book.overlays.filter(
      (ov) => (!ov.routes || ov.routes.includes(outcome.route)) && holds(ov.when, values),
    );
    const openQuestions: OpenQuestion[] = [];
    for (const ov of matched)
      for (const ask of ov.asks ?? [])
        if (ALWAYS_ASK_OVERLAYS.includes(ov.id) || facts[ask.fact].value === "unknown")
          openQuestions.push({
            key: `${h.id}:${ov.id}`,
            question: fill(ask.question),
            accountIds: [h.id],
          });

    const assumptions = accountAssumptions(h, facts, ctx);
    let passesToNames: string[] = [];
    switch (outcome.passesTo) {
      case "surviving-owners":
        passesToNames = h.owners.filter(
          (o) =>
            o !== input.deceased.name && members.find((m) => m.name === o)?.status !== "Deceased",
        );
        break;
      case "beneficiaries":
        passesToNames = beneficiaryTakers(h, ctx).names;
        break;
      case "successor-trustee":
        passesToNames = h.owners.filter(
          (o) =>
            o !== input.deceased.name && members.find((m) => m.name === o)?.status !== "Deceased",
        );
        if (!passesToNames.length)
          openQuestions.push({
            key: `${h.id}:successor-trustee`,
            question: "Who is the successor trustee named in the trust instrument?",
            accountIds: [h.id],
          });
        break;
      case "successor-owner":
        passesToNames = h.successorOwner ? [h.successorOwner] : [];
        if (!h.successorOwner)
          openQuestions.push({
            key: `${h.id}:successor-owner`,
            question: fill("Who should own {account} now?"),
            accountIds: [h.id],
          });
        break;
      case "estate":
        passesToNames = [`Estate of ${input.deceased.name}`];
        break;
    }

    const actionIds = uniq([...outcome.actions, ...matched.flatMap((ov) => ov.actions)]);
    const actions = actionIds.map((id) => plan(book.actions[id], h.id, fill, dod, [h.id]));

    trace.forEach((t) => cite(t.sources));
    cite(outcome.sources);
    matched.forEach((ov) => cite(ov.sources));
    actions.forEach((a) => cite(a.action.sources));

    accounts.push({
      holding: h,
      facts,
      outcome,
      title: fill(outcome.title),
      summary: fill(outcome.summary),
      plain: fill(outcome.plain),
      passesToNames,
      trace: trace.map((t) => ({ ...t, question: fill(t.question), answer: fill(t.answer) })),
      overlays: matched.map((ov) => ({ ...ov, detail: fill(ov.detail) })),
      actions,
      assumptions,
      openQuestions,
      review: orderReview([...outcome.review, ...matched.flatMap((ov) => ov.review ?? [])]),
      attention: matched.some((ov) => ov.attention),
      sources: uniq([
        ...trace.flatMap((t) => t.sources),
        ...outcome.sources,
        ...matched.flatMap((ov) => ov.sources),
        ...actions.flatMap((a) => a.action.sources),
      ]),
    });
  }

  // 7. Household rules, once per death.
  const hh = deriveHouseholdFacts(ctx, accounts);
  const hhValues = plainValues(hh.facts);
  const hhFill = filler(input);
  const household: HouseholdItem[] = [];
  const hhQuestions: OpenQuestion[] = [];
  for (const rule of book.household) {
    if (!holds(rule.when, hhValues)) continue;
    household.push({
      rule,
      detail: hhFill(rule.detail),
      actions: rule.actions.map((id) => plan(book.actions[id], "household", hhFill, dod, [])),
    });
    for (const ask of rule.asks ?? [])
      if (hh.facts[ask.fact].value === "unknown")
        hhQuestions.push({
          key: `household:${rule.id}`,
          question: hhFill(ask.question),
          accountIds: [],
        });
    cite(rule.sources);
    rule.actions.forEach((id) => cite(book.actions[id].sources));
  }

  // 8. Deadlines: one per action and date, listing every account it applies to.
  const dated = new Map<string, PlannedAction>();
  for (const a of [...accounts.flatMap((p) => p.actions), ...household.flatMap((x) => x.actions)]) {
    if (!a.due) continue;
    const k = `${a.action.id}@${a.due}`;
    const seen = dated.get(k);
    dated.set(k, seen ? { ...seen, accountIds: uniq([...seen.accountIds, ...a.accountIds]) } : a);
  }
  const deadlines = [...dated.values()].sort(
    (a, b) =>
      a.due!.localeCompare(b.due!) ||
      KIND_ORDER.indexOf(a.action.deadline!.kind) - KIND_ORDER.indexOf(b.action.deadline!.kind) ||
      a.label.localeCompare(b.label),
  );

  // Open questions: the same question on several accounts is asked once.
  const openQuestions: OpenQuestion[] = [];
  for (const q of [...accounts.flatMap((p) => p.openQuestions), ...hhQuestions]) {
    const seen = openQuestions.find((x) => x.question === q.question);
    if (seen) seen.accountIds = uniq([...seen.accountIds, ...q.accountIds]);
    else openQuestions.push({ ...q, accountIds: [...q.accountIds] });
  }

  // 9. Review queue.
  const reviewQueue: ReviewItem[] = [
    ...accounts
      .filter((p) => p.review.length)
      .map((p) => ({
        key: p.holding.id,
        label: `${label(p.holding)}: ${p.title}`,
        levels: p.review,
      })),
    ...household
      .filter((x) => x.rule.review?.length)
      .map((x) => ({
        key: `household:${x.rule.id}`,
        label: x.rule.title,
        levels: orderReview(x.rule.review!),
      })),
  ];

  // 10. Totals.
  const totals: SettlementTotals = {
    outsideProbate: 0,
    uninterrupted: 0,
    probate: 0,
    debts: 0,
    heldOutsidePnc: 0,
    needsReview: 0,
  };
  for (const { holding: h, outcome } of accounts) {
    if (outcome.route === "designation-update") continue; // not the decedent's
    if (outcome.route === "closes-estate-pays") totals.debts += h.value;
    else if (h.external) totals.heldOutsidePnc += h.value;
    else if (outcome.probate) totals.probate += h.value;
    else if (outcome.route === "needs-review") totals.needsReview += h.value;
    else {
      totals.outsideProbate += h.value;
      if (outcome.survivorAccess === "uninterrupted") totals.uninterrupted += h.value;
    }
  }

  return {
    rulebookVersion: book.version,
    asOf: input.asOf,
    mode: input.mode,
    deceased: input.deceased,
    survivor: input.survivor,
    state: input.state,
    accounts,
    household,
    deadlines,
    openQuestions,
    reviewQueue,
    assumptions: uniq([
      ...(input.assumptions ?? []),
      ...accounts.flatMap((p) => p.assumptions),
      ...hh.assumptions,
    ]),
    totals,
    sourcesUsed,
  };
}

// ---------------------------------------------------------------------------
// Selectors for the UI and the assistant.

export function plansByRoute(p: SettlementPlan): Map<SettlementRoute, AccountPlan[]> {
  const out = new Map<SettlementRoute, AccountPlan[]>();
  for (const a of p.accounts) out.set(a.outcome.route, [...(out.get(a.outcome.route) ?? []), a]);
  return out;
}

/** Deadlines due from `fromIso` (inclusive) through the next `days` days. */
export function nextDeadlines(p: SettlementPlan, fromIso: string, days: number): PlannedAction[] {
  return p.deadlines.filter((d) => {
    const n = daysBetween(fromIso, d.due!);
    return n >= 0 && n <= days;
  });
}

/** Account plans ordered for display: probate first, then needs review, then by value. */
export function displayOrder(accounts: AccountPlan[]): AccountPlan[] {
  const rank = (a: AccountPlan) =>
    a.outcome.probate ? 0 : a.outcome.route === "needs-review" ? 1 : 2;
  return [...accounts].sort((a, b) => rank(a) - rank(b) || b.holding.value - a.holding.value);
}
