/**
 * The script of the guided tour (`/tour`): one family's story, told on the
 * working app. Between acts the stage shows the family themselves (`cast`);
 * within an act, a scene puts one, two or three people's screens on stage.
 * Each stop is one key press with at most one click: the pointer, labelled
 * with the person's name, clicks the real control, and the spotlight settles
 * on the one thing that matters. There are no captions; four small dots at the
 * top say which part of Findoe is on stage. The family is John, Maya, David
 * and Alexa Smith, with the Bank Advisor; the tour's own words introduce no
 * other names.
 *
 * Targets describe elements by the words on them, so the tour keeps working
 * when the app's markup changes but its labels do not. When you rename a
 * label or heading in the app, update the script and replay `/tour`.
 */
import type { Target } from "@/lib/film";
import { factsFor } from "@/lib/assistant";
import { guidanceFor } from "@/lib/nextSteps";
import type { FrameId, ProductId, TourScene, TourStep, TourStop } from "@/lib/tour";
import type { WillDraft } from "@/lib/will/types";
import { advisorCustomers } from "./advisor";
import { profileFor } from "./clients";
import { DPOA_FULL_NAME } from "./dpoa";
import { accounts, people, seedFamilies } from "./household";
import { MOCK_AS_OF } from "./mock";
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

/** The family dashboard, in one line: its members, what they share and what it is worth. */
export const familyTotals = (() => {
  const f = seedFamilies.find((x) => x.id === "fam-sample")!;
  const shared = accounts.filter((a) => f.accountIds.includes(a.id));
  return {
    name: f.familyName,
    members: f.members.length,
    shared: shared.length,
    value: shared.filter((a) => !a.external).reduce((s, a) => s + a.balance, 0),
  };
})();

/** The four parts of Findoe, as the dots at the top of the stage name them. */
export const tourProducts: Record<ProductId, { name: string; lines: string[] }> = {
  will: { name: "Digital Will", lines: ["Digital", "Will"] },
  family: { name: "Family Dashboard", lines: ["Family", "Dashboard"] },
  assets: { name: "Asset Management Portal", lines: ["Asset", "Management", "Portal"] },
  advisory: { name: "AI Advisory Portal", lines: ["AI Advisory", "Portal"] },
};

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
    address: {
      street1: "100 Sample Street",
      street2: "",
      city: "Cranberry",
      state: "PA",
      zip: "16066",
    },
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
// What Findoe works through for the advisor, from the rulebook itself

const johnAsClient = advisorCustomers.find((c) => c.id === "c-sample")!;
const johnFacts = factsFor(johnAsClient, profileFor(johnAsClient.id)!, MOCK_AS_OF);
const johnGuidance = guidanceFor(johnFacts, { answers: {}, done: [] }, {});
const johnPlan = johnGuidance.plan ?? johnGuidance.readiness!.plan;
const ira = johnPlan.accounts.find((a) => a.holding.name.includes("IRA"))!;

/** The rulebook's walk for John's IRA: each decision it took, and where it ended. */
export const iraDecisions = {
  account: `${ira.holding.name}${ira.holding.last4 ? ` x${ira.holding.last4}` : ""}`,
  steps: ira.trace.map((t) => ({ question: t.question, answer: t.answer })),
  outcome: ira.title,
};

export const rulebookVersion = johnPlan.rulebookVersion;

// ---------------------------------------------------------------------------
// Scenes: who is on stage, on which page, and how wide the page is laid out

const FAMILY = "/family#fam-sample";
const JOHN_AS_CLIENT = "/advisor/clients/c-sample#estate";
/** A lone screen is laid out like a laptop; two or three side by side are laid out narrower, so they read. */
const WIDE = 1280;
const HALF = 860;

const home = { path: "/home", ready: { text: "Portfolio Summary" } };
const assets = { path: "/assets", ready: { text: "What you own" } };

export const tourScenes: Record<string, TourScene> = {
  john: {
    world: "before",
    product: "assets",
    frames: { husband: { slot: "solo", ...home, width: WIDE } },
  },
  // John's Assets and Debts makes room for Maya's.
  couple: {
    world: "before",
    product: "assets",
    from: "john",
    frames: {
      husband: { slot: "left", ...assets, width: HALF, keep: true },
      wife: { slot: "right", ...assets, width: HALF },
    },
  },
  // Their two views become one family dashboard.
  family: {
    world: "ready",
    product: "family",
    from: "couple",
    merge: { wife: "husband" },
    frames: {
      husband: { slot: "solo", path: FAMILY, ready: { text: "Shared assets" }, width: WIDE },
    },
  },
  access: {
    world: "ready",
    product: "family",
    from: "family",
    frames: {
      husband: {
        slot: "left",
        path: FAMILY,
        ready: { text: "Shared assets" },
        width: HALF,
        keep: true,
      },
      child1: { slot: "right", path: FAMILY, ready: { text: "Shared with you" }, width: HALF },
    },
  },
  aftermath: {
    world: "loss",
    product: null,
    frames: {
      husband: {
        slot: "third1",
        path: "/home",
        ready: { text: "accounts are being settled" },
        width: HALF,
      },
      wife: { slot: "third2", ...home, width: HALF },
      advisor: { slot: "third3", path: "/advisor", ready: { text: "Your Customers" }, width: HALF },
    },
  },
  // The advisor's screen, alone: from the dashboard to John's estate and Findoe.
  advisor: {
    world: "loss",
    product: "advisory",
    from: "aftermath",
    frames: {
      advisor: {
        slot: "solo",
        path: "/advisor",
        ready: { text: "Your Customers" },
        width: WIDE,
        keep: true,
      },
    },
  },
  // The advisor's screen makes room for Maya's as the transfer begins.
  transfer: {
    world: "loss",
    product: "advisory",
    from: "advisor",
    frames: {
      advisor: {
        slot: "left",
        path: JOHN_AS_CLIENT,
        ready: { text: "Estate of John Smith" },
        width: HALF,
        keep: true,
      },
      wife: { slot: "right", ...home, width: HALF },
    },
    setup: [
      { in: "advisor", do: "click", on: { css: "button", text: "Initiate" } },
      { in: "advisor", do: "wait", for: { text: "Initiate wealth transfer?" } },
    ],
  },
  maya: {
    world: "after",
    product: "assets",
    from: "transfer",
    frames: {
      wife: {
        slot: "solo",
        path: "/assets#unclaimed",
        ready: { text: "accounts that can pass to you" },
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
const card = (text: string, closest = "section"): Target => ({ text, closest });
const findoePanel = "aside.findoe-panel";
/** The advisor's Findoe, docked beside the client's page. */
const advisorFindoe = 'aside[aria-label="Findoe"]';

const ADVISOR_QUESTION = "What should I do next for Maya?";

/** A quick click: one of a run the viewer sees as a single motion. */
const tick = (on: Target): TourStep => ({ in: "husband", do: "click", on, quick: true });
const button = (text: string, exact = false): Target => ({ css: "button", text, exact });
/** The DPOA's five steps across the top of its page. */
const dpoaSteps: Target = { css: "ol", text: "Send to PNC" };
/**
 * John's DPOA from its first step to its last. The page holds still and only
 * the steps across its top stay live: the line runs from the first to the last,
 * ticking off each one on the way. Then it is sent, out of sight.
 */
const dpoaRun: TourStep[] = [
  { in: "husband", do: "hide", except: dpoaSteps },
  tick({ css: "button[aria-pressed]", text: "Maya Smith" }),
  { do: "pause", ms: 60 },
  tick(button("Continue", true)),
  { in: "husband", do: "wait", for: { text: "When it starts" } },
  { do: "pause", ms: 220 },
  tick(button("Continue", true)),
  { in: "husband", do: "wait", for: { text: "Review your DPOA" } },
  { do: "pause", ms: 220 },
  tick(button("Continue to signing")),
  { in: "husband", do: "wait", for: { text: "Sign online with a notary" } },
  { do: "pause", ms: 220 },
  tick(button("Sign online with a notary")),
  { in: "husband", do: "wait", for: { text: "Send to PNC for review" } },
  // The line reaches the last step before the page moves on.
  { do: "pause", ms: 650 },
  { in: "husband", do: "hide" },
  tick(button("Send to PNC for review")),
  { in: "husband", do: "wait", for: { text: "Your DPOA is with PNC for review" } },
];

/** The will planner's sections across the top of its page. */
const willSections: Target = { css: 'nav[aria-label="Will sections"]' };
/**
 * How many screens each of the planner's sections has. John saves each one
 * with what the bank already knows filled in. Only the sections across the top
 * are seen: they tick off one after another as the bar runs to the end.
 */
const willScreens = {
  "About you": 2,
  Guardians: 3,
  Assets: 2,
  Inheritance: 6,
  Gifts: 1,
  Funeral: 1,
  Executor: 6,
  Review: 1,
};
const willRun: TourStep[] = Object.values(willScreens).flatMap((n) =>
  Array.from({ length: n }, (): TourStep[] => [
    tick({ css: "button[type=submit]", text: "Save & Continue", exact: true }),
    // Each save leaves the planner a moment to show the next screen.
    { do: "pause", ms: 40 },
  ]).flat(),
);

/** John's will, from a blank start to a preview and with PNC for review. */
const willStops: TourStop[] = [
  {
    id: "will-start",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Start your will" } },
      { in: "husband", do: "wait", for: willSections },
    ],
    focus: { husband: { on: willSections, fit: "width", maxZoom: 1.5, spot: false } },
  },
  // The tracker runs from the first section to the last, every one ticked off: one motion.
  {
    id: "will-fill",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "hide", except: willSections },
      ...willRun,
      { in: "husband", do: "wait", for: { text: "Review your will" } },
      // The bar reaches the end before the page moves on.
      { do: "pause", ms: 600 },
    ],
    focus: { husband: { on: willSections, fit: "width", maxZoom: 1.5, spot: false } },
  },
  // John previews the will the planner has drawn up.
  {
    id: "will-preview",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "click", on: button("Generate will (preview)") },
      { in: "husband", do: "wait", for: { text: "Last Will and Testament of" } },
    ],
    focus: {
      husband: { on: { text: "Last Will and Testament of", closest: "div" }, spot: false },
    },
  },
  // He verifies it, and it is with PNC: signing and stamping happen out of sight.
  {
    id: "will-in-review",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "look", at: { text: "Happy with the draft?", closest: "div" } },
      { in: "husband", do: "hide" },
      { in: "husband", do: "click", on: button("Verify the will", true) },
      { in: "husband", do: "wait", for: { text: "VERIFIED · PNC" } },
      tick(button("Go to will overview")),
      { in: "husband", do: "wait", for: { text: "Your will is with PNC for review" } },
    ],
  },
];
const MAYA_QUESTION = "If I take the life policy as a lump sum, will I owe tax on it?";

export const tourStops: TourStop[] = [
  // --- The family ----------------------------------------------------------
  { id: "title", cast: "title" },
  { id: "smiths", cast: "family" },
  { id: "carries", cast: "carries" },

  // --- John's own view: everything he owns, in one place --------------------
  { id: "home", scene: "john" },
  { id: "summary", scene: "john", focus: { husband: { on: card("Portfolio Summary") } } },
  {
    id: "assets",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Open Assets and Debts" } },
      { in: "husband", do: "wait", for: { text: "What you own" } },
    ],
  },
  {
    id: "add",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Add asset" } },
      { in: "husband", do: "wait", for: { text: "Manually Add Assets and Debts" } },
    ],
    // All three kinds of asset on one screen: from the first row down.
    focus: {
      husband: {
        on: { text: "Accounts you hold with PNC", closest: "div.space-y-6" },
        spot: false,
      },
    },
  },
  {
    id: "add-pnc",
    scene: "john",
    focus: { husband: { on: card("Accounts you hold with PNC"), maxZoom: 1.2 } },
  },
  {
    id: "add-external",
    scene: "john",
    focus: { husband: { on: card("Accounts at other banks and institutions"), maxZoom: 1.2 } },
  },
  {
    id: "add-own",
    scene: "john",
    focus: { husband: { on: card("Property, valuables and anything else"), maxZoom: 1.2 } },
  },
  {
    id: "vehicle",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: { text: "Vehicles", closest: "button" } },
      { in: "husband", do: "wait", for: { css: dialog, text: "What is it?" } },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "vehicle-details",
    scene: "john",
    steps: [
      {
        in: "husband",
        do: "type",
        into: { css: `${dialog} input[placeholder="e.g. Sample Sedan"]` },
        text: "Sample Sedan",
      },
      {
        in: "husband",
        do: "type",
        into: { css: `${dialog} input[placeholder="e.g. 2022"]` },
        text: "2022",
      },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "vehicle-proof",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: inDialog("Continue") },
      { in: "husband", do: "wait", for: { css: dialog, text: "Proof of ownership" } },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "vehicle-title",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: inDialog("Upload the certificate of title") },
      { in: "husband", do: "wait", for: { css: dialog, text: "Verified" } },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "vehicle-added",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: inDialog("Add to Assets and Debts") },
      { in: "husband", do: "wait", for: { text: "Added to Assets and Debts" } },
    ],
    focus: { husband: { on: { css: dialog }, spot: false } },
  },
  {
    id: "notifications",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: { css: "header a", text: "Home", exact: true } },
      { in: "husband", do: "wait", for: { text: "Portfolio Summary" } },
    ],
    focus: { husband: { on: card("Notifications"), maxZoom: 1.25 } },
  },
  {
    id: "dpoa-note",
    scene: "john",
    focus: {
      husband: { on: { text: `Add a ${DPOA_FULL_NAME} (DPOA)`, closest: "li" }, maxZoom: 1.35 },
    },
  },
  {
    id: "dpoa",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Set up your DPOA" } },
      { in: "husband", do: "wait", for: { text: "Who can act for you?" } },
    ],
  },
  // The line runs from the first step to the last in one motion; then it is sent, with its check mark.
  {
    id: "dpoa-steps",
    scene: "john",
    product: "will",
    steps: dpoaRun,
    focus: {
      husband: { on: { text: "Your DPOA is with PNC for review", closest: "div" }, maxZoom: 1.3 },
    },
  },
  // Back home: the whole page first, then the notes that matter.
  {
    id: "home-again",
    scene: "john",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Back to Home" } },
      { in: "husband", do: "wait", for: { text: "Portfolio Summary" } },
    ],
  },
  {
    id: "beneficiary-note",
    scene: "john",
    focus: {
      husband: { on: { text: "Add a beneficiary to Savings x0002", closest: "li" }, maxZoom: 1.35 },
    },
  },
  {
    id: "will-note",
    scene: "john",
    focus: { husband: { on: { text: "Write your will", closest: "li" }, maxZoom: 1.35 } },
  },

  // --- The will -------------------------------------------------------------
  {
    id: "will",
    scene: "john",
    product: "will",
    steps: [
      { in: "husband", do: "click", on: { css: "a", text: "Start your will" } },
      { in: "husband", do: "wait", for: { css: "button", text: "Start your will" } },
    ],
  },
  ...willStops,

  // --- His Assets and Debts, then Maya's -----------------------------------------
  {
    id: "assets-again",
    scene: "john",
    steps: [
      {
        in: "husband",
        do: "click",
        on: { css: "nav[aria-label=Breadcrumb] a", text: "Assets and Debts" },
      },
      { in: "husband", do: "wait", for: { text: "What you own" } },
    ],
  },
  { id: "maya-assets", scene: "couple", spot: "wife" },
  { id: "both-assets", scene: "couple" },

  // --- One family -------------------------------------------------------------
  { id: "dashboard", scene: "family" },
  {
    id: "shared",
    scene: "family",
    focus: { husband: { on: card("Shared assets"), maxZoom: 1.25 } },
  },
  {
    id: "members",
    scene: "family",
    focus: { husband: { on: { css: "aside", text: "People" }, maxZoom: 1.45 } },
  },
  {
    id: "access",
    scene: "access",
    focus: { child1: { on: { css: "h3", text: "Shared with you", closest: "section" } } },
  },
  {
    id: "manage",
    scene: "access",
    steps: [
      { in: "husband", do: "click", on: { css: "button", text: "Manage family" } },
      { in: "husband", do: "wait", for: { css: "[role=tab]", text: "Roles & access" } },
    ],
  },
  // While John sets what David can see, David's screen waits in the background.
  {
    id: "roles",
    scene: "access",
    spot: "husband",
    steps: [
      { in: "husband", do: "click", on: { css: "[role=tab]", text: "Roles & access" } },
      { in: "husband", do: "wait", for: { text: "Sees the household checking account" } },
    ],
  },
  {
    id: "role",
    scene: "access",
    spot: "husband",
    steps: [
      {
        in: "husband",
        do: "click",
        on: { text: "Sees the household checking account", closest: "button" },
      },
      { in: "husband", do: "wait", for: { text: "What this role can see" } },
    ],
  },
  // One motion: John lets the role see his Savings, scrolls down to the Cash Rewards Visa, and saves.
  {
    id: "share",
    scene: "access",
    spot: "husband",
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
  // Saved: both screens come forward, David's whole view first...
  { id: "shared-with-david", scene: "access" },
  // ...then what is now shared with him.
  {
    id: "david-shared",
    scene: "access",
    focus: { child1: { on: { css: "h3", text: "Shared with you", closest: "section" } } },
  },

  // --- The advisor joins them, and John dies ------------------------------------
  { id: "gathered", cast: "gathered" },
  { id: "together", cast: "advisor" },
  { id: "loss", cast: "loss" },
  { id: "passed", scene: "aftermath", memorial: true },
  { id: "closed", scene: "aftermath", memorial: true, spot: "husband" },
  { id: "condolence", scene: "aftermath", memorial: true, spot: "wife", product: "assets" },
  { id: "alerted", scene: "aftermath", memorial: true, spot: "advisor", product: "advisory" },

  // --- The advisor's dashboard, then John's estate ----------------------------------
  { id: "advisor-home", scene: "advisor" },
  {
    id: "alert",
    scene: "advisor",
    focus: { advisor: { on: { text: "Customer passed away", closest: "tr" }, pad: 2 } },
  },
  {
    id: "estate",
    scene: "advisor",
    steps: [
      { in: "advisor", do: "click", on: { css: "tbody a", text: "John Smith", exact: true } },
      { in: "advisor", do: "wait", for: { text: "Estate of John Smith" } },
    ],
  },
  {
    id: "readiness",
    scene: "advisor",
    focus: { advisor: { on: card("How ready John was"), maxZoom: 1.4 } },
  },

  // --- Findoe, for the advisor: an answer that shows its work ----------------------
  {
    id: "ask",
    scene: "advisor",
    steps: [
      // Findoe has read John's file and is ready for a question.
      { in: "advisor", do: "wait", for: { css: advisorFindoe, text: "One thing I need from you" } },
      { do: "pause", ms: 150 },
      {
        in: "advisor",
        do: "type",
        into: { css: `${advisorFindoe} textarea` },
        text: ADVISOR_QUESTION,
      },
    ],
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
  },
  {
    id: "worked",
    scene: "advisor",
    steps: [
      { in: "advisor", do: "click", on: { css: `${advisorFindoe} button`, text: "Send" } },
      { in: "advisor", do: "wait", for: { text: "Worked through" } },
    ],
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
  },
  {
    id: "customer-data",
    scene: "advisor",
    steps: [{ in: "advisor", do: "click", on: { text: "Worked through", closest: "button" } }],
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
    notes: {
      in: "advisor",
      items: [
        {
          kind: "card",
          icon: "data",
          title: "Customer data",
          body: "Accounts, owners and beneficiaries, read from the bank's own records",
          at: { text: "Read John Smith's file", closest: "li" },
        },
      ],
    },
  },
  {
    id: "rulebook",
    scene: "advisor",
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
    notes: {
      in: "advisor",
      items: [
        {
          kind: "card",
          icon: "data",
          title: "Customer data",
          body: "Accounts, owners and beneficiaries, read from the bank's own records",
          at: { text: "Read John Smith's file", closest: "li" },
        },
        {
          kind: "card",
          icon: "law",
          title: "Legal rulebook",
          body: "Federal and Pennsylvania settlement rules, each with its source",
          tag: `v${rulebookVersion}`,
          at: { text: "accounts through the rulebook", closest: "li" },
        },
      ],
    },
  },
  {
    id: "decision",
    scene: "advisor",
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
    notes: {
      in: "advisor",
      items: [
        {
          kind: "tree",
          title: "Deterministic decision tree",
          account: iraDecisions.account,
          steps: iraDecisions.steps,
          outcome: iraDecisions.outcome,
          at: { text: "accounts through the rulebook", closest: "li" },
        },
      ],
    },
  },
  {
    id: "cited",
    scene: "advisor",
    focus: { advisor: { on: { css: advisorFindoe }, fit: "width", maxZoom: 1.3 } },
    notes: {
      in: "advisor",
      items: [
        {
          kind: "card",
          icon: "cited",
          title: "Every answer cited",
          body: "Each step points to the rule or record it rests on. Nothing is made up.",
          at: { css: 'ul[aria-label="Rules that apply"]' },
        },
      ],
    },
  },
  {
    id: "asks",
    scene: "advisor",
    focus: {
      advisor: { on: { text: "One thing I need from you", closest: "section" }, maxZoom: 1.3 },
    },
    notes: {
      in: "advisor",
      items: [
        {
          kind: "label",
          text: "Asks, never guesses",
          at: { text: "One thing I need from you", closest: "section" },
        },
      ],
    },
  },

  // Having asked Findoe, the next steps: the whole of what to do for John's will; then the transfer.
  {
    id: "process",
    scene: "advisor",
    focus: { advisor: { on: card("Process John Smith's will"), maxZoom: 1.45 } },
  },
  {
    id: "initiate",
    scene: "advisor",
    steps: [
      { in: "advisor", do: "click", on: { css: "button", text: "Initiate" } },
      { in: "advisor", do: "wait", for: { text: "Initiate wealth transfer?" } },
    ],
    focus: { advisor: { on: { css: dialog }, spot: false } },
  },

  // --- Maya comes into view; the advisor starts the claim, and she hears at once ------
  {
    id: "handoff",
    scene: "transfer",
    focus: { advisor: { on: { css: dialog }, spot: false } },
  },
  {
    id: "notified",
    scene: "transfer",
    spot: "wife",
    steps: [
      { in: "advisor", do: "click", on: inDialog("Initiate and notify") },
      { in: "wife", do: "wait", for: { text: "estate is being passed on" } },
    ],
  },
  {
    id: "maya-notice",
    scene: "transfer",
    spot: "wife",
    focus: { wife: { on: card("Notifications"), maxZoom: 1.3 } },
  },

  // --- Maya: what passes to her, and two ways to claim it -------------------------
  { id: "maya", scene: "maya" },
  {
    id: "receiving",
    scene: "maya",
    focus: { wife: { on: { css: 'ul[aria-label="Accounts you can claim"]' }, maxZoom: 1.3 } },
  },
  {
    id: "claim",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "claim for Joint Checking" } },
      { in: "wife", do: "wait", for: { text: "Survivorship form" } },
    ],
  },
  {
    id: "claim-id",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { text: "This is still my current ID", closest: "label" } },
    ],
    focus: { wife: { on: { text: "This is still my current ID", closest: "li" }, maxZoom: 1.35 } },
  },
  {
    id: "claim-sign",
    scene: "maya",
    steps: [
      {
        in: "wife",
        do: "click",
        on: { text: "The details are correct and I sign", closest: "label" },
      },
    ],
    focus: {
      wife: { on: { text: "The details are correct and I sign", closest: "li" }, maxZoom: 1.35 },
    },
  },
  {
    id: "claim-sent",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "Send to PNC" } },
      { in: "wife", do: "wait", for: { text: "we have everything we need" } },
    ],
    focus: { wife: { on: { text: "we have everything we need", closest: "div" }, maxZoom: 1.3 } },
  },
  {
    id: "claim-processing",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "All unclaimed assets" } },
      { in: "wife", do: "wait", for: { css: 'ul[aria-label="Accounts you can claim"]' } },
    ],
    focus: { wife: { on: { css: 'ul[aria-label="Accounts you can claim"]' }, maxZoom: 1.3 } },
  },
  {
    id: "policy",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: "button", text: "See how to claim" } },
      { in: "wife", do: "wait", for: { text: "How to claim it, step by step" } },
    ],
    focus: {
      wife: { on: { text: "How to claim it, step by step", closest: "section" }, maxZoom: 1.3 },
    },
  },
  {
    id: "maya-findoe",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: "button.fixed", text: "Ask Findoe" } },
      { in: "wife", do: "wait", for: { css: `${findoePanel} textarea` } },
      { do: "pause", ms: 250 },
    ],
    focus: { wife: { on: { css: findoePanel }, fit: "width", maxZoom: 1.45 } },
  },
  {
    id: "maya-asks",
    scene: "maya",
    steps: [
      { in: "wife", do: "type", into: { css: `${findoePanel} textarea` }, text: MAYA_QUESTION },
    ],
    // Her question, as she types it.
    focus: { wife: { on: { css: `${findoePanel} form` }, maxZoom: 1.6, spot: false } },
  },
  {
    id: "maya-answer",
    scene: "maya",
    steps: [
      { in: "wife", do: "click", on: { css: `${findoePanel} button`, text: "Send" } },
      { in: "wife", do: "wait", for: { text: "Most likely very little" } },
    ],
    focus: {
      wife: {
        on: { css: findoePanel },
        fit: "width",
        maxZoom: 1.2,
        // Her question at the top, Findoe's working beneath it...
        top: { text: MAYA_QUESTION },
      },
    },
  },
  // ...then the answer itself.
  {
    id: "maya-answer-read",
    scene: "maya",
    focus: {
      wife: {
        on: { css: findoePanel },
        fit: "width",
        maxZoom: 1.2,
        top: { text: "Wrote the answer" },
      },
    },
  },

  // --- Everyone, and what carries them -----------------------------------------
  { id: "circle", cast: "circle" },
  { id: "vision", cast: "vision" },
  { id: "finale", cast: "finale" },
];

/**
 * The tour's index: each section's name and the stop it begins with, in order.
 * The presenter can jump straight to the start of any of them.
 */
export const tourSections: { title: string; start: string }[] = [
  { title: "Opening", start: "title" },
  { title: "The Smith family", start: "smiths" },
  { title: "John's portfolio", start: "home" },
  { title: "Adding assets", start: "add" },
  { title: "Adding a vehicle", start: "vehicle" },
  { title: "Notifications and DPOA", start: "notifications" },
  { title: "Beneficiary and will reminders", start: "home-again" },
  { title: "Writing the will", start: "will" },
  { title: "John's and Maya's assets", start: "assets-again" },
  { title: "Family dashboard", start: "dashboard" },
  { title: "Sharing with David", start: "manage" },
  { title: "John passes away", start: "gathered" },
  { title: "After the loss", start: "passed" },
  { title: "Advisor dashboard and estate", start: "advisor-home" },
  { title: "Asking Findoe", start: "ask" },
  { title: "Next steps and transfer", start: "process" },
  { title: "Maya is notified", start: "handoff" },
  { title: "Maya's claims", start: "maya" },
  { title: "Maya asks Findoe", start: "maya-findoe" },
  { title: "Finale", start: "circle" },
];
