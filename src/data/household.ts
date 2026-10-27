/**
 * MOCK DATA — the Sample household, the one family every customer login and
 * the advisor read from. Every name and figure is invented.
 *
 * Jordan (52) and Casey (49) are married; Avery is 17 and turns 18 on
 * Nov 30, 2026; Riley is 14. Dana is the family's estate attorney (no login).
 * A few gaps are deliberate so the planning reminders have something to say:
 * Jordan's savings has no payable-on-death beneficiary, the brokerage account
 * has no transfer-on-death beneficiary, and nobody has a will yet.
 */
import { NO_ACCESS } from "./family";
import type { AssetAccess, BankAccount, FamilyMember, FamilyRole, HouseholdPerson } from "./types";

/** The household's id on the advisor side. */
export const HOUSEHOLD_ID = "c-sample";

export const people: HouseholdPerson[] = [
  {
    id: "p-jordan",
    name: "Jordan Sample",
    relationship: "Self",
    birthdate: "1974-05-14",
    email: "jordan@example.com",
    login: "jordan",
  },
  {
    id: "p-casey",
    name: "Casey Sample",
    relationship: "Spouse",
    birthdate: "1977-03-02",
    email: "casey@example.com",
    login: "casey",
  },
  {
    id: "p-avery",
    name: "Avery Sample",
    relationship: "Child",
    birthdate: "2008-11-30",
    email: "avery@example.com",
    login: "avery",
  },
  {
    id: "p-riley",
    name: "Riley Sample",
    relationship: "Child",
    birthdate: "2012-06-18",
    email: "riley@example.com",
    login: "riley",
  },
  {
    id: "p-dana",
    name: "Dana Example",
    relationship: "Other",
    birthdate: "1968-01-20",
    email: "dana@example-law.com",
    note: "Estate attorney",
  },
];

export const accounts: BankAccount[] = [
  {
    id: "acct-joint-checking",
    name: "Joint Checking",
    last4: "0001",
    kind: "checking",
    balance: 12_480.55,
    owners: ["p-jordan", "p-casey"],
    transactions: [
      {
        id: "jc1",
        date: "2026-10-24",
        description: "Sample Grocer #12",
        amount: -86.42,
        status: "Pending",
      },
      {
        id: "jc2",
        date: "2026-10-23",
        description: "Payroll — Demo Employer LLC",
        amount: 3250,
        status: "Posted",
      },
      {
        id: "jc3",
        date: "2026-10-20",
        description: "Example Power & Light",
        amount: -142.18,
        status: "Posted",
      },
      {
        id: "jc4",
        date: "2026-10-18",
        description: "Mortgage — Sample Home Loans",
        amount: -1840,
        status: "Posted",
      },
    ],
  },
  {
    id: "acct-jordan-savings",
    name: "Savings",
    last4: "0002",
    kind: "savings",
    balance: 18_250,
    owners: ["p-jordan"],
    beneficiaries: [],
    transactions: [
      { id: "js1", date: "2026-10-01", description: "Interest", amount: 12.4, status: "Posted" },
      {
        id: "js2",
        date: "2026-09-15",
        description: "Transfer from Joint Checking x0001",
        amount: 500,
        status: "Posted",
      },
    ],
  },
  {
    id: "acct-jordan-ira",
    name: "401(k) Rollover IRA",
    last4: "0011",
    kind: "ira",
    balance: 184_000,
    owners: ["p-jordan"],
    beneficiaries: ["p-casey"],
  },
  {
    id: "acct-jordan-brokerage",
    name: "Brokerage Account",
    last4: "0012",
    kind: "brokerage",
    balance: 96_500,
    owners: ["p-jordan"],
    beneficiaries: [],
  },
  {
    id: "acct-jordan-card",
    name: "Cash Rewards Visa",
    last4: "0003",
    kind: "credit-card",
    balance: -1_284.19,
    owners: ["p-jordan"],
    transactions: [
      {
        id: "cc1",
        date: "2026-10-22",
        description: "Sample Fuel Stop",
        amount: -48.1,
        status: "Posted",
      },
      {
        id: "cc2",
        date: "2026-10-19",
        description: "Demo Bookstore",
        amount: -32.75,
        status: "Posted",
      },
    ],
  },
  {
    id: "acct-jordan-life",
    name: "Term Life Policy",
    kind: "life-insurance",
    balance: 500_000,
    owners: ["p-jordan"],
    beneficiaries: ["p-casey"],
    external: true,
  },
  {
    id: "acct-casey-savings",
    name: "Savings",
    last4: "0021",
    kind: "savings",
    balance: 15_300,
    owners: ["p-casey"],
    beneficiaries: ["p-jordan"],
    transactions: [
      { id: "cs1", date: "2026-10-01", description: "Interest", amount: 10.2, status: "Posted" },
    ],
  },
  {
    id: "acct-casey-roth",
    name: "Roth IRA",
    last4: "0022",
    kind: "roth",
    balance: 42_800,
    owners: ["p-casey"],
    beneficiaries: ["p-jordan"],
  },
  {
    id: "acct-avery-checking",
    name: "Student Checking",
    last4: "0031",
    kind: "checking",
    balance: 1_240.6,
    owners: ["p-avery"],
    custodian: "p-casey",
    transactions: [
      {
        id: "ac1",
        date: "2026-10-21",
        description: "Campus Coffee Co.",
        amount: -6.25,
        status: "Posted",
      },
      {
        id: "ac2",
        date: "2026-10-17",
        description: "Part-time pay — Demo Market",
        amount: 210,
        status: "Posted",
      },
    ],
  },
  {
    id: "acct-riley-savings",
    name: "Teen Savings",
    last4: "0041",
    kind: "savings",
    balance: 860,
    owners: ["p-riley"],
    custodian: "p-jordan",
    transactions: [
      { id: "rs1", date: "2026-10-05", description: "Allowance", amount: 20, status: "Posted" },
    ],
  },
];

// ---------------------------------------------------------------------------
// The family Jordan has set up: who's in it, their roles, and what's shared.

const view: AssetAccess = { ...NO_ACCESS, view: true };
const viewActivity: AssetAccess = { ...view, activity: true };

export const adminRole: FamilyRole = {
  id: "r-admin",
  name: "Admin",
  description:
    "Full access to every shared account. Can invite people, share accounts and decide what each role can see and do.",
  isAdmin: true,
  builtIn: true,
  access: {},
};

/** A family as stored: everything but the viewer, plus which accounts are shared. */
export type StoredFamily = {
  id: string;
  familyName: string;
  createdBy: string;
  createdOn: string;
  members: FamilyMember[];
  roles: FamilyRole[];
  /** Accounts the admins have shared with the family. */
  accountIds: string[];
};

export const seedFamilies: StoredFamily[] = [
  {
    id: "fam-sample",
    familyName: "Sample Family",
    createdBy: "p-jordan",
    createdOn: "2026-06-02",
    members: [
      {
        id: "p-jordan",
        name: "Jordan Sample",
        email: "jordan@example.com",
        relationship: "Self",
        roleId: "r-admin",
        status: "Active",
      },
      {
        id: "p-casey",
        name: "Casey Sample",
        email: "casey@example.com",
        relationship: "Spouse",
        roleId: "r-admin",
        status: "Active",
      },
      {
        id: "p-avery",
        name: "Avery Sample",
        email: "avery@example.com",
        relationship: "Child",
        note: "Turns 18 on Nov 30",
        roleId: "r-older-child",
        status: "Active",
      },
      {
        id: "p-riley",
        name: "Riley Sample",
        email: "riley@example.com",
        relationship: "Child",
        note: "Age 14",
        roleId: "r-younger-child",
        status: "Active",
      },
      {
        id: "p-dana",
        name: "Dana Example",
        email: "dana@example-law.com",
        relationship: "Other",
        note: "Estate attorney",
        roleId: "r-trusted",
        status: "Invited",
      },
    ],
    roles: [
      adminRole,
      {
        id: "r-older-child",
        name: "Older child",
        description: "Sees the household checking account and its activity. No control.",
        isAdmin: false,
        builtIn: false,
        access: { "acct-joint-checking": viewActivity },
      },
      {
        id: "r-younger-child",
        name: "Younger child",
        description: "Nothing shared yet.",
        isAdmin: false,
        builtIn: false,
        access: {},
      },
      {
        id: "r-trusted",
        name: "Trusted advisor",
        description:
          "An outside professional, such as the estate attorney. Read-only access to investments and retirement for planning.",
        isAdmin: false,
        builtIn: false,
        access: {
          "acct-jordan-ira": viewActivity,
          "acct-jordan-brokerage": viewActivity,
          "acct-jordan-life": view,
          "acct-casey-roth": viewActivity,
        },
      },
    ],
    accountIds: [
      "acct-joint-checking",
      "acct-jordan-savings",
      "acct-jordan-ira",
      "acct-jordan-brokerage",
      "acct-jordan-card",
      "acct-jordan-life",
      "acct-casey-savings",
      "acct-casey-roth",
    ],
  },
];
