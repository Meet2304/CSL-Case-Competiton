import { useMemo, useSyncExternalStore } from "react";
import { MOCK_AS_OF } from "@/data/mock";
import type { WillStatus } from "@/data/types";
import { emptyDraft, type WillDraft, type WillProgress } from "./types";

/**
 * Demo persistence for each household member's will, keyed by their person id
 * (the will's owner). There is no backend, so drafts live in this browser's
 * localStorage, where every login and the advisor can see them: finish a will
 * as `husband`, sign in as `advisor` and Husband shows "Will on file". After the
 * bank records the owner's death, the executor's progress settling the estate
 * is stored here too.
 */
const DRAFT_KEY = "pnc-will-draft-v2";
const STATUS_KEY = "pnc-will-status-v2";
const EXECUTION_KEY = "pnc-will-execution-v2";
const STATUS_EVENT = "pnc-will-status";

const key = (base: string, owner: string) => `${base}:${owner}`;

export type SavedWill = { draft: WillDraft; progress?: WillProgress };

/** The executor has started settling the estate under the will. */
export type WillExecution = {
  /** Person id of whoever began execution. */
  startedBy: string;
  startedOn: string; // ISO date
  dateOfPassing: string; // ISO date
  /** Ids of finished estate steps (see `estateSteps`). */
  completed: string[];
};

function read(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}

function write(k: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, value);
  } catch {
    // Storage blocked (private mode): the planner still works for this visit.
  }
}

export function loadWill(owner: string): SavedWill {
  return parseWill(read(key(DRAFT_KEY, owner))) ?? { draft: emptyDraft() };
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

export function saveWill(owner: string, saved: SavedWill) {
  write(key(DRAFT_KEY, owner), JSON.stringify(saved));
}

export function readWillStatus(owner: string): WillStatus | null {
  const v = read(key(STATUS_KEY, owner));
  return v === "in-progress" || v === "on-file" ? v : null;
}

export function setWillStatus(owner: string, status: WillStatus) {
  write(key(STATUS_KEY, owner), status === "none" ? null : status);
  write(key(`${STATUS_KEY}-updated`, owner), status === "none" ? null : MOCK_AS_OF);
  window.dispatchEvent(new Event(STATUS_EVENT));
}

export function readWillUpdated(owner: string): string | undefined {
  return read(key(`${STATUS_KEY}-updated`, owner)) ?? undefined;
}

export function setWillExecution(owner: string, execution: WillExecution | null) {
  write(key(EXECUTION_KEY, owner), execution && JSON.stringify(execution));
  window.dispatchEvent(new Event(STATUS_EVENT));
}

/** Clears the owner's draft, status and any execution ("Start over"). */
export function resetWill(owner: string) {
  write(key(DRAFT_KEY, owner), null);
  write(key(EXECUTION_KEY, owner), null);
  setWillStatus(owner, "none");
}

/** Clears every will in this browser (the demo reset). */
export function resetAllWills() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => [DRAFT_KEY, STATUS_KEY, EXECUTION_KEY].some((b) => k.startsWith(b)))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {}
  window.dispatchEvent(new Event(STATUS_EVENT));
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
 * The owner's will status as saved in this browser, or `fallback` when nothing
 * is saved. The server render always uses `fallback`.
 */
export function useWillStatus(owner: string, fallback: WillStatus = "none"): WillStatus {
  return useSyncExternalStore(
    subscribe,
    () => readWillStatus(owner) ?? fallback,
    () => fallback,
  );
}

/** The owner's saved will (answers and progress), or null on the server / before one is started. */
export function useSavedWill(owner: string): SavedWill | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key(DRAFT_KEY, owner)),
    () => null,
  );
  return useMemo(() => parseWill(raw), [raw]);
}

/** Settlement of the owner's estate under their will, if the executor has begun it. */
export function useWillExecution(owner: string): WillExecution | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key(EXECUTION_KEY, owner)),
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
