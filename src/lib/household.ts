/**
 * Rules over the Sample household (src/data/household.ts): who owns or
 * manages which account, what each person sees through the families they
 * belong to, and how an account looks inside a family. Pure functions; the
 * browser-side state (families, beneficiary changes) is in ./householdStore.
 */
import { accounts as seedAccounts, people, type StoredFamily } from "@/data/household";
import type {
  AccountKind,
  AssetAccess,
  AssetCategory,
  BankAccount,
  FamilyAsset,
  FamilyMember,
  FamilyState,
  HouseholdPerson,
  SuccessionMethod,
} from "@/data/types";
import { effectiveAccess, roleById } from "@/lib/family";

export type HouseholdState = {
  families: StoredFamily[];
  /** Beneficiary designations the owner changed, by account id. */
  designations: Record<string, string[]>;
};

export const personById = (id: string): HouseholdPerson | undefined =>
  people.find((p) => p.id === id);
export const personByName = (name: string): HouseholdPerson | undefined =>
  people.find((p) => p.name === name);
export const firstName = (name: string) => name.split(" ")[0];
export const accountLabel = (a: BankAccount) => `${a.name}${a.last4 ? ` x${a.last4}` : ""}`;

/** Whole years between a birthdate and `todayIso`. */
export function ageOn(birthIso: string, todayIso: string): number {
  const [by, bm, bd] = birthIso.split("-").map(Number);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export const isMinor = (p: HouseholdPerson, today: string) => ageOn(p.birthdate, today) < 18;

/** The account list with the owners' beneficiary changes applied. */
export function currentAccounts(s: HouseholdState): BankAccount[] {
  return seedAccounts.map((a) =>
    a.beneficiaries !== undefined && s.designations[a.id]
      ? { ...a, beneficiaries: s.designations[a.id] }
      : a,
  );
}

/** Accounts a person owns, or manages for a minor child. */
export function accountsOf(all: BankAccount[], personId: string) {
  return {
    owned: all.filter((a) => a.owners.includes(personId)),
    managed: all.filter((a) => a.custodian === personId && !a.owners.includes(personId)),
  };
}

/** Kinds where the owner can name who inherits the account directly. */
export const takesBeneficiary = (a: BankAccount) =>
  a.beneficiaries !== undefined && a.owners.length === 1 && !a.custodian;

export const kindLabels: Record<AccountKind, string> = {
  checking: "Checking",
  savings: "Savings",
  ira: "Retirement",
  roth: "Retirement",
  brokerage: "Investments",
  "credit-card": "Credit card",
  "life-insurance": "Life insurance",
};

/** What naming a beneficiary does, in the account owner's terms. */
export function designationTerm(a: BankAccount): string {
  if (a.kind === "checking" || a.kind === "savings") return "payable-on-death beneficiary";
  if (a.kind === "brokerage") return "transfer-on-death beneficiary";
  if (a.kind === "life-insurance") return "policy beneficiary";
  return "beneficiary";
}

// ---------------------------------------------------------------------------
// Families

const categoryByKind: Record<AccountKind, AssetCategory> = {
  checking: "Checking & savings",
  savings: "Checking & savings",
  ira: "401(k) / IRA",
  roth: "401(k) / IRA",
  brokerage: "Brokerage account",
  "credit-card": "Debts",
  "life-insurance": "Life insurance",
};

function methodOf(a: BankAccount): SuccessionMethod | undefined {
  if (a.kind === "life-insurance") return undefined;
  if (a.kind === "credit-card") return "close";
  if (a.owners.length > 1) return "joint";
  if (a.kind === "ira" || a.kind === "roth") return "retirement";
  if (a.beneficiaries?.length) return a.kind === "brokerage" ? "tod" : "pod";
  return "estate";
}

/** How an account appears inside a family. */
export function accountAsAsset(a: BankAccount): FamilyAsset {
  return {
    id: a.id,
    name: a.name,
    last4: a.last4,
    category: categoryByKind[a.kind],
    value: a.balance,
    owners: a.owners,
    method: methodOf(a),
    successors: a.beneficiaries?.length ? a.beneficiaries : undefined,
    external: a.external,
  };
}

/** A stored family as seen by one viewer, with recorded deaths applied. */
export function familyView(
  f: StoredFamily,
  viewerId: string,
  all: BankAccount[],
  deceasedIds: string[],
): FamilyState {
  return {
    familyName: f.familyName,
    selfId: viewerId,
    members: f.members.map<FamilyMember>((m) =>
      deceasedIds.includes(m.id) ? { ...m, status: "Deceased" } : m,
    ),
    roles: f.roles,
    assets: f.accountIds.flatMap((id) => {
      const a = all.find((x) => x.id === id);
      return a ? [accountAsAsset(a)] : [];
    }),
    processes: [],
  };
}

export const familiesOf = (s: HouseholdState, personId: string) =>
  s.families.filter((f) => f.members.some((m) => m.id === personId));

/** Accounts other people share with this person through a family, with what they may do. */
export function sharedWith(
  s: HouseholdState,
  personId: string,
  all: BankAccount[],
  deceasedIds: string[],
): { account: BankAccount; family: StoredFamily; access: AssetAccess }[] {
  const out: { account: BankAccount; family: StoredFamily; access: AssetAccess }[] = [];
  for (const f of familiesOf(s, personId)) {
    const view = familyView(f, personId, all, deceasedIds);
    const me = view.members.find((m) => m.id === personId);
    if (!me) continue;
    for (const asset of view.assets) {
      const account = all.find((a) => a.id === asset.id)!;
      if (account.owners.includes(personId) || account.custodian === personId) continue;
      if (out.some((x) => x.account.id === account.id)) continue;
      const access = effectiveAccess(view, me, asset);
      if (access.view) out.push({ account, family: f, access });
    }
  }
  return out;
}

/** What `other` is to `viewer` (the seed records relationships to Jordan). */
export function relationshipTo(
  viewer: HouseholdPerson,
  other: HouseholdPerson,
): FamilyMember["relationship"] {
  if (viewer.id === other.id) return "Self";
  if (other.relationship === "Other" || viewer.relationship === "Other") return "Other";
  const parent = (r: string) => r === "Self" || r === "Spouse";
  if (parent(viewer.relationship)) return parent(other.relationship) ? "Spouse" : "Child";
  return parent(other.relationship) ? "Parent" : "Sibling";
}

/**
 * The whole household seen from one person (`selfId`): everyone in it, with
 * relationships from that person's side, and that person's own accounts.
 * The will planner and executor tracker read the household in this shape.
 */
export function householdAsFamily(
  selfId: string,
  all: BankAccount[],
  deceasedIds: string[],
): FamilyState {
  const self = personById(selfId)!;
  return {
    familyName: "Household",
    selfId,
    members: people.map<FamilyMember>((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      relationship: relationshipTo(self, p),
      note: p.note,
      roleId: "",
      status: deceasedIds.includes(p.id) ? "Deceased" : "Active",
    })),
    roles: [],
    assets: accountsOf(all, selfId).owned.map(accountAsAsset),
    processes: [],
  };
}

/** "Admin" or the role's name, for a member of a family. */
export function roleName(f: StoredFamily, personId: string): string | undefined {
  const member = f.members.find((m) => m.id === personId);
  return member ? roleById({ roles: f.roles } as FamilyState, member.roleId)?.name : undefined;
}
