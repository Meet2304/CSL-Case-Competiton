import { stateName } from "@/data/will";
import { formatMoney } from "@/lib/format";
import { planRows, primaryRows, round2, spouseName, totalPercent } from "./flow";
import type {
  Address,
  Asset,
  AssetCategory,
  Beneficiary,
  Gender,
  Gift,
  GiftType,
  OwnedBy,
  WillDraft,
} from "./types";

/** Plain-language wording of answers, shared by the summaries and the generated will. */

export const genderLabels: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  trans: "Trans",
  "non-binary": "Non-binary",
};

export const maritalLabels = {
  single: "Single / Widowed",
  married: "Married",
  partnership: "Domestic Partnership",
} as const;

export const ownedByLabels: Record<OwnedBy, string> = {
  me: "Only me",
  "me-spouse": "Me and my spouse",
  "me-other": "Me and someone else",
};

export const assetCategories: Record<AssetCategory, { label: string; modalTitle: string }> = {
  financial: { label: "Financial account", modalTitle: "Add a financial account" },
  retirement: { label: "Retirement account", modalTitle: "Add a retirement account" },
  insurance: { label: "Life insurance", modalTitle: "Add a life insurance policy" },
  "real-estate": { label: "Real estate", modalTitle: "Add a real estate property" },
  vehicle: { label: "Vehicle", modalTitle: "Add a vehicle" },
  brokerage: { label: "Brokerage account", modalTitle: "Add a brokerage account" },
  other: { label: "Cash / Jewelry / Other", modalTitle: "Add an asset" },
};

export const giftTypeLabels: Record<GiftType, string> = {
  "real-estate": "Real estate",
  vehicle: "Vehicle",
  cash: "Cash",
  digital: "Digital",
  other: "Other",
};

export const yesNo = (v?: string) =>
  v === "yes" ? "Yes" : v === "no" ? "No" : v === "say-nothing" ? "Say nothing" : "—";

export function formatAddress(a: Address): string {
  const line1 = [a.street1, a.street2].filter(Boolean).join(", ");
  const line2 = [a.city, [a.state && stateName(a.state), a.zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [line1, line2].filter(Boolean).join(", ");
}

export function money(value: string): string {
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? formatMoney(n) : "";
}

export function assetTitle(a: Asset): string {
  if (a.nickname) return a.nickname;
  switch (a.category) {
    case "financial":
      return [a.institution, a.description].filter(Boolean).join(" · ");
    case "retirement":
      return [a.institution, a.accountType].filter(Boolean).join(" · ");
    case "insurance":
      return `${a.institution} life insurance policy`;
    case "brokerage":
      return `${a.institution} brokerage account`;
    case "real-estate":
      return formatAddress(a.address);
    default:
      return a.description;
  }
}

export function giftTitle(g: Gift): string {
  if (g.type === "cash") return `${money(g.amount)} in cash`;
  if (g.type === "real-estate") return formatAddress(g.address);
  return g.description;
}

const share = (b: Beneficiary) => `${round2(Number.parseFloat(b.percent) || 0)}% to ${b.name}`;
export const describeRows = (rows: Beneficiary[]) => rows.map(share).join(", ");

export function primarySummary(d: WillDraft): string {
  const { plan } = d.residuary.primary;
  if (!plan) return "—";
  const rows = primaryRows(d);
  if (plan === "custom") return describeRows(rows);
  const rest = round2(100 - totalPercent(rows));
  return [
    describeRows(rows),
    rows.length ? `${rest}% to my spouse, ${spouseName(d)}` : `My spouse, ${spouseName(d)}`,
  ]
    .filter(Boolean)
    .join(", ");
}

/** "→ If not to my spouse, then …" lines for the contingent beneficiaries. */
export function contingentLines(d: WillDraft): string[] {
  const { secondary, tertiary } = d.residuary;
  const toSpouse = d.residuary.primary.plan === "spouse";
  const lines: string[] = [];
  const then = (plan: string | undefined, rows: Beneficiary[]) => {
    if (plan === "children")
      return "split evenly among my children, else to their respective descendants";
    if (plan === "descendants") return "their share goes to their respective descendants";
    if (plan === "share") return "their share is split among my surviving primary beneficiaries";
    return describeRows(planRows(plan, rows));
  };
  if (secondary.plan) {
    const lead = toSpouse ? "If not to my spouse" : "If a primary beneficiary does not survive me";
    lines.push(`${lead}, then ${then(secondary.plan, secondary.beneficiaries)}`);
  }
  if (tertiary.plan && (secondary.plan === "children" || secondary.plan === "descendants")) {
    const lead =
      secondary.plan === "children"
        ? "If not to my children or their descendants"
        : "If not to my primary beneficiaries or their descendants";
    lines.push(`${lead}, then ${then(tertiary.plan, tertiary.beneficiaries)}`);
  }
  return lines;
}

export function lastResortSummary(d: WillDraft): string {
  const { plan, beneficiaries } = d.residuary.lastResort;
  if (!plan) return "—";
  return plan === "heirs" ? "Leave it to my heirs" : describeRows(planRows(plan, beneficiaries));
}

/** Second sentence of the secondary-beneficiary question, e.g. "If your spouse, Mother does not survive you". */
export function secondaryQuestion(d: WillDraft): string {
  return d.residuary.primary.plan === "spouse"
    ? `If your spouse, ${spouseName(d)} does not survive you, to whom should their portion of the estate go?`
    : "If any of your primary beneficiaries do not survive you, to whom should their portion of the estate go?";
}

export function tertiaryQuestion(d: WillDraft): string {
  if (d.residuary.secondary.plan === "children") {
    return `If your spouse, ${spouseName(d)} and your children and all of their descendents do not survive you, to whom should their portion of the estate go?`;
  }
  return "If your primary beneficiaries and all of their descendants do not survive you, to whom should their portion of the estate go?";
}
