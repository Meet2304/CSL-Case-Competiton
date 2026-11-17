/**
 * MOCK DATA and words for the product story (`/story`): a key-driven walk
 * through Findoe told around one family. Balances, dates, the will and the
 * death certificate come from the shared household, estate and advisor data,
 * so the story and the prototype never disagree. The family is John, Maya,
 * David and Alexa Smith, with the Bank Advisor.
 *
 * In this telling John acts on Findoe's reminders before he dies: he names a
 * beneficiary on the two accounts that had none, following his will. That is
 * the story's one departure from the seeded household, and it is why nothing
 * here waits on probate.
 */
import { sectionMeta } from "@/components/will/sections";
import { addAssetGroups, sampleEstimates } from "./addAsset";
import { advisor, advisorCustomers } from "./advisor";
import { deathCertificates, willsOnFile } from "./estate";
import { accounts, people } from "./household";
import type { AvatarLook, BankAccount } from "./types";
import type { StopId } from "@/lib/story";

// ---------------------------------------------------------------------------
// People

export type StoryPersonId = "john" | "maya" | "david" | "alexa" | "advisor";

export type StoryPerson = {
  id: StoryPersonId;
  name: string;
  first: string;
  /** How they relate to the story, shown under their name. */
  role: string;
  look: AvatarLook;
};

const householdPerson = (id: string) => people.find((p) => p.id === id)!;
const first = (name: string) => name.split(" ")[0];

const member = (
  id: Exclude<StoryPersonId, "advisor">,
  householdId: string,
  role: string,
): StoryPerson => {
  const p = householdPerson(householdId);
  return { id, name: p.name, first: first(p.name), role, look: p.avatar! };
};

export const storyPeople: Record<StoryPersonId, StoryPerson> = {
  john: member("john", "p-jordan", "52"),
  maya: member("maya", "p-casey", "49"),
  david: member("david", "p-avery", "17"),
  alexa: member("alexa", "p-riley", "14"),
  advisor: {
    id: "advisor",
    name: "Bank Advisor",
    first: "Advisor",
    role: advisor.title,
    look: "service",
  },
};

export const familyIds = ["john", "maya", "david", "alexa"] as const;

const personByHousehold: Record<string, Exclude<StoryPersonId, "advisor">> = {
  "p-jordan": "john",
  "p-casey": "maya",
  "p-avery": "david",
  "p-riley": "alexa",
};

// ---------------------------------------------------------------------------
// Accounts

export type StoryAccountId =
  "joint" | "savings" | "ira" | "brokerage" | "life" | "card" | "mayaSavings" | "mayaRoth";

const householdIds: Record<StoryAccountId, string> = {
  joint: "acct-joint-checking",
  savings: "acct-jordan-savings",
  ira: "acct-jordan-ira",
  brokerage: "acct-jordan-brokerage",
  life: "acct-jordan-life",
  card: "acct-jordan-card",
  mayaSavings: "acct-casey-savings",
  mayaRoth: "acct-casey-roth",
};

export type StoryAccount = {
  id: StoryAccountId;
  name: string;
  last4?: string;
  kind: BankAccount["kind"];
  /** What kind of account it is, in a word or two. */
  type: string;
  balance: number;
  owners: StoryPersonId[];
  external?: boolean;
};

const typeNames: Partial<Record<BankAccount["kind"], string>> = {
  checking: "Checking",
  savings: "Savings",
  ira: "Retirement",
  roth: "Retirement",
  brokerage: "Investments",
  "life-insurance": "Life insurance",
  "credit-card": "Credit card",
};

function build(id: StoryAccountId): StoryAccount {
  const source = accounts.find((a) => a.id === householdIds[id]);
  if (!source) throw new Error(`Story account ${id} is missing from the household`);
  return {
    id,
    name: source.name,
    last4: source.last4,
    kind: source.kind,
    type: typeNames[source.kind] ?? "Account",
    balance: source.balance,
    owners: source.owners.map((o) => personByHousehold[o]),
    external: source.external,
  };
}

export const storyAccounts = Object.fromEntries(
  (Object.keys(householdIds) as StoryAccountId[]).map((id) => [id, build(id)]),
) as Record<StoryAccountId, StoryAccount>;

const A = storyAccounts;
const sum = (ids: StoryAccountId[]) => ids.reduce((s, id) => s + A[id].balance, 0);

/** John's own list, in the order his Assets and Debts page shows it. */
export const johnsList: StoryAccountId[] = ["joint", "savings", "ira", "brokerage", "life", "card"];

/** The money John looks after, as loose pieces around him before Findoe gathers them. */
export const carried: { account: StoryAccountId; x: number; y: number; tilt: number }[] = [
  { account: "ira", x: 250, y: 150, tilt: -4 },
  { account: "life", x: 690, y: 118, tilt: 3 },
  { account: "brokerage", x: 110, y: 330, tilt: 2 },
  { account: "savings", x: 150, y: 560, tilt: -3 },
  { account: "card", x: 480, y: 690, tilt: 4 },
  { account: "joint", x: 800, y: 600, tilt: -2 },
];

export const johnTotals = {
  pncAssets: sum(["joint", "savings", "ira", "brokerage"]),
  debts: -A.card.balance,
  external: A.life.balance,
  net: sum(["joint", "savings", "ira", "brokerage", "card"]),
};

/** The family dashboard's shared list: both parents' accounts. */
export const sharedList: StoryAccountId[] = [
  "joint",
  "savings",
  "mayaSavings",
  "brokerage",
  "ira",
  "mayaRoth",
  "life",
  "card",
];

export const familyTotals = {
  shared: sharedList.length,
  members: familyIds.length,
  /** Everything held at PNC, less what is owed. The life policy is paid by its insurer. */
  value: sum(sharedList.filter((id) => !A[id].external)),
};

// ---------------------------------------------------------------------------
// Getting ready: reminders, things a bank never sees, beneficiaries and the will

const will = willsOnFile["p-jordan"];
const shares = (list: { personId: string; share: number }[]) =>
  list.map((g) => ({ person: personByHousehold[g.personId], share: g.share }));

/** Who inherits each account that had no beneficiary, once John names them as his will says. */
export const named: { account: StoryAccountId; to: { person: StoryPersonId; share: number }[] }[] =
  [
    { account: "savings", to: shares(will.gifts["acct-jordan-savings"]) },
    { account: "brokerage", to: shares(will.residuary) },
  ];

/** What Findoe reminds John of on his Home page. */
export const reminders = [
  {
    id: "will",
    title: "Write your will",
    body: "Name who inherits and who carries out your wishes.",
  },
  {
    id: "savings",
    title: `Add a beneficiary to ${A.savings.name} x${A.savings.last4}`,
    body: "Without one, it would go through probate.",
  },
  {
    id: "brokerage",
    title: `Add a beneficiary to ${A.brokerage.name} x${A.brokerage.last4}`,
    body: "Without one, it would go through probate.",
  },
];

const option = (id: string) => {
  for (const g of addAssetGroups) {
    const found = g.options.find((o) => o.id === id);
    if (found) return found;
  }
  throw new Error(`Add-asset option ${id} is missing`);
};

/** The kinds of asset the story shows on Add an asset, from the app's own list. */
export const addTiles = ["real-estate", "vehicles", "jewelry", "art"].map(option);
export const addElsewhere = ["banks", "workplace", "insurance"].map(option);

const vehicle = option("vehicles");

/** The car John adds: the fields the app asks for a vehicle, and what he types. */
export const car = {
  option: vehicle,
  answers: { model: "Sample Roadster", year: "1967" } as Record<string, string>,
  name: "1967 Sample Roadster",
  ...sampleEstimates.vehicles,
};

/** The children's own accounts, which keep working as before. */
export const kidsAccounts = {
  david: accounts.find((a) => a.id === "acct-avery-checking")!,
  alexa: accounts.find((a) => a.id === "acct-riley-savings")!,
};

/** The will planner's steps, in order, and what John's finished will says. */
export const willSteps = Object.values(sectionMeta).map((s) => s.short);

export const willFacts = {
  signedOn: will.signedOn,
  executor: householdPerson(will.executor).name,
  attorney: will.attorney,
  gift: {
    account: A.savings,
    to: shares(will.gifts["acct-jordan-savings"]),
  },
  rest: shares(will.residuary),
};

// ---------------------------------------------------------------------------
// Who sees what

export type Sight = "hidden" | "account" | "balance";

export const sightLabels: Record<Sight, string> = {
  hidden: "Hidden",
  account: "Account",
  balance: "Account and balance",
};

/** The accounts on the access panel, and what each child sees before and after John shares more. */
export const accessRows: {
  account: StoryAccountId;
  david: [before: Sight, after: Sight];
  alexa: [before: Sight, after: Sight];
}[] = [
  { account: "joint", david: ["balance", "balance"], alexa: ["hidden", "hidden"] },
  { account: "savings", david: ["hidden", "account"], alexa: ["hidden", "hidden"] },
  { account: "ira", david: ["hidden", "account"], alexa: ["hidden", "hidden"] },
  { account: "brokerage", david: ["hidden", "hidden"], alexa: ["hidden", "hidden"] },
  { account: "life", david: ["hidden", "account"], alexa: ["hidden", "hidden"] },
  { account: "card", david: ["hidden", "hidden"], alexa: ["hidden", "hidden"] },
];

// ---------------------------------------------------------------------------
// The loss, and the bank's record of it

const johnClient = advisorCustomers.find((c) => c.id === "c-sample")!;
const loss = johnClient.lossEvents[0];
const certificate = deathCertificates["p-jordan"];

export const lossFacts = {
  born: householdPerson("p-jordan").birthdate,
  died: loss.date,
  certificateNumber: certificate.certificateNumber,
  certificateVerifier: certificate.verifiedBy,
  certificateSender: householdPerson(certificate.receivedFrom.personId).name,
};

/** What each person is told once the bank records John's death. */
export const word = {
  record: "The bank records John's passing",
  maya: "We're so sorry for the loss of John. There's nothing you need to do today.",
  children: "We're so sorry about John. There's nothing you need to do here.",
  advisor: "John Smith passed away. Call Maya to offer condolences.",
};

// ---------------------------------------------------------------------------
// The advisor

export const book = {
  customers: advisorCustomers.length,
  attention: advisorCustomers.filter((c) => c.lossEvents.some((l) => !l.followUpComplete)).length,
  john: johnClient,
  others: advisorCustomers.filter((c) => c.id !== "c-sample").slice(0, 4),
  nextActions: ["Review death certificate", "Process will", "Message beneficiaries"],
};

/** How much of what John left passes straight to the people he named. */
export const standing = {
  headline: "John Smith died yesterday",
  body: "Maya is John's spouse and the executor. Every account names who it passes to, so nothing at PNC waits on probate.",
  direct: johnTotals.pncAssets,
  probate: 0,
};

export const planSteps = [
  {
    title: "Call Maya to offer condolences",
    detail: "Lead with care. No account talk unless Maya brings it up.",
    when: "Today",
    who: "You",
  },
  {
    title: "Request a certified death certificate",
    detail: "Each claim needs one. Maya sends it once.",
    when: "Today",
    who: "Operations",
  },
  {
    title: `Retitle ${A.joint.name} to Maya`,
    detail: "Joint with right of survivorship, so Maya owns it now.",
    when: "This week",
    who: "Operations",
  },
  {
    title: `Help Maya claim the ${A.ira.name}`,
    detail: "As her own IRA, or as an inherited one. Her choice.",
    when: "This month",
    who: "You",
  },
];

/** A record the bank holds, or an entry in the legal library (an id in `rulebook.sources`). */
export type StorySource = { kind: "record"; label: string } | { kind: "law"; id: string };

/** How Findoe decided what happens to one account, a step at a time. */
export const decision = {
  opening:
    "I walked the 6 accounts John was part of through the settlement rulebook. One thing I need you to confirm.",
  account: A.joint,
  path: [
    {
      text: "Two owners: John and Maya",
      source: { kind: "record", label: "Account record" } as StorySource,
    },
    {
      text: "Joint, with right of survivorship",
      source: { kind: "law", id: "pa-6304" } as StorySource,
    },
    { text: "Maya owns it now, outside probate", source: null },
  ],
  question: "Did John receive Social Security or other federal benefits by direct deposit?",
  answers: ["Yes", "No", "Not sure yet"],
};

// ---------------------------------------------------------------------------
// The estate: who receives what, following the will and the beneficiaries on file

export type Inheritance = {
  person: Exclude<StoryPersonId, "advisor" | "john">;
  note: string;
  items: { account: StoryAccountId; basis: string; amount: number }[];
  total: number;
};

function inheritance(
  person: Inheritance["person"],
  note: string,
  items: Inheritance["items"],
): Inheritance {
  return { person, note, items, total: items.reduce((s, i) => s + i.amount, 0) };
}

const shareOf = (account: StoryAccountId, person: StoryPersonId) =>
  named.find((n) => n.account === account)!.to.find((t) => t.person === person)!.share;
const part = (account: StoryAccountId, person: StoryPersonId, basis: string) => {
  const share = shareOf(account, person);
  return {
    account,
    basis: `${basis} · ${Math.round(share * 100)}%`,
    amount: A[account].balance * share,
  };
};
const child = (person: "david" | "alexa") =>
  inheritance(person, "Held by Maya until 18", [
    part("savings", person, "Named beneficiary"),
    part("brokerage", person, "Named beneficiary"),
  ]);

export const inheritances: Inheritance[] = [
  inheritance("maya", "John's spouse · executor", [
    { account: "joint", basis: "Joint owner", amount: A.joint.balance },
    { account: "ira", basis: "Named beneficiary", amount: A.ira.balance },
    { account: "life", basis: "Paid by the insurer", amount: A.life.balance },
    part("brokerage", "maya", "Named beneficiary"),
  ]),
  child("david"),
  child("alexa"),
];

export const estateSteps = [
  {
    title: "Review the death certificate",
    detail: `Sent by ${lossFacts.certificateSender}, verified by ${lossFacts.certificateVerifier}`,
  },
  { title: "Offer your condolences", detail: "Write to Maya Smith before anything else" },
  { title: "Initiate the wealth transfer", detail: "Tells every beneficiary what they receive" },
  { title: "Brief the beneficiaries' advisors", detail: "Happens with the transfer" },
];

/** The advisor's first words to Maya, and her reply. */
export const conversation = [
  {
    from: "advisor" as StoryPersonId,
    text: "Maya, I'm so sorry about John. There is nothing you need to do today. When you feel ready, I'm here, and so is everything John set up for you.",
  },
  { from: "maya" as StoryPersonId, text: "Thank you. Could we talk on Thursday?" },
  { from: "advisor" as StoryPersonId, text: "Thursday at ten. I'll call you." },
];

// ---------------------------------------------------------------------------
// Maya: what passes to her, one claim, and a question

export const condolence = {
  lead: "We're so sorry for the loss of John.",
  body: "When you feel ready, John's accounts that pass to you are in one place. There's nothing you need to do today.",
  link: "See what passes to you",
};

export const unclaimed = {
  title: "John's accounts that can pass to you",
  today: "Upload John's death certificate. We use it for every account.",
  rows: inheritances[0].items,
};

export const claimDocs = [
  {
    title: "Certified death certificate",
    ask: "Uploaded once, used for every account",
    filled: `No. ${lossFacts.certificateNumber} · verified`,
  },
  { title: "Your photo ID", ask: "A current government ID", filled: "Already on file" },
  { title: "Survivorship form", ask: "The bank's form", filled: "Filled in for you" },
];

export const mayaChat = {
  question: "What should I do with John's IRA?",
  steps: [
    {
      label: "Looking up your accounts",
      detail: `${A.ira.name} x${A.ira.last4} · you are the beneficiary`,
      kind: "record" as const,
    },
    {
      label: "Searching the legal library",
      detail: "Distributions from IRAs",
      kind: "law" as const,
    },
  ],
  intro: "You have a choice, and no deadline this week.",
  claims: [
    {
      text: "As John's spouse, you can take it as your own IRA.",
      source: { kind: "law", id: "irs-pub-590b" } as StorySource,
    },
    {
      text: "Or keep it as an inherited account.",
      source: { kind: "law", id: "irs-pub-590b" } as StorySource,
    },
    {
      text: "You are the only beneficiary named on it.",
      source: { kind: "record", label: "Your accounts" } as StorySource,
    },
  ],
  close: "Each is taxed differently when you withdraw, so ask before you choose.",
  action: "Talk it through with your advisor",
};

/** What the children see: a gentle word, and nothing to do. */
export const childrenNote = {
  title: "Nothing here needs you",
  body: "The adults in your family and PNC are looking after John's accounts. Your own accounts keep working just as before.",
};

// ---------------------------------------------------------------------------
// Words on the canvas: at most one short line per stop

export const lines: Partial<Record<StopId, string>> = {
  smiths: "The Smiths.",
  carries: "John looks after the money. The whole picture lives with him.",
  home: "It starts with one view.",
  assets: "Everything they own. Everything they owe.",
  outside: "Even what PNC doesn't hold.",
  add: "The house. The car. The things a bank never sees.",
  car: "Each asks only for what it needs.",
  gaps: "Findoe finds the gaps while there is time.",
  named: "A name today. No probate later.",
  will: "The conversation nobody wants to have.",
  signed: "Twenty minutes. Done before it is needed.",
  dashboard: "One family. One shared picture.",
  access: "John and Maya decide who sees what.",
  granted: "Account by account. Person by person.",
  david: "David sees enough to help. Nothing more.",
  together: "And their advisor knows all of them.",
  word: "One record. Everyone it should reach.",
  alert: "The advisor knows who to call.",
  plan: "A plan, in order. People first.",
  sources: "It shows its work, and asks instead of guessing.",
  estate: "John's will, carried out as he wrote it.",
  transfer: "Everyone he named is told what comes to them.",
  message: "A person, not a process.",
  condolence: "Maya is met with care.",
  claim: "One certificate, used for every account.",
  sent: "Sent. Nothing more today.",
  ask: "Her question, in her own words.",
  answer: "Her accounts. The actual rule.",
  children: "The children are told gently.",
  circle: "The right information. The right people. The right time.",
};

export const closing = {
  line: "Somebody has their back.",
  memorial: "Husband to Maya. Father to David and Alexa.",
  mock: "A concept prototype. Every name and figure is mock data.",
};
