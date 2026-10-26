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
