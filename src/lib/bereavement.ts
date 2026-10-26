/**
 * Demo store for the bereavement journey. The bank (advisor view) records a
 * death; the surviving spouse's views (customer side) react to it. Both sides
 * read this one store, kept in localStorage so the demo works across a
 * sign-out / sign-in in the same browser, and synced between open tabs.
 */
import { useSyncExternalStore } from "react";
import type { FamilyRelationship } from "@/data/types";

export type RecordedLoss = {
  id: string;
  /** Advisor customer (household) id, e.g. "c-sample". */
  customerId: string;
  memberName: string;
  relationship: FamilyRelationship;
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
};

const STORAGE_KEY = "pnc-bereavement-demo-v1";
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
  /** Clears the survivor's progress but keeps the recorded loss, for the demo. */
  resetProgress() {
    update((s) => ({ ...s, deathCertificate: undefined, flows: {} }));
  },
  /** Clears everything, for the demo. */
  reset() {
    write(EMPTY);
  },
};

export function flowProgress(s: BereavementState, flowId: string): FlowProgress {
  return s.flows[flowId] ?? { status: "not-started", answers: {} };
}

/** The open loss for a household, if the bank has recorded one. */
export function lossFor(s: BereavementState, customerId: string): RecordedLoss | undefined {
  return [...s.losses].reverse().find((l) => l.customerId === customerId);
}
