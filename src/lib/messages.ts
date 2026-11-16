/**
 * Demo store for the advisor's Messages: messages added on top of the seeded
 * conversations (src/data/messages.ts), and when each conversation was last
 * read. Kept in localStorage and synced between tabs, like the bereavement
 * store.
 */
import { useSyncExternalStore } from "react";
import { seedThreads, type Message } from "@/data/messages";

type MessagesState = {
  added: Record<string, Message[]>;
  /** The time of the newest message seen, by contact id. */
  readAt: Record<string, string>;
};

const STORAGE_KEY = "pnc-messages-demo-v1";
const EMPTY: MessagesState = { added: {}, readAt: {} };
const listeners = new Set<() => void>();
let cached: { raw: string | null; state: MessagesState } = { raw: null, state: EMPTY };

function read(): MessagesState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cached.state;
  }
  if (raw === cached.raw) return cached.state;
  let state = EMPTY;
  try {
    state = raw ? { ...EMPTY, ...(JSON.parse(raw) as MessagesState) } : EMPTY;
  } catch {}
  cached = { raw, state };
  return state;
}

function write(next: MessagesState) {
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

export function useMessages(): MessagesState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** One conversation, oldest first: the seed, then anything added in this browser. */
export function threadOf(s: MessagesState, contactId: string): Message[] {
  return [...(seedThreads[contactId] ?? []), ...(s.added[contactId] ?? [])];
}

/** How many conversations have an unseen message from the other side (for the nav badge). */
export function unreadCount(s: MessagesState): number {
  const ids = new Set([...Object.keys(seedThreads), ...Object.keys(s.added)]);
  return [...ids].filter((id) => isUnread(s, id)).length;
}

/** Whether the newest message came from the contact and hasn't been seen. */
export function isUnread(s: MessagesState, contactId: string): boolean {
  const last = threadOf(s, contactId).at(-1);
  return !!last && last.from === "contact" && (s.readAt[contactId] ?? "") < last.at;
}

const update = (fn: (s: MessagesState) => MessagesState) => write(fn(read()));
const newId = () => `m-${Math.random().toString(36).slice(2, 9)}`;

export const messagesActions = {
  add(contactId: string, message: Omit<Message, "id">) {
    update((s) => ({
      ...s,
      added: {
        ...s.added,
        [contactId]: [...(s.added[contactId] ?? []), { ...message, id: newId() }],
      },
    }));
  },
  markRead(contactId: string) {
    const last = threadOf(read(), contactId).at(-1);
    if (!last || (read().readAt[contactId] ?? "") >= last.at) return;
    update((s) => ({ ...s, readAt: { ...s.readAt, [contactId]: last.at } }));
  },
  reset() {
    write(EMPTY);
  },
};
