import { useMemo, useSyncExternalStore } from "react";
import { advisorCustomers } from "@/data/advisor";
import { customer } from "@/data/mock";
import type { WillStatus } from "@/data/types";
import { emptyDraft, type WillDraft, type WillProgress } from "./types";

/**
 * Demo persistence for the signed-in customer's will. There is no backend, so
 * the draft lives in this browser's localStorage. The status key is separate
 * (and tiny) so the customer reminder and the advisor dashboard can watch it:
 * finish a will as `customer`, sign in as `advisor` in the same browser and
 * the household shows "Will on file". Once a will is on file, a family member
 * it names can begin executing it; that progress is stored here too.
 */
const DRAFT_KEY = "pnc-will-draft-v1";
const STATUS_KEY = "pnc-will-status";
const EXECUTION_KEY = "pnc-will-execution";
const STATUS_EVENT = "pnc-will-status";

export type SavedWill = { draft: WillDraft; progress?: WillProgress };

/** A family member has started settling the estate under the will. */
export type WillExecution = {
  /** Family member id of whoever began execution. */
  startedBy: string;
  startedOn: string; // ISO date
  dateOfPassing: string; // ISO date
  /** Ids of finished estate steps (see `estateSteps`). */
  completed: string[];
};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode): the planner still works for this visit.
  }
}

export function loadWill(): SavedWill {
  return parseWill(read(DRAFT_KEY)) ?? { draft: emptyDraft() };
}

function parseWill(raw: string | null): SavedWill | null {
  if (raw) {
    try {
      const saved = JSON.parse(raw) as SavedWill;
      // Merge over an empty draft so drafts saved by older builds gain new fields.
      const base = emptyDraft();
      const draft = Object.fromEntries(
        Object.entries(base).map(([k, v]) => {
          const s = (saved.draft as Record<string, unknown>)[k];
          return [k, Array.isArray(v) ? (s ?? v) : { ...v, ...(s as object) }];
        }),
      ) as WillDraft;
      return { draft, progress: saved.progress };
    } catch {
      // Corrupt draft: start over.
    }
  }
  return null;
}

export function saveWill(saved: SavedWill) {
  write(DRAFT_KEY, JSON.stringify(saved));
}

export function readWillStatus(): WillStatus | null {
  const v = read(STATUS_KEY);
  return v === "in-progress" || v === "on-file" ? v : null;
}

export function setWillStatus(status: WillStatus) {
  write(STATUS_KEY, status === "none" ? null : status);
  write(`${STATUS_KEY}-updated`, status === "none" ? null : new Date().toISOString().slice(0, 10));
  window.dispatchEvent(new Event(STATUS_EVENT));
}

export function readWillUpdated(): string | undefined {
  return read(`${STATUS_KEY}-updated`) ?? undefined;
}

export function setWillExecution(execution: WillExecution | null) {
  write(EXECUTION_KEY, execution && JSON.stringify(execution));
  window.dispatchEvent(new Event(STATUS_EVENT));
}

/** Clears the draft, status and any execution ("Start over"). */
export function resetWill() {
  write(DRAFT_KEY, null);
  write(EXECUTION_KEY, null);
  setWillStatus("none");
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STATUS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STATUS_EVENT, onChange);
  };
}

/**
 * The demo customer's will status as saved in this browser, or `fallback`
 * (the mock record) when nothing is saved. The server render always uses
 * `fallback`, so markup matches until the browser value is read.
 */
export function useWillStatus(fallback: WillStatus): WillStatus {
  return useSyncExternalStore(
    subscribe,
    () => readWillStatus() ?? fallback,
    () => fallback,
  );
}

/** The bank's record for the demo customer, used until this browser has saved a status. */
const recordedStatus = advisorCustomers.find((c) => c.id === customer.id)?.will.status ?? "none";

/** The signed-in customer's will status. */
export const useMyWillStatus = () => useWillStatus(recordedStatus);

/** The saved will (answers and progress), or null on the server / before one is started. */
export function useSavedWill(): SavedWill | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(DRAFT_KEY),
    () => null,
  );
  return useMemo(() => parseWill(raw), [raw]);
}

/** The estate settlement in progress under the will, if anyone has begun it. */
export function useWillExecution(): WillExecution | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(EXECUTION_KEY),
    () => null,
  );
  return useMemo(() => {
    try {
      return raw ? (JSON.parse(raw) as WillExecution) : null;
    } catch {
      return null;
    }
  }, [raw]);
}

/** True once rendering on the client (localStorage is readable). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
