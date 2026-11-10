/**
 * MOCK DATA and script for the guided tour (`/tour`): a short walk through one
 * family's story that shows the problem and what Findoe does about it.
 * Balances come from the shared household so the tour and the prototype never
 * disagree. People are named by role only (Husband, Wife, Child 1, Child 2,
 * Bank Advisor); the tour introduces no other names.
 */
import { accounts } from "./household";
import type { AvatarLook } from "./types";

// ---------------------------------------------------------------------------
// People

export type TourPersonId = "husband" | "wife" | "child1" | "child2" | "advisor";

export const tourPeople: Record<
  TourPersonId,
  { id: TourPersonId; name: string; look?: AvatarLook }
> = {
  husband: { id: "husband", name: "Husband", look: "husband" },
  wife: { id: "wife", name: "Wife", look: "wife" },
  child1: { id: "child1", name: "Child 1", look: "teen" },
  child2: { id: "child2", name: "Child 2", look: "child" },
  advisor: { id: "advisor", name: "Bank Advisor" },
};

export const familyIds: TourPersonId[] = ["husband", "wife", "child1", "child2"];

export type ChildId = "child1" | "child2";
export const childIds: ChildId[] = ["child1", "child2"];

// ---------------------------------------------------------------------------
// Accounts

export type TourAccountId =
  | "joint"
  | "savings"
  | "ira"
  | "brokerage"
  | "card"
  | "life"
  | "wifeSavings"
  | "wifeRoth"
  | "studentChecking"
  | "teenSavings";

export type TourAccount = {
  id: TourAccountId;
  name: string;
  last4?: string;
  balance: number;
  /** Held at another institution (the life policy). */
  external?: boolean;
};

const householdIds: Record<TourAccountId, string> = {
  joint: "acct-joint-checking",
  savings: "acct-jordan-savings",
  ira: "acct-jordan-ira",
  brokerage: "acct-jordan-brokerage",
  card: "acct-jordan-card",
  life: "acct-jordan-life",
  wifeSavings: "acct-casey-savings",
  wifeRoth: "acct-casey-roth",
  studentChecking: "acct-avery-checking",
  teenSavings: "acct-riley-savings",
};

function build(id: TourAccountId): TourAccount {
  const source = accounts.find((a) => a.id === householdIds[id]);
  if (!source) throw new Error(`Tour account ${id} is missing from the household`);
  return {
    id,
    name: id === "teenSavings" ? "Child 2's Teen Savings" : source.name,
    last4: source.last4,
    balance: source.balance,
    external: source.external,
  };
}

export const tourAccounts = Object.fromEntries(
  (Object.keys(householdIds) as TourAccountId[]).map((id) => [id, build(id)]),
) as Record<TourAccountId, TourAccount>;

/** "Savings x0002"; the life policy has no number. */
export function accountLabel(id: TourAccountId): string {
  const a = tourAccounts[id];
  return a.last4 ? `${a.name} x${a.last4}` : a.name;
}

/** Husband's money at PNC, by kind. */
export const glanceGroups: { label: string; ids: TourAccountId[]; tone: string }[] = [
  { label: "Cash", ids: ["joint", "savings"], tone: "bg-pnc-blue-600" },
  { label: "Retirement", ids: ["ira"], tone: "bg-pnc-navy" },
  { label: "Investments", ids: ["brokerage"], tone: "bg-pnc-orange" },
];

/** The accounts Husband leaves, in the order the tour lists them. */
export const husbandAccountIds: TourAccountId[] = ["joint", "ira", "savings", "brokerage", "life"];

/** Accounts shared into the family dashboard. */
export const sharedAccountIds: TourAccountId[] = [
  "joint",
  "savings",
  "wifeSavings",
  "brokerage",
  "ira",
  "wifeRoth",
  "life",
];

/** Each child's own account. */
export const ownAccount: Record<ChildId, TourAccountId> = {
  child1: "studentChecking",
  child2: "teenSavings",
};

/** What each child can see when the tour starts. */
export const initialChildAccess: Record<ChildId, TourAccountId[]> = {
  child1: ["joint"],
  child2: [],
};

// ---------------------------------------------------------------------------
// Wife's claim for the IRA

export type ClaimStepId = "certificate" | "form" | "identity" | "receive" | "withholding";

export const claimSteps: { id: ClaimStepId; title: string; note: string }[] = [
  { id: "certificate", title: "Death certificate", note: "Upload once, reused for every claim" },
  { id: "form", title: "Beneficiary claim form", note: "Filled in for you" },
  { id: "identity", title: "Photo ID and tax details", note: "Filled in from your profile" },
  { id: "receive", title: "How to receive it", note: "Your choice" },
  { id: "withholding", title: "Tax withholding", note: "Your choice" },
];

// ---------------------------------------------------------------------------
// Findoe

export type FindoeQuestionId = "claim-ira" | "savings";

export const findoeQuestions: Record<FindoeQuestionId, string> = {
  "claim-ira": "How do I claim the 401(k) Rollover IRA?",
  savings: "What happens to Savings x0002?",
};

/** The rulebook's path for the IRA, as the Bank Advisor sees it. */
export const iraDecisionPath: { question: string; answer: string }[] = [
  { question: "Husband's role", answer: "Sole owner" },
  { question: "Account type", answer: "IRA" },
  { question: "Beneficiary named", answer: "Yes" },
  { question: "Beneficiary", answer: "Surviving spouse" },
];
export const iraOutcome = "Wife chooses how to take over the IRA";

export const benefitsQuestion =
  "Did Husband receive Social Security or other federal benefits by direct deposit?";

// ---------------------------------------------------------------------------
// The script

export type TourChapterId = "problem" | "before" | "advisor" | "widow" | "findoe" | "close";

export const tourChapters: { id: TourChapterId; label: string }[] = [
  { id: "problem", label: "The problem" },
  { id: "before", label: "Before a loss" },
  { id: "advisor", label: "The day it happens" },
  { id: "widow", label: "After the loss" },
  { id: "findoe", label: "Findoe AI" },
  { id: "close", label: "Summary" },
];

export type TourVisualId =
  | "family"
  | "today"
  | "one-view"
  | "gaps"
  | "sharing"
  | "preview"
  | "notice"
  | "plan"
  | "transfer"
  | "condolence"
  | "unclaimed"
  | "claim"
  | "ask"
  | "tree"
  | "asks"
  | "close";

/** One step: a headline, one plain sentence and one visual. The presenter says the rest. */
export type TourStep = {
  /** Also the step's URL hash and the visual it shows. */
  id: TourVisualId;
  chapter: TourChapterId;
  title: string;
  body: string;
  /** Something the viewer can click on this step. */
  tryIt?: string;
};

export const tourSteps: TourStep[] = [
  {
    id: "family",
    chapter: "problem",
    title: "One person holds the whole picture",
    body: "Husband manages the family's money. He is also the only one the Bank Advisor knows.",
  },
  {
    id: "today",
    chapter: "problem",
    title: "When he dies, three things break",
    body: "Each one is a reason for the family to move its money to another bank.",
  },
  {
    id: "one-view",
    chapter: "before",
    title: "Every asset in one view",
    body: "Husband sees everything he owns, including the life policy he holds outside PNC.",
  },
  {
    id: "gaps",
    chapter: "before",
    title: "Gaps are found early",
    body: "Two accounts have no beneficiary. Naming Wife now keeps the account out of probate later.",
    tryIt: "Select Name Wife.",
  },
  {
    id: "sharing",
    chapter: "before",
    title: "The whole family, inside the bank",
    body: "Husband shares his accounts with the family and decides who sees each one.",
    tryIt: "Select a circle under Child 1 or Child 2.",
  },
  {
    id: "preview",
    chapter: "before",
    title: "The children are already customers",
    body: "Each child has a login and sees only what the family shares with them.",
    tryIt: "Switch between Child 1 and Child 2.",
  },
  {
    id: "notice",
    chapter: "advisor",
    title: "The Bank Advisor knows right away",
    body: "When the bank records the death, the Bank Advisor is told and a plan is ready.",
  },
  {
    id: "plan",
    chapter: "advisor",
    title: "A plan that starts with condolences",
    body: "People come first. The account work follows at Wife's pace.",
    tryIt: "Tick a step.",
  },
  {
    id: "transfer",
    chapter: "advisor",
    title: "A transfer plan for every account",
    body: "Each account shows where it goes and the law behind it.",
  },
  {
    id: "condolence",
    chapter: "widow",
    title: "Wife is met with care",
    body: "The first screen has no forms and no deadlines. There is one link, for when she is ready.",
  },
  {
    id: "unclaimed",
    chapter: "widow",
    title: "One list of everything he left",
    body: "Each account that passes to Wife is listed with the reason. The estate handles the rest.",
  },
  {
    id: "claim",
    chapter: "widow",
    title: "Each claim is a short checklist",
    body: "The forms are filled in for her, and the death certificate is uploaded once.",
    tryIt: "Select each step, then send the claim.",
  },
  {
    id: "ask",
    chapter: "findoe",
    title: "Answers from her records and the law",
    body: "Findoe shows where every answer comes from.",
    tryIt: "Ask the second question.",
  },
  {
    id: "tree",
    chapter: "findoe",
    title: "Same facts, same answer",
    body: "Fixed rules decide what happens to each account. The AI only explains the result.",
  },
  {
    id: "asks",
    chapter: "findoe",
    title: "When unsure, Findoe asks",
    body: "It never guesses a fact it cannot see.",
    tryIt: "Answer the question.",
  },
  {
    id: "close",
    chapter: "close",
    title: "Clarity for families. Context for advisors.",
    body: "The family stays with PNC because it was already there.",
  },
];
