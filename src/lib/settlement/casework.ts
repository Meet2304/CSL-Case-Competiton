/**
 * Demo store for what the advisor tells the assistant about a client: answers
 * to the rulebook's open questions, and next steps they've marked done. Both
 * are new information, not derived data — the plan and the steps are always
 * recomputed from them. Same pattern as src/lib/bereavement.ts.
 */
import { useSyncExternalStore } from "react";
import type { Answers } from "./engine";

export type Casework = { answers: Answers; done: string[] };
type State = Record<string, Casework>;

const STORAGE_KEY = "pnc-advisor-casework-v1";
const EMPTY: State = {};
const NONE: Casework = { answers: {}, done: [] };
const listeners = new Set<() => void>();

let cached: { raw: string | null; state: State } = { raw: null, state: EMPTY };

function read(): State {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cached.state;
  }
  if (raw === cached.raw) return cached.state;
  let state = EMPTY;
  try {
    state = raw ? (JSON.parse(raw) as State) : EMPTY;
  } catch {}
  cached = { raw, state };
  return state;
}

function write(next: State) {
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

/** One client's casework. Empty during server render, filled after hydration. */
export function useCasework(customerId: string): Casework {
  return useSyncExternalStore(
    subscribe,
    () => read()[customerId] ?? NONE,
    () => NONE,
  );
}

/** True when any client has casework, e.g. to offer a demo reset. */
export function useHasCasework(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Object.keys(read()).length > 0,
    () => false,
  );
}

function update(customerId: string, fn: (c: Casework) => Casework) {
  const s = read();
  write({ ...s, [customerId]: fn(s[customerId] ?? NONE) });
}

export const caseworkActions = {
  /** Sets one answer for every key the question covers. */
  answer(customerId: string, keys: string[], value: string) {
    update(customerId, (c) => ({
      ...c,
      answers: { ...c.answers, ...Object.fromEntries(keys.map((k) => [k, value])) },
    }));
  },
  clearAnswer(customerId: string, keys: string[]) {
    update(customerId, (c) => ({
      ...c,
      answers: Object.fromEntries(Object.entries(c.answers).filter(([k]) => !keys.includes(k))),
    }));
  },
  toggleDone(customerId: string, stepId: string) {
    update(customerId, (c) => ({
      ...c,
      done: c.done.includes(stepId) ? c.done.filter((x) => x !== stepId) : [...c.done, stepId],
    }));
  },
  reset() {
    write(EMPTY);
  },
};
