/**
 * Turn the app's data — the advisor's client facts and profiles, or the
 * customer's family dashboard — into settlement engine input.
 */
import type {
  AdvisorCustomer,
  ClientMember,
  ClientProfile,
  FamilyAsset,
  FamilyMember,
  FamilyState,
  Holding,
  HoldingType,
} from "@/data/types";
import type { ClientFacts } from "@/lib/assistant";
import type { Answers, SettlementInput } from "./engine";
import { stateFromCity } from "./facts";

/** What the survivor is to the deceased, from what the deceased was to the survivor. */
const inverse: Record<string, string> = {
  spouse: "spouse",
  parent: "child",
  child: "parent",
  sibling: "sibling",
};

/** For an open loss in the advisor book. Undefined when there's no loss or no deceased member. */
export function settlementInputFromFacts(
  f: ClientFacts,
  answers: Answers = {},
): SettlementInput | undefined {
  if (!f.loss || !f.deceased) return undefined;
  return {
    answers,
    mode: "settlement",
    asOf: f.today,
    deceased: { name: f.deceased.name, age: f.deceased.age, dateOfDeath: f.loss.date },
    survivor: {
      name: f.self,
      relationshipToDeceased: inverse[f.relToSurvivor ?? ""] ?? "family member",
    },
    members: f.p.members,
    holdings: f.p.holdings,
    state: stateFromCity(f.p.city),
  };
}

/** What a household member (relative to the primary customer) is to the customer. */
const toCustomer: Record<string, string> = {
  Spouse: "spouse",
  Child: "parent",
  Parent: "child",
  Sibling: "sibling",
};
/** What the customer's next of kin is to the customer, when the customer dies. */
const kinToCustomer: Record<string, string> = {
  Spouse: "spouse",
  Child: "child",
  Parent: "parent",
  Sibling: "sibling",
};
const KIN_ORDER = ["Spouse", "Child", "Parent", "Sibling"];

/** "What if {personName} died on asOf?" */
export function simulationInput(
  customer: AdvisorCustomer,
  profile: ClientProfile,
  personName: string,
  asOf: string,
  answers: Answers = {},
): SettlementInput {
  const person = profile.members.find((m) => m.name === personName);
  const living = profile.members.filter((m) => m.status === "Living" && m.name !== personName);
  let survivor: SettlementInput["survivor"];
  if (personName === customer.name) {
    const kin = [...living]
      .filter((m) => KIN_ORDER.includes(m.relationship))
      .sort((a, b) => KIN_ORDER.indexOf(a.relationship) - KIN_ORDER.indexOf(b.relationship))[0];
    survivor = kin
      ? { name: kin.name, relationshipToDeceased: kinToCustomer[kin.relationship] }
      : { name: "Heirs under the will", relationshipToDeceased: "heir" };
  } else {
    survivor = {
      name: customer.name,
      relationshipToDeceased: toCustomer[person?.relationship ?? ""] ?? "family member",
    };
  }
  return {
    mode: "simulation",
    asOf,
    deceased: { name: personName, age: person?.age, dateOfDeath: asOf },
    survivor,
    members: profile.members,
    holdings: profile.holdings,
    state: stateFromCity(profile.city),
    answers,
  };
}

// ---------------------------------------------------------------------------
// Customer-side family data.

function clientMember(m: FamilyMember, deceasedId: string, dateOfDeath: string): ClientMember {
  const age = m.note?.match(/Age (\d+)/)?.[1];
  const relationship: ClientMember["relationship"] =
    m.relationship === "Other"
      ? /attorney/i.test(m.note ?? "")
        ? "Attorney"
        : "Sibling-in-law"
      : m.relationship;
  const deceased = m.id === deceasedId || m.status === "Deceased";
  return {
    name: m.name,
    relationship,
    age: age ? Number(age) : undefined,
    status: deceased ? "Deceased" : "Living",
    died: m.id === deceasedId ? dateOfDeath : undefined,
    roles: [],
    note: m.note,
  };
}

function holdingFor(a: FamilyAsset, nameOf: (id: string) => string): Holding | undefined {
  if (a.closed) return undefined;
  const owners = a.owners.map(nameOf);
  const successors = (a.successors ?? []).map(nameOf);
  const byCount = owners.length > 1 ? "Joint" : "Individual";
  const base = {
    id: a.id,
    name: a.name,
    last4: a.last4,
    value: a.value,
    owners,
    external: a.external,
  };
  const typed = (type: HoldingType, rest: Partial<Holding>): Holding => ({
    ...base,
    type,
    ownership: byCount,
    ...rest,
  });
  switch (a.category) {
    case "Checking & savings":
      return typed(a.name.includes("Money Market") ? "Money market" : "Checking", {
        beneficiaries: a.method === "pod" ? successors : a.method === "estate" ? [] : undefined,
      });
    case "Brokerage account":
      return a.method === "trust"
        ? typed("Trust", { ownership: "Trust" })
        : typed("Brokerage", {
            beneficiaries: a.method === "tod" ? successors : a.method === "estate" ? [] : undefined,
          });
    case "401(k) / IRA":
      return typed(a.name.includes("Roth") ? "Roth IRA" : "Traditional IRA", {
        ownership: "Individual",
        beneficiaries: successors,
      });
    case "Life insurance":
      return typed("Life insurance", { ownership: "Individual", beneficiaries: successors });
    case "Debts":
      return typed("Credit card", { ownership: "Individual", value: -Math.abs(a.value) });
    default:
      // Real estate, vehicles and the rest have no class in the advisor model yet.
      return undefined;
  }
}

/** Customer-side family data → engine input. Assumes Pennsylvania (the seed has no address). */
export function settlementInputFromFamily(
  s: FamilyState,
  deceasedId: string,
  dateOfDeath: string,
  asOf: string,
): SettlementInput {
  const members = s.members.map((m) => clientMember(m, deceasedId, dateOfDeath));
  const nameOf = (id: string) => s.members.find((m) => m.id === id)?.name ?? id;
  const deceased = members.find((_, i) => s.members[i].id === deceasedId)!;
  const self = members.find((_, i) => s.members[i].id === s.selfId)!;
  const survivor =
    self.name !== deceased.name
      ? self
      : (members.find((m) => m.relationship === "Spouse" && m.status === "Living") ?? self);
  return {
    mode: "settlement",
    asOf,
    deceased: { name: deceased.name, age: deceased.age, dateOfDeath },
    survivor: {
      name: survivor.name,
      relationshipToDeceased:
        survivor.relationship === "Self" && deceased.relationship === "Spouse"
          ? "spouse"
          : (toCustomer[deceased.relationship] ?? "family member"),
    },
    members,
    holdings: s.assets.flatMap((a) => holdingFor(a, nameOf) ?? []),
    state: "PA",
    assumptions: ["Assumes the family lives in Pennsylvania."],
  };
}
