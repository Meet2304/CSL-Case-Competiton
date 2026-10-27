/**
 * Answers collected by the will planner. Free-text and numeric inputs are
 * kept as strings so half-typed values survive a reload; they are parsed
 * when validating or generating the will.
 */

export type YesNo = "yes" | "no";
export type Gender = "male" | "female" | "trans" | "non-binary";
export type MaritalStatus = "single" | "married" | "partnership";
export type OwnedBy = "me" | "me-spouse" | "me-other";

export type Address = {
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
};

export type Person = { id: string; name: string; relationship: string };
export type Child = { id: string; name: string; birthdate: string };

export type Beneficiary = {
  id: string;
  kind: "person" | "charity";
  name: string;
  relationship: string;
  /** Whole or decimal percent, as typed. */
  percent: string;
};

export type AssetCategory =
  "financial" | "retirement" | "insurance" | "real-estate" | "vehicle" | "brokerage" | "other";

export type Asset = {
  id: string;
  category: AssetCategory;
  institution: string;
  accountType: string;
  description: string;
  location: string;
  value: string;
  ownedBy?: OwnedBy;
  payableOnDeath: boolean;
  nickname: string;
  address: Address;
};

export type GiftType = "real-estate" | "vehicle" | "cash" | "digital" | "other";

export type Gift = {
  id: string;
  type: GiftType;
  description: string;
  amount: string;
  address: Address;
  primary: Person[];
  contingent: Person[];
};

export type PrimaryPlan = "spouse" | "custom";
export type SecondaryPlan = "children" | "descendants" | "share" | "charity" | "custom";
export type TertiaryPlan = "charity" | "custom";
export type LastResortPlan = "charity" | "heirs" | "custom";

export type Distribution<P extends string> = { plan?: P; beneficiaries: Beneficiary[] };

export type WillDraft = {
  basics: {
    gender?: Gender;
    birthdate: string;
    phone: string;
    address: Address;
    marital?: MaritalStatus;
    spouse: { first: string; middle: string; last: string };
  };
  nominees: {
    hasChildren?: YesNo;
    children: Child[];
    guardians: Person[];
    hasPets?: YesNo;
    petNames: string;
    petGuardians: Person[];
  };
  assets: {
    method?: "list" | "estimate";
    estimate?: string;
    items: Asset[];
  };
  residuary: {
    /** Names of nonprofits picked on "What do you care about?". */
    charities: string[];
    consent?: "yes" | "no";
    primary: Distribution<PrimaryPlan>;
    secondary: Distribution<SecondaryPlan>;
    tertiary: Distribution<TertiaryPlan>;
    lastResort: Distribution<LastResortPlan>;
  };
  gifts: Gift[];
  funeral: {
    people: Person[];
    service: string;
    body: string;
    charities: string[];
  };
  provisions: {
    executors: Person[];
    digital?: YesNo;
    digitalExecutors: Person[];
    digitalComms?: YesNo;
    noContest?: YesNo;
    affidavit?: YesNo;
    independent?: "yes" | "no" | "say-nothing";
    statement?: YesNo;
    statementText: string;
  };
  review: {
    mirror?: YesNo;
    spouseGender?: Gender;
    spouseBirthdate: string;
    spouseConsent: boolean;
  };
};

/** Where the planner is, saved alongside the answers so it resumes in place. */
export type WillProgress = {
  screen: string;
  /** Furthest screen index reached. */
  furthest: number;
  /**
   * Screens answered with "Save & Continue". Section progress is derived from
   * these plus the current answers (see `sectionProgress`). Older saves lack
   * it and fall back to every screen before `furthest`.
   */
  answered?: string[];
  /** Set when a screen was opened from the review page's Edit link. */
  returnToReview: boolean;
};

let seq = 0;
/** Short unique id for list rows. */
export function newId(prefix = "row"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export const emptyAddress = (): Address => ({
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
});
export const emptyPerson = (): Person => ({ id: newId("p"), name: "", relationship: "" });

export function emptyDraft(): WillDraft {
  return {
    basics: {
      birthdate: "",
      phone: "",
      address: emptyAddress(),
      spouse: { first: "", middle: "", last: "" },
    },
    nominees: {
      children: [],
      guardians: [emptyPerson()],
      petNames: "",
      petGuardians: [emptyPerson()],
    },
    assets: { items: [] },
    residuary: {
      charities: [],
      primary: { beneficiaries: [] },
      secondary: { beneficiaries: [] },
      tertiary: { beneficiaries: [] },
      lastResort: { beneficiaries: [] },
    },
    gifts: [],
    funeral: { people: [emptyPerson()], service: "", body: "", charities: [] },
    provisions: {
      executors: [emptyPerson()],
      digitalExecutors: [emptyPerson()],
      statementText: "",
    },
    review: { spouseBirthdate: "", spouseConsent: false },
  };
}
