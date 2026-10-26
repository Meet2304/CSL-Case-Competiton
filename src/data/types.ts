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

/** A life event recorded against a customer, e.g. the death of a family member. */
export type LossEvent = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  relationship: FamilyRelationship;
  memberName: string;
  reportedVia: "Branch visit" | "Phone call" | "Mobile app" | "Estate attorney";
  /** Advisor has completed the follow-up steps; the customer is no longer flagged. */
  followUpComplete: boolean;
};

export type HouseholdMember = {
  name: string;
  relationship: FamilyRelationship;
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
};
