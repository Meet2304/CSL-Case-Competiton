/**
 * The script of the guided tour (`/tour`): one family's story, told on the
 * working app. Between acts the stage shows the family themselves (`cast`);
 * within an act, a scene puts one or two people's screens on stage. Each stop
 * is one key press: it clicks through the real controls, the spotlight settles
 * on the one thing that matters, and one short line says what it means. The
 * family is John, Maya, David and Alexa Smith, with the Bank Advisor; the
 * tour's own words introduce no other names.
 *
 * Targets describe elements by the words on them, so the tour keeps working
 * when the app's markup changes but its labels do not. When you rename a
 * label or heading in the app, update the script and replay `/tour`.
 */
import type { Target } from "@/lib/film";
import type { FrameId, TourScene, TourStep, TourStop } from "@/lib/tour";
import type { WillDraft } from "@/lib/will/types";
import { advisorCustomers } from "./advisor";
import { accounts, people } from "./household";
import type { AvatarLook } from "./types";
import { placeholderCharities } from "./will";

// ---------------------------------------------------------------------------
// People

export type TourPersonId = "husband" | "wife" | "child1" | "child2" | "advisor";

export type TourPerson = {
  id: TourPersonId;
  name: string;
  first: string;
  /** How they relate to the story, shown beside the name above their screen. */
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

/** The one color that glows behind each person's screen, every time they appear. */
export const tourGlow: Record<FrameId, string> = {
  husband: "var(--tour-husband)",
  wife: "var(--tour-wife)",
  child1: "var(--tour-child1)",
  child2: "var(--tour-child2)",
  advisor: "var(--tour-advisor)",
};

/** The family, in the order the stage shows them. */
export const familyIds = ["husband", "wife", "child1", "child2"] as const;

const john = people.find((p) => p.id === "p-jordan")!;
const maya = people.find((p) => p.id === "p-casey")!;
const children = people.filter((p) => p.id === "p-avery" || p.id === "p-riley");
const loss = advisorCustomers.find((c) => c.id === "c-sample")!.lossEvents[0];

/** John's death, as the bank recorded it. */
export const tourLoss = {
  frame: "husband" as FrameId,
  personId: john.id,
  personName: john.name,
  born: john.birthdate,
  date: loss.date,
  reportedVia: loss.reportedVia,
  /** The words under his name when he is gone. */
  remembered: "Husband to Maya. Father to David and Alexa.",
};

/** What John looks after, alone, before the story begins: his accounts, wherever they are held. */
export const carried = [
  "acct-ira",
  "acct-life",
  "acct-brokerage",
  "acct-savings",
  "acct-card",
  "acct-joint-checking",
].map((short) => {
  const id = short === "acct-joint-checking" ? short : short.replace("acct-", "acct-jordan-");
  const a = accounts.find((x) => x.id === id)!;
  return { id, name: a.name, balance: a.balance, external: Boolean(a.external) };
});

/** The beneficiaries John names on his Savings, as his will gives it: to the children. */
export const savingsBeneficiaries = children.map((c) => ({ id: c.id, name: c.name }));

// ---------------------------------------------------------------------------
// John's will, as far as he has got before the tour begins: every answer
// given, ready for him to review and add to his account on stage.

const row = (id: string, name: string, relationship: string) => ({ id, name, relationship });

export const tourWillDraft: WillDraft = {
  basics: {
    gender: "male",
    birthdate: john.birthdate,
    phone: "",
    address: { street1: "", street2: "", city: "Cranberry", state: "PA", zip: "" },
    marital: "married",
    spouse: { first: "Maya", middle: "", last: "Smith" },
  },
  nominees: {
    hasChildren: "yes",
    children: children.map((c) => ({ id: `tour-${c.id}`, name: c.name, birthdate: c.birthdate })),
    guardians: [row("tour-guardian", maya.name, "Spouse")],
    hasPets: "no",
    petNames: "",
    petGuardians: [row("tour-pet", "", "")],
  },
  assets: { method: "list", items: [] },
  residuary: {
    charities: [],
    primary: { plan: "spouse", beneficiaries: [] },
    secondary: { plan: "children", beneficiaries: [] },
    // If Maya and the children are all gone before him, the rest goes to charity.
    tertiary: {
      plan: "charity",
      beneficiaries: [
        {
          id: "tour-charity",
          kind: "charity",
          name: placeholderCharities.find((c) => c.featured)!.name,
          relationship: "",
          percent: "100",
        },
      ],
    },
    lastResort: { plan: "heirs", beneficiaries: [] },
  },
  gifts: [],
  funeral: {
    people: [row("tour-funeral", maya.name, "Spouse")],
    service: "",
    body: "",
    charities: [],
  },
  provisions: {
    executors: [row("tour-executor", maya.name, "Spouse")],
    digital: "no",
    digitalExecutors: [row("tour-digital", "", "")],
    digitalComms: "no",
    noContest: "yes",
    affidavit: "yes",
    independent: "yes",
    statement: "no",
    statementText: "",
  },
  review: { mirror: "no", spouseBirthdate: "", spouseConsent: false },
};

// ---------------------------------------------------------------------------
// Scenes: who is on stage, on which page, and how wide the page is laid out

const FAMILY = "/family#fam-sample";
const JOHN_AS_CLIENT = "/advisor/clients/c-sample#estate";
/** A lone screen is laid out like a laptop; two side by side are laid out narrower, so they read. */
const WIDE = 1280;
const HALF = 860;

const home = { path: "/home", ready: { text: "Portfolio Summary" } };

export const tourScenes: Record<string, TourScene> = {
  john: { world: "before", frames: { husband: { slot: "solo", ...home, width: WIDE } } },
  family: {
    world: "ready",
    frames: {
      husband: { slot: "solo", path: FAMILY, ready: { text: "Shared assets" }, width: WIDE },
    },
  },
  access: {
    world: "ready",
    frames: {
      husband: { slot: "left", path: FAMILY, ready: { text: "Shared assets" }, width: HALF },
      child1: { slot: "right", path: FAMILY, ready: { text: "Shared with you" }, width: HALF },
    },
  },
  advisor: {
    world: "ready",
    frames: {
      advisor: { slot: "solo", path: "/advisor", ready: { text: "Your Customers" }, width: WIDE },
    },
  },
  transfer: {
    world: "ready",
    frames: {
      advisor: {
        slot: "left",
        path: JOHN_AS_CLIENT,
        ready: { text: "Estate of John Smith" },
        width: HALF,
      },
      wife: { slot: "right", ...home, width: HALF },
    },
  },
  maya: {
    world: "after",
    frames: {
      wife: {
        slot: "solo",
        path: "/assets#unclaimed",
        ready: { text: "accounts that can pass to you" },
        width: WIDE,
      },
    },
  },
  children: {
    world: "after",
    frames: {
      child1: { slot: "left", path: "/home", ready: { text: "so sorry about John" }, width: HALF },
      child2: { slot: "right", path: "/home", ready: { text: "so sorry about John" }, width: HALF },
    },
  },
};

// ---------------------------------------------------------------------------
// The stops

/** The dialog or side panel that is open. */
const dialog = "dialog[open]";
const inDialog = (text: string, css = "button"): Target => ({ css: `${dialog} ${css}`, text });
/** The white card that holds this heading. */
const card = (text: string, closest = "section"): Target => ({ text, closest });
const findoePanel = "aside.findoe-panel";

const ADVISOR_QUESTION =
  "Based on John's will, what do I need to do to start the asset transfer to his spouse?";
const CONDOLENCE =
  "Maya, I'm so sorry about John. There is nothing you need to do today. When you feel ready, I'm here.";
const MAYA_QUESTION = "Will I owe tax on what John left me?";

export const tourStops: TourStop[] = [
  // --- The family ----------------------------------------------------------
  { id: "title", cast: "title", line: "" },
  { id: "smiths", cast: "family", line: "The Smiths." },
  {
    id: "carries",
    cast: "carries",
    line: "John looks after the money. The whole picture lives with him.",
  },

  // --- John puts his affairs in order --------------------------------------
  {
    id: "home",
    scene: "john",
    line: "It starts with one view.",
    focus: { husband: { on: card("Portfolio Summary") } },
  },
  {
    id: "assets",
    scene: "john",
    line: "Everything he owns. Everything he owes.",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Open Assets and Debts" } },
      { in: "husband", do: "wait", for: { text: "What you own" } },
    ],
  },
  {
    id: "outside",
    scene: "john",
    line: "Even what PNC doesn't hold.",
    focus: { husband: { on: { text: "Term Life Policy", closest: "li" }, maxZoom: 1.25 } },
  },
  {
    id: "add",
    scene: "john",
    line: "The house. The car. The things a bank never sees.",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Add asset" } },
      { in: "husband", do: "wait", for: { text: "Add your own" } },
    ],
    focus: {
      husband: { on: { text: "Property, valuables and anything else", closest: "section" } },
    },
  },
  {
    id: "house",
    scene: "john",
    line: "He adds the family home. The bank values it for him.",
    steps: [
      { in: "husband", do: "click", on: { text: "Real estate", closest: "button" } },
      { in: "husband", do: "type", into: { css: `${dialog} input` }, text: "100 Sample Street" },
      { in: "husband", do: "click", on: inDialog("Estimate value") },
      { in: "husband", do: "wait", for: { text: "Estimated value" } },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "gaps",
    scene: "john",
    line: "Findoe finds the gaps while there is still time.",
    steps: [
      { in: "husband", do: "click", on: inDialog("Add to Assets and Debts") },
      { in: "husband", do: "wait", for: { text: "Added to Assets and Debts" } },
      { in: "husband", do: "click", on: inDialog("Back to Assets and Debts", "a") },
      { in: "husband", do: "wait", for: { text: "What you own" } },
      { in: "husband", do: "click", on: { css: "header a", text: "Home", exact: true } },
      { in: "husband", do: "wait", for: { text: "Portfolio Summary" } },
    ],
    focus: {
      husband: { on: { text: "Add a beneficiary to Savings x0002", closest: "li" }, maxZoom: 1.3 },
    },
  },
  {
    id: "named",
    scene: "john",
    line: "A name today. No probate later.",
    steps: [
      { in: "husband", do: "click", on: { css: 'a[href="/assets#manage-acct-jordan-savings"]' } },
      { in: "husband", do: "click", on: inDialog("Add beneficiary") },
      ...savingsBeneficiariesSteps(),
      { in: "husband", do: "click", on: inDialog("Save") },
    ],
    focus: { husband: { on: { css: `${dialog} section`, text: "David and Alexa" }, maxZoom: 1.3 } },
  },
  {
    id: "will",
    scene: "john",
    line: "The conversation nobody wants to have.",
    steps: [
      { in: "husband", do: "click", on: { css: `${dialog} button[aria-label="Close"]` } },
      { in: "husband", do: "click", on: { css: "header button", text: "Assets and Debts" } },
      { in: "husband", do: "click", on: { css: "a", text: "Your will" } },
      { in: "husband", do: "wait", for: { text: "What your will covers" } },
    ],
    focus: { husband: { on: { text: "Finish your will", closest: "div.rounded-lg" } } },
  },
  {
    id: "will-draft",
    scene: "john",
    line: "His wishes, in plain words.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Continue your will" } },
      { in: "husband", do: "click", on: { css: "button", text: "Generate will (preview)" } },
      { in: "husband", do: "wait", for: { text: "Add will to my account" } },
    ],
    focus: { husband: { on: { text: "Last Will and Testament of", closest: "div" }, spot: false } },
  },
  {
    id: "signed",
    scene: "john",
    line: "Done, long before it is needed.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Add will to my account" } },
      { in: "husband", do: "click", on: { css: "button", text: "Go to will overview" } },
      { in: "husband", do: "wait", for: { text: "People your will names" } },
    ],
    focus: { husband: { on: { text: "People your will names", closest: "div" }, maxZoom: 1.3 } },
  },

  // --- One family ----------------------------------------------------------
  {
    id: "dashboard",
    scene: "family",
    line: "One family. One shared picture.",
  },
  {
    id: "access",
    scene: "access",
    line: "John decides who sees what.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Manage family" } },
      { in: "husband", do: "click", on: { css: "[role=tab]", text: "Roles & access" } },
      {
        in: "husband",
        do: "click",
        on: { text: "Sees the household checking account", closest: "button" },
      },
      { in: "husband", do: "wait", for: { text: "What this role can see" } },
    ],
    focus: { child1: { on: { css: "h3", text: "Shared with you", closest: "section" } } },
  },
  {
    id: "share",
    scene: "access",
    line: "Account by account. Person by person.",
    steps: [
      {
        in: "husband",
        do: "click",
        on: { css: `${dialog} input[aria-label="Account and balances: Savings x0002"]` },
      },
      {
        in: "husband",
        do: "click",
        on: { css: `${dialog} input[aria-label="Account and balances: Cash Rewards Visa x0003"]` },
      },
      { in: "husband", do: "click", on: inDialog("Save changes") },
      { in: "child1", do: "wait", for: { text: "Cash Rewards Visa" } },
    ],
    focus: { child1: { on: { css: "h3", text: "Shared with you", closest: "section" } } },
  },

  // --- A loss --------------------------------------------------------------
  { id: "together", cast: "advisor", line: "And their advisor knows every one of them." },
  { id: "loss", cast: "memorial", line: "" },

  // --- The advisor ---------------------------------------------------------
  {
    id: "alert",
    scene: "advisor",
    line: "The bank hears first. The advisor knows who to call.",
    focus: { advisor: { on: { text: "Customer passed away · Oct 24", closest: "tr" } } },
  },
  {
    id: "estate",
    scene: "advisor",
    line: "John's will, carried out as he wrote it.",
    steps: [
      { in: "advisor", do: "click", on: { css: "a", text: "Process will" } },
      { in: "advisor", do: "wait", for: { text: "Estate of John Smith" } },
    ],
    focus: {
      advisor: { on: { text: "Beneficiaries and what passes to them", closest: "section" } },
    },
  },
  {
    id: "ask",
    scene: "advisor",
    line: "Findoe answers, and shows its work.",
    steps: [
      { in: "advisor", do: "type", into: { css: "aside textarea" }, text: ADVISOR_QUESTION },
      { in: "advisor", do: "click", on: { css: "aside button", text: "Send" } },
      { in: "advisor", do: "wait", for: { text: "Worked through" } },
      { in: "advisor", do: "click", on: { text: "Worked through", closest: "button" } },
    ],
    focus: { advisor: { on: { css: "aside" }, fit: "width", maxZoom: 1.35 } },
  },
  {
    id: "message",
    scene: "advisor",
    line: "Then a person, not a process.",
    steps: [
      { in: "advisor", do: "click", on: { css: "main a", text: "Message" } },
      { in: "advisor", do: "type", into: { css: "textarea" }, text: CONDOLENCE },
      { in: "advisor", do: "click", on: { css: "main button[aria-label^='Send']" } },
      { in: "advisor", do: "wait", for: { text: "nothing you need to do today" } },
    ],
    focus: { advisor: { on: { text: "nothing you need to do today", closest: "section" } } },
  },
  {
    id: "transfer",
    scene: "transfer",
    line: "Everyone John named is told what comes to them.",
    steps: [
      { in: "advisor", do: "click", on: { css: "button", text: "Initiate" } },
      { in: "advisor", do: "wait", for: { text: "Initiate wealth transfer?" } },
    ],
    focus: { advisor: { on: { css: dialog }, spot: false } },
  },
  {
    id: "notified",
    scene: "transfer",
    line: "Maya is met with care. Nothing is due today.",
    steps: [
      { in: "advisor", do: "click", on: inDialog("Initiate and notify") },
      { in: "wife", do: "wait", for: { text: "so sorry for the loss of John" } },
    ],
    focus: { wife: { on: { text: "so sorry for the loss of John", closest: "div" } } },
  },

  // --- Maya ----------------------------------------------------------------
  {
    id: "unclaimed",
    scene: "maya",
    line: "Everything John left her, in one place.",
    focus: { wife: { on: { css: 'ul[aria-label="Accounts you can claim"]' } } },
  },
  {
    id: "claim",
    scene: "maya",
    line: "Two of three steps are already done for her.",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "claim for Joint Checking" } },
      { in: "wife", do: "wait", for: { text: "Survivorship form" } },
    ],
  },
  {
    id: "sent",
    scene: "maya",
    line: "Sent. Nothing more today.",
    steps: [
      { in: "wife", do: "click", on: { text: "This is still my current ID", closest: "label" } },
      {
        in: "wife",
        do: "click",
        on: { text: "The details are correct and I sign", closest: "label" },
      },
      { in: "wife", do: "click", on: { css: "button", text: "Send to PNC" } },
      { in: "wife", do: "wait", for: { text: "we have everything we need" } },
    ],
    focus: {
      wife: { on: { text: "we have everything we need", closest: "div" }, maxZoom: 1.3 },
    },
  },
  {
    id: "maya-asks",
    scene: "maya",
    line: "Her question, in her own words.",
    steps: [
      { in: "wife", do: "click", on: { css: "button.fixed", text: "Ask Findoe" } },
      { in: "wife", do: "type", into: { css: `${findoePanel} textarea` }, text: MAYA_QUESTION },
      { in: "wife", do: "click", on: { css: `${findoePanel} button`, text: "Send" } },
      { in: "wife", do: "wait", for: { text: "Searched the legal library" } },
    ],
    focus: { wife: { on: { css: findoePanel }, fit: "width", maxZoom: 1.45 } },
  },
  {
    id: "maya-answer",
    scene: "maya",
    line: "Her own accounts. The actual law.",
    steps: [{ in: "wife", do: "look", at: { text: "Most likely very little", closest: "div" } }],
    focus: {
      wife: {
        on: { text: "Most likely very little", closest: "div" },
        fit: "width",
        maxZoom: 1.45,
      },
    },
  },

  // --- The children, and the close -----------------------------------------
  {
    id: "children",
    scene: "children",
    line: "The children are told gently. Nothing is asked of them.",
    focus: {
      child1: { on: { text: "so sorry about John", closest: "div" } },
      child2: { on: { text: "so sorry about John", closest: "div" } },
    },
  },
  { id: "close", cast: "close", line: "What John put in place, Maya never had to search for." },
];

/** John ticks each child as a beneficiary on his Savings. */
function savingsBeneficiariesSteps(): TourStep[] {
  return savingsBeneficiaries.map(({ name }) => ({
    in: "husband" as const,
    do: "click" as const,
    on: { css: `${dialog} label`, text: name },
  }));
}
