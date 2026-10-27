// Shared shapes for the mock data layer. When real services are wired in,
// adapters should return these same types so screens do not change.

export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negative = debit
  status?: "Pending" | "Posted";
};

export type DepositAccount = {
  id: string;
  name: string;
  last4: string;
  kind: "checking" | "savings";
  availableBalance: number;
  ledgerBalance: number;
  transactions: Transaction[];
};

export type CreditCardAccount = {
  id: string;
  name: string;
  last4: string;
  balance: number;
  availableCredit: number;
  creditLimit: number;
  minimumDue: number;
  dueDate: string;
  rewardsBalance: number;
  cardStyle: "cash-rewards" | "travel" | "core";
  transactions: Transaction[];
};

export type WalletSubAccount = {
  id: string;
  label: "Spend" | "Reserve" | "Growth";
  last4: string;
  balance: number;
  availableBalance: number;
  note?: string;
};

export type Reminder = {
  id: string;
  text: string;
  linkText?: string;
};

export type Offer = {
  id: string;
  title: string;
  body: string;
  cta: string;
};

export type PaybackOffer = {
  id: string;
  merchant: string;
  cashBack: string;
  expires: string;
};

export type Payment = {
  id: string;
  payee: string;
  account: string;
  date: string;
  amount: number;
  status: "Complete" | "Scheduled";
};

/** Everyday bills and payments offered on the family dashboard. */
export type BillCategory =
  | "electricity"
  | "mobile-prepaid"
  | "phone"
  | "investments"
  | "tolls"
  | "insurance"
  | "rent"
  | "credit-card"
  | "gas"
  | "water"
  | "cable"
  | "tuition"
  | "foreign-currency";

/** Who a bill in one category is paid to, and what is due (if the biller sends a bill). */
export type Biller = {
  category: BillCategory;
  payee: string;
  /** The customer's account number with the biller. */
  last4?: string;
  /** Left out for top-ups and contributions, where the customer picks the amount. */
  amountDue?: number;
  dueDate?: string; // ISO
};

export type Customer = {
  /** Matches the household's `AdvisorCustomer.id` on the advisor side. */
  id: string;
  firstName: string;
  lastName: string;
  tier: string;
  userIdMasked: string;
};

// ---------------------------------------------------------------------------
// Roles and the advisor (bank representative) side of the platform.

export type Role = "customer" | "advisor";

export type DemoUser = {
  userId: string;
  role: Role;
  displayName: string;
  /** For customers: who they are in the household (see src/data/household.ts). */
  personId?: string;
  /** Shown on the demo sign-on buttons, e.g. "Husband, 52". */
  hint?: string;
};

// ---------------------------------------------------------------------------
// The demo household: one source of truth for people and their accounts,
// read by every customer login and by the advisor.

/** How a household member's illustrated profile picture is drawn (see PersonAvatar). */
export type AvatarLook = "husband" | "wife" | "teen" | "child";

export type HouseholdPerson = {
  id: string;
  name: string;
  /** Relationship to the household's primary customer (Husband). */
  relationship: FamilyMemberRelationship;
  birthdate: string; // ISO
  email: string;
  /** Free text under the name, e.g. "Estate attorney". */
  note?: string;
  /** Has an online banking login. */
  login?: string;
  /** Their profile picture's look; without one, it's picked from their id. */
  avatar?: AvatarLook;
};

export type AccountKind =
  "checking" | "savings" | "ira" | "roth" | "brokerage" | "credit-card" | "life-insurance";

/** One account (or policy) belonging to someone in the household. */
export type BankAccount = {
  id: string;
  name: string;
  last4?: string;
  kind: AccountKind;
  /** Negative for a balance owed. */
  balance: number;
  /** Person ids of the legal owners. */
  owners: string[];
  /** Adult who manages a minor's account until they turn 18. */
  custodian?: string;
  /**
   * Payable- or transfer-on-death / retirement beneficiaries, as person ids.
   * Undefined where the account type has no designation.
   */
  beneficiaries?: string[];
  /** Held outside PNC (e.g. a life insurance policy); tracked for planning. */
  external?: boolean;
  transactions?: Transaction[];
};

export type Advisor = {
  firstName: string;
  lastName: string;
  title: string;
  team: string;
};

export type FamilyRelationship = "Spouse" | "Parent" | "Child" | "Sibling";

/** Who died, relative to the household's primary customer ("Self" = the primary customer). */
export type LossRelationship = FamilyRelationship | "Self";

/** A life event recorded against a customer, e.g. the death of a family member. */
export type LossEvent = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  relationship: LossRelationship;
  memberName: string;
  reportedVia: "Branch visit" | "Phone call" | "Mobile app" | "Estate attorney";
  /** Advisor has completed the follow-up steps; the customer is no longer flagged. */
  followUpComplete: boolean;
};

export type HouseholdMember = {
  name: string;
  relationship: FamilyRelationship;
};

/** Where a customer is with adding a will to their account. */
export type WillStatus = "none" | "in-progress" | "on-file";

export type WillRecord = {
  status: WillStatus;
  /** ISO date the will was last saved (absent when there is no will). */
  updated?: string;
};

/** A customer household assigned to the advisor by the bank. */
export type AdvisorCustomer = {
  id: string;
  name: string; // primary customer
  household: HouseholdMember[];
  segment: "Private Bank" | "Wealth Management" | "Preferred Banking";
  relationshipValue: number;
  accountCount: number;
  lastContact: string; // ISO date
  nextReview: string; // ISO date
  lossEvents: LossEvent[];
  will: WillRecord;
};

// ---------------------------------------------------------------------------
// Client profiles behind the advisor's Client Summary and assistant.

export type ClientMemberStatus = "Living" | "Deceased";

/** A person in (or close to) the client's household, with estate-relevant roles. */
export type ClientMember = {
  name: string;
  relationship: FamilyRelationship | "Self" | "Grandchild" | "Sibling-in-law" | "Attorney";
  age?: number;
  status: ClientMemberStatus;
  /** ISO date of death, for deceased members. */
  died?: string;
  /** e.g. "Executor of Riley's will", "Successor trustee". */
  roles: string[];
  /** One line the advisor should know, e.g. "Lives in Denver; speaks weekly with Avery". */
  note?: string;
  contact?: string;
};

export type HoldingType =
  | "Checking"
  | "Savings"
  | "Money market"
  | "CD"
  | "Brokerage"
  | "Traditional IRA"
  | "Roth IRA"
  | "401(k) rollover IRA"
  | "Inherited IRA"
  | "Trust"
  | "529 plan"
  | "Life insurance"
  | "Credit card";

export type Ownership = "Individual" | "Joint" | "Trust" | "Custodial";

export type Holding = {
  id: string;
  name: string;
  last4?: string;
  type: HoldingType;
  /** Negative for balances owed. */
  value: number;
  ownership: Ownership;
  /** Names of the legal owners (trustees for a trust). */
  owners: string[];
  /**
   * Named co-primary beneficiaries (POD/TOD or retirement designations), equal shares.
   * For 529 plans these are the students, not who inherits the account.
   */
  beneficiaries?: string[];
  /** Named contingent beneficiaries (paid only if every primary beneficiary has died). */
  contingentBeneficiaries?: string[];
  /** 529 plans: who becomes account owner if the owner dies. Absent = not on file. */
  successorOwner?: string;
  /** Held outside PNC; tracked for planning, not counted in the relationship. */
  external?: boolean;
};

export type Interaction = {
  date: string; // ISO date
  channel: "Phone" | "Email" | "In person" | "Video" | "Text";
  summary: string;
};

export type ClientProfile = {
  customerId: string;
  age: number;
  occupation: string;
  city: string;
  clientSince: number;
  contactPreference: "Phone" | "Email" | "In person" | "Text";
  riskProfile: "Conservative" | "Moderate" | "Growth";
  goals: string[];
  /** Advisor's private notes, newest first. */
  notes: string[];
  members: ClientMember[];
  holdings: Holding[];
  interactions: Interaction[];
};

export type AdvisorNotificationKind = "loss" | "review" | "deposit" | "document";

export type AdvisorNotification = {
  id: string;
  kind: AdvisorNotificationKind;
  customerId: string;
  title: string;
  /** One line shown while the notification is collapsed. */
  summary: string;
  body: string;
  date: string; // ISO date
  urgent: boolean;
  /** Suggested next steps (shown for urgent notifications). */
  steps?: string[];
  /** Suggested wording for a humane first call (loss notifications). */
  outreach?: string;
};

// ---------------------------------------------------------------------------
// Family dashboard (customer side): role-based access and asset control.

export type FamilyMemberRelationship = "Self" | "Spouse" | "Child" | "Parent" | "Sibling" | "Other";

export type FamilyMemberStatus = "Active" | "Invited" | "Deceased";

export type FamilyMember = {
  id: string;
  name: string;
  email: string;
  relationship: FamilyMemberRelationship;
  /** Free-text detail shown under the name, e.g. "Estate attorney". */
  note?: string;
  roleId: string;
  status: FamilyMemberStatus;
};

/** What a role may do with one asset. View is implied by any other permission. */
export type AssetAccess = {
  /** Visibility: see the asset and its balance. */
  view: boolean;
  /** Visibility: see transactions, statements and documents. */
  activity: boolean;
  /** Control: move money, pay, trade. */
  transact: boolean;
  /** Control: change settings, cards, beneficiaries. */
  manage: boolean;
};

export type FamilyRole = {
  id: string;
  name: string;
  description: string;
  /** Admins can add members and assets and manage access; full access to every asset. */
  isAdmin: boolean;
  /** Built-in roles cannot be renamed or deleted. */
  builtIn: boolean;
  /** Per-asset access, keyed by asset id. Missing = no access. */
  access: Record<string, AssetAccess>;
};

export const assetCategories = [
  "Checking & savings",
  "Real Estate",
  "Brokerage account",
  "401(k) / IRA",
  "Life insurance",
  "Social Security",
  "Pension",
  "Employer benefits",
  "Vehicles",
  "Digital assets, crypto, loyalty points",
  "Business interests",
  "Debts",
  "IP",
] as const;

export type AssetCategory = (typeof assetCategories)[number];

/** How an asset legally passes when an owner dies. Drives the required steps. */
export type SuccessionMethod =
  "joint" | "pod" | "tod" | "retirement" | "trust" | "estate" | "close";

export type SuccessionStep = { id: string; label: string; detail: string };

export type FamilyAsset = {
  id: string;
  name: string;
  last4?: string;
  category: AssetCategory;
  value: number;
  /** Member ids of the legal owners (or trustees for a trust). */
  owners: string[];
  /** How the asset passes legally on an owner's death (not collected for new assets yet). */
  method?: SuccessionMethod;
  /**
   * Who takes control after an owner's death, for methods that name someone
   * (POD/TOD/retirement beneficiaries, estate executor). Joint and trust
   * assets pass to the surviving owners/trustees instead.
   */
  successors?: string[];
  /** Replaces the method's standard steps when an asset needs its own process. */
  steps?: SuccessionStep[];
  /** Held outside PNC (e.g. a home) — tracked for the family's plan only. */
  external?: boolean;
  closed?: boolean;
};

export type SuccessionProcess = {
  id: string;
  assetId: string;
  deceasedId: string;
  startedOn: string; // ISO date
  completedStepIds: string[];
  status: "in-progress" | "complete";
};

export type FamilyState = {
  familyName: string;
  /** The signed-in customer's member id. */
  selfId: string;
  members: FamilyMember[];
  roles: FamilyRole[];
  assets: FamilyAsset[];
  processes: SuccessionProcess[];
};

// ---------------------------------------------------------------------------
// Will planner reference data.

export type CharityCause =
  | "Health"
  | "Education"
  | "Environment"
  | "Animals"
  | "Veterans"
  | "Human Services"
  | "International";

/** A placeholder nonprofit offered in the will planner's charity grid. */
export type PlaceholderCharity = {
  id: string;
  name: string;
  cause: CharityCause;
  blurb: string;
  featured: boolean;
};

// ---------------------------------------------------------------------------
// Settlement rules engine: what legally happens to each account when someone
// dies, with the rule and source behind every step. Data in src/data/settlement,
// engine in src/lib/settlement. General guidance, not legal or tax advice.

export type Jurisdiction = "US" | "PA";

export type SourceAuthority =
  | "IRS"
  | "US Treasury"
  | "FDIC"
  | "SSA"
  | "CFPB"
  | "PA General Assembly"
  | "PA Department of Revenue"
  | "PNC"
  | "Plan documents";

export type SourceKind =
  | "statute"
  | "regulation"
  | "agency-guidance"
  | "form-instructions"
  | "bank-policy"
  | "plan-document";

export type RuleSource = {
  id: string;
  /** Short display title, e.g. "Right of survivorship". */
  title: string;
  /** Formal cite, e.g. "20 Pa.C.S. § 6304". */
  citation: string;
  authority: SourceAuthority;
  jurisdiction: Jurisdiction;
  kind: SourceKind;
  url: string;
  /** One or two sentences in our own words: what the source says that the rule relies on. */
  summary: string;
  /** ISO date someone on the team checked the source; absent = not yet verified. */
  verifiedOn?: string;
};

export type AccountClass =
  | "deposit" // checking, savings, money market
  | "cd"
  | "brokerage"
  | "ira-traditional" // incl. 401(k) rollover IRA
  | "ira-roth"
  | "ira-inherited"
  | "trust"
  | "education-529"
  | "life-insurance"
  | "credit-card"
  | "real-estate"
  | "vehicle"
  | "other";

/** What the person who died was to this account. */
export type DecedentRole =
  | "sole-owner"
  | "joint-owner"
  | "co-trustee"
  | "sole-trustee"
  | "plan-owner" // 529 account owner
  | "named-beneficiary" // someone else's account names them
  | "not-involved";

export type BeneficiaryStatus = "living" | "none-on-file" | "all-deceased" | "not-applicable";

export type PrimaryBeneficiaryCategory =
  | "spouse"
  | "minor-child-of-decedent"
  | "within-10-years-of-age" // not more than 10 years younger than the decedent
  | "other-individual"
  | "not-applicable";

export type TriState = "yes" | "no" | "unknown";

export type StateCode = "PA" | "other";

/** Discrete facts about one account, relative to one death. */
export type AccountFactValues = {
  accountClass: AccountClass;
  decedentRole: DecedentRole;
  beneficiaryStatus: BeneficiaryStatus;
  primaryBeneficiaryCategory: PrimaryBeneficiaryCategory;
  beneficiaryCount: number;
  anyBeneficiaryMinor: TriState;
  decedentPastRequiredBeginningDate: TriState;
  successorOwnerNamed: TriState; // 529 plans
  /** Never in our records; only the advisor can confirm it. */
  beneficiaryDisabledOrIll: TriState;
  heldOutsidePnc: boolean;
  value: number;
  state: StateCode;
};

export type AccountFactKey = keyof AccountFactValues;

/** One fact with the plain-English evidence it was derived from. */
export type Fact<V> = { value: V; evidence: string };
export type AccountFacts = { [K in AccountFactKey]: Fact<AccountFactValues[K]> };

/** Household-level facts for one death. */
export type HouseholdFactValues = {
  state: StateCode;
  survivorIsSpouse: boolean;
  executorKnown: boolean;
  hasProbateAssets: boolean;
  probateValueAtPnc: number;
  /** Rough decedent gross estate (see facts.ts for the formula); always paired with an assumption. */
  estimatedGrossEstate: number;
  receivedFederalBenefits: TriState;
};

export type HouseholdFactKey = keyof HouseholdFactValues;
export type HouseholdFacts = { [K in HouseholdFactKey]: Fact<HouseholdFactValues[K]> };

/** A test on one fact. All clauses in a list must hold (AND). */
export type Clause<K extends string = string> = {
  fact: K;
  eq?: string | number | boolean;
  in?: (string | number | boolean)[];
  gt?: number;
  lte?: number;
};

export type SettlementRoute =
  | "survivorship"
  | "beneficiary-claim"
  | "spousal-retirement-options"
  | "inherited-retirement"
  | "successor-trustee"
  | "successor-owner"
  | "probate"
  | "closes-estate-pays"
  | "insurer-claim"
  | "designation-update"
  | "not-affected"
  | "needs-review";

export type ReviewLevel = "advisor" | "operations" | "trust-officer" | "attorney" | "tax-advisor";

export type ActionOwner =
  | "advisor"
  | "client"
  | "executor"
  | "bank-operations"
  | "trust-officer"
  | "attorney"
  | "tax-advisor"
  | "insurer";

export type DeadlineAnchor =
  | { from: "date-of-death"; months: number }
  | { from: "dec-31"; yearsAfterDeath: number } // 0 = Dec 31 of the year of death
  | { from: "apr-15"; yearsAfterDeath: number };

export type DeadlineKind = "statutory" | "recommended" | "opportunity";

export type RuleAction = {
  id: string;
  label: string;
  /** Advisor-facing detail; may contain {decedent}, {survivor}, {account} placeholders. */
  detail: string;
  owner: ActionOwner;
  deadline?: { anchor: DeadlineAnchor; kind: DeadlineKind; label: string };
  sources: string[];
};

export type DecisionNode = {
  id: string;
  kind: "decision";
  question: string;
  fact: AccountFactKey;
  /** One branch per possible value of `fact` (enforced by a test). */
  branches: { when: string; label: string; next: string }[];
  sources: string[];
};

export type OutcomeNode = {
  id: string;
  kind: "outcome";
  route: SettlementRoute;
  title: string;
  /** Advisor-facing explanation. Placeholders allowed. */
  summary: string;
  /** Client-facing explanation: gentle, no jargon, no urgency. Placeholders allowed. */
  plain: string;
  passesTo:
    | "surviving-owners"
    | "beneficiaries"
    | "estate"
    | "successor-trustee"
    | "successor-owner"
    | "nobody"
    | "unchanged";
  probate: boolean;
  survivorAccess: "uninterrupted" | "after-claim" | "after-letters" | "not-applicable";
  typicalTimeline: string;
  actions: string[];
  review: ReviewLevel[];
  sources: string[];
};

export type RuleNode = DecisionNode | OutcomeNode;

/** One answer the advisor can pick; `value` is the fact value it sets. */
export type AskOption = { value: string; label: string };

/**
 * A fact the rulebook needs but our records don't have. Raised while the fact
 * is "unknown"; the advisor's answer becomes the fact and the tree is re-walked.
 */
export type RuleAsk<K extends string> = {
  fact: K;
  question: string;
  /** Defaults to Yes / No for yes-no-unknown facts. */
  options?: AskOption[];
};

export type Overlay = {
  id: string;
  title: string;
  /** Extra condition on the outcome's route; omitted = any route. */
  routes?: SettlementRoute[];
  when: Clause<AccountFactKey>[];
  detail: string;
  actions: string[];
  review?: ReviewLevel[];
  /** Show as a warning chip on the account row. */
  attention?: boolean;
  /** Questions to raise when a fact used here is "unknown". */
  asks?: RuleAsk<AccountFactKey>[];
  sources: string[];
};

export type HouseholdRule = {
  id: string;
  jurisdiction: Jurisdiction;
  title: string;
  when: Clause<HouseholdFactKey>[];
  detail: string;
  actions: string[];
  review?: ReviewLevel[];
  asks?: RuleAsk<HouseholdFactKey>[];
  sources: string[];
};

export type Rulebook = {
  version: string;
  /** ISO date the rule content was last reviewed. */
  asOf: string;
  rootNodeId: string;
  nodes: Record<string, RuleNode>;
  actions: Record<string, RuleAction>;
  overlays: Overlay[];
  household: HouseholdRule[];
  sources: Record<string, RuleSource>;
};
