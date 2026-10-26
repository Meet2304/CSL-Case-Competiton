import { MOCK_AS_OF } from "@/data/mock";
import {
  newId,
  type Beneficiary,
  type LastResortPlan,
  type Person,
  type PrimaryPlan,
  type SecondaryPlan,
  type TertiaryPlan,
  type WillDraft,
} from "./types";

/**
 * The will planner's step order. Each screen belongs to one of the eight
 * sections in the stepper, may be skipped based on earlier answers, and
 * validates the answers that native form validation can't (option tiles,
 * allocation totals). Text inputs use `required` / `pattern` so the browser
 * shows its own "Please fill in this field." bubble.
 */

export const sections = [
  "Basics",
  "Nominees",
  "Assets",
  "Residuary",
  "Gifts",
  "Funeral",
  "Provisions",
  "Review",
] as const;

export type Errors = Record<string, string>;

export const REQUIRED = "Required";
export const PAGE_ERROR =
  "Please check that all required fields are filled out correctly. You may need to scroll down.";

type ScreenDef = {
  id: string;
  section: number;
  skip?: (d: WillDraft) => boolean;
  validate?: (d: WillDraft) => Errors;
};

// ---------------------------------------------------------------------------
// Answer helpers shared by screens, the summary and the will generator.

export const isMarried = (d: WillDraft) => d.basics.marital === "married";

export function spouseName(d: WillDraft): string {
  const { first, middle, last } = d.basics.spouse;
  return [first, middle, last]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

export const named = <T extends { name: string }>(rows: T[]) =>
  rows.filter((r) => r.name.trim() !== "");

export const hasChildren = (d: WillDraft) =>
  d.nominees.hasChildren === "yes" && named(d.nominees.children).length > 0;

/** Children under 18 on the prototype's fixed "today". */
export function minorChildren(d: WillDraft) {
  if (d.nominees.hasChildren !== "yes") return [];
  return named(d.nominees.children).filter(
    (c) => c.birthdate && ageOn(c.birthdate, MOCK_AS_OF) < 18,
  );
}

export function ageOn(birthIso: string, todayIso: string): number {
  const [by, bm, bd] = birthIso.split("-").map(Number);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export const parsePercent = (p: string) => Number.parseFloat(p);
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const totalPercent = (rows: Beneficiary[]) =>
  round2(rows.reduce((s, b) => s + (parsePercent(b.percent) || 0), 0));

/** Rows shown/used for the primary distribution under the chosen plan. */
export function primaryRows(d: WillDraft): Beneficiary[] {
  const { plan, beneficiaries } = d.residuary.primary;
  return plan === "spouse" ? beneficiaries.filter((b) => b.kind === "charity") : beneficiaries;
}

/** Selecting a nonprofit on "What do you care about?" adds it to the primary plan. */
export function toggleCharity(d: WillDraft, name: string): WillDraft {
  const selected = d.residuary.charities.includes(name);
  const primary = d.residuary.primary.beneficiaries;
  return {
    ...d,
    residuary: {
      ...d.residuary,
      charities: selected
        ? d.residuary.charities.filter((c) => c !== name)
        : [...d.residuary.charities, name],
      primary: {
        ...d.residuary.primary,
        beneficiaries: selected
          ? primary.filter((b) => !(b.kind === "charity" && b.name === name))
          : primary.some((b) => b.kind === "charity" && b.name === name)
            ? primary
            : [
                ...primary,
                { id: newId("b"), kind: "charity", name, relationship: "", percent: "" },
              ],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Options whose availability depends on earlier answers.

export type Option<V extends string> = { value: V; label: string };

export function primaryOptions(d: WillDraft): Option<PrimaryPlan>[] {
  return [
    ...(isMarried(d)
      ? [{ value: "spouse" as const, label: `Leave the rest to my spouse, ${spouseName(d)}` }]
      : []),
    { value: "custom", label: "Create a custom plan" },
  ];
}

export function secondaryOptions(d: WillDraft): Option<SecondaryPlan>[] {
  const charity = { value: "charity" as const, label: "Leave it to charity" };
  const custom = { value: "custom" as const, label: "Create a custom plan" };
  if (d.residuary.primary.plan === "spouse") {
    return [
      ...(hasChildren(d)
        ? [
            {
              value: "children" as const,
              label: "Split evenly among my children, else to their respective descendants",
            },
          ]
        : []),
      charity,
      custom,
    ];
  }
  return [
    { value: "descendants", label: "Give it to their respective descendants" },
    { value: "share", label: "Split it among my surviving primary beneficiaries" },
    charity,
    custom,
  ];
}

export const tertiaryOptions: Option<TertiaryPlan>[] = [
  { value: "charity", label: "Leave it to charity" },
  { value: "custom", label: "Create a custom plan" },
];

export const lastResortOptions: Option<LastResortPlan>[] = [
  { value: "charity", label: "Leave it to charity" },
  { value: "heirs", label: "Leave it to my heirs" },
  { value: "custom", label: "Create a custom plan" },
];

export const needsTertiary = (d: WillDraft) =>
  d.residuary.secondary.plan === "children" || d.residuary.secondary.plan === "descendants";

// ---------------------------------------------------------------------------
// Validation helpers.

const req = (ok: unknown, key: string, errors: Errors, message = REQUIRED) => {
  if (!ok) errors[key] = message;
};

/** Every row needs a positive share and the shares must total exactly 100%. */
export function allocationError(
  rows: Beneficiary[],
  { charityOnly = false } = {},
): string | undefined {
  if (rows.length === 0)
    return charityOnly ? "Add at least one charity" : "Add at least one beneficiary";
  if (rows.some((b) => !(parsePercent(b.percent) > 0)))
    return "Enter an allocation greater than 0% for each beneficiary";
  if (totalPercent(rows) !== 100) return "Your distribution must equal exactly 100% to continue";
}

function planErrors(
  plan: string | undefined,
  options: Option<string>[],
  rows: Beneficiary[],
  errors: Errors,
) {
  if (!plan || !options.some((o) => o.value === plan)) {
    errors.plan = REQUIRED;
    return;
  }
  if (plan === "charity" || plan === "custom") {
    const e = allocationError(rows, { charityOnly: plan === "charity" });
    if (e) errors.allocation = e;
  }
}

function peopleError(rows: Person[], errors: Errors, key = "people") {
  if (named(rows).length === 0) errors[key] = "Add at least one person";
}

/** Rows for a charity-only plan ignore any people entered under "custom". */
export function planRows(plan: string | undefined, rows: Beneficiary[]) {
  return plan === "charity" ? rows.filter((b) => b.kind === "charity") : rows;
}

// ---------------------------------------------------------------------------
// The screens, in order.

export const screens: ScreenDef[] = [
  {
    id: "basics.details",
    section: 0,
    validate: (d) => {
      const e: Errors = {};
      req(d.basics.gender, "gender", e);
      if (d.basics.birthdate && ageOn(d.basics.birthdate, MOCK_AS_OF) < 18) {
        e.birthdate = "You must be at least 18 years old to make a will.";
      }
      return e;
    },
  },
  {
    id: "basics.marital",
    section: 0,
    validate: (d) => {
      const e: Errors = {};
      req(d.basics.marital, "marital", e);
      return e;
    },
  },
  {
    id: "nominees.children",
    section: 1,
    validate: (d) => {
      const e: Errors = {};
      req(d.nominees.hasChildren, "hasChildren", e);
      if (d.nominees.hasChildren === "yes" && named(d.nominees.children).length === 0)
        e.children = "Add at least one child";
      return e;
    },
  },
  {
    id: "nominees.guardians",
    section: 1,
    skip: (d) => minorChildren(d).length === 0,
    validate: (d) => {
      const e: Errors = {};
      peopleError(d.nominees.guardians, e);
      return e;
    },
  },
  {
    id: "nominees.pets",
    section: 1,
    validate: (d) => {
      const e: Errors = {};
      req(d.nominees.hasPets, "hasPets", e);
      if (d.nominees.hasPets === "yes") peopleError(d.nominees.petGuardians, e);
      return e;
    },
  },
  {
    id: "assets.method",
    section: 2,
    validate: (d) => {
      const e: Errors = {};
      req(d.assets.method, "method", e);
      return e;
    },
  },
  {
    id: "assets.estimate",
    section: 2,
    skip: (d) => d.assets.method !== "estimate",
    validate: (d) => {
      const e: Errors = {};
      req(d.assets.estimate, "estimate", e);
      return e;
    },
  },
  { id: "assets.list", section: 2, skip: (d) => d.assets.method !== "list" },
  { id: "residuary.causes", section: 3 },
  {
    id: "residuary.consent",
    section: 3,
    skip: (d) => d.residuary.charities.length === 0,
    validate: (d) => {
      const e: Errors = {};
      req(d.residuary.consent, "consent", e);
      return e;
    },
  },
  {
    id: "residuary.primary",
    section: 3,
    validate: (d) => {
      const e: Errors = {};
      const { plan } = d.residuary.primary;
      if (!plan || !primaryOptions(d).some((o) => o.value === plan)) e.plan = REQUIRED;
      else if (plan === "custom") {
        const err = allocationError(d.residuary.primary.beneficiaries);
        if (err) e.allocation = err;
      } else {
        const rows = primaryRows(d);
        if (rows.some((b) => !(parsePercent(b.percent) > 0)))
          e.allocation = "Enter an allocation greater than 0% for each charity";
        else if (totalPercent(rows) >= 100)
          e.allocation =
            "Gifts to charity must total less than 100% so your spouse receives the rest";
      }
      return e;
    },
  },
  {
    id: "residuary.secondary",
    section: 3,
    validate: (d) => {
      const e: Errors = {};
      const { plan, beneficiaries } = d.residuary.secondary;
      planErrors(plan, secondaryOptions(d), planRows(plan, beneficiaries), e);
      return e;
    },
  },
  {
    id: "residuary.tertiary",
    section: 3,
    skip: (d) => !needsTertiary(d),
    validate: (d) => {
      const e: Errors = {};
      const { plan, beneficiaries } = d.residuary.tertiary;
      planErrors(plan, tertiaryOptions, planRows(plan, beneficiaries), e);
      return e;
    },
  },
  {
    id: "residuary.lastResort",
    section: 3,
    validate: (d) => {
      const e: Errors = {};
      const { plan, beneficiaries } = d.residuary.lastResort;
      planErrors(plan, lastResortOptions, planRows(plan, beneficiaries), e);
      return e;
    },
  },
  { id: "residuary.summary", section: 3 },
  {
    id: "gifts",
    section: 4,
    validate: (d) => {
      const e: Errors = {};
      for (const g of d.gifts) {
        if (named(g.primary).length === 0) e[g.id] = "Assign at least one primary beneficiary";
      }
      return e;
    },
  },
  { id: "funeral", section: 5 },
  {
    id: "provisions.executors",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      peopleError(d.provisions.executors, e);
      return e;
    },
  },
  {
    id: "provisions.digital",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      req(d.provisions.digital, "digital", e);
      if (d.provisions.digital === "yes") peopleError(d.provisions.digitalExecutors, e);
      req(d.provisions.digitalComms, "digitalComms", e);
      return e;
    },
  },
  {
    id: "provisions.noContest",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      req(d.provisions.noContest, "noContest", e);
      return e;
    },
  },
  {
    id: "provisions.affidavit",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      req(d.provisions.affidavit, "affidavit", e);
      return e;
    },
  },
  {
    id: "provisions.independent",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      req(d.provisions.independent, "independent", e);
      return e;
    },
  },
  {
    id: "provisions.statement",
    section: 6,
    validate: (d) => {
      const e: Errors = {};
      req(d.provisions.statement, "statement", e);
      return e;
    },
  },
  {
    id: "review.mirror",
    section: 7,
    skip: (d) => !isMarried(d),
    validate: (d) => {
      const e: Errors = {};
      req(d.review.mirror, "mirror", e);
      if (d.review.mirror === "yes") req(d.review.spouseGender, "spouseGender", e);
      return e;
    },
  },
  { id: "review.summary", section: 7 },
];

export const FIRST_SCREEN = screens[0].id;
export const REVIEW_SCREEN = "review.summary";

export const screenIndex = (id: string) =>
  Math.max(
    0,
    screens.findIndex((s) => s.id === id),
  );
export const screenDef = (id: string) => screens[screenIndex(id)];

const visible = (d: WillDraft) => screens.filter((s) => !s.skip?.(d));

export function nextScreen(d: WillDraft, id: string): string {
  const from = screenIndex(id);
  return visible(d).find((s) => screenIndex(s.id) > from)?.id ?? REVIEW_SCREEN;
}

export function prevScreen(d: WillDraft, id: string): string | undefined {
  const from = screenIndex(id);
  return visible(d)
    .filter((s) => screenIndex(s.id) < from)
    .at(-1)?.id;
}

export function firstScreenOf(d: WillDraft, section: number): string {
  return visible(d).find((s) => s.section === section)?.id ?? FIRST_SCREEN;
}

export function validateScreen(d: WillDraft, id: string): Errors {
  return screenDef(id).validate?.(d) ?? {};
}

/** Visible screens whose answers no longer validate (e.g. after an edit from the review page). */
export function incompleteScreens(d: WillDraft): string[] {
  return visible(d)
    .filter((s) => Object.keys(s.validate?.(d) ?? {}).length > 0)
    .map((s) => s.id);
}

/** Short screen names for the review page's "still needs answers" list. */
export const screenTitles: Record<string, string> = {
  "basics.details": "Basic details",
  "basics.marital": "Marital status",
  "nominees.children": "Your children",
  "nominees.guardians": "Guardian for minor children",
  "nominees.pets": "Pet guardian",
  "assets.method": "How you provide your assets",
  "assets.estimate": "Total value of assets",
  "assets.list": "List of major assets",
  "residuary.causes": "What do you care about?",
  "residuary.consent": "Supporting nonprofits",
  "residuary.primary": "Primary beneficiaries",
  "residuary.secondary": "Secondary beneficiaries",
  "residuary.tertiary": "Tertiary beneficiaries",
  "residuary.lastResort": "Takers of last resort",
  "residuary.summary": "Residuary summary",
  gifts: "Specific gifts",
  funeral: "Funeral wishes",
  "provisions.executors": "Executors",
  "provisions.digital": "Digital executors",
  "provisions.noContest": "No-contest clause",
  "provisions.affidavit": "Self-proving affidavit",
  "provisions.independent": "Independent administration",
  "provisions.statement": "Personal statement",
  "review.mirror": "Mirror Wills",
  "review.summary": "Review",
};
