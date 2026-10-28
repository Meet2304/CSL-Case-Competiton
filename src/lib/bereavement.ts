/**
 * Demo store for the bereavement journey. The bank (advisor view) records a
 * death; the surviving spouse's views (customer side) react to it. Both sides
 * read this one store, kept in localStorage so the demo works across a
 * sign-out / sign-in in the same browser, and synced between open tabs.
 */
import { useSyncExternalStore } from "react";
import { previousNames } from "@/data/household";
import type { AdvisorCustomer } from "@/data/types";

/**
 * A death as recorded by the bank: one customer, as a single unit. How it
 * affects families (who the person was to whom) is assessed afterwards from
 * the household records — see `assessImpact` in src/lib/advisor.ts.
 */
export type RecordedLoss = {
  id: string;
  /** The customer who passed away. */
  personName: string;
  date: string; // date of death, ISO
  reportedVia: "Branch visit" | "Phone call" | "Mobile app" | "Estate attorney";
  recordedOn: string; // ISO
};

export type FlowStatus = "not-started" | "in-progress" | "submitted" | "complete";

export type FlowProgress = {
  /** Only "submitted" and "complete" are stored; earlier states are derived from answers. */
  status: FlowStatus;
  /** Field answers and step confirmations (`confirm:<stepId>` = "yes"), keyed by id. */
  answers: Record<string, string>;
};

export type BereavementState = {
  losses: RecordedLoss[];
  /** Uploaded once and reused by every transfer flow. */
  deathCertificate?: { fileName: string; uploadedOn: string };
  flows: Record<string, FlowProgress>;
  /** Who has opened the condolence banner, by person id: the loss they saw. It then stays hidden. */
  seenBy?: Record<string, string>;
};

const STORAGE_KEY = "pnc-bereavement-demo-v2";
const EMPTY: BereavementState = { losses: [], flows: {} };
const listeners = new Set<() => void>();

let cached: { raw: string | null; state: BereavementState } = { raw: null, state: EMPTY };

function read(): BereavementState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cached.state;
  }
  // Return the same object while storage is unchanged (useSyncExternalStore needs stable snapshots).
  if (raw === cached.raw) return cached.state;
  let state = EMPTY;
  try {
    state = raw ? { ...EMPTY, ...(JSON.parse(raw) as BereavementState) } : EMPTY;
  } catch {}
  // Deaths recorded before the household was renamed carry the old name.
  if (state.losses.some((l) => previousNames[l.personName]))
    state = {
      ...state,
      losses: state.losses.map((l) => ({
        ...l,
        personName: previousNames[l.personName] ?? l.personName,
      })),
    };
  cached = { raw, state };
  return state;
}

function write(next: BereavementState) {
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

/** Current bereavement state. Empty during server render, filled after hydration. */
export function useBereavement(): BereavementState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const update = (fn: (s: BereavementState) => BereavementState) => write(fn(read()));
const newId = () => Math.random().toString(36).slice(2, 9);

export const bereavementActions = {
  recordLoss(loss: Omit<RecordedLoss, "id">) {
    update((s) => ({ ...s, losses: [...s.losses, { ...loss, id: newId() }] }));
  },
  uploadCertificate(fileName: string, date: string) {
    update((s) => ({ ...s, deathCertificate: { fileName, uploadedOn: date } }));
  },
  saveFlow(flowId: string, progress: FlowProgress) {
    update((s) => ({ ...s, flows: { ...s.flows, [flowId]: progress } }));
  },
  /** The person opened the condolence banner, so it no longer shows for this loss. */
  acknowledgeLoss(personId: string, lossId: string) {
    update((s) => ({ ...s, seenBy: { ...s.seenBy, [personId]: lossId } }));
  },
  /** Clears the survivor's progress but keeps the recorded loss, for the demo. */
  resetProgress() {
    update((s) => ({ ...s, deathCertificate: undefined, flows: {}, seenBy: {} }));
  },
  /** Clears everything, for the demo. */
  reset() {
    write(EMPTY);
  },
};

export function flowProgress(s: BereavementState, flowId: string): FlowProgress {
  return s.flows[flowId] ?? { status: "not-started", answers: {} };
}

/**
 * The most recent recorded death of someone in this household other than the
 * primary customer — i.e. a loss the primary customer is living through.
 */
export function lossFor(s: BereavementState, household: AdvisorCustomer): RecordedLoss | undefined {
  return [...s.losses]
    .reverse()
    .find((l) => household.household.some((m) => m.name === l.personName));
}
