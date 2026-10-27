// Labels and tones for the settlement engine's output. Tokens only; every
// chip pairs its color with text so nothing is conveyed by color alone.
import type { DeadlineKind, ReviewLevel, SettlementRoute } from "@/data/types";
import type { StepWhen } from "@/lib/nextSteps";
import type { FindingSeverity, ReadinessReport } from "@/lib/settlement/simulate";

export { ownerLabel } from "@/lib/settlement/labels";
export { routeLabels } from "@/lib/settlement/engine";

const positive = "bg-pnc-positive-bg text-pnc-positive ring-transparent";
const blue = "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent";
const attention = "bg-attention-bg text-attention ring-attention-line";
const orange = "bg-pnc-orange/10 text-pnc-orange-600 ring-pnc-orange/30";
const muted = "bg-pnc-chip text-pnc-muted ring-transparent";

export const routeTone: Record<SettlementRoute, string> = {
  survivorship: positive,
  "successor-trustee": positive,
  "beneficiary-claim": blue,
  "spousal-retirement-options": blue,
  "inherited-retirement": blue,
  "successor-owner": blue,
  "insurer-claim": blue,
  probate: attention,
  "needs-review": orange,
  "designation-update": orange,
  "closes-estate-pays": muted,
  "not-affected": muted,
};

export const reviewLabels: Record<ReviewLevel, string> = {
  advisor: "Advisor",
  operations: "Operations",
  "trust-officer": "Trust officer",
  attorney: "Attorney",
  "tax-advisor": "Tax advisor",
};

export const reviewTone = "bg-white text-pnc-ink ring-pnc-line";

export const whenTone: Record<StepWhen["tone"], string> = {
  now: attention,
  soon: orange,
  later: muted,
};

export const kindLabels: Record<DeadlineKind, string> = {
  statutory: "Set by law",
  opportunity: "Opportunity",
  recommended: "Recommended",
};

export const kindTone: Record<DeadlineKind, string> = {
  statutory: attention,
  opportunity: orange,
  recommended: blue,
};

export const severityLabels: Record<FindingSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const severityTone: Record<FindingSeverity, string> = {
  high: attention,
  medium: orange,
  low: blue,
};

export const statusCopy: Record<ReadinessReport["status"], { label: string; tone: string }> = {
  ready: { label: "Ready", tone: "bg-pnc-positive-bg text-pnc-ink ring-pnc-positive/30" },
  gaps: { label: "Gaps to close", tone: "bg-pnc-orange/10 text-pnc-ink ring-pnc-orange/30" },
  exposed: { label: "Exposed", tone: "bg-attention-bg text-pnc-ink ring-attention-line" },
};

export const sectionTitle = "font-display text-lg font-medium text-pnc-ink";
export const linkButton =
  "inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-pnc-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";
export const pillButton =
  "inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-pnc-link ring-1 ring-pnc-blue-600/20 hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";
export const firstName = (name: string) => name.split(" ")[0];
