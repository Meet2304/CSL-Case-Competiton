/**
 * Rules for the family dashboard: who can see and control which asset, and
 * what happens legally when a family member dies. Pure functions only — the
 * React state lives in components/family/FamilyProvider.tsx.
 */
import { FULL_ACCESS, methodSteps, NO_ACCESS } from "@/data/family";
import type {
  AssetAccess,
  FamilyAsset,
  FamilyMember,
  FamilyMemberRelationship,
  FamilyRole,
  FamilyState,
  SuccessionProcess,
  SuccessionStep,
} from "@/data/types";

// ---------------------------------------------------------------------------
// Lookups

export const memberById = (s: FamilyState, id: string) => s.members.find((m) => m.id === id);
export const roleById = (s: FamilyState, id: string) => s.roles.find((r) => r.id === id);
export const firstName = (name: string) => name.split(" ")[0];

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const isAdminMember = (s: FamilyState, m: FamilyMember) =>
  m.status !== "Deceased" && roleById(s, m.roleId)?.isAdmin === true;

export const livingAdmins = (s: FamilyState) => s.members.filter((m) => isAdminMember(s, m));

// ---------------------------------------------------------------------------
// Access

/** Keeps a permission set consistent: anything beyond viewing implies view. */
export function normalizeAccess(a: AssetAccess): AssetAccess {
  const view = a.view || a.activity || a.transact || a.manage;
  return { ...a, view };
}

export const isFull = (a: AssetAccess) => a.view && a.activity && a.transact && a.manage;

export function roleAccess(role: FamilyRole | undefined, assetId: string): AssetAccess {
  if (!role) return NO_ACCESS;
  if (role.isAdmin) return FULL_ACCESS;
  return role.access[assetId] ?? NO_ACCESS;
}

/** An in-progress legal process freezes control of the asset for everyone. */
export function activeProcess(s: FamilyState, assetId: string): SuccessionProcess | undefined {
  return s.processes.find((p) => p.assetId === assetId && p.status === "in-progress");
}

export const isLocked = (s: FamilyState, assetId: string) =>
  activeProcess(s, assetId) !== undefined;

/** What a member can actually do with an asset right now. */
export function effectiveAccess(
  s: FamilyState,
  member: FamilyMember,
  asset: FamilyAsset,
): AssetAccess {
  if (member.status === "Deceased") return NO_ACCESS;
  const base = roleAccess(roleById(s, member.roleId), asset.id);
  if (isLocked(s, asset.id) || asset.closed) return { ...base, transact: false, manage: false };
  return base;
}

/** Living members who can see an asset. */
export function viewersOf(s: FamilyState, asset: FamilyAsset): FamilyMember[] {
  return s.members.filter((m) => effectiveAccess(s, m, asset).view);
}

/** "Sees 4 of 10 assets · controls 1" for a role card. */
export function roleSummary(s: FamilyState, role: FamilyRole) {
  const access = s.assets.map((a) => roleAccess(role, a.id));
  return {
    sees: access.filter((a) => a.view).length,
    controls: access.filter((a) => a.transact || a.manage).length,
    total: s.assets.length,
  };
}

// ---------------------------------------------------------------------------
// Succession

export function stepsFor(asset: FamilyAsset): SuccessionStep[] {
  return asset.steps ?? (asset.method ? methodSteps[asset.method] : []);
}

/** Who takes control of `asset` if `deceasedId` dies (empty for closing credit). */
export function successorsFor(
  s: FamilyState,
  asset: FamilyAsset,
  deceasedId: string,
): FamilyMember[] {
  if (!asset.method || asset.method === "close") return [];
  const ids =
    asset.method === "joint" || asset.method === "trust"
      ? asset.owners.filter((id) => id !== deceasedId)
      : (asset.successors ?? []);
  return ids
    .map((id) => memberById(s, id))
    .filter((m): m is FamilyMember => m !== undefined && m.status !== "Deceased");
}

/** Assets an owner's death would affect. */
export function assetsAffectedBy(s: FamilyState, memberId: string): FamilyAsset[] {
  return s.assets.filter((a) => !a.closed && a.owners.includes(memberId));
}

// ---------------------------------------------------------------------------
// State changes

export type FamilyAction =
  | { type: "hydrate"; state: FamilyState }
  | { type: "reset"; state: FamilyState }
  | {
      type: "addMember";
      /** An id/status when adding someone the bank already knows (e.g. a household member). */
      member: Omit<FamilyMember, "id" | "status"> & Partial<Pick<FamilyMember, "id" | "status">>;
    }
  | { type: "setMemberRole"; memberId: string; roleId: string }
  | { type: "removeMember"; memberId: string }
  | { type: "reportPassing"; memberId: string; date: string }
  | { type: "toggleStep"; processId: string; stepId: string }
  | { type: "saveRole"; role: FamilyRole }
  | { type: "deleteRole"; roleId: string }
  | { type: "addAsset"; asset: Omit<FamilyAsset, "id"> };

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export function familyReducer(s: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case "hydrate":
    case "reset":
      return action.state;

    case "addMember": {
      const id = action.member.id ?? newId("m");
      if (s.members.some((m) => m.id === id)) return s;
      return {
        ...s,
        members: [
          ...s.members,
          { ...action.member, id, status: action.member.status ?? "Invited" },
        ],
      };
    }

    case "setMemberRole": {
      const member = memberById(s, action.memberId);
      if (!member) return s;
      // Never leave the family without a living admin.
      const losingAdmin = isAdminMember(s, member) && !roleById(s, action.roleId)?.isAdmin;
      if (losingAdmin && livingAdmins(s).length <= 1) return s;
      return {
        ...s,
        members: s.members.map((m) =>
          m.id === action.memberId ? { ...m, roleId: action.roleId } : m,
        ),
      };
    }

    case "removeMember": {
      const member = memberById(s, action.memberId);
      if (!member || member.id === s.selfId) return s;
      if (isAdminMember(s, member) && livingAdmins(s).length <= 1) return s;
      return { ...s, members: s.members.filter((m) => m.id !== action.memberId) };
    }

    case "reportPassing": {
      const member = memberById(s, action.memberId);
      if (!member || member.id === s.selfId || member.status === "Deceased") return s;
      const processes = assetsAffectedBy(s, member.id)
        .filter((a) => !activeProcess(s, a.id))
        .map<SuccessionProcess>((a) => ({
          id: newId("p"),
          assetId: a.id,
          deceasedId: member.id,
          startedOn: action.date,
          completedStepIds: [],
          status: "in-progress",
        }));
      return {
        ...s,
        members: s.members.map((m) => (m.id === member.id ? { ...m, status: "Deceased" } : m)),
        processes: [...s.processes, ...processes],
      };
    }

    case "toggleStep": {
      const process = s.processes.find((p) => p.id === action.processId);
      const asset = process && s.assets.find((a) => a.id === process.assetId);
      if (!process || !asset || process.status === "complete") return s;

      const done = process.completedStepIds.includes(action.stepId)
        ? process.completedStepIds.filter((id) => id !== action.stepId)
        : [...process.completedStepIds, action.stepId];
      const complete = stepsFor(asset).every((step) => done.includes(step.id));

      const processes = s.processes.map((p) =>
        p.id === process.id
          ? { ...p, completedStepIds: done, status: complete ? ("complete" as const) : p.status }
          : p,
      );
      if (!complete) return { ...s, processes };

      // Legal process finished: ownership moves to the successors (or the card closes).
      const successors = successorsFor(s, asset, process.deceasedId).map((m) => m.id);
      const assets = s.assets.map((a) =>
        a.id !== asset.id
          ? a
          : asset.method === "close"
            ? { ...a, closed: true, owners: [] }
            : { ...a, owners: successors, successors: undefined },
      );
      return { ...s, processes, assets };
    }

    case "saveRole": {
      const role = { ...action.role, id: action.role.id || newId("r") };
      const exists = s.roles.some((r) => r.id === role.id);
      return {
        ...s,
        roles: exists ? s.roles.map((r) => (r.id === role.id ? role : r)) : [...s.roles, role],
      };
    }

    case "deleteRole": {
      const role = roleById(s, action.roleId);
      if (!role || role.builtIn || s.members.some((m) => m.roleId === role.id)) return s;
      return { ...s, roles: s.roles.filter((r) => r.id !== role.id) };
    }

    case "addAsset":
      return { ...s, assets: [...s.assets, { ...action.asset, id: newId("a") }] };
  }
}

export const relationships: FamilyMemberRelationship[] = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Other",
];
