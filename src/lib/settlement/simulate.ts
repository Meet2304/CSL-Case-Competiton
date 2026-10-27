/**
 * "What if this person died today?" — the same rulebook run before a death.
 * Every bad outcome (probate, a designation naming someone who has died, no
 * beneficiary, a minor named directly) becomes a finding with a fix.
 */
import type { AdvisorCustomer, ClientProfile, Holding } from "@/data/types";
import { firstName, formatCompactMoney } from "@/lib/format";
import { simulationInput } from "./adapters";
import { settlementPlan, type Answers, type SettlementPlan } from "./engine";
import { label } from "./facts";

export type FindingSeverity = "high" | "medium" | "low";

export type Finding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  fix: string;
  holdingIds: string[];
  /** Total value of the accounts affected. */
  value: number;
  sources: string[];
};

export type ReadinessReport = {
  person: string;
  survivor: string;
  plan: SettlementPlan;
  findings: Finding[];
  status: "ready" | "gaps" | "exposed";
};

const SEVERITY_ORDER: FindingSeverity[] = ["high", "medium", "low"];
const list = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
const uniq = <T>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) === i);
const sum = (hs: Holding[]) => hs.reduce((s, h) => s + h.value, 0);
const isRetirement = (h: Holding) => h.type.includes("IRA");

export function readinessReport(
  customer: AdvisorCustomer,
  profile: ClientProfile,
  personName: string,
  asOf: string,
  answers: Answers = {},
): ReadinessReport {
  const input = simulationInput(customer, profile, personName, asOf, answers);
  const plan = settlementPlan(input);
  const first = firstName(personName);
  const findings: Finding[] = [];
  const deceasedInReality = (name: string) =>
    profile.members.find((m) => m.name === name)?.status === "Deceased";
  const pnc = profile.holdings.filter((h) => !h.external);

  const probate = plan.accounts.filter((a) => a.outcome.probate && a.holding.value > 0);
  if (probate.length) {
    const hs = probate.map((a) => a.holding);
    const stillTitled = probate.filter((a) =>
      a.holding.owners.some((o) => o !== personName && deceasedInReality(o)),
    );
    findings.push({
      id: "f.probate",
      severity: sum(hs) >= 100_000 ? "high" : "medium",
      title: `${formatCompactMoney(sum(hs))} would go through probate`,
      detail: `${list(hs.map(label))} ${hs.length > 1 ? "have" : "has"} no surviving co-owner or living beneficiary, so ${hs.length > 1 ? "they'd" : "it'd"} wait for letters before anyone could use ${hs.length > 1 ? "them" : "it"}.`,
      fix: stillTitled.length
        ? `Retitle ${list(stillTitled.map((a) => label(a.holding)))} into ${first}'s name with a POD beneficiary${probate.length > stillTitled.length ? `, and add a beneficiary to ${list(probate.filter((a) => !stillTitled.includes(a)).map((a) => label(a.holding)))}` : ""}`
        : `Add a POD/TOD or retirement beneficiary to ${list(hs.map(label))}`,
      holdingIds: hs.map((h) => h.id),
      value: sum(hs),
      sources: uniq(probate.flatMap((a) => a.outcome.sources)),
    });
  }

  const namesDeceased = pnc.filter(
    (h) =>
      h.type !== "529 plan" &&
      h.owners.some((o) => !deceasedInReality(o)) &&
      h.beneficiaries?.some(deceasedInReality),
  );
  if (namesDeceased.length) {
    const who = uniq(namesDeceased.flatMap((h) => h.beneficiaries!.filter(deceasedInReality)));
    findings.push({
      id: "f.names-deceased",
      severity: "high",
      title: `${namesDeceased.length} designation${namesDeceased.length > 1 ? "s" : ""} still name${namesDeceased.length > 1 ? "" : "s"} ${list(who.map(firstName))}`,
      detail: `${list(namesDeceased.map(label))} name${namesDeceased.length > 1 ? "" : "s"} ${list(who)}, who has died. Until it's updated the account can't pass the way the owner intends.`,
      fix: `Send new beneficiary forms for ${list(namesDeceased.map(label))}`,
      holdingIds: namesDeceased.map((h) => h.id),
      value: sum(namesDeceased),
      sources: ["irs-pub-590b"],
    });
  }

  const noBeneficiary = pnc.filter(
    (h) =>
      (isRetirement(h) || h.type === "Brokerage") &&
      h.owners.includes(personName) &&
      h.beneficiaries?.length === 0,
  );
  if (noBeneficiary.length) {
    findings.push({
      id: "f.no-beneficiary",
      severity: "high",
      title: `No beneficiary on ${noBeneficiary.length} account${noBeneficiary.length > 1 ? "s" : ""}`,
      detail: `${list(noBeneficiary.map(label))} ${noBeneficiary.length > 1 ? "have" : "has"} no beneficiary on file.`,
      fix: `Name beneficiaries on ${list(noBeneficiary.map(label))}`,
      holdingIds: noBeneficiary.map((h) => h.id),
      value: sum(noBeneficiary),
      sources: ["irs-pub-590b", "pa-ch64"],
    });
  }

  const minors = plan.accounts.filter((a) => a.facts.anyBeneficiaryMinor.value === "yes");
  if (minors.length) {
    const kids = uniq(
      minors.flatMap((a) =>
        a.passesToNames.filter((n) => (profile.members.find((m) => m.name === n)?.age ?? 99) < 18),
      ),
    );
    findings.push({
      id: "f.minor-direct",
      severity: "medium",
      title: `A minor is named directly on ${minors.length} account${minors.length > 1 ? "s" : ""}`,
      detail: `${list(minors.map((a) => label(a.holding)))} would pass to ${list(kids)}, who can't take it outright.`,
      fix: `Name a custodian or a trust for ${list(kids.map(firstName))} instead of the child directly`,
      holdingIds: minors.map((a) => a.holding.id),
      value: sum(minors.map((a) => a.holding)),
      sources: ["rmd-minor-child"],
    });
  }

  const no529Successor = pnc.filter(
    (h) => h.type === "529 plan" && h.owners.includes(personName) && !h.successorOwner,
  );
  if (no529Successor.length) {
    findings.push({
      id: "f.529-successor",
      severity: "medium",
      title: "No successor owner on the 529",
      detail: `If ${first} died, nobody is named to take over ${list(no529Successor.map(label))}.`,
      fix: "Name a successor owner on the 529",
      holdingIds: no529Successor.map((h) => h.id),
      value: sum(no529Successor),
      sources: ["plan-529"],
    });
  }

  if (customer.will.status !== "on-file" && plan.totals.probate > 0) {
    findings.push({
      id: "f.no-will",
      severity: "medium",
      title:
        customer.will.status === "in-progress" ? "Will started, not finished" : "No will on file",
      detail: `Probate assets would pass under ${first}'s will — or state intestacy rules without one.`,
      fix: "Finish the will in the PNC planner",
      holdingIds: probate.map((a) => a.holding.id),
      value: plan.totals.probate,
      sources: ["pa-register-of-wills"],
    });
  }

  const fdic = plan.accounts.filter((a) => a.overlays.some((o) => o.id === "ov.fdic-grace"));
  if (fdic.length) {
    findings.push({
      id: "f.fdic",
      severity: "low",
      title: "Deposits above the insurance limit",
      detail: `${list(fdic.map((a) => label(a.holding)))} would rely on the FDIC's six-month grace period.`,
      fix: "Review coverage within 6 months of a death",
      holdingIds: fdic.map((a) => a.holding.id),
      value: sum(fdic.map((a) => a.holding)),
      sources: ["fdic-330-3j"],
    });
  }

  findings.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.value - a.value,
  );
  const status = findings.some((f) => f.severity === "high")
    ? "exposed"
    : findings.some((f) => f.severity === "medium")
      ? "gaps"
      : "ready";
  return { person: personName, survivor: input.survivor.name, plan, findings, status };
}

/** People worth simulating: living members (not attorney / sibling-in-law) who own a PNC holding. */
export function simulatablePeople(profile: ClientProfile): string[] {
  return profile.members
    .filter(
      (m) =>
        m.status === "Living" &&
        m.relationship !== "Attorney" &&
        m.relationship !== "Sibling-in-law" &&
        profile.holdings.some((h) => !h.external && h.owners.includes(m.name)),
    )
    .map((m) => m.name);
}
