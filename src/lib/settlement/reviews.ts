/**
 * Demo store for review sign-offs on settlement plans: who signed off which
 * step, at which level. The plan itself is always derived; only sign-offs
 * are stored. Same pattern as src/lib/bereavement.ts.
 */
import { useSyncExternalStore } from "react";
import type { ReviewLevel } from "@/data/types";

export type ReviewSignOff = { level: ReviewLevel; by: string; on: string };
/** Keyed by `${customerId}:${queueKey}`. */
export type ReviewState = Record<string, ReviewSignOff[]>;

const STORAGE_KEY = "pnc-settlement-reviews-v1";
const EMPTY: ReviewState = {};
const listeners = new Set<() => void>();

let cached: { raw: string | null; state: ReviewState } = { raw: null, state: EMPTY };

function read(): ReviewState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cached.state;
  }
  if (raw === cached.raw) return cached.state;
  let state = EMPTY;
  try {
    state = raw ? (JSON.parse(raw) as ReviewState) : EMPTY;
  } catch {}
  cached = { raw, state };
  return state;
}

function write(next: ReviewState) {
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

/** Current sign-offs. Empty during server render, filled after hydration. */
export function useReviews(): ReviewState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const reviewKey = (customerId: string, queueKey: string) => `${customerId}:${queueKey}`;

export const reviewActions = {
  signOff(key: string, signOff: ReviewSignOff) {
    const s = read();
    const rest = (s[key] ?? []).filter((x) => x.level !== signOff.level);
    write({ ...s, [key]: [...rest, signOff] });
  },
  undo(key: string, level: ReviewLevel) {
    const s = read();
    write({ ...s, [key]: (s[key] ?? []).filter((x) => x.level !== level) });
  },
  reset() {
    write(EMPTY);
  },
};
