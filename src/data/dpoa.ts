/**
 * MOCK DATA for setting up a Durable Power of Attorney (DPOA) at
 * `routes.dpoa`. The flow follows the steps a Pennsylvania DPOA takes (choose
 * an agent, choose the powers, review, sign with witnesses and a notary, send
 * it to PNC), but it is a demonstration: nothing is signed, notarized or
 * registered, and the notary below is invented.
 */

export const DPOA_FULL_NAME = "Durable Power of Attorney";

/** The steps of the flow, in order, as the stepper names them. */
export const dpoaSteps = [
  { id: "people", label: "People" },
  { id: "powers", label: "Powers" },
  { id: "review", label: "Review" },
  { id: "sign", label: "Sign" },
  { id: "send", label: "Send to PNC" },
] as const;

export type DpoaStepId = (typeof dpoaSteps)[number]["id"];

/** Financial matters an agent can be given. Gifting is off unless chosen: Pennsylvania asks for it explicitly. */
export const dpoaMatters = [
  { id: "banking", label: "Banking", detail: "Pay bills, deposit and move money between accounts" },
  { id: "investments", label: "Investments", detail: "Manage brokerage and managed accounts" },
  { id: "retirement", label: "Retirement accounts", detail: "Handle IRAs and other plans" },
  { id: "property", label: "Real estate and vehicles", detail: "Sell, lease or insure property" },
  { id: "taxes", label: "Taxes", detail: "File returns and deal with the IRS and the state" },
  {
    id: "gifts",
    label: "Gifts",
    detail: "Make gifts from your assets. Pennsylvania requires you to choose this on purpose",
    off: true,
  },
] as const;

/** When the agent's authority begins. */
export const dpoaStarts = [
  { id: "now", label: "Right away", detail: "Your agent can act as soon as PNC registers it" },
  {
    id: "incapacity",
    label: "Only if I can't act myself",
    detail: "A doctor must certify it first",
  },
] as const;

export type DpoaStart = (typeof dpoaStarts)[number]["id"];

/** What signing involves in Pennsylvania (20 Pa.C.S. § 5601), done online in the demo. */
export const dpoaSigning = {
  notary: "Sample Remote Notary",
  steps: [
    "You sign it",
    "Two adult witnesses sign it",
    "A notary notarizes it (online is allowed in Pennsylvania)",
    "Your agent signs the agent's acknowledgment",
  ],
  source: "20 Pa.C.S. § 5601",
};

/** How long PNC's review usually takes, and what it does and doesn't change. */
export const dpoaReview = {
  time: "5–7 business days",
  after: "Once PNC registers it, your agent can act for you at the bank.",
  separate: "Online banking access for your agent is a separate request.",
};
