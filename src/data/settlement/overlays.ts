/**
 * Rules layered on top of an account's outcome when their conditions match:
 * thresholds, tax opportunities and extra checks. Evaluated in this order.
 */
import type { Overlay } from "@/data/types";

export const overlays: Overlay[] = [
  {
    id: "ov.fdic-grace",
    title: "FDIC six-month grace period",
    routes: ["survivorship", "beneficiary-claim", "probate"],
    when: [
      { fact: "accountClass", in: ["deposit", "cd"] },
      { fact: "value", gt: 250_000 },
    ],
    detail:
      "Deposits above the standard insurance limit stay insured as if {decedent} were alive for six months. Re-check coverage before then.",
    actions: ["fdic-review"],
    review: ["advisor"],
    attention: true,
    sources: ["fdic-330-3j"],
  },
  {
    id: "ov.cd-waiver",
    title: "CD penalty waived on death",
    routes: ["survivorship", "beneficiary-claim", "probate"],
    when: [{ fact: "accountClass", eq: "cd" }],
    detail: "The early-withdrawal penalty is waived, so {survivor} needn't wait for maturity.",
    actions: ["cd-penalty-waiver"],
    sources: ["pnc-cd-agreement"],
  },
  {
    id: "ov.step-up",
    title: "Cost basis steps up",
    routes: ["survivorship", "probate"],
    when: [{ fact: "accountClass", eq: "brokerage" }],
    detail:
      "Basis generally resets to the date-of-death value. Record values before selling anything.",
    actions: ["record-basis"],
    review: ["tax-advisor"],
    sources: ["irc-1014"],
  },
  {
    id: "ov.yod-rmd",
    title: "Year-of-death required withdrawal",
    routes: ["spousal-retirement-options", "inherited-retirement", "probate"],
    when: [
      { fact: "accountClass", eq: "ira-traditional" },
      { fact: "decedentPastRequiredBeginningDate", in: ["yes", "unknown"] },
    ],
    detail:
      "If {decedent} hadn't taken this year's required withdrawal, the beneficiary takes it by their tax-filing deadline or, if later, Dec 31 of next year.",
    actions: ["yod-rmd"],
    review: ["advisor"],
    attention: true,
    asks: [
      {
        fact: "decedentPastRequiredBeginningDate",
        question: "Was {decedent} already taking required withdrawals from {account}?",
        options: [
          { value: "yes", label: "Yes, already taking them" },
          { value: "no", label: "No, not yet" },
        ],
      },
    ],
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "ov.annual-rmds",
    title: "Annual withdrawals continue",
    routes: ["inherited-retirement"],
    when: [
      { fact: "accountClass", eq: "ira-traditional" },
      { fact: "decedentPastRequiredBeginningDate", eq: "yes" },
    ],
    detail:
      "{decedent} had reached the required beginning date, so beneficiaries take a withdrawal every year in years 1–9 as well.",
    actions: ["annual-rmds"],
    review: ["advisor"],
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "ov.separate-accounts",
    title: "Separate accounts for each beneficiary",
    routes: ["inherited-retirement"],
    when: [{ fact: "beneficiaryCount", gt: 1 }],
    detail: "Splitting by Dec 31 of next year lets each beneficiary follow their own schedule.",
    actions: ["separate-accounts"],
    review: ["operations"],
    sources: ["irs-pub-590b"],
  },
  {
    id: "ov.minor-beneficiary",
    title: "A beneficiary is a minor",
    routes: ["beneficiary-claim", "insurer-claim", "inherited-retirement"],
    when: [{ fact: "anyBeneficiaryMinor", eq: "yes" }],
    detail: "A minor can't take assets outright; a custodian or trust must hold their share.",
    actions: ["minor-custodian"],
    review: ["attorney"],
    attention: true,
    sources: ["rmd-minor-child"],
  },
  {
    id: "ov.disability-check",
    title: "Check for an eligible designated beneficiary",
    routes: ["inherited-retirement"],
    // Disability is never in our records, so it's asked for every adult non-spouse heir.
    when: [
      { fact: "primaryBeneficiaryCategory", eq: "other-individual" },
      { fact: "beneficiaryDisabledOrIll", eq: "unknown" },
    ],
    detail:
      "A disabled or chronically ill beneficiary can stretch withdrawals over their lifetime instead of 10 years. Until someone confirms, the plan assumes the 10-year rule.",
    actions: [],
    asks: [
      {
        fact: "beneficiaryDisabledOrIll",
        question: "Is any beneficiary of {account} disabled or chronically ill?",
        options: [
          { value: "yes", label: "Yes, at least one is" },
          { value: "no", label: "No" },
        ],
      },
    ],
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "ov.pa-3101b",
    title: "Small deposits paid to family without letters",
    routes: ["probate"],
    when: [
      { fact: "state", eq: "PA" },
      { fact: "accountClass", in: ["deposit", "cd"] },
      { fact: "value", lte: 20_000 },
    ],
    detail:
      "Pennsylvania lets the bank pay up to $20,000 of {decedent}'s deposits to close family on a funeral bill, without waiting for letters.",
    actions: ["pa-3101b"],
    review: ["operations"],
    sources: ["pa-3101", "pa-act50-2025"],
  },
  {
    id: "ov.held-outside",
    title: "Held outside PNC",
    when: [{ fact: "heldOutsidePnc", eq: true }],
    detail: "Tracked for planning; the client handles it with the provider.",
    actions: [],
    sources: ["pnc-death-claims"],
  },
];
