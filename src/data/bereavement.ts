/**
 * MOCK content for the bereavement journey: the transfer flows a surviving
 * spouse completes, how assets are grouped on their "Next steps" dashboard,
 * support resources, and suggested outreach wording for advisors.
 *
 * Two flows are fully modelled (joint checking/savings and 401(k)/IRA). Every
 * other asset uses a placeholder flow built from its legal method in
 * ./family. General guidance only — not legal or tax advice.
 */
import { advisor, advisorCustomers } from "./advisor";
import { initialFamilyState } from "./family";

/** The signed-in customer's household on the advisor side. */
export const SELF_HOUSEHOLD_ID = "c-sample";
export const selfHousehold = advisorCustomers.find((c) => c.id === SELF_HOUSEHOLD_ID)!;

// ---------------------------------------------------------------------------
// Transfer flows

/** How each document is provided — shown as a tag on every step. */
export type DocKind = "upload" | "autofill" | "manual";

export const docKindLabels: Record<DocKind, string> = {
  upload: "Upload",
  autofill: "Filled in for you",
  manual: "You fill in",
};

export type FieldOption = { value: string; label: string; help?: string };

export type FlowField = {
  id: string;
  label: string;
  type: "choice" | "select" | "text";
  options?: FieldOption[];
  placeholder?: string;
};

export type FlowStep = {
  id: string;
  title: string;
  kind: DocKind;
  description: string;
  optional?: boolean;
  /** Uses the household's single death-certificate upload. */
  sharedCertificate?: boolean;
  /** Read-only details we fill in from records on file ("Filled in for you"). */
  prefill?: { label: string; value: string }[];
  /** What the customer confirms for an autofilled step. */
  confirmLabel?: string;
  /** Inputs for a "You fill in" step. */
  fields?: FlowField[];
  /** Only shown when another answer has a given value. */
  showIf?: { field: string; equals: string };
};

export type TransferFlow = {
  id: string;
  title: string;
  assetIds: string[];
  intro: string;
  /** Typical time once everything is submitted. */
  reviewTime: string;
  /** Shown when the flow is complete. */
  outcome: string;
  steps: FlowStep[];
};

const assets = initialFamilyState.assets;
const asset = (id: string) => assets.find((a) => a.id === id)!;
const accountLabel = (id: string) => {
  const a = asset(id);
  return `${a.name}${a.last4 ? ` x${a.last4}` : ""}`;
};

const deathCertificate: FlowStep = {
  id: "death-certificate",
  title: "Certified death certificate",
  kind: "upload",
  sharedCertificate: true,
  description:
    "A photo or scan of the certified copy from the funeral home or county is fine. You only need to upload it once — we use it for every account.",
};

const idOnFile = [
  { label: "Name", value: "Jordan Sample" },
  { label: "ID on file", value: "Driver's license ending 0000" },
  { label: "Last verified", value: "Mar 12, 2024" },
];

export const transferFlows: Record<string, TransferFlow> = {
  joint: {
    id: "joint",
    title: "Joint checking & savings",
    assetIds: ["a-checking", "a-wallet"],
    intro:
      "You and Casey owned these accounts together, so they pass straight to you. You can keep using them — this just updates the bank's records.",
    reviewTime: "1–3 business days",
    outcome:
      "Both accounts are now in your name only. Nothing else changes — same cards, same account numbers.",
    steps: [
      deathCertificate,
      {
        id: "survivor-id",
        title: "Your photo ID",
        kind: "autofill",
        description: "We already have your ID on file, so there's nothing to upload.",
        prefill: idOnFile,
        confirmLabel: "This is still my current ID",
      },
      {
        id: "survivorship-form",
        title: "Survivorship & account-change form",
        kind: "autofill",
        description: "We've filled in the bank's form for you. Please check it and sign.",
        prefill: [
          { label: "Deceased owner", value: "Casey Sample" },
          { label: "Surviving owner", value: "Jordan Sample" },
          {
            label: "Accounts",
            value: `${accountLabel("a-checking")}, ${accountLabel("a-wallet")}`,
          },
          { label: "New account title", value: "Jordan Sample" },
        ],
        confirmLabel: "The details are correct and I sign this form electronically",
      },
    ],
  },
  ira: {
    id: "ira",
    title: "Roth IRA",
    assetIds: ["a-ira"],
    intro:
      "Casey named you as the beneficiary, so the IRA comes to you. As a spouse you have the most flexible choices — there's no rush to decide.",
    reviewTime: "2–3 weeks",
    outcome: "The Roth IRA has been transferred to you as you chose.",
    steps: [
      deathCertificate,
      {
        id: "claim-form",
        title: "Beneficiary claim form",
        kind: "autofill",
        description:
          "We've filled in the plan administrator's claim form from Casey's account records.",
        prefill: [
          { label: "Account owner", value: "Casey Sample" },
          { label: "Account", value: accountLabel("a-ira") },
          { label: "Beneficiary", value: "Jordan Sample (spouse)" },
          { label: "Share", value: "100%" },
        ],
        confirmLabel: "The details are correct",
      },
      {
        id: "id-w9",
        title: "Your photo ID and taxpayer details (W-9)",
        kind: "autofill",
        description:
          "Taken from your profile. The W-9 lets the account be re-registered in your name.",
        prefill: [...idOnFile.slice(0, 2), { label: "SSN", value: "•••-••-0000" }],
        confirmLabel: "I certify my taxpayer information is correct",
      },
      {
        id: "election",
        title: "How you'd like to receive the IRA",
        kind: "manual",
        description: "Your advisor can talk these through with you before you choose.",
        fields: [
          {
            id: "election",
            label: "Choose one",
            type: "choice",
            options: [
              {
                value: "rollover",
                label: "Spousal rollover — make it my own Roth IRA",
                help: "Most common for spouses. It becomes your account and you name new beneficiaries.",
              },
              {
                value: "inherited",
                label: "Keep it as an inherited Roth IRA",
                help: "Stays separate, for your benefit. Can suit you if you may need the money sooner.",
              },
              {
                value: "lump-sum",
                label: "Take it as a lump sum",
                help: "Closes the account and pays it to you. Check the tax effect with your advisor first.",
              },
            ],
          },
        ],
      },
      {
        id: "new-ira",
        title: "New IRA account application",
        kind: "manual",
        description: "Because you're rolling it over, we'll open a Roth IRA in your name.",
        showIf: { field: "election", equals: "rollover" },
        fields: [
          {
            id: "investments",
            label: "Investments",
            type: "select",
            options: [
              { value: "keep", label: "Keep Casey's current investments" },
              { value: "cash", label: "Move to cash for now" },
            ],
          },
          {
            id: "beneficiary",
            label: "Primary beneficiary for your new IRA",
            type: "select",
            options: [
              { value: "avery", label: "Avery Sample (child)" },
              { value: "riley", label: "Riley Sample (child)" },
              { value: "later", label: "I'll decide later" },
            ],
          },
        ],
      },
      {
        id: "withholding",
        title: "Tax withholding election",
        kind: "manual",
        description:
          "Only matters if money is paid out to you. Qualified Roth withdrawals are usually tax-free.",
        fields: [
          {
            id: "federal",
            label: "Federal withholding",
            type: "choice",
            options: [
              { value: "none", label: "No withholding" },
              { value: "10", label: "10%" },
              { value: "20", label: "20%" },
            ],
          },
        ],
      },
      {
        id: "marriage-certificate",
        title: "Marriage certificate",
        kind: "manual",
        optional: true,
        description:
          "Sometimes requested to confirm a spousal rollover. You can skip this unless we ask.",
        fields: [
          {
            id: "marriage",
            label: "Marriage certificate",
            type: "choice",
            options: [
              { value: "later", label: "I'll provide it if asked" },
              { value: "have", label: "I have it ready to share" },
            ],
          },
        ],
      },
    ],
  },
};

export function visibleSteps(flow: TransferFlow, answers: Record<string, string>): FlowStep[] {
  return flow.steps.filter((s) => !s.showIf || answers[s.showIf.field] === s.showIf.equals);
}

// ---------------------------------------------------------------------------
// Next steps dashboard

export type AssetGroup = {
  id: string;
  title: string;
  assetIds: string[];
  /** A fully modelled flow, or undefined for a placeholder flow. */
  flowId?: keyof typeof transferFlows;
};

/** Settle soon — the household relies on these. */
export const keyAssetGroups: AssetGroup[] = [
  { id: "joint", title: "Joint account", assetIds: ["a-checking", "a-wallet"], flowId: "joint" },
  { id: "life", title: "Life insurance", assetIds: ["a-life"] },
  { id: "ira", title: "IRA", assetIds: ["a-ira"], flowId: "ira" },
];

/** No rush — up to about 6 months. */
export const secondaryAssetGroups: AssetGroup[] = [
  { id: "brokerage", title: "Brokerage account", assetIds: ["a-brokerage"] },
  { id: "money-market", title: "Money Market", assetIds: ["a-money-market"] },
  { id: "core-visa", title: "Credit card", assetIds: ["a-core-visa"] },
  { id: "trust", title: "Family trust", assetIds: ["a-trust"] },
  { id: "home", title: "Home", assetIds: ["a-home"] },
  { id: "car", title: "Vehicle", assetIds: ["a-car"] },
];

export const familyAsset = asset;

/** Steps shown in placeholder flows for assets without a legal method on record. */
export const placeholderSteps: Record<string, string[]> = {
  life: [
    "Contact the insurance company to start a claim",
    "Send a certified death certificate",
    "Complete the insurer's claim form and choose how to be paid",
  ],
  car: [
    "Certified death certificate",
    "The vehicle's current title",
    "Retitle the vehicle at your state's motor vehicle office",
  ],
};

export const supportResources = [
  { title: "Funeral homes", body: "Compare local funeral homes and what they include." },
  { title: "Counseling resources", body: "Free, confidential grief counseling sessions." },
  { title: "Support groups", body: "Local and online groups for people who've lost a partner." },
];

const lawyer = initialFamilyState.members.find((m) => m.id === "m-dana")!;

export const supportPeople = [
  {
    role: "Your advisor",
    name: `${advisor.firstName} ${advisor.lastName}`,
    detail: advisor.title,
    action: "Schedule a call",
  },
  {
    role: "Lawyer",
    name: lawyer.name,
    detail: lawyer.note ?? "Estate attorney",
    action: "Send a message",
  },
];

// ---------------------------------------------------------------------------
// Advisor outreach

export function outreachGuide(customerName: string, deceasedName: string) {
  const first = customerName.split(" ")[0];
  const deceasedFirst = deceasedName.split(" ")[0];
  return {
    title: `Reach out to ${first} personally`,
    tips: [
      "Call first — don't open with an email or a form.",
      "Lead with condolences, not paperwork.",
      "Tell them nothing is urgent today; offer to pause statements and marketing.",
      "Ask how and when they'd like to hear from you next.",
    ],
    script: `“Hi ${first}, it's ${advisor.firstName} from PNC. I was so sorry to hear about ${deceasedFirst}. I'm not calling about paperwork — I just wanted you to know I'm here, and there's nothing you need to do today. Whenever you're ready, I can walk you through things at your pace.”`,
  };
}
