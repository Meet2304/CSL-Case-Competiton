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
import { effectiveAccess, isAdminMember, roleById } from "@/lib/family";
import { firstName } from "@/lib/format";

export type HouseholdState = {
  families: StoredFamily[];
  /** Beneficiary designations the owner changed, by account id. */
  designations: Record<string, string[]>;
};

export const personById = (id: string): HouseholdPerson | undefined =>
  people.find((p) => p.id === id);
export const personByName = (name: string): HouseholdPerson | undefined =>
  people.find((p) => p.name === name);
export { firstName };
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

/** What `other` is to `viewer` (the seed records relationships to Father). */
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

// ---------------------------------------------------------------------------
// A person's assets: what they own, manage for a child, and what family shares with them

export type AssetRelation = "owned" | "managed" | "shared";

export type PersonAsset = {
  account: BankAccount;
  relation: AssetRelation;
  /** Shared accounts only: the family it is shared through and what the viewer may do. */
  family?: StoredFamily;
  access?: AssetAccess;
};

/** Everything a person can see, in the order a list shows it: theirs, managed, shared. */
export function assetsFor(
  s: HouseholdState,
  personId: string,
  all: BankAccount[],
  deceasedIds: string[],
): PersonAsset[] {
  const { owned, managed } = accountsOf(all, personId);
  return [
    ...owned.map((account): PersonAsset => ({ account, relation: "owned" })),
    ...managed.map((account): PersonAsset => ({ account, relation: "managed" })),
    ...sharedWith(s, personId, all, deceasedIds).map(
      ({ account, family, access }): PersonAsset => ({
        account,
        relation: "shared",
        family,
        access,
      }),
    ),
  ];
}

export type AssetGroup = "cash" | "retirement" | "investments" | "insurance" | "owed";

export const assetGroups: { id: AssetGroup; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "retirement", label: "Retirement" },
  { id: "investments", label: "Investments" },
  { id: "insurance", label: "Life insurance" },
  { id: "owed", label: "Owed" },
];

const groupByKind: Record<AccountKind, AssetGroup> = {
  checking: "cash",
  savings: "cash",
  ira: "retirement",
  roth: "retirement",
  brokerage: "investments",
  "life-insurance": "insurance",
  "credit-card": "owed",
};

export const assetGroupOf = (a: BankAccount): AssetGroup => groupByKind[a.kind];

/**
 * Balances by group. `net` is what the accounts at PNC add up to (debts
 * subtracted); policies held outside PNC are reported separately because a
 * face value isn't a balance.
 */
export function assetSummary(accounts: BankAccount[]) {
  const atPnc = accounts.filter((a) => !a.external);
  const groups = assetGroups
    .map(({ id, label }) => {
      const items = atPnc.filter((a) => assetGroupOf(a) === id);
      return { id, label, total: items.reduce((s, a) => s + a.balance, 0), count: items.length };
    })
    .filter((g) => g.count > 0);
  return {
    net: atPnc.reduce((s, a) => s + a.balance, 0),
    /** Positive groups, for a proportional bar. */
    holdings: groups.filter((g) => g.total > 0),
    owed: groups.find((g) => g.id === "owed")?.total ?? 0,
    outside: accounts.filter((a) => a.external),
    count: accounts.length,
  };
}

/** Matches a search box query against an asset's name, number, type, owners and family. */
export function assetMatches(item: PersonAsset, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const a = item.account;
  const haystack = [
    a.name,
    a.last4 ? `x${a.last4} ${a.last4}` : "",
    kindLabels[a.kind],
    a.external ? "outside pnc" : "",
    item.relation === "shared" ? "shared" : item.relation === "managed" ? "manage custodian" : "",
    item.family?.familyName ?? "",
    ...a.owners.map((id) => personById(id)?.name ?? ""),
  ]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

/**
 * A family at a glance, from one member's side. Admins see every shared
 * account; anyone else sees only what their role lets them see, so nothing
 * here reveals what is hidden from them.
 */
export function familySummary(
  f: StoredFamily,
  viewerId: string,
  all: BankAccount[],
  deceasedIds: string[],
) {
  const state = familyView(f, viewerId, all, deceasedIds);
  const me = state.members.find((m) => m.id === viewerId);
  const isAdmin = me ? isAdminMember(state, me) : false;
  const visible = me
    ? state.assets.filter((a) => isAdmin || effectiveAccess(state, me, a).view)
    : [];
  const living = state.members.filter((m) => m.status !== "Deceased");
  return {
    state,
    me,
    isAdmin,
    role: me ? roleById(state, me.roleId) : undefined,
    living,
    invited: living.filter((m) => m.status === "Invited"),
    deceased: state.members.filter((m) => m.status === "Deceased"),
    /** Accounts this viewer can see in the family. */
    visible,
    total: visible.filter((a) => !a.external && !a.closed).reduce((s, a) => s + a.value, 0),
    /** Of the visible accounts, how many are the viewer's own. */
    yours: visible.filter((a) => a.owners.includes(viewerId)).length,
  };
}

/**
 * Whether a person may manage an account they can see: their own (unless a
 * custodian runs it until they turn 18), one they're the custodian of, or one
 * shared with them with the Manage permission.
 */
export function canManage(item: PersonAsset, personId: string): boolean {
  const a = item.account;
  if (item.relation === "managed") return true;
  if (item.relation === "shared") return item.access?.manage === true;
  return !a.custodian || a.custodian === personId;
}

/**
 * Whether a person can pay bills from an account: a PNC checking or savings
 * account they run themselves (theirs, or one they're custodian of), or one
 * shared with them whose role allows paying and transferring.
 */
export function canPayFrom(item: PersonAsset, personId: string): boolean {
  const a = item.account;
  if (a.external || (a.kind !== "checking" && a.kind !== "savings")) return false;
  if (item.relation === "shared") return item.access?.transact === true;
  return canManage(item, personId);
}
