/**
 * Federal household rules: evaluated once per death, not per account.
 * State packs live in ./states.
 */
import type { HouseholdRule } from "@/data/types";

export const federalHousehold: HouseholdRule[] = [
  {
    id: "hh.flag",
    jurisdiction: "US",
    title: "Record the death",
    when: [],
    detail:
      "Flag {decedent}'s accounts and collect a certified death certificate; everything else follows from this.",
    actions: ["flag-death", "death-certificate"],
    sources: ["pnc-death-claims"],
  },
  {
    id: "hh.reclamation",
    jurisdiction: "US",
    title: "Federal benefit payments after the death",
    when: [],
    detail:
      "Social Security or other federal payments that arrive after the death are returned to the agency. Warn {survivor} so it isn't a surprise.",
    actions: ["reclamation-watch"],
    review: ["operations"],
    asks: [
      {
        fact: "receivedFederalBenefits",
        question:
          "Did {decedent} receive Social Security or other federal benefits by direct deposit?",
      },
    ],
    sources: ["treas-210"],
  },
  {
    id: "hh.ssa",
    jurisdiction: "US",
    title: "Social Security lump-sum payment",
    when: [{ fact: "survivorIsSpouse", eq: true }],
    detail: "As the surviving spouse, {survivor} can apply for the one-time payment.",
    actions: ["ssa-lump-sum"],
    sources: ["ssa-lump-sum"],
  },
  {
    id: "hh.final-1040",
    jurisdiction: "US",
    title: "Final income tax return",
    when: [],
    detail: "{decedent}'s final individual return covers January 1 to the date of death.",
    actions: ["final-1040"],
    review: ["tax-advisor"],
    sources: ["irs-pub-559"],
  },
  {
    id: "hh.fiduciary",
    jurisdiction: "US",
    title: "Executor notifies the IRS",
    when: [{ fact: "executorKnown", eq: true }],
    detail: "The executor files Form 56 so the IRS knows who acts for {decedent}.",
    actions: ["form-56"],
    review: ["attorney"],
    sources: ["irs-pub-559"],
  },
  {
    id: "hh.estate-income",
    jurisdiction: "US",
    title: "Estate income tax",
    when: [{ fact: "hasProbateAssets", eq: true }],
    detail:
      "Probate assets earn income in the estate's name until they're distributed. The estate needs an EIN and may file Form 1041.",
    actions: ["estate-ein", "form-1041"],
    review: ["tax-advisor"],
    sources: ["irs-1041"],
  },
  {
    id: "hh.portability",
    jurisdiction: "US",
    title: "Portability of the unused exclusion",
    when: [
      { fact: "survivorIsSpouse", eq: true },
      { fact: "estimatedGrossEstate", lte: 15_000_000 },
    ],
    detail:
      "No federal estate tax looks likely, but filing Form 706 passes {decedent}'s unused exclusion to {survivor}. A tax advisor weighs the cost of filing.",
    actions: ["portability", "portability-late"],
    review: ["tax-advisor"],
    sources: ["irs-706-instr", "irs-estate-whats-new"],
  },
  {
    id: "hh.form-706",
    jurisdiction: "US",
    title: "Federal estate tax return",
    when: [{ fact: "estimatedGrossEstate", gt: 15_000_000 }],
    detail:
      "The estimated gross estate is above the 2026 basic exclusion, so an estate tax return is required.",
    actions: ["form-706"],
    review: ["tax-advisor", "attorney"],
    sources: ["irs-706-instr", "irs-estate-whats-new"],
  },
];
