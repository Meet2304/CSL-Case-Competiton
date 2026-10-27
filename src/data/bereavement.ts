/**
 * MOCK content for the bereavement journey: the shape of the transfer flows a
 * survivor completes, support resources, and suggested outreach wording for
 * advisors. The flows themselves are built from the household's accounts in
 * src/lib/survivor.ts. General guidance only — not legal or tax advice.
 */
import type { BankAccount } from "./types";
import { advisor } from "./advisor";
import { people } from "./household";
import { firstName } from "@/lib/format";

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
  /** Stable id: progress is saved under it. */
  id: string;
  title: string;
  accounts: BankAccount[];
  intro: string;
  /** Typical time once everything is submitted. */
  reviewTime: string;
  /** Shown when PNC has finished its review. */
  outcome: string;
  steps: FlowStep[];
};

export const deathCertificateStep: FlowStep = {
  id: "death-certificate",
  title: "Certified death certificate",
  kind: "upload",
  sharedCertificate: true,
  description:
    "A photo or scan of the certified copy from the funeral home or county is fine. You only need to upload it once — we use it for every account.",
};

export function visibleSteps(flow: TransferFlow, answers: Record<string, string>): FlowStep[] {
  return flow.steps.filter((s) => !s.showIf || answers[s.showIf.field] === s.showIf.equals);
}

// ---------------------------------------------------------------------------
// Support

export const supportResources = [
  { title: "Funeral homes", body: "Compare local funeral homes and what they include." },
  { title: "Counseling resources", body: "Free, confidential grief counseling sessions." },
  { title: "Support groups", body: "Local and online groups for people who've lost someone." },
];

const lawyer = people.find((p) => p.id === "p-dana")!;

export const supportPeople = [
  {
    role: "Your advisor",
    name: `${advisor.firstName} ${advisor.lastName}`,
    detail: advisor.title,
    action: "Schedule a call",
  },
  {
    role: "Estate attorney",
    name: lawyer.name,
    detail: lawyer.note ?? "Estate attorney",
    action: "Send a message",
  },
];

// ---------------------------------------------------------------------------
// Advisor outreach

export function outreachGuide(customerName: string, deceasedName: string) {
  const first = firstName(customerName);
  const deceasedFirst = firstName(deceasedName);
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
