/**
 * State and rules for the guided tour (`/tour`). The tour is a scripted demo,
 * but what the viewer clicks carries forward: naming a beneficiary before the
 * loss changes what passes to Wife after it. Everything shown is derived here
 * from that state, so the visuals never disagree with each other.
 */
import {
  accountLabel,
  benefitsQuestion,
  claimSteps,
  glanceGroups,
  husbandAccountIds,
  initialChildAccess,
  sharedAccountIds,
  tourAccounts,
  tourSteps,
  type ChildId,
  type ClaimStepId,
  type FindoeQuestionId,
  type TourAccountId,
  type TourChapterId,
} from "@/data/tour";

export type BenefitsAnswer = "yes" | "no" | "unsure";

export type TourState = {
  /** Husband named Wife on Savings x0002 before the loss. */
  beneficiaryNamed: boolean;
  childAccess: Record<ChildId, TourAccountId[]>;
  previewAs: ChildId;
  /** Bank Advisor plan steps marked done, by id. */
  planDone: string[];
  benefits?: BenefitsAnswer;
  claimDone: ClaimStepId[];
  claimSent: boolean;
};

export const initialTourState: TourState = {
  beneficiaryNamed: false,
  childAccess: initialChildAccess,
  previewAs: "child1",
  planDone: [],
  claimDone: [],
  claimSent: false,
};

export type TourAction =
  | { type: "go"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "restart" }
  | { type: "nameBeneficiary" }
  | { type: "toggleAccess"; child: ChildId; account: TourAccountId }
  | { type: "previewAs"; child: ChildId }
  | { type: "togglePlanStep"; id: string }
  | { type: "answerBenefits"; answer: BenefitsAnswer }
  | { type: "toggleClaimStep"; id: ClaimStepId }
  | { type: "sendClaim" };

/** Keeps a step number inside the script. */
export const clampStep = (n: number) => Math.min(Math.max(n, 0), tourSteps.length - 1);

const toggle = <T>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    // Which step is showing lives in the URL hash (see GuidedTour), not here.
    case "go":
    case "next":
    case "back":
      return state;
    case "restart":
      return initialTourState;
    case "nameBeneficiary":
      return { ...state, beneficiaryNamed: true };
    case "toggleAccess":
      return {
        ...state,
        childAccess: {
          ...state.childAccess,
          [action.child]: toggle(state.childAccess[action.child], action.account),
        },
      };
    case "previewAs":
      return { ...state, previewAs: action.child };
    case "togglePlanStep":
      return { ...state, planDone: toggle(state.planDone, action.id) };
    case "answerBenefits":
      return { ...state, benefits: action.answer };
    case "toggleClaimStep":
      // A claim that has been sent is with the bank and can no longer be changed.
      return state.claimSent ? state : { ...state, claimDone: toggle(state.claimDone, action.id) };
    case "sendClaim":
      // A claim can only be sent once every step is done.
      return { ...state, claimSent: state.claimDone.length === claimSteps.length };
  }
}

/** Index of the step with this id, or -1. */
export const stepIndex = (id: string) => tourSteps.findIndex((s) => s.id === id);

/** Index of the first step of a chapter. */
export const chapterStart = (chapter: TourChapterId) =>
  tourSteps.findIndex((s) => s.chapter === chapter);

// ---------------------------------------------------------------------------
// What happens to each of Husband's accounts

export type RouteOutcome = "direct" | "estate" | "outside";

export type TourRoute = {
  account: TourAccountId;
  outcome: RouteOutcome;
  /** Why it goes there, in two or three words. */
  reason: string;
  /** How long the bank's review usually takes, when Wife claims it at PNC. */
  review?: string;
  /** Ids in `rulebook.sources`. */
  sources: string[];
};

export function routesFor(state: Pick<TourState, "beneficiaryNamed">): TourRoute[] {
  return [
    {
      account: "joint",
      outcome: "direct",
      reason: "Joint owner",
      review: "1 to 3 business days",
      sources: ["pa-6304"],
    },
    {
      account: "ira",
      outcome: "direct",
      reason: "Named beneficiary",
      review: "2 to 3 weeks",
      sources: ["irs-pub-590b"],
    },
    state.beneficiaryNamed
      ? {
          account: "savings",
          outcome: "direct",
          reason: "Named beneficiary",
          review: "1 to 3 business days",
          sources: ["pa-6304"],
        }
      : {
          account: "savings",
          outcome: "estate",
          reason: "No beneficiary",
          sources: ["pa-register-of-wills"],
        },
    {
      account: "brokerage",
      outcome: "estate",
      reason: "No beneficiary",
      sources: ["pa-register-of-wills"],
    },
    { account: "life", outcome: "outside", reason: "Paid by the insurer", sources: [] },
    {
      account: "teenSavings",
      outcome: "direct",
      reason: "New custodian",
      review: "1 to 3 business days",
      sources: ["pnc-death-claims"],
    },
    { account: "card", outcome: "estate", reason: "Card closes", sources: ["cfpb-1026-11c"] },
  ];
}

const sum = (ids: TourAccountId[]) => ids.reduce((t, id) => t + tourAccounts[id].balance, 0);

/** The headline figures: Husband's own money at PNC that passes directly, and through the estate. */
export function settlementSplit(state: Pick<TourState, "beneficiaryNamed">) {
  const routes = routesFor(state);
  const owned = (outcome: RouteOutcome) =>
    routes
      .filter((r) => r.outcome === outcome && husbandAccountIds.includes(r.account))
      .map((r) => r.account);
  return {
    direct: sum(owned("direct")),
    estate: sum(owned("estate")),
    outside: sum(owned("outside")),
    /** Accounts Wife can act on: everything except what the estate handles. */
    toWife: routes.filter((r) => r.outcome !== "estate"),
    viaEstate: routes.filter((r) => r.outcome === "estate"),
  };
}

/** Husband's money at PNC by kind, the total, and the total after what he owes on cards. */
export function husbandMoney() {
  const groups = glanceGroups.map((g) => ({ ...g, total: sum(g.ids) }));
  const assets = groups.reduce((t, g) => t + g.total, 0);
  return { groups, assets, net: assets + tourAccounts.card.balance };
}

/** Who inherits each account Husband leaves, as he sees it before the loss. */
export function beneficiaryOf(
  state: Pick<TourState, "beneficiaryNamed">,
  account: TourAccountId,
): "wife" | undefined {
  return routesFor(state).find((r) => r.account === account)?.outcome === "estate"
    ? undefined
    : "wife";
}

// ---------------------------------------------------------------------------
// Family dashboard

/** Shared accounts a child can see, in dashboard order. */
export function visibleTo(state: Pick<TourState, "childAccess">, child: ChildId) {
  return sharedAccountIds.filter((id) => state.childAccess[child].includes(id));
}

// ---------------------------------------------------------------------------
// Bank Advisor plan

export type PlanStep = {
  id: string;
  title: string;
  when: string;
  /** A short line of guidance under the title. */
  note?: string;
  /** The rulebook is waiting on the Bank Advisor for a fact. */
  needsAnswer?: boolean;
};

export function advisorPlan(state: Pick<TourState, "beneficiaryNamed" | "benefits">): PlanStep[] {
  const steps: PlanStep[] = [
    {
      id: "condolences",
      title: "Call Wife to offer condolences",
      when: "Today",
      note: "Lead with care. No account talk unless she raises it.",
    },
    {
      id: "certificate",
      title: "Flag the death and request the death certificate",
      when: "Today",
    },
    { id: "proceed", title: "Ask Wife how she wants to proceed", when: "This week" },
    { id: "retitle", title: `Retitle ${accountLabel("joint")} to Wife`, when: "This week" },
    { id: "ira", title: "Open the IRA claim with Wife", when: "When she is ready" },
    { id: "estate", title: "Introduce the estate attorney", when: "This month" },
  ];
  if (state.benefits === "yes") {
    steps.push({
      id: "benefits",
      title: "Return federal benefit payments received after the death",
      when: "This week",
    });
  } else if (state.benefits !== "no") {
    steps.push({
      id: "benefits",
      title: benefitsQuestion,
      when: "Needs your answer",
      needsAnswer: true,
    });
  }
  return steps;
}

/** What Findoe says back once the Bank Advisor answers the benefits question. */
export function benefitsReply(answer: BenefitsAnswer): string {
  if (answer === "yes")
    return "Noted. I added a step to the plan: return any federal benefit payment received after the death.";
  if (answer === "no")
    return "Noted. There is nothing to return, so I removed that step from the plan.";
  return "That is fine. I will keep the cautious assumption and leave the question open in the plan.";
}

// ---------------------------------------------------------------------------
// Findoe's answers to Wife

export type FindoeAnswer = {
  /** The bank record the answer rests on. */
  record: string;
  /** The law it rests on: an id in `rulebook.sources`. */
  lawSourceId: string;
  /** Short sentences; "[1]" cites the record and "[2]" the law. */
  sentences: string[];
};

export function findoeAnswer(
  question: FindoeQuestionId,
  state: Pick<TourState, "beneficiaryNamed">,
): FindoeAnswer {
  if (question === "claim-ira") {
    return {
      record: accountLabel("ira"),
      lawSourceId: "irs-pub-590b",
      sentences: [
        "It passes to you because Husband named you as the beneficiary [1].",
        "As his spouse, you can treat it as your own or keep it as an inherited account [2].",
        "The claim is five short steps, and review usually takes 2 to 3 weeks.",
      ],
    };
  }
  return state.beneficiaryNamed
    ? {
        record: accountLabel("savings"),
        lawSourceId: "pa-6304",
        sentences: [
          "It passes directly to you, because Husband named you as its beneficiary [1] [2].",
          "It is in your list with a short claim. There is no rush.",
        ],
      }
    : {
        record: accountLabel("savings"),
        lawSourceId: "pa-register-of-wills",
        sentences: [
          "It has no beneficiary on file [1], so it is settled through Husband's estate.",
          "The person the Register of Wills appoints for the estate collects it [2].",
          "There is nothing for you to do today.",
        ],
      };
}
