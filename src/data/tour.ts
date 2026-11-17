/**
 * MOCK DATA and script for the guided tour (`/tour`): a presenter-led walk
 * through one family's story, moved along one arrow press at a time. Balances
 * and dates come from the shared household, estate and advisor data so the
 * tour and the prototype never disagree. The family is John, Maya, David and
 * Alexa Smith, with the Bank Advisor; the tour's own words introduce no other
 * names.
 */
import { advisor, advisorCustomers } from "./advisor";
import { deathCertificates, willsOnFile } from "./estate";
import { accounts, people } from "./household";
import type { AccountKind, AvatarLook } from "./types";

// ---------------------------------------------------------------------------
// People

export type TourPersonId = "husband" | "wife" | "child1" | "child2" | "advisor";

export type TourPerson = {
  id: TourPersonId;
  name: string;
  first: string;
  /** How they relate to the story, shown beside the name on their screen. */
  role: string;
  /** What they type at sign-on. */
  userId: string;
  look?: AvatarLook;
};

export const tourPeople: Record<TourPersonId, TourPerson> = {
  husband: {
    id: "husband",
    name: "John Smith",
    first: "John",
    role: "Husband",
    userId: "john",
    look: "husband",
  },
  wife: {
    id: "wife",
    name: "Maya Smith",
    first: "Maya",
    role: "Wife",
    userId: "maya",
    look: "wife",
  },
  child1: {
    id: "child1",
    name: "David Smith",
    first: "David",
    role: "Son, 17",
    userId: "david",
    look: "teen",
  },
  child2: {
    id: "child2",
    name: "Alexa Smith",
    first: "Alexa",
    role: "Daughter, 14",
    userId: "alexis",
    look: "child",
  },
  advisor: {
    id: "advisor",
    name: "Bank Advisor",
    first: "Advisor",
    role: "John's advisor",
    userId: "advisor",
    look: "service",
  },
};

export const familyIds: TourPersonId[] = ["husband", "wife", "child1", "child2"];

/** Each person's screen has its own glow, the same one every time they appear. */
export const tourGlow: Record<Exclude<TourPersonId, "child2">, [string, string]> = {
  husband: ["var(--tour-husband)", "var(--tour-husband-2)"],
  wife: ["var(--tour-wife)", "var(--tour-wife-2)"],
  child1: ["var(--tour-child1)", "var(--tour-child1-2)"],
  advisor: ["var(--tour-advisor)", "var(--tour-advisor-2)"],
};

const person = (id: string) => people.find((p) => p.id === id)!;
const john = person("p-jordan");

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
  | "studentChecking";

export type TourAccount = {
  id: TourAccountId;
  name: string;
  last4?: string;
  kind: AccountKind;
  balance: number;
  owners: TourPersonId[];
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
};

const personIds: Record<string, TourPersonId> = {
  "p-jordan": "husband",
  "p-casey": "wife",
  "p-avery": "child1",
  "p-riley": "child2",
};

function build(id: TourAccountId): TourAccount {
  const source = accounts.find((a) => a.id === householdIds[id]);
  if (!source) throw new Error(`Tour account ${id} is missing from the household`);
  return {
    id,
    name: source.name,
    last4: source.last4,
    kind: source.kind,
    balance: source.balance,
    owners: source.owners.map((o) => personIds[o]),
    external: source.external,
  };
}

export const tourAccounts = Object.fromEntries(
  (Object.keys(householdIds) as TourAccountId[]).map((id) => [id, build(id)]),
) as Record<TourAccountId, TourAccount>;

/** What each person sees on their own Assets and Debts, in their own order. */
export const ownLists: Record<"husband" | "wife" | "child1", TourAccountId[]> = {
  husband: ["joint", "savings", "ira", "brokerage", "life", "card"],
  wife: ["wifeRoth", "wifeSavings", "joint", "studentChecking"],
  child1: ["studentChecking"],
};

/** The family dashboard's shared list: both parents' accounts, assets then debts. */
export const familyList: TourAccountId[] = [
  "joint",
  "savings",
  "wifeSavings",
  "ira",
  "wifeRoth",
  "card",
];

/** Accounts an admin can switch on for David, in the order the panel lists them. */
export const shareable: TourAccountId[] = ["joint", "savings", "ira", "card"];

/** The order John switches them on in the tour: two assets, then a debt. */
export const shareOrder: TourAccountId[] = ["joint", "savings", "card"];

/** John's accounts that name Maya, so she can claim them herself. */
export const claimable: { account: TourAccountId; why: string; note: string }[] = [
  { account: "joint", why: "Joint owner", note: "Owned together, so it is already yours." },
  { account: "ira", why: "Named beneficiary", note: "John named you as the beneficiary." },
  {
    account: "life",
    why: "Beneficiary · outside PNC",
    note: "Paid by the insurer, not by PNC.",
  },
];

// ---------------------------------------------------------------------------
// John's death, his will and the bank's record of both

const loss = advisorCustomers.find((c) => c.id === "c-sample")!.lossEvents[0];
const will = willsOnFile["p-jordan"];
const certificate = deathCertificates["p-jordan"];

export const tourFacts = {
  born: john.birthdate,
  died: loss.date,
  willSigned: will.signedOn,
  executor: person(will.executor).name,
  certificateNumber: certificate.certificateNumber,
  certificateIssuer: certificate.issuedBy,
  certificateSender: person(certificate.receivedFrom.personId).name,
  certificateVerifier: certificate.verifiedBy,
  advisorTitle: advisor.title,
  advisorTeam: advisor.team,
};

/** How ready John's affairs were, as his advisor sees it on the Client tab. */
export const readiness = {
  score: 86,
  label: "Well prepared",
  checks: [
    { label: "Will on file", detail: "Signed and stored with PNC", state: "done" },
    { label: "Executor named", detail: tourFacts.executor, state: "done" },
    { label: "Family dashboard set up", detail: "4 members", state: "done" },
    {
      label: "Beneficiaries named",
      detail: "IRA and life policy",
      state: "partial",
    },
  ] satisfies { label: string; detail: string; state: "done" | "partial" }[],
};

/** The advisor's immediate actions to begin carrying out the will. */
export const advisorSteps = [
  { title: "Offer condolences to Maya Smith", detail: "Before anything else.", when: "Today" },
  {
    title: "Confirm Maya Smith as executor",
    detail: "She is named in John's will.",
    when: "Today",
  },
  {
    title: "Initiate the asset transfer",
    detail: "Tells every beneficiary what passes to them.",
    when: "This week",
  },
  {
    title: "Brief the beneficiaries' advisors",
    detail: "Happens together with the transfer.",
    when: "This week",
  },
];

/** The other clients on the advisor's home screen, from the advisor's book. */
export const otherClients = advisorCustomers.filter((c) => c.id !== "c-sample").slice(0, 4);
export const johnAsClient = advisorCustomers.find((c) => c.id === "c-sample")!;

// ---------------------------------------------------------------------------
// The claim Maya sends for an account held at PNC

export const claimDocs = [
  {
    title: "Certified death certificate",
    ask: "A photo or scan of the certified copy",
    filled: `No. ${tourFacts.certificateNumber} · verified by ${tourFacts.certificateVerifier}`,
  },
  {
    title: "Your photo ID",
    ask: "A current government ID",
    filled: "Driver's license ending 0000 · on file",
  },
  {
    title: "Survivorship form",
    ask: "The bank's form, signed by you",
    filled: "Filled in for you · signed electronically",
  },
];

/** How to claim the life policy, which its insurer pays. */
export const policySteps = [
  {
    title: "Call the insurer to open a claim",
    detail: "Have the policy number and John's date of death ready.",
  },
  {
    title: "Send a certified death certificate",
    detail: "The insurer needs its own certified copy.",
  },
  {
    title: "Complete the insurer's claim form",
    detail: "It confirms who you are and that you are the beneficiary.",
  },
  { title: "Choose how to be paid", detail: "A lump sum, or instalments over time." },
];

// ---------------------------------------------------------------------------
// Findoe: what is asked, how it works it out and what it answers

/** A sentence in an answer, with the record or law it rests on. */
export type TourClaim = {
  text: string;
  /** An id in `rulebook.sources`. */
  law?: string;
  /** A record the bank holds. */
  record?: string;
};

export type TourChat = {
  question: string;
  steps: { label: string; detail: string; kind: "record" | "law" }[];
  intro: string;
  claims: TourClaim[];
  close: string;
};

export const advisorChat: TourChat & { action: string; done: string } = {
  question: "Based on John's will, what do I need to do to start the asset transfer to his spouse?",
  steps: [
    { label: "Reading the will on file", detail: "Executor: Maya Smith", kind: "record" },
    {
      label: "Checking how each account passes",
      detail: "3 pass to Maya outside probate",
      kind: "record",
    },
    {
      label: "Reviewing the legal documents",
      detail: "Survivorship and beneficiary rules",
      kind: "law",
    },
  ],
  intro: "Maya Smith is the executor. Three assets can pass to her now, outside probate:",
  claims: [
    { text: "Joint Checking x0001 is hers as the surviving owner.", law: "pa-6304" },
    { text: "The 401(k) Rollover IRA names her as beneficiary.", law: "irs-pub-590b" },
    { text: "The Term Life Policy is paid to her by the insurer.", record: "Beneficiary on file" },
  ],
  close: "The death certificate is approved, so her claim can start today.",
  action: "Initiate claim",
  done: "Claim initiated · Maya notified",
};

export const mayaChat: TourChat = {
  question: "For step 4, if I choose a lump sum, will I owe tax on it?",
  steps: [
    {
      label: "Looking up your assets and debts",
      detail: "Term Life Policy · you are the beneficiary",
      kind: "record",
    },
    {
      label: "Searching the legal library",
      detail: "Federal income tax · Pennsylvania inheritance tax",
      kind: "law",
    },
    { label: "Checking what applies to a spouse", detail: "Pennsylvania", kind: "law" },
  ],
  intro: "No. A lump sum from this policy reaches you without tax:",
  claims: [
    {
      text: "Life insurance paid because the insured died is generally not income.",
      law: "irs-pub-559",
    },
    {
      text: "Pennsylvania's inheritance tax rate for a spouse is 0%.",
      law: "pa-inheritance-tax",
    },
    { text: "You are the only beneficiary on the policy.", record: "Your assets and debts" },
  ],
  close: "If you choose instalments instead, the interest they earn is taxable.",
};

// ---------------------------------------------------------------------------
// Captions: one headline (at most 8 words) and one sentence (at most 20) per stop

export type TourChapterId = "views" | "family" | "access" | "loss" | "advisor" | "claims";

export const tourChapters: { id: TourChapterId; label: string }[] = [
  { id: "views", label: "Two views" },
  { id: "family", label: "One family" },
  { id: "access", label: "Access" },
  { id: "loss", label: "A loss" },
  { id: "advisor", label: "The advisor" },
  { id: "claims", label: "Maya's claims" },
];

export type TourCaption = { chapter: TourChapterId; title: string; body: string };

export const tourCaptions = {
  signin: {
    chapter: "views",
    title: "Two people, two sign-ins",
    body: "John and Maya each sign on to PNC Private Bank with their own User ID.",
  },
  assets: {
    chapter: "views",
    title: "Two separate dashboards",
    body: "Each lands on Assets and Debts and sees only their own accounts, in their own order.",
  },
  family: {
    chapter: "family",
    title: "One family dashboard",
    body: "Their two views come together as the Smith Family.",
  },
  shared: {
    chapter: "family",
    title: "Shared assets and debts",
    body: "What John and Maya own and owe, alone or jointly, sits in one list.",
  },
  children: {
    chapter: "family",
    title: "The children belong here too",
    body: "David and Alexa are members of the family, each with their own sign-in.",
  },
  admin: {
    chapter: "access",
    title: "A parent decides what a child sees",
    body: "John is an admin. David, 17, starts with only his own account.",
  },
  manage: {
    chapter: "access",
    title: "Manage family",
    body: "John opens the family's settings and chooses what David can see.",
  },
  share1: {
    chapter: "access",
    title: "Share an asset",
    body: "John turns on Joint Checking. It appears on David's dashboard at once.",
  },
  share2: {
    chapter: "access",
    title: "Then another",
    body: "Savings follows, the moment John switches it on.",
  },
  share3: {
    chapter: "access",
    title: "Debts work the same way",
    body: "The credit card becomes visible to David too.",
  },
  loss: {
    chapter: "loss",
    title: "John passes away",
    body: "The family tells the bank. From here, the bank carries the work.",
  },
  three: {
    chapter: "loss",
    title: "One event reaches three screens",
    body: "The bank records John's death, and each person's view changes.",
  },
  closed: {
    chapter: "loss",
    title: "John's sign-in is closed",
    body: "His access ends and his accounts are secured.",
  },
  condolence: {
    chapter: "loss",
    title: "Maya is met with care",
    body: "A condolence first, then a quiet notification. Nothing is due today.",
  },
  alert: {
    chapter: "loss",
    title: "His advisor is alerted",
    body: "One of his clients has died, and the next step is one click away.",
  },
  advHome: {
    chapter: "advisor",
    title: "The advisor's view",
    body: "John is at the top of his list, flagged for attention.",
  },
  client: {
    chapter: "advisor",
    title: "John's client page",
    body: "Everything the bank knows about John, with Findoe alongside.",
  },
  readiness: {
    chapter: "advisor",
    title: "John was ready",
    body: "A strong readiness score: a will on file, an executor named, beneficiaries chosen.",
  },
  certificate: {
    chapter: "advisor",
    title: "The death certificate is approved",
    body: "The bank has verified it, so no one asks Maya for it again.",
  },
  nextSteps: {
    chapter: "advisor",
    title: "The next steps are laid out",
    body: "The immediate actions needed to start carrying out John's will.",
  },
  ask: {
    chapter: "advisor",
    title: "The advisor asks Findoe",
    body: "A plain question about the will and the transfer to Maya.",
  },
  thinking: {
    chapter: "advisor",
    title: "Findoe shows its work",
    body: "It reads the will, checks each account, then reviews the legal documents it needs.",
  },
  answer: {
    chapter: "advisor",
    title: "An answer, with a way forward",
    body: "Every statement is cited, and one button starts Maya's claim.",
  },
  maya: {
    chapter: "claims",
    title: "Now, Maya's view",
    body: "She sees only the assets that name her, and can ask Findoe for help.",
  },
  claim: {
    chapter: "claims",
    title: "Claiming an account held at PNC",
    body: "The claim for Joint Checking asks for three documents.",
  },
  fills: {
    chapter: "claims",
    title: "The form is filled for her",
    body: "The death certificate, her ID and the bank's form. Now she can submit it.",
  },
  processing: {
    chapter: "claims",
    title: "Submitted, and now processing",
    body: "On her list, Joint Checking has moved from Start claim to Processing.",
  },
  howto: {
    chapter: "claims",
    title: "An asset held outside PNC",
    body: "The life policy is paid by its insurer, so each step is spelled out.",
  },
  mayaAsk: {
    chapter: "claims",
    title: "Maya asks about a step",
    body: "She wonders what choosing a lump sum would mean for her.",
  },
  mayaThinking: {
    chapter: "claims",
    title: "Findoe looks it up",
    body: "It checks her own assets and debts, then searches the legal library.",
  },
  mayaAnswer: {
    chapter: "claims",
    title: "An answer rooted in fact",
    body: "Her own records and the law, both cited. No guesswork.",
  },
  end: {
    chapter: "claims",
    title: "From loss to clarity",
    body: "One family view, a prepared advisor and guided claims.",
  },
} satisfies Record<string, TourCaption>;

export type TourCaptionId = keyof typeof tourCaptions;
