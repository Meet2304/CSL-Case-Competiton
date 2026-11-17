import { useSyncExternalStore } from "react";
import { MOCK_AS_OF } from "@/data/mock";

/**
 * Demo persistence for each person's Durable Power of Attorney (DPOA): who
 * they chose as agent and when they sent it to PNC for review. There is no
 * backend, so it lives in this browser's localStorage, keyed by person id.
 * Sending it is a demonstration: nothing is signed or registered.
 */
const KEY = "pnc-dpoa-v1";
const EVENT = "pnc-dpoa";

export type DpoaRecord = {
  /** Person id of the agent. */
  agentId: string;
  /** Ids of the financial matters the agent may handle. */
  matters: string[];
  start: "now" | "incapacity";
  /** ISO date it was sent to PNC for review. */
  sentOn: string;
};

const key = (personId: string) => `${KEY}:${personId}`;

function read(personId: string): string | null {
  try {
    return window.localStorage.getItem(key(personId));
  } catch {
    return null;
  }
}

export function readDpoa(personId: string): DpoaRecord | null {
  const raw = read(personId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DpoaRecord;
  } catch {
    return null;
  }
}

/** Records that the person sent their DPOA to PNC for review. */
export function sendDpoa(personId: string, record: Omit<DpoaRecord, "sentOn">) {
  try {
    window.localStorage.setItem(key(personId), JSON.stringify({ ...record, sentOn: MOCK_AS_OF }));
  } catch {
    // Storage blocked (private mode): the flow still finishes for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Clears every DPOA in this browser (the demo reset). */
export function resetAllDpoas() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(KEY))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The raw record, so React compares a stable string rather than a new object. */
export function useDpoaSent(personId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => read(personId) !== null,
    () => false,
  );
}
