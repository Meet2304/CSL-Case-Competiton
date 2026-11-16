"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { ArrowLeft, ArrowRight, BellRing, Search, SendHorizontal, X } from "lucide-react";
import { useHash } from "@/components/shared/useHashTab";
import { MockBadge } from "@/components/mock/Mock";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { simulatedReplies, type Message } from "@/data/messages";
import { cn } from "@/lib/format";
import { isUnread, messagesActions, threadOf, useMessages } from "@/lib/messages";
import { routes } from "@/lib/routes";
import { useContacts, type Contact } from "./contacts";

const kindLabel: Record<Contact["kind"], string> = {
  client: "Client",
  beneficiary: "Beneficiary",
  advisor: "Advisor",
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const noop = () => () => {};
/**
 * Today's date in the browser ("" while rendering ahead of time, when pages
 * mustn't read the clock), for "Today" and same-day times.
 */
function useToday(): string {
  return useSyncExternalStore(
    noop,
    () => new Date().toDateString(),
    () => "",
  );
}
/** "3:41 PM" today, "Oct 22" before. */
const shortWhen = (iso: string, today: string) =>
  new Date(iso).toDateString() === today
    ? time(iso)
    : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const dayLabel = (iso: string, today: string) =>
  new Date(iso).toDateString() === today
    ? "Today"
    : new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/**
 * The advisor's Messages: conversations on the left, the open one on the
 * right (one pane at a time on narrow screens). The open conversation is in
 * the URL hash, so other pages can link straight to it. Replies are simulated.
 */
export function Messages() {
  const contacts = useContacts();
  const state = useMessages();
  const [hash, setHash] = useHash();
  const [query, setQuery] = useState("");
  const searchId = useId();
  const today = useToday();

  const rows = useMemo(() => {
    const withLast = contacts.map((c) => ({ c, last: threadOf(state, c.id).at(-1) }));
    return withLast.sort(
      (a, b) =>
        (b.last?.at ?? "").localeCompare(a.last?.at ?? "") || a.c.name.localeCompare(b.c.name),
    );
  }, [contacts, state]);
  const shown = rows.filter(({ c }) =>
    `${c.name} ${c.detail}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = contacts.find((c) => c.id === hash);

  return (
    <div className="@container">
      <div className="grid h-[calc(100dvh-13rem)] min-h-[30rem] overflow-hidden rounded-lg bg-white shadow-card @3xl:grid-cols-[21rem_minmax(0,1fr)]">
        {/* Conversations */}
        <aside
          aria-label="Conversations"
          className={cn(
            "flex min-h-0 flex-col border-pnc-line @3xl:border-r",
            selected && "hidden @3xl:flex",
          )}
        >
          <div className="border-b border-pnc-line px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-medium text-pnc-ink">Messages</h2>
              <MockBadge />
            </div>
            <label
              htmlFor={searchId}
              className="mt-2.5 flex h-9 items-center gap-2 rounded-full border border-pnc-line bg-pnc-surface/60 px-3.5 focus-within:border-pnc-link focus-within:bg-white focus-within:ring-2 focus-within:ring-pnc-link/15"
            >
              <Search className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
              <span className="sr-only">Search conversations</span>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people"
                className="min-w-0 flex-1 bg-transparent text-sm text-pnc-ink outline-none placeholder:text-pnc-muted [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="grid size-6 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {shown.map(({ c, last }) => {
              const unread = isUnread(state, c.id);
              const active = c.id === selected?.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setHash(c.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                      active ? "bg-pnc-blue-50" : "hover:bg-pnc-surface/70",
                    )}
                  >
                    <PersonAvatar
                      seed={c.avatarSeed}
                      look={c.look}
                      className={cn("size-11 ring-pnc-line", c.deceased && "grayscale")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm text-pnc-ink",
                            unread ? "font-bold" : "font-semibold",
                          )}
                        >
                          {c.name}
                        </span>
                        {last && (
                          <span className="shrink-0 text-2xs text-pnc-muted">
                            {shortWhen(last.at, today)}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "line-clamp-1 flex-1 text-xs",
                            unread ? "font-semibold text-pnc-ink" : "text-pnc-muted",
                          )}
                        >
                          {last
                            ? `${last.from === "advisor" ? "You: " : ""}${last.text}`
                            : c.detail}
                        </span>
                        {unread && (
                          <span className="size-2.5 shrink-0 rounded-full bg-pnc-link">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-pnc-muted">
                No one matches &ldquo;{query}&rdquo;.
              </li>
            )}
          </ul>
        </aside>

        {/* The open conversation */}
        {selected ? (
          <Conversation key={selected.id} contact={selected} onBack={() => setHash(null)} />
        ) : (
          <div className="hidden place-items-center p-10 text-center @3xl:grid">
            <div>
              <p className="font-display text-xl font-medium text-pnc-ink">Pick a conversation</p>
              <p className="mt-1 text-sm text-pnc-muted">
                Your clients, and the families and advisors around them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Conversation({ contact: c, onBack }: { contact: Contact; onBack: () => void }) {
  const state = useMessages();
  const thread = threadOf(state, c.id);
  const today = useToday();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(undefined);
  const inputId = useId();

  // Seen once it's open; keep the newest message in view.
  useEffect(() => {
    messagesActions.markRead(c.id);
    end.current?.scrollIntoView({ block: "end" });
  }, [c.id, thread.length]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function send() {
    const text = draft.trim();
    if (!text || c.deceased) return;
    messagesActions.add(c.id, { from: "advisor", text, at: new Date().toISOString() });
    setDraft("");
    // A simulated reply, a moment later.
    setTyping(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const replies = simulatedReplies[c.kind];
      const mine = thread.filter((m) => m.from === "contact").length;
      messagesActions.add(c.id, {
        from: "contact",
        text: replies[mine % replies.length],
        at: new Date().toISOString(),
      });
      setTyping(false);
    }, 1800);
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <section aria-label={`Conversation with ${c.name}`} className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-pnc-line px-4 py-3 @3xl:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="All conversations"
          className="grid size-8 place-items-center rounded-full text-pnc-link hover:bg-pnc-blue-50 @3xl:hidden"
        >
          <ArrowLeft className="size-4.5" aria-hidden="true" />
        </button>
        <PersonAvatar
          seed={c.avatarSeed}
          look={c.look}
          className={cn("size-10 ring-pnc-line", c.deceased && "grayscale")}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-pnc-ink">
            {c.name}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-2xs font-semibold",
                c.deceased ? "bg-pnc-chip text-pnc-muted" : "bg-pnc-blue-50 text-pnc-blue-800",
              )}
            >
              {c.deceased ? "Passed away" : kindLabel[c.kind]}
            </span>
          </p>
          <p className="truncate text-xs text-pnc-muted">{c.detail}</p>
        </div>
        {c.customerId && (
          <Link
            href={
              c.deceased ? routes.advisorEstate(c.customerId) : routes.advisorClient(c.customerId)
            }
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-pnc-link hover:underline @xl:inline-flex"
          >
            {c.deceased ? "Open estate" : "View client"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-pnc-surface/40 px-4 py-4 @3xl:px-6">
        {thread.length === 0 && (
          <p className="py-10 text-center text-sm text-pnc-muted">
            No messages yet. Say hello to {c.name}.
          </p>
        )}
        <ol className="space-y-1.5">
          {thread.map((m, i) => (
            <Bubble key={m.id} message={m} previous={thread[i - 1]} today={today} />
          ))}
        </ol>
        {typing && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-pnc-muted" role="status">
            <span className="flex gap-0.5" aria-hidden="true">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-1.5 rounded-full bg-pnc-muted motion-safe:animate-pulse"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </span>
            {c.name} is typing
          </p>
        )}
        <div ref={end} />
      </div>

      {c.deceased ? (
        <p className="border-t border-pnc-line px-5 py-4 text-sm text-pnc-muted">
          {c.name} has passed away. His estate and his beneficiaries are on the{" "}
          {c.customerId && (
            <Link
              href={routes.advisorEstate(c.customerId)}
              className="font-semibold text-pnc-link hover:underline"
            >
              Estate tab
            </Link>
          )}
          .
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 border-t border-pnc-line px-4 py-3 @3xl:px-5"
        >
          <label htmlFor={inputId} className="sr-only">
            Message {c.name}
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Write to ${c.name}`}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-pnc-line bg-white px-4 py-2.5 text-sm text-pnc-ink outline-none [field-sizing:content] placeholder:text-pnc-muted focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-700 text-white hover:bg-pnc-blue-800 disabled:bg-pnc-chip disabled:text-pnc-muted"
          >
            <SendHorizontal className="size-4.5" aria-hidden="true" />
          </button>
        </form>
      )}
    </section>
  );
}

/** One message, with a day divider when the day changes. */
function Bubble({
  message: m,
  previous,
  today,
}: {
  message: Message;
  previous?: Message;
  today: string;
}) {
  const mine = m.from === "advisor";
  const newDay = !previous || !sameDay(new Date(previous.at), new Date(m.at));
  return (
    <li>
      {newDay && (
        <p className="my-3 flex items-center gap-3 text-2xs font-semibold text-pnc-muted">
          <span className="h-px flex-1 bg-pnc-line" aria-hidden="true" />
          {dayLabel(m.at, today)}
          <span className="h-px flex-1 bg-pnc-line" aria-hidden="true" />
        </p>
      )}
      <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
        {m.notice && (
          <span className="mb-1 inline-flex items-center gap-1 text-2xs font-semibold text-pnc-muted">
            <BellRing className="size-3" aria-hidden="true" /> Sent with the wealth transfer
          </span>
        )}
        <p
          className={cn(
            "max-w-[min(34rem,85%)] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            mine
              ? "rounded-br-md bg-pnc-blue-700 text-white"
              : "rounded-bl-md bg-white text-pnc-ink shadow-card",
          )}
        >
          {m.text}
        </p>
        <span className="mt-0.5 px-1 text-2xs text-pnc-muted">{time(m.at)}</span>
      </div>
    </li>
  );
}
