/**
 * Fact derivation: turns one holding (and the household around it) into the
 * discrete facts the rulebook branches on, each with the evidence it came
 * from. This is where correctness lives — keep every rule here and tested.
 */
import type {
  AccountClass,
  AccountFactKey,
  AccountFacts,
  BeneficiaryStatus,
  ClientMember,
  Holding,
  HoldingType,
  HouseholdFacts,
  OutcomeNode,
  PrimaryBeneficiaryCategory,
  StateCode,
  TriState,
} from "@/data/types";
import { formatCompactMoney } from "@/lib/format";

export type DerivationContext = {
  deceased: { name: string; age?: number };
  survivor: { name: string };
  /** With the deceased already marked "Deceased". */
  members: ClientMember[];
  state: StateCode;
};

/** Every value each branched-on fact can take. Decision nodes must cover exactly these. */
export const FACT_DOMAINS: Partial<Record<AccountFactKey, readonly string[]>> = {
  accountClass: [
    "deposit",
    "cd",
    "brokerage",
    "ira-traditional",
    "ira-roth",
    "ira-inherited",
    "trust",
    "education-529",
    "life-insurance",
    "credit-card",
    "real-estate",
    "vehicle",
    "other",
  ],
  decedentRole: [
    "sole-owner",
    "joint-owner",
    "co-trustee",
    "sole-trustee",
    "plan-owner",
    "named-beneficiary",
    "not-involved",
  ],
  beneficiaryStatus: ["living", "none-on-file", "all-deceased", "not-applicable"],
  primaryBeneficiaryCategory: [
    "spouse",
    "minor-child-of-decedent",
    "within-10-years-of-age",
    "other-individual",
    "not-applicable",
  ],
  successorOwnerNamed: ["yes", "no", "unknown"],
  state: ["PA", "other"],
};

const classByType: Record<HoldingType, AccountClass> = {
  Checking: "deposit",
  Savings: "deposit",
  "Money market": "deposit",
  CD: "cd",
  Brokerage: "brokerage",
  "Traditional IRA": "ira-traditional",
  "401(k) rollover IRA": "ira-traditional",
  "Roth IRA": "ira-roth",
  "Inherited IRA": "ira-inherited",
  Trust: "trust",
  "529 plan": "education-529",
  "Life insurance": "life-insurance",
  "Credit card": "credit-card",
};

export function accountClassOf(h: Holding): AccountClass {
  return classByType[h.type];
}

export function stateFromCity(city: string): StateCode {
  return /,\s*PA$/.test(city) ? "PA" : "other";
}

const memberOf = (name: string, members: ClientMember[]) => members.find((m) => m.name === name);
const isDeceased = (name: string, members: ClientMember[]) =>
  memberOf(name, members)?.status === "Deceased";
const withStatus = (names: string[], members: ClientMember[]) =>
  names.map((n) => (isDeceased(n, members) ? `${n} (deceased)` : n)).join(", ");

/** True when one of the two is the household's primary customer and the other their spouse. */
export function areSpouses(a: string, b: string, members: ClientMember[]): boolean {
  const ra = memberOf(a, members)?.relationship;
  const rb = memberOf(b, members)?.relationship;
  return (ra === "Spouse" && rb === "Self") || (ra === "Self" && rb === "Spouse");
}

/** Owners other than the deceased who are still living. */
function livingCoOwners(h: Holding, ctx: DerivationContext): string[] {
  return h.owners.filter((o) => o !== ctx.deceased.name && !isDeceased(o, ctx.members));
}

/**
 * Who takes under the designation: living primaries, or the living contingents
 * when every primary has died. `viaContingent` says which.
 */
export function beneficiaryTakers(
  h: Holding,
  ctx: DerivationContext,
): { names: string[]; viaContingent: boolean } {
  const alive = (n: string) => n !== ctx.deceased.name && !isDeceased(n, ctx.members);
  const primaries = (h.beneficiaries ?? []).filter(alive);
  if (primaries.length) return { names: primaries, viaContingent: false };
  return { names: (h.contingentBeneficiaries ?? []).filter(alive), viaContingent: true };
}

function decedentRoleOf(h: Holding, ctx: DerivationContext) {
  const d = ctx.deceased.name;
  const isOwner = h.owners.includes(d);
  const coOwners = livingCoOwners(h, ctx);
  if (h.type === "Trust" && isOwner) return coOwners.length ? "co-trustee" : "sole-trustee";
  if (h.type === "529 plan" && isOwner) return "plan-owner";
  if (isOwner && h.ownership === "Joint" && coOwners.length) return "joint-owner";
  if (isOwner) return "sole-owner";
  // A deceased owner's account naming them isn't an action item for anyone.
  const someOwnerLiving = h.owners.some((o) => !isDeceased(o, ctx.members));
  if ((h.beneficiaries ?? []).includes(d) && h.type !== "529 plan" && someOwnerLiving)
    return "named-beneficiary";
  return "not-involved";
}

function beneficiaryStatusOf(h: Holding, ctx: DerivationContext): BeneficiaryStatus {
  if (h.beneficiaries === undefined || h.type === "529 plan") return "not-applicable";
  if (h.beneficiaries.length === 0) return "none-on-file";
  const takers = beneficiaryTakers(h, ctx);
  return takers.names.length ? "living" : "all-deceased";
}

function categoryOf(first: string | undefined, ctx: DerivationContext): PrimaryBeneficiaryCategory {
  if (!first) return "not-applicable";
  if (first === ctx.survivor.name && areSpouses(ctx.deceased.name, first, ctx.members))
    return "spouse";
  const b = memberOf(first, ctx.members);
  const dRel = memberOf(ctx.deceased.name, ctx.members)?.relationship;
  if (
    b?.relationship === "Child" &&
    (dRel === "Self" || dRel === "Spouse") &&
    b.age !== undefined &&
    b.age < 21
  )
    return "minor-child-of-decedent";
  if (b?.age !== undefined && ctx.deceased.age !== undefined && b.age >= ctx.deceased.age - 10)
    return "within-10-years-of-age";
  return "other-individual";
}

function minorOf(names: string[], ctx: DerivationContext): TriState {
  const ages = names.map((n) => memberOf(n, ctx.members)?.age);
  if (ages.some((a) => a !== undefined && a < 18)) return "yes";
  if (ages.some((a) => a === undefined)) return "unknown";
  return "no";
}

function rbdOf(h: Holding, age: number | undefined): TriState {
  if (h.type === "Roth IRA") return "no";
  if (age === undefined) return "unknown";
  if (age >= 74) return "yes";
  if (age <= 72) return "no";
  return "unknown";
}

export function deriveAccountFacts(h: Holding, ctx: DerivationContext): AccountFacts {
  const role = decedentRoleOf(h, ctx);
  const status = beneficiaryStatusOf(h, ctx);
  const takers = status === "living" ? beneficiaryTakers(h, ctx).names : [];
  const category = status === "living" ? categoryOf(takers[0], ctx) : "not-applicable";
  const age = ctx.deceased.age;
  const rbd = rbdOf(h, age);
  const successor: TriState = h.type !== "529 plan" ? "no" : h.successorOwner ? "yes" : "unknown";
  const bens = h.beneficiaries ?? [];

  return {
    accountClass: { value: accountClassOf(h), evidence: h.type },
    decedentRole: {
      value: role,
      evidence:
        role === "named-beneficiary" ||
        (role === "not-involved" && bens.includes(ctx.deceased.name))
          ? `Owners: ${withStatus(h.owners, ctx.members)}; beneficiary: ${withStatus(bens, ctx.members)}`
          : `Owners: ${withStatus(h.owners, ctx.members)}${h.ownership !== "Individual" ? ` (${h.ownership.toLowerCase()})` : ""}`,
    },
    beneficiaryStatus: {
      value: status,
      evidence:
        status === "not-applicable"
          ? h.type === "529 plan"
            ? `529 plan for ${bens.join(", ") || "a student"}; no inheritance designation`
            : "No beneficiary designation on this account type"
          : status === "none-on-file"
            ? "No beneficiary on file"
            : `Beneficiaries: ${withStatus(bens, ctx.members)}${h.contingentBeneficiaries?.length ? `; contingent: ${withStatus(h.contingentBeneficiaries, ctx.members)}` : ""}`,
    },
    primaryBeneficiaryCategory: {
      value: category,
      evidence:
        category === "not-applicable"
          ? "No living beneficiary"
          : (() => {
              const m = memberOf(takers[0], ctx.members);
              return `${takers[0]}${m ? ` — ${m.relationship === "Self" ? "primary client" : m.relationship.toLowerCase()}${m.age !== undefined ? `, ${m.age}` : ""}` : ""}${age !== undefined ? `; ${ctx.deceased.name} was ${age}` : ""}`;
            })(),
    },
    beneficiaryCount: {
      value: takers.length,
      evidence: `${takers.length} living beneficiar${takers.length === 1 ? "y" : "ies"}`,
    },
    anyBeneficiaryMinor: {
      value: takers.length ? minorOf(takers, ctx) : "no",
      evidence: takers.length
        ? takers.map((n) => `${n}: ${memberOf(n, ctx.members)?.age ?? "age unknown"}`).join("; ")
        : "No living beneficiary",
    },
    decedentPastRequiredBeginningDate: {
      value: rbd,
      evidence:
        h.type === "Roth IRA"
          ? "Roth IRAs have no lifetime required withdrawals"
          : age === undefined
            ? `${ctx.deceased.name}'s age isn't on file`
            : `${ctx.deceased.name} was ${age}`,
    },
    successorOwnerNamed: {
      value: successor,
      evidence:
        h.type !== "529 plan"
          ? "Not a 529 plan"
          : h.successorOwner
            ? `Successor owner: ${h.successorOwner}`
            : "No successor owner on file",
    },
    heldOutsidePnc: {
      value: h.external === true,
      evidence: h.external ? "Held outside PNC" : "Held at PNC",
    },
    value: { value: h.value, evidence: formatCompactMoney(h.value) },
    state: {
      value: ctx.state,
      evidence: ctx.state === "PA" ? "Household lives in Pennsylvania" : "Household outside PA",
    },
  };
}

/** Things the engine inferred about this account rather than knew. */
export function accountAssumptions(
  h: Holding,
  facts: AccountFacts,
  ctx: DerivationContext,
): string[] {
  const out: string[] = [];
  const d = ctx.deceased.name.split(" ")[0];
  const deadCo = h.owners.filter((o) => o !== ctx.deceased.name && isDeceased(o, ctx.members));
  if (
    h.ownership === "Joint" &&
    h.owners.includes(ctx.deceased.name) &&
    deadCo.length &&
    facts.decedentRole.value === "sole-owner"
  )
    out.push(
      `${label(h)} is still titled jointly with ${deadCo.join(", ")} (deceased); with no surviving co-owner it's treated as ${d}'s alone.`,
    );
  if (
    facts.decedentPastRequiredBeginningDate.value === "yes" &&
    facts.accountClass.value === "ira-traditional"
  )
    out.push(
      `${d} was ${ctx.deceased.age}; we assume they had reached their required beginning date (applicable age 73 for those born 1951–1958).`,
    );
  if (facts.beneficiaryStatus.value === "living" && beneficiaryTakers(h, ctx).viaContingent)
    out.push(`${label(h)}: the primary beneficiary has died, so the contingent beneficiary takes.`);
  if (facts.heldOutsidePnc.value)
    out.push(
      `${label(h)} is held outside PNC — tracked for planning; the client handles it with the provider.`,
    );
  return out;
}

export const label = (h: Holding) => `${h.name}${h.last4 ? ` x${h.last4}` : ""}`;

/** The slice of an account plan the household facts need. */
type PlanLike = { holding: Holding; facts: AccountFacts; outcome: OutcomeNode };

export function deriveHouseholdFacts(
  ctx: DerivationContext,
  plans: PlanLike[],
): { facts: HouseholdFacts; assumptions: string[] } {
  const probate = plans.filter((p) => p.outcome.probate && p.holding.value > 0);
  const probateAtPnc = probate.filter((p) => !p.holding.external);
  const probateValueAtPnc = probateAtPnc.reduce((s, p) => s + p.holding.value, 0);
  const spouses = areSpouses(ctx.deceased.name, ctx.survivor.name, ctx.members);
  const executor = ctx.members.find(
    (m) =>
      m.name !== ctx.deceased.name &&
      m.status !== "Deceased" &&
      m.roles.some((r) => r.startsWith("Executor")),
  );

  let estate = 0;
  for (const { holding: h, facts } of plans) {
    const role = facts.decedentRole.value;
    if (role === "sole-owner" || role === "sole-trustee") estate += Math.max(h.value, 0);
    else if (role === "joint-owner" || role === "co-trustee") estate += 0.5 * h.value;
  }

  return {
    facts: {
      state: { value: ctx.state, evidence: ctx.state === "PA" ? "Pennsylvania" : "Not PA" },
      survivorIsSpouse: {
        value: spouses,
        evidence: spouses
          ? `${ctx.survivor.name} was ${ctx.deceased.name}'s spouse`
          : `${ctx.survivor.name} wasn't ${ctx.deceased.name}'s spouse`,
      },
      executorKnown: {
        value: !!executor,
        evidence: executor
          ? `${executor.name}: ${executor.roles.find((r) => r.startsWith("Executor"))}`
          : "No executor on file",
      },
      hasProbateAssets: {
        value: probate.length > 0,
        evidence: probate.length
          ? `Passes under the will: ${probate.map((p) => label(p.holding)).join(", ")}`
          : "Nothing passes under the will",
      },
      probateValueAtPnc: {
        value: probateValueAtPnc,
        evidence: `${formatCompactMoney(probateValueAtPnc)} at PNC goes through probate`,
      },
      estimatedGrossEstate: {
        value: estate,
        evidence: `About ${formatCompactMoney(estate)}`,
      },
      receivedFederalBenefits: { value: "unknown", evidence: "Not in our records" },
    },
    assumptions: [
      `Estimated gross estate ≈ ${formatCompactMoney(estate)} — sole accounts, half of joint and trust accounts, and life insurance the decedent owned. Accounts outside PNC that we don't track are not included.`,
    ],
  };
}
