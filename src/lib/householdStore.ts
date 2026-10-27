/**
 * Browser-side state for the Sample household: the families people create
 * and the beneficiary changes they make. Kept in localStorage so every login
 * in the same browser (and the advisor) sees the same household. Only things
 * people actually do are stored; everything else is derived in ./household.
 */
import { useMemo, useSyncExternalStore } from "react";
import {
  adminRole,
  people,
  retiredRoleIds,
  seedFamilies,
  type StoredFamily,
} from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import type { FamilyMember } from "@/data/types";
import { personByName, type HouseholdState } from "@/lib/household";
import { useBereavement } from "@/lib/bereavement";

const STORAGE_KEY = "pnc-household-v1";
const EMPTY: HouseholdState = { families: seedFamilies, designations: {} };
const listeners = new Set<() => void>();

let cached: { raw: string | null; state: HouseholdState } = { raw: null, state: EMPTY };

function read(): HouseholdState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cached.state;
  }
  if (raw === cached.raw) return cached.state;
  let state = EMPTY;
  try {
    state = raw ? { ...EMPTY, ...(JSON.parse(raw) as HouseholdState) } : EMPTY;
  } catch {}
  cached = { raw, state: normalize(state) };
  return cached.state;
}

/**
 * Brings families saved by earlier builds in line with the seed: household
 * members' names and emails come from the seed (so a rename such as Jordan
 * Sample → Father reaches them), families hold family only (an outside
 * professional such as the estate attorney is dropped), and retired roles go
 * once nobody holds them.
 */
function normalize(state: HouseholdState): HouseholdState {
  return {
    ...state,
    families: state.families.map((f) => {
      const members = f.members.flatMap((m) => {
        const p = people.find((x) => x.id === m.id);
        if (!p) return [m];
        if (p.relationship === "Other") return [];
        return [{ ...m, name: p.name, email: p.email }];
      });
      const roles = f.roles.filter(
        (r) => !retiredRoleIds.includes(r.id) || members.some((m) => m.roleId === r.id),
      );
      return { ...f, members, roles };
    }),
  };
}

function write(next: HouseholdState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The household as saved in this browser; the seed during server render. */
export function useHousehold(): HouseholdState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Ids of household members whose death the bank has recorded. */
export function useDeceasedIds(): string[] {
  const { losses } = useBereavement();
  return useMemo(() => losses.flatMap((l) => personByName(l.personName)?.id ?? []), [losses]);
}

const update = (fn: (s: HouseholdState) => HouseholdState) => write(fn(read()));
const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const householdActions = {
  /** A new family with its creator as the only admin. */
  createFamily(name: string, creatorId: string): string {
    const creator = people.find((p) => p.id === creatorId)!;
    const id = newId("fam");
    const me: FamilyMember = {
      id: creator.id,
      name: creator.name,
      email: creator.email,
      relationship: "Self",
      roleId: adminRole.id,
      status: "Active",
    };
    const family: StoredFamily = {
      id,
      familyName: name.trim(),
      createdBy: creatorId,
      createdOn: MOCK_AS_OF,
      members: [me],
      roles: [adminRole],
      accountIds: [],
    };
    update((s) => ({ ...s, families: [...s.families, family] }));
    return id;
  },
  updateFamily(id: string, fn: (f: StoredFamily) => StoredFamily) {
    update((s) => ({ ...s, families: s.families.map((f) => (f.id === id ? fn(f) : f)) }));
  },
  setBeneficiaries(accountId: string, personIds: string[]) {
    update((s) => ({ ...s, designations: { ...s.designations, [accountId]: personIds } }));
  },
  reset() {
    write(EMPTY);
  },
};
