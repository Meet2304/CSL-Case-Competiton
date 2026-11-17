/**
 * The script of the guided tour (`/tour`): one family's story, told on the
 * working app. Each scene puts one or two people's screens on stage; each
 * stop is one key press, which clicks through the real controls and then
 * rests. The family is John, Maya, David and Alexa Smith, with the Bank
 * Advisor; the tour's own words introduce no other names.
 *
 * Targets describe elements by the words on them, so the tour keeps working
 * when the app's markup changes but its labels do not. When you rename a
 * label or heading in the app, update the script and replay `/tour`.
 */
import type { Target } from "@/lib/film";
import type { FrameId, TourScene, TourStop } from "@/lib/tour";
import type { WillDraft } from "@/lib/will/types";
import { advisorCustomers } from "./advisor";
import { people } from "./household";
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
  advisor: "var(--tour-advisor)",
};

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
};

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

export const tourScenes: Record<string, TourScene> = {
  "sign-on": {
    world: "before",
    frames: {
      husband: {
        slot: "left",
        path: "/",
        ready: { css: "input[name=userId]" },
        width: HALF,
        signedOut: true,
      },
      wife: {
        slot: "right",
        path: "/",
        ready: { css: "input[name=userId]" },
        width: HALF,
        signedOut: true,
      },
    },
  },
  john: {
    world: "before",
    frames: {
      husband: { slot: "solo", path: "/assets", ready: { text: "What you own" }, width: WIDE },
    },
  },
  family: {
    world: "before",
    frames: {
      husband: { slot: "solo", path: FAMILY, ready: { text: "Shared assets" }, width: WIDE },
    },
  },
  access: {
    world: "before",
    frames: {
      husband: { slot: "left", path: FAMILY, ready: { text: "Shared assets" }, width: HALF },
      child1: { slot: "right", path: FAMILY, ready: { text: "Shared with you" }, width: HALF },
    },
  },
  loss: {
    world: "before",
    frames: {
      husband: { slot: "solo", path: "/home", ready: { text: "Portfolio Summary" }, width: WIDE },
    },
  },
  advisor: {
    world: "before",
    frames: {
      advisor: { slot: "solo", path: "/advisor", ready: { text: "Your Customers" }, width: WIDE },
    },
  },
  transfer: {
    world: "before",
    frames: {
      advisor: {
        slot: "left",
        path: JOHN_AS_CLIENT,
        ready: { text: "Estate of John Smith" },
        width: HALF,
      },
      wife: { slot: "right", path: "/home", ready: { text: "Portfolio Summary" }, width: HALF },
    },
  },
  maya: {
    world: "after",
    frames: {
      wife: {
        slot: "solo",
        path: "/home",
        ready: { text: "so sorry for the loss of John" },
        width: WIDE,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// The stops

/** The dialog or side panel that is open. */
const dialog = "dialog[open]";
const inDialog = (text: string, css = "button"): Target => ({ css: `${dialog} ${css}`, text });
/** The white card that holds this heading. */
const card = (text: string, closest = ".shadow-card"): Target => ({ text, closest });
const findoePanel = "aside.findoe-panel";

const ADVISOR_QUESTION =
  "Based on John's will, what do I need to do to start the asset transfer to his spouse?";
const MAYA_QUESTION = "Will I owe tax on what John left me?";

export const tourStops: TourStop[] = [
  // --- Two people ----------------------------------------------------------
  {
    id: "open",
    scene: "sign-on",
    say: "John and Maya each have their own sign-on to PNC Private Bank.",
  },
  {
    id: "sign-on",
    scene: "sign-on",
    say: "Each signs on and lands on a home page of their own.",
    steps: [
      { in: "husband", do: "type", into: { css: "input[name=userId]" }, text: "john" },
      { in: "wife", do: "type", into: { css: "input[name=userId]" }, text: "maya" },
      {
        in: "husband",
        do: "click",
        on: { css: "button[type=submit]", text: "Sign On" },
        signsIn: true,
      },
      { in: "husband", do: "wait", for: { text: "Portfolio Summary" } },
      {
        in: "wife",
        do: "click",
        on: { css: "button[type=submit]", text: "Sign On" },
        signsIn: true,
      },
      { in: "wife", do: "wait", for: { text: "Portfolio Summary" } },
    ],
  },

  // --- John puts his affairs in one place ---------------------------------
  {
    id: "assets",
    scene: "john",
    say: "John's Assets and Debts: everything he owns and owes, in one place.",
  },
  {
    id: "add",
    scene: "john",
    say: "Add asset: accounts at PNC, accounts held elsewhere, and things he enters himself.",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Add asset" } },
      { in: "husband", do: "wait", for: { text: "External accounts" } },
    ],
  },
  {
    id: "outside",
    scene: "john",
    say: "He links an account held at another institution.",
    steps: [
      { in: "husband", do: "click", on: { text: "Banks and brokerages", closest: "button" } },
      { in: "husband", do: "click", on: inDialog("Demo Brokerage") },
      { in: "husband", do: "wait", for: { text: "Found at Demo Brokerage" } },
    ],
    focus: { husband: { on: { css: dialog }, maxZoom: 1.5 } },
  },
  {
    id: "outside-added",
    scene: "john",
    say: "The accounts found there are added to his Assets and Debts.",
    steps: [
      { in: "husband", do: "click", on: inDialog("Add 2 accounts") },
      { in: "husband", do: "wait", for: { text: "Added to Assets and Debts" } },
    ],
    focus: { husband: { on: { css: dialog }, maxZoom: 1.5 } },
  },
  {
    id: "own",
    scene: "john",
    say: "He adds the family home himself, and the bank estimates its value.",
    steps: [
      { in: "husband", do: "click", on: inDialog("Add another") },
      { in: "husband", do: "click", on: { text: "Real estate", closest: "button" } },
      { in: "husband", do: "type", into: { css: `${dialog} input` }, text: "100 Sample Street" },
      { in: "husband", do: "click", on: inDialog("Estimate value") },
      { in: "husband", do: "wait", for: { text: "Estimated value" } },
    ],
    focus: { husband: { on: { css: dialog }, maxZoom: 1.5 } },
  },
  {
    id: "own-added",
    scene: "john",
    say: "The home joins everything else he owns.",
    steps: [
      { in: "husband", do: "click", on: inDialog("Add to Assets and Debts") },
      { in: "husband", do: "wait", for: { text: "Added to Assets and Debts" } },
    ],
    focus: { husband: { on: { css: dialog }, maxZoom: 1.5 } },
  },
  {
    id: "will",
    scene: "john",
    say: "His will lives under Assets and Debts too, and he has answered every question.",
    steps: [
      { in: "husband", do: "click", on: inDialog("Back to Assets and Debts", "a") },
      { in: "husband", do: "wait", for: { text: "What you own" } },
      { in: "husband", do: "click", on: { css: "header button", text: "Assets and Debts" } },
      { in: "husband", do: "click", on: { css: "a", text: "Your will" } },
      { in: "husband", do: "wait", for: { text: "What your will covers" } },
    ],
  },
  {
    id: "will-review",
    scene: "john",
    say: "He reviews it: Maya inherits, and Maya carries out his wishes.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Continue your will" } },
      { in: "husband", do: "wait", for: { text: "Generate will (preview)" } },
    ],
  },
  {
    id: "will-draft",
    scene: "john",
    say: "The bank writes the will from his answers.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Generate will (preview)" } },
      { in: "husband", do: "wait", for: { text: "Add will to my account" } },
    ],
    focus: { husband: { on: { text: "Add will to my account", closest: "div.space-y-6" } } },
  },
  {
    id: "will-on-file",
    scene: "john",
    say: "He adds the will to his account. His family and his advisor now know it is in place.",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Add will to my account" } },
      { in: "husband", do: "wait", for: { text: "Your will is on file" } },
      { in: "husband", do: "click", on: { css: "button", text: "Go to will overview" } },
      { in: "husband", do: "wait", for: { text: "People your will names" } },
    ],
  },

  // --- One family ----------------------------------------------------------
  {
    id: "family",
    scene: "family",
    say: "The Smith Family dashboard: what John and Maya own and owe, together, and the four of them.",
  },
  {
    id: "david",
    scene: "access",
    say: "John is an admin. David, 17, sees only what the family shares with him.",
  },
  {
    id: "roles",
    scene: "access",
    say: "In Manage family, John opens David's role and what it can see.",
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
    focus: { husband: { on: { text: "What this role can see", closest: "div" } } },
  },
  {
    id: "share",
    scene: "access",
    say: "He shares a savings account and a debt, and they appear on David's screen.",
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
  },

  // --- A loss --------------------------------------------------------------
  {
    id: "loss",
    scene: "loss",
    say: "John passes away.",
    steps: [{ do: "pause", ms: 1600 }],
    quiet: "husband",
  },

  // --- The advisor ---------------------------------------------------------
  {
    id: "alert",
    scene: "advisor",
    say: "His advisor's home page opens on it: John is at the top, with what to do next.",
  },
  {
    id: "estate",
    scene: "advisor",
    say: "John's estate: the steps to process his will, in order.",
    steps: [
      { in: "advisor", do: "click", on: { css: "a", text: "Process will" } },
      { in: "advisor", do: "wait", for: { text: "Estate of John Smith" } },
    ],
  },
  {
    id: "certificate",
    scene: "advisor",
    say: "The death certificate Maya sent is already verified by the bank.",
    steps: [
      { in: "advisor", do: "click", on: { css: "button", text: "View certificate" } },
      { in: "advisor", do: "wait", for: { text: "Certificate of Death" } },
    ],
    focus: { advisor: { on: { css: dialog }, maxZoom: 1.5 } },
  },
  {
    id: "passes",
    scene: "advisor",
    say: "The will John put on file decides what passes to Maya, David and Alexa.",
    steps: [
      { in: "advisor", do: "click", on: { css: `${dialog} button[aria-label="Close"]` } },
      { in: "advisor", do: "look", at: { text: "Will on file", closest: "section" } },
    ],
    focus: {
      advisor: { on: { text: "Beneficiaries and what passes to them", closest: "section" } },
    },
  },
  {
    id: "ask",
    scene: "advisor",
    say: "The advisor asks Findoe how to begin, and it shows its work before it answers.",
    steps: [
      { in: "advisor", do: "type", into: { css: "aside textarea" }, text: ADVISOR_QUESTION },
      { in: "advisor", do: "click", on: { css: "aside button", text: "Send" } },
      { in: "advisor", do: "wait", for: { text: "Worked through" } },
    ],
    focus: { advisor: { on: { css: "aside" }, fit: "width", maxZoom: 1.6 } },
  },
  {
    id: "thinking",
    scene: "advisor",
    say: "Its chain of thought is there to open: every record and rule it read.",
    steps: [{ in: "advisor", do: "click", on: { text: "Worked through", closest: "button" } }],
    focus: { advisor: { on: { css: "aside" }, fit: "width", maxZoom: 1.6 } },
  },

  // --- The handover --------------------------------------------------------
  {
    id: "maya-before",
    scene: "transfer",
    say: "Until now, nothing has been asked of Maya.",
  },
  {
    id: "initiate",
    scene: "transfer",
    say: "The advisor initiates the wealth transfer, and sees who will be told.",
    steps: [
      { in: "advisor", do: "click", on: { css: "button", text: "Initiate" } },
      { in: "advisor", do: "wait", for: { text: "Initiate wealth transfer?" } },
    ],
    focus: { advisor: { on: { css: dialog } } },
  },
  {
    id: "notified",
    scene: "transfer",
    say: "On Maya's screen, a condolence comes first. Nothing is due today.",
    steps: [
      { in: "advisor", do: "click", on: inDialog("Initiate and notify") },
      { in: "wife", do: "wait", for: { text: "so sorry for the loss of John" } },
    ],
  },

  // --- Maya ----------------------------------------------------------------
  {
    id: "maya",
    scene: "maya",
    say: "Maya's home page, when she is ready: one link to what passes to her.",
  },
  {
    id: "unclaimed",
    scene: "maya",
    say: "Everything John left her is in one list, each with the reason it is hers.",
    steps: [
      { in: "wife", do: "click", on: { css: "a", text: "See what passes to you" } },
      { in: "wife", do: "wait", for: { text: "accounts that can pass to you" } },
    ],
  },
  {
    id: "claim",
    scene: "maya",
    say: "Joint Checking was theirs together. Two of its three steps are already filled in for her.",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "claim for Joint Checking" } },
      { in: "wife", do: "wait", for: { text: "Survivorship form" } },
    ],
  },
  {
    id: "sent",
    scene: "maya",
    say: "She confirms, signs and sends it. The bank takes it from here.",
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
    say: "The life policy is paid by an insurer, not the bank. She asks Findoe how to claim it.",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "All unclaimed assets" } },
      { in: "wife", do: "wait", for: { text: "accounts that can pass to you" } },
      { in: "wife", do: "click", on: { css: "button", text: "Ask Findoe about Term Life Policy" } },
      { in: "wife", do: "wait", for: { text: "Wrote the answer" } },
    ],
    focus: { wife: { on: { css: findoePanel }, fit: "width", maxZoom: 1.5 } },
  },
  {
    id: "maya-tax",
    scene: "maya",
    say: "Then the question that keeps her up: tax. Findoe checks her records and the law, and cites both.",
    steps: [
      { in: "wife", do: "type", into: { css: `${findoePanel} textarea` }, text: MAYA_QUESTION },
      { in: "wife", do: "click", on: { css: `${findoePanel} button`, text: "Send" } },
      { in: "wife", do: "wait", for: { text: "Searched the legal library" } },
    ],
    focus: { wife: { on: { css: findoePanel }, fit: "width", maxZoom: 1.5 } },
  },
  {
    id: "maya-answer",
    scene: "maya",
    say: "Most likely very little: a spouse pays no Pennsylvania inheritance tax, and every line is cited.",
    steps: [{ in: "wife", do: "look", at: { text: "Most likely very little", closest: "div" } }],
    focus: {
      wife: { on: { text: "Most likely very little", closest: "div" }, fit: "width", maxZoom: 1.5 },
    },
  },
  {
    id: "end",
    say: "What John put in place, Maya never has to search for.",
  },
];

export const tourQuestions = { advisor: ADVISOR_QUESTION, maya: MAYA_QUESTION, findoePanel, card };
