/**
 * MOCK DATA for the family dashboard (customer side). The signed-in customer
 * is Jordan Sample, an admin of the Sample family. Balances for accounts that
 * also appear on the Accounts dashboard come from ./mock so they always match.
 *
 * This is only the starting state: admins can add members, roles and assets
 * in the app, and those changes are kept in the browser (see FamilyProvider).
 */
import { creditCardAccounts, depositAccounts, virtualWallet } from "./mock";
import type { AssetAccess, FamilyState, SuccessionMethod, SuccessionStep } from "./types";

const NONE: AssetAccess = { view: false, activity: false, transact: false, manage: false };
export const FULL_ACCESS: AssetAccess = {
  view: true,
  activity: true,
  transact: true,
  manage: true,
};
export const NO_ACCESS = NONE;

const viewOnly: AssetAccess = { ...NONE, view: true };
const viewActivity: AssetAccess = { ...NONE, view: true, activity: true };
const viewTransact: AssetAccess = { ...NONE, view: true, transact: true };

const [checking, savings] = depositAccounts;
const [cashRewards, coreVisa] = creditCardAccounts;
const walletTotal = virtualWallet.accounts.reduce((sum, a) => sum + a.balance, 0);

export const initialFamilyState: FamilyState = {
  familyName: "Sample Family",
  selfId: "m-jordan",
  members: [
    {
      id: "m-jordan",
      name: "Jordan Sample",
      email: "jordan@example.com",
      relationship: "Self",
      roleId: "r-admin",
      status: "Active",
    },
    {
      id: "m-casey",
      name: "Casey Sample",
      email: "casey@example.com",
      relationship: "Spouse",
      roleId: "r-admin",
      status: "Active",
    },
    {
      id: "m-avery",
      name: "Avery Sample",
      email: "avery@example.com",
      relationship: "Child",
      note: "Age 21",
      roleId: "r-adult-child",
      status: "Active",
    },
    {
      id: "m-riley",
      name: "Riley Sample",
      email: "riley@example.com",
      relationship: "Child",
      note: "Age 15",
      roleId: "r-teen",
      status: "Invited",
    },
    {
      id: "m-dana",
      name: "Dana Example",
      email: "dana@example-law.com",
      relationship: "Other",
      note: "Estate attorney",
      roleId: "r-trusted",
      status: "Active",
    },
  ],
  roles: [
    {
      id: "r-admin",
      name: "Admin",
      description:
        "Full access to every asset. Can add members and assets, and manage what each role can see and control.",
      isAdmin: true,
      builtIn: true,
      access: {},
    },
    {
      id: "r-adult-child",
      name: "Adult child",
      description:
        "Sees the household accounts and the assets they are a beneficiary of. No control.",
      isAdmin: false,
      builtIn: false,
      access: {
        "a-checking": viewActivity,
        "a-wallet": viewOnly,
        "a-brokerage": viewOnly,
        "a-trust": viewOnly,
      },
    },
    {
      id: "r-teen",
      name: "Teen",
      description: "Can see and spend from the Virtual Wallet for allowance. Nothing else.",
      isAdmin: false,
      builtIn: false,
      access: { "a-wallet": viewTransact },
    },
    {
      id: "r-trusted",
      name: "Trusted advisor",
      description:
        "Outside professional (e.g. estate attorney). Read-only access to investments, trust and property for planning.",
      isAdmin: false,
      builtIn: false,
      access: {
        "a-brokerage": viewActivity,
        "a-ira": viewActivity,
        "a-trust": viewActivity,
        "a-money-market": viewOnly,
        "a-home": viewOnly,
      },
    },
  ],
  assets: [
    {
      id: "a-checking",
      name: checking.name,
      last4: checking.last4,
      category: "Joint checking/savings",
      value: checking.availableBalance,
      owners: ["m-jordan", "m-casey"],
      method: "joint",
    },
    {
      id: "a-savings",
      name: savings.name,
      last4: savings.last4,
      category: "Joint checking/savings",
      value: savings.availableBalance,
      owners: ["m-jordan"],
      method: "pod",
      successors: ["m-casey"],
    },
    {
      id: "a-wallet",
      name: "Virtual Wallet",
      last4: virtualWallet.accounts[0].last4,
      category: "Joint checking/savings",
      value: walletTotal,
      owners: ["m-jordan", "m-casey"],
      method: "joint",
    },
    {
      id: "a-money-market",
      name: "Money Market",
      last4: "0103",
      category: "Joint checking/savings",
      value: 48_200,
      owners: ["m-casey"],
      method: "estate",
      successors: ["m-jordan"],
    },
    {
      id: "a-cash-visa",
      name: cashRewards.name,
      last4: cashRewards.last4,
      category: "Debts",
      value: -cashRewards.balance,
      owners: ["m-jordan"],
      method: "close",
    },
    {
      id: "a-core-visa",
      name: coreVisa.name,
      last4: coreVisa.last4,
      category: "Debts",
      value: -coreVisa.balance,
      owners: ["m-casey"],
      method: "close",
    },
    {
      id: "a-brokerage",
      name: "Brokerage Account",
      last4: "0101",
      category: "Brokerage account",
      value: 412_380.2,
      owners: ["m-casey"],
      method: "tod",
      successors: ["m-jordan", "m-avery"],
    },
    {
      id: "a-ira",
      name: "Roth IRA",
      last4: "0102",
      category: "401(k) / IRA",
      value: 186_950,
      owners: ["m-casey"],
      method: "retirement",
      successors: ["m-jordan"],
    },
    {
      id: "a-trust",
      name: "Sample Family Trust",
      last4: "0201",
      category: "Brokerage account",
      value: 1_250_000,
      owners: ["m-jordan", "m-casey"],
      method: "trust",
    },
    {
      id: "a-home",
      name: "Home · 12 Example Lane",
      category: "Real Estate",
      value: 640_000,
      owners: ["m-jordan", "m-casey"],
      method: "joint",
      external: true,
      steps: [
        {
          id: "death-certificate",
          label: "Obtain certified death certificates",
          detail: "Order several copies from the county vital records office.",
        },
        {
          id: "affidavit",
          label: "Sign an affidavit of survivorship",
          detail: "Confirms the surviving joint owner now holds the title.",
        },
        {
          id: "record",
          label: "Record with the county recorder",
          detail: "File the affidavit and death certificate so the deed reflects the survivor.",
        },
      ],
    },
    {
      id: "a-life",
      name: "Whole Life Policy",
      last4: "0301",
      category: "Life insurance",
      value: 64_300,
      owners: ["m-casey"],
      external: true,
    },
    {
      id: "a-car",
      name: "2022 Example SUV",
      category: "Vehicles",
      value: 28_500,
      owners: ["m-jordan", "m-casey"],
      external: true,
    },
  ],
  processes: [],
};

export const methodLabels: Record<SuccessionMethod, string> = {
  joint: "Joint ownership · right of survivorship",
  pod: "Payable-on-death beneficiary",
  tod: "Transfer-on-death beneficiary",
  retirement: "Retirement account beneficiary",
  trust: "Trust · successor trustee",
  estate: "Estate · probate",
  close: "Individual credit · closes at death",
};

export const methodTimelines: Record<SuccessionMethod, string> = {
  joint: "1–3 business days",
  pod: "5–10 business days",
  tod: "2–4 weeks",
  retirement: "2–3 weeks",
  trust: "1–2 weeks",
  estate: "3–9 months",
  close: "30–60 days",
};

const notify: SuccessionStep = {
  id: "notify",
  label: "Notify PNC of the death",
  detail: "Call or visit a branch; we will place a hold on control of the account.",
};
const certificate: SuccessionStep = {
  id: "death-certificate",
  label: "Provide a certified death certificate",
  detail: "An original certified copy, not a photocopy.",
};

/** Standard legal steps by succession method (general guidance, not legal advice). */
export const methodSteps: Record<SuccessionMethod, SuccessionStep[]> = {
  joint: [
    notify,
    certificate,
    {
      id: "verify-owner",
      label: "Verify the surviving owner's identity",
      detail: "Government-issued photo ID for each surviving owner.",
    },
  ],
  pod: [
    notify,
    certificate,
    {
      id: "claim-form",
      label: "Submit the beneficiary claim form",
      detail: "Completed and signed by each named beneficiary.",
    },
    {
      id: "verify-beneficiary",
      label: "Verify each beneficiary's identity",
      detail: "Government-issued photo ID.",
    },
  ],
  tod: [
    notify,
    certificate,
    {
      id: "tod-claim",
      label: "Submit the transfer-on-death claim form",
      detail: "One form per beneficiary, with how they want to receive their share.",
    },
    {
      id: "domicile",
      label: "Provide an affidavit of domicile",
      detail: "States where the owner lived at the time of death.",
    },
    {
      id: "w9",
      label: "Provide a W-9 for each beneficiary",
      detail: "Needed to re-register the holdings for tax reporting.",
    },
  ],
  retirement: [
    notify,
    certificate,
    {
      id: "ira-claim",
      label: "Submit the beneficiary claim form",
      detail: "Signed by the named beneficiary.",
    },
    {
      id: "ira-option",
      label: "Choose how to receive the account",
      detail: "A spouse can roll it into their own IRA or keep it as an inherited IRA.",
    },
  ],
  trust: [
    notify,
    certificate,
    {
      id: "certification",
      label: "Provide a certification of trust",
      detail: "Names the successor trustee and confirms their authority.",
    },
    {
      id: "trustee-accept",
      label: "Successor trustee accepts and verifies identity",
      detail: "Signed acceptance plus government-issued photo ID.",
    },
  ],
  estate: [
    notify,
    certificate,
    {
      id: "letters",
      label: "Obtain letters testamentary",
      detail: "Issued by the probate court to the executor named in the will.",
    },
    {
      id: "ein",
      label: "Get an estate tax ID (EIN)",
      detail: "Apply with the IRS so the estate can hold funds.",
    },
    {
      id: "estate-account",
      label: "Open an estate account",
      detail: "Funds move here and are distributed under the will.",
    },
  ],
  close: [
    notify,
    certificate,
    {
      id: "final-statement",
      label: "Card is closed and a final statement issued",
      detail: "No new charges; autopays and authorized users stop.",
    },
    {
      id: "settle",
      label: "Balance is settled by the estate",
      detail: "Family members are not personally responsible for an individual card.",
    },
  ],
};
