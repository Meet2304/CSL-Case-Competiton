/**
 * Pennsylvania state pack (the pilot state). Every rule carries its own
 * `state = PA` clause, plus the fallback used for every other state.
 */
import type { HouseholdRule } from "@/data/types";

export const paHousehold: HouseholdRule[] = [
  {
    id: "hh.pa-inheritance",
    jurisdiction: "PA",
    title: "Pennsylvania inheritance tax",
    when: [{ fact: "state", eq: "PA" }],
    detail:
      "The rate depends on who inherits — 0% to a spouse, more for other heirs. A tax professional decides what's taxable; the rulebook never computes the tax.",
    actions: ["pa-it-discount", "pa-it-return"],
    review: ["tax-advisor"],
    sources: ["pa-inheritance-tax"],
  },
  {
    id: "hh.pa-letters",
    jurisdiction: "PA",
    title: "Letters from the Register of Wills",
    when: [
      { fact: "state", eq: "PA" },
      { fact: "hasProbateAssets", eq: true },
    ],
    detail:
      "Some of {decedent}'s accounts pass under the will, so the executor needs letters before the bank can release them.",
    actions: ["letters", "estate-account"],
    review: ["attorney"],
    sources: ["pa-register-of-wills"],
  },
  {
    id: "hh.pa-small-estate",
    jurisdiction: "PA",
    title: "Small-estate petition",
    when: [
      { fact: "state", eq: "PA" },
      { fact: "hasProbateAssets", eq: true },
      { fact: "probateValueAtPnc", lte: 50_000 },
    ],
    detail:
      "The probate assets at PNC are small enough that a small-estate petition may replace full probate.",
    actions: ["pa-small-estate"],
    review: ["attorney"],
    sources: ["pa-3102"],
  },
];

/** Every state other than the pilot falls back to the attorney. */
export const unmodelledStateHousehold: HouseholdRule[] = [
  {
    id: "hh.state-unmodelled",
    jurisdiction: "US",
    title: "State law not modelled",
    when: [{ fact: "state", eq: "other" }],
    detail:
      "This household isn't in Pennsylvania, the pilot state. The estate attorney confirms state-specific steps.",
    actions: ["attorney-review"],
    review: ["attorney"],
    sources: ["pa-register-of-wills"],
  },
];
