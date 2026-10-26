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
  /** Named beneficiaries (POD/TOD or retirement designations), primary first. */
  beneficiaries?: string[];
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
  "Joint checking/savings",
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
