/**
 * MOCK DATA — every name, number and balance in this file is invented for the
 * CSL Case Competition prototype. Nothing here belongs to a real person or a
 * real PNC account. Screens must read from this module (never hard-code
 * figures in components) so the mock source stays obvious and swappable.
 */
import type {
  CreditCardAccount,
  Customer,
  DepositAccount,
  Offer,
  PaybackOffer,
  Payment,
  Reminder,
  WalletSubAccount,
} from "./types";

/** Fixed "today" so pages render identically on server and client. */
export const MOCK_AS_OF = "2026-10-25";

export const customer: Customer = {
  firstName: "Jordan",
  lastName: "Sample",
  tier: "Silver Tier Member",
  userIdMasked: "••••••0000",
};

export const depositAccounts: DepositAccount[] = [
  {
    id: "chk-0001",
    name: "Performance Select Checking",
    last4: "0001",
    kind: "checking",
    availableBalance: 12480.55,
    ledgerBalance: 12612.3,
    transactions: [
      { id: "t1", date: "2026-10-24", description: "Sample Grocer #12", amount: -86.42, status: "Pending" },
      { id: "t2", date: "2026-10-23", description: "Payroll — Demo Employer LLC", amount: 3250.0, status: "Posted" },
      { id: "t3", date: "2026-10-22", description: "Online Transfer to Savings x0002", amount: -500.0, status: "Posted" },
      { id: "t4", date: "2026-10-20", description: "Demo Coffee Roasters", amount: -6.75, status: "Posted" },
    ],
  },
  {
    id: "sav-0002",
    name: "High Yield Savings",
    last4: "0002",
    kind: "savings",
    availableBalance: 26180.28,
    ledgerBalance: 26180.28,
    transactions: [
      { id: "t5", date: "2026-10-22", description: "Online Transfer from Checking x0001", amount: 500.0, status: "Posted" },
      { id: "t6", date: "2026-09-30", description: "Interest Payment", amount: 41.19, status: "Posted" },
    ],
  },
];

export const creditCardAccounts: CreditCardAccount[] = [
  {
    id: "cc-4545",
    name: "PNC Cash Rewards® Visa®",
    last4: "0003",
    balance: 1284.19,
    availableCredit: 8715.81,
    creditLimit: 10000,
    minimumDue: 35.0,
    dueDate: "2026-11-14",
    rewardsBalance: 257.1,
    cardStyle: "cash-rewards",
    transactions: [
      { id: "t7", date: "2026-10-24", description: "Example Fuel Station", amount: -48.1, status: "Pending" },
      { id: "t8", date: "2026-10-21", description: "Sample Streaming Service", amount: -15.99, status: "Posted" },
      { id: "t9", date: "2026-10-18", description: "Demo Home Goods", amount: -212.6, status: "Posted" },
    ],
  },
  {
    id: "cc-7788",
    name: "PNC Core® Visa®",
    last4: "0004",
    balance: 0,
    availableCredit: 5000,
    creditLimit: 5000,
    minimumDue: 0,
    dueDate: "2026-11-20",
    rewardsBalance: 0,
    cardStyle: "core",
    transactions: [],
  },
];

/** The mobile "Virtual Wallet With Performance Spend" bundle. */
export const virtualWallet: { title: string; accounts: WalletSubAccount[] } = {
  title: "Virtual Wallet With Performance Spend",
  accounts: [
    {
      id: "vw-spend",
      label: "Spend",
      last4: "0005",
      balance: -36.0,
      availableBalance: -536.0,
      note: "Free Balance until Nov. 23",
    },
    { id: "vw-reserve", label: "Reserve", last4: "0006", balance: 9274.33, availableBalance: 9274.33 },
    { id: "vw-growth", label: "Growth", last4: "0007", balance: 827.45, availableBalance: 827.45 },
  ],
};

export const reminders: Reminder[] = [
  { id: "r1", text: "Your Monthly Statement for Checking x0001 is ready.", linkText: "View statement" },
  { id: "r2", text: "Your Cash Rewards Visa x0003 payment of $35.00 is due Nov. 14.", linkText: "Make a payment" },
  { id: "r3", text: "Set up additional security alerts to help secure your accounts.", linkText: "Set up alerts" },
];

export const offers: Offer[] = [
  {
    id: "o1",
    title: "Get Help Reaching Your Goals",
    body: "Learn how Savings Goals and Savings Rules can help you put money aside automatically.",
    cta: "Learn More",
  },
];

export const securityNotices = [
  {
    id: "s1",
    title: "We're Enhancing Your Security",
    body: "You might be asked to authenticate at sign on with a one-time passcode.",
  },
  {
    id: "s2",
    title: "Turn On Account Alerts",
    body: "Get notified about balances, deposits and card activity.",
  },
  {
    id: "s3",
    title: "Go Paperless",
    body: "Switch to online statements in a few taps.",
  },
];

export const paybackOffers: PaybackOffer[] = [
  { id: "p1", merchant: "Sample Coffee Co.", cashBack: "10% back", expires: "Exp. 11/30" },
  { id: "p2", merchant: "Demo Fitness", cashBack: "$15 back", expires: "Exp. 12/15" },
  { id: "p3", merchant: "Example Market", cashBack: "5% back", expires: "Exp. 12/31" },
  { id: "p4", merchant: "Placeholder Pets", cashBack: "8% back", expires: "Exp. 01/15" },
];

export const rewardsProfile = {
  program: "TotalRewards",
  tier: "Gold Tier Member",
  pointsBalance: 18450,
};

export const billPayHistory: Payment[] = [
  { id: "b1", payee: "Sample Web Services Inc", account: "From Checking x0001", date: "2026-10-15", amount: 250.0, status: "Complete" },
  { id: "b2", payee: "Demo Streaming", account: "From Checking x0001", date: "2026-10-12", amount: 15.99, status: "Complete" },
  { id: "b3", payee: "Example Energy Co.", account: "From Checking x0001", date: "2026-10-05", amount: 132.4, status: "Complete" },
  { id: "b4", payee: "Sample Wireless", account: "From Checking x0001", date: "2026-11-02", amount: 74.0, status: "Scheduled" },
];

export const totals = {
  deposits: depositAccounts.reduce((sum, a) => sum + a.availableBalance, 0),
  creditBalance: creditCardAccounts.reduce((sum, a) => sum + a.balance, 0),
};
