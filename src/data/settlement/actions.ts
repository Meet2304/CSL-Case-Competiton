/**
 * Every step the rulebook can ask for, with who owns it and — when the law or
 * good practice sets one — a deadline anchored to the date of death. Outcomes,
 * overlays and household rules refer to these by id; tests reference the ids.
 * `{decedent}`, `{survivor}` and `{account}` are filled in by the engine.
 */
import type { RuleAction } from "@/data/types";

const list: RuleAction[] = [
  {
    id: "flag-death",
    label: "Flag the death on every account",
    detail:
      "Operations records the date of death on each of {decedent}'s accounts so fraud monitoring and statements change.",
    owner: "bank-operations",
    sources: ["pnc-death-claims"],
  },
  {
    id: "death-certificate",
    label: "Collect a certified death certificate",
    detail: "One certified copy is kept with the claim; suggest {survivor} orders several.",
    owner: "client",
    sources: ["pnc-death-claims"],
  },
  {
    id: "retitle-joint",
    label: "Retitle {account} to {survivor}",
    detail:
      "The surviving owner already owns the money; retitling removes {decedent}'s name. Keep the account number where possible so autopays keep working.",
    owner: "bank-operations",
    sources: ["pa-6304", "pnc-death-claims"],
  },
  {
    id: "pod-claim",
    label: "Submit the beneficiary claim for {account}",
    detail: "The payable-on-death beneficiary files a claim form with a death certificate and ID.",
    owner: "client",
    sources: ["pnc-death-claims"],
  },
  {
    id: "tod-claim",
    label: "Re-register {account} to the TOD beneficiaries",
    detail: "Operations moves the securities into an account in each beneficiary's name.",
    owner: "bank-operations",
    sources: ["pa-ch64"],
  },
  {
    id: "record-basis",
    label: "Record date-of-death values for the new cost basis",
    detail:
      "Capture each position's value on the date of death before anything is sold, so the stepped-up basis is on file.",
    owner: "advisor",
    sources: ["irc-1014"],
  },
  {
    id: "spousal-election",
    label: "Help {survivor} choose: treat as own IRA or keep as inherited",
    detail:
      "Treating it as their own is simplest; keeping it inherited allows penalty-free withdrawals before 59½. There's no statutory deadline for the choice.",
    owner: "advisor",
    sources: ["irs-pub-590b", "rmd-final-regs-2024"],
  },
  {
    id: "inherited-setup",
    label: "Open an inherited IRA for each beneficiary",
    detail: "Each beneficiary gets an account titled as inherited from {decedent}.",
    owner: "bank-operations",
    sources: ["irs-pub-590b"],
  },
  {
    id: "separate-accounts",
    label: "Split into separate inherited IRAs",
    detail:
      "With more than one beneficiary, separate accounts let each follow their own distribution rules.",
    owner: "bank-operations",
    deadline: {
      anchor: { from: "dec-31", yearsAfterDeath: 1 },
      kind: "recommended",
      label: "Separate accounts for each beneficiary",
    },
    sources: ["irs-pub-590b"],
  },
  {
    id: "yod-rmd",
    label: "Confirm {decedent}'s year-of-death RMD was taken",
    detail:
      "If {decedent} hadn't taken this year's required withdrawal, the beneficiary takes it — by their tax-filing deadline (with extensions) or, if later, by this date.",
    owner: "advisor",
    deadline: {
      anchor: { from: "dec-31", yearsAfterDeath: 1 },
      kind: "statutory",
      label: "Latest date to take a missed year-of-death RMD",
    },
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "annual-rmds",
    label: "Schedule annual RMDs in years 1–9",
    detail:
      "{decedent} had reached the required beginning date, so beneficiaries take a withdrawal every year as well as emptying the account within 10 years.",
    owner: "advisor",
    deadline: {
      anchor: { from: "dec-31", yearsAfterDeath: 1 },
      kind: "statutory",
      label: "First annual RMD for beneficiaries",
    },
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "ten-year-end",
    label: "Empty the inherited IRA by the 10-year deadline",
    detail: "Plan withdrawals across the years to spread the income tax.",
    owner: "advisor",
    deadline: {
      anchor: { from: "dec-31", yearsAfterDeath: 10 },
      kind: "statutory",
      label: "10-year rule: account must be emptied",
    },
    sources: ["rmd-final-regs-2024"],
  },
  {
    id: "minor-custodian",
    label: "Arrange a custodian or trust for the minor beneficiary",
    detail: "A minor can't take the assets outright; a custodian or trust holds them.",
    owner: "attorney",
    sources: ["rmd-minor-child"],
  },
  {
    id: "trust-certification",
    label: "Request a certification of trust naming {survivor} as successor trustee",
    detail: "Lets the bank update the trustees without reading the full trust document.",
    owner: "trust-officer",
    sources: ["pa-7790-3"],
  },
  {
    id: "trust-first-death",
    label: "Review the trust's first-death provisions before moving assets",
    detail: "Some trusts split into separate shares at the first death.",
    owner: "attorney",
    sources: ["pa-7790-3"],
  },
  {
    id: "successor-owner",
    label: "Confirm the 529's successor owner",
    detail: "Check the plan's records for a successor owner and update the account owner.",
    owner: "bank-operations",
    sources: ["plan-529"],
  },
  {
    id: "close-card",
    label: "Close {account} to new charges and stop autopays",
    detail: "Family members aren't personally responsible for an individual card.",
    owner: "bank-operations",
    sources: ["cfpb-1026-11c"],
  },
  {
    id: "card-balance-to-executor",
    label: "Give the executor the balance on request (within 30 days)",
    detail: "No new fees or rate increases after the request.",
    owner: "bank-operations",
    sources: ["cfpb-1026-11c"],
  },
  {
    id: "insurer-claim",
    label: "Start the claim with the insurer",
    detail: "The beneficiary sends the insurer a claim form and a certified death certificate.",
    owner: "client",
    sources: ["pnc-death-claims"],
  },
  {
    id: "letters",
    label: "Executor obtains letters from the Register of Wills",
    detail: "Letters give the executor authority to act for {decedent}'s estate.",
    owner: "executor",
    sources: ["pa-register-of-wills"],
  },
  {
    id: "estate-ein",
    label: "Get an EIN for the estate",
    detail: "The estate needs its own tax ID before an estate account can be opened.",
    owner: "executor",
    sources: ["irs-1041"],
  },
  {
    id: "estate-account",
    label: "Open an estate account once letters are issued",
    detail: "Probate assets are collected here and paid out under the will.",
    owner: "bank-operations",
    sources: ["pnc-death-claims"],
  },
  {
    id: "form-56",
    label: "File Form 56 (notice of fiduciary relationship)",
    detail: "Tells the IRS who is acting for {decedent}.",
    owner: "executor",
    sources: ["irs-pub-559"],
  },
  {
    id: "form-1041",
    label: "File Form 1041 if estate income exceeds $600",
    detail: "Interest and dividends earned after the death are the estate's income.",
    owner: "tax-advisor",
    sources: ["irs-1041"],
  },
  {
    id: "final-1040",
    label: "File {decedent}'s final income tax return",
    detail: "Covers income from January 1 to the date of death.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "apr-15", yearsAfterDeath: 1 },
      kind: "statutory",
      label: "Final individual return due",
    },
    sources: ["irs-pub-559"],
  },
  {
    id: "portability",
    label: "Consider filing Form 706 to elect portability for {survivor}",
    detail:
      "Even when no estate tax is owed, a timely return passes {decedent}'s unused exclusion to {survivor}.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 9 },
      kind: "opportunity",
      label: "Portability election (timely 706)",
    },
    sources: ["irs-706-instr"],
  },
  {
    id: "portability-late",
    label: "Late portability election window closes",
    detail: "Estates not otherwise required to file can still elect portability until this date.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 60 },
      kind: "opportunity",
      label: "Last date for a late portability election (Rev. Proc. 2022-32)",
    },
    sources: ["irs-706-instr"],
  },
  {
    id: "form-706",
    label: "File Form 706 (estate tax return)",
    detail: "Required when the gross estate is above the basic exclusion amount.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 9 },
      kind: "statutory",
      label: "Estate tax return due",
    },
    sources: ["irs-706-instr", "irs-estate-whats-new"],
  },
  {
    id: "pa-it-discount",
    label: "Pay PA inheritance tax early for the 5% discount",
    detail: "A tax professional decides what's taxable and at which rate.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 3 },
      kind: "opportunity",
      label: "PA inheritance tax 5% discount ends",
    },
    sources: ["pa-inheritance-tax"],
  },
  {
    id: "pa-it-return",
    label: "File the PA inheritance tax return",
    detail: "Tax not paid by this date is delinquent and accrues interest.",
    owner: "tax-advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 9 },
      kind: "statutory",
      label: "PA inheritance tax due",
    },
    sources: ["pa-inheritance-tax"],
  },
  {
    id: "pa-small-estate",
    label: "Ask the attorney whether a small-estate petition applies",
    detail: "May avoid full probate when the personal property is small.",
    owner: "attorney",
    sources: ["pa-3102"],
  },
  {
    id: "pa-3101b",
    label: "Pay up to $20,000 of deposits to family on a funeral bill, without letters",
    detail: "Operations confirms the total across {decedent}'s deposits and the payee's priority.",
    owner: "bank-operations",
    sources: ["pa-3101", "pa-act50-2025"],
  },
  {
    id: "fdic-review",
    label: "Re-check deposit insurance coverage before the grace period ends",
    detail:
      "{account} is insured as if {decedent} were alive for six months; after that coverage follows the new owners.",
    owner: "advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 6 },
      kind: "recommended",
      label: "FDIC 6-month grace period ends",
    },
    sources: ["fdic-330-3j"],
  },
  {
    id: "cd-penalty-waiver",
    label: "Apply the CD early-withdrawal penalty waiver if {survivor} wants the cash",
    detail: "There's no need to wait for maturity.",
    owner: "bank-operations",
    sources: ["pnc-cd-agreement"],
  },
  {
    id: "reclamation-watch",
    label: "Watch for federal benefit deposits made after the death",
    detail: "Payments received after the bank learns of the death are returned to the agency.",
    owner: "bank-operations",
    sources: ["treas-210"],
  },
  {
    id: "ssa-lump-sum",
    label: "Remind {survivor} to claim the $255 SSA lump-sum payment",
    detail: "A surviving spouse applies to Social Security.",
    owner: "advisor",
    deadline: {
      anchor: { from: "date-of-death", months: 24 },
      kind: "statutory",
      label: "SSA lump-sum application deadline",
    },
    sources: ["ssa-lump-sum"],
  },
  {
    id: "update-designation",
    label: "Send {survivor} a new beneficiary form for {account}",
    detail: "The designation names {decedent}, who has died.",
    owner: "advisor",
    sources: ["irs-pub-590b", "pnc-death-claims"],
  },
  {
    id: "ops-review",
    label: "Operations confirms the titling and the right process",
    detail: "The rulebook doesn't model this combination; a person decides.",
    owner: "bank-operations",
    sources: ["pnc-death-claims"],
  },
  {
    id: "attorney-review",
    label: "Estate attorney confirms how this passes under state law",
    detail: "Nothing moves until the attorney confirms.",
    owner: "attorney",
    sources: ["pa-register-of-wills"],
  },
];

export const actions: Record<string, RuleAction> = Object.fromEntries(list.map((a) => [a.id, a]));
