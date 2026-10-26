"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, MessageCircleQuestion, RotateCcw } from "lucide-react";
import { AssistantMark } from "@/components/advisor/assistant/parts";
import { SourceChips } from "@/components/advisor/settlement/SourceChip";
import { RULEBOOK_VERSION } from "@/data/settlement";
import { suggestedQuestions, type Answer, type ClientFacts } from "@/lib/assistant";
import { cn, formatDate } from "@/lib/format";

export type ChatTurn = { id: number; question: string; answer: Answer; trace: string[] };

/** What the assistant "looked at" for this client, shown before each answer. */
export function traceFor(f: ClientFacts, answer?: Answer): string[] {
  return [
    `Read ${f.first}'s profile and ${f.p.notes.length} note${f.p.notes.length === 1 ? "" : "s"}`,
    `Checked ${f.p.holdings.length} accounts and their beneficiaries`,
    `Looked at ${f.p.members.length - 1} family member${f.p.members.length === 2 ? "" : "s"} and their roles`,
    ...(f.loss ? [`Reviewed the loss reported ${formatDate(f.loss.date, "medium")}`] : []),
    ...(answer?.usedRulebook ? [`Applied the settlement rulebook (v${RULEBOOK_VERSION})`] : []),
  ];
}

const chip =
  "inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-left text-sm text-pnc-ink ring-1 ring-pnc-line hover:text-pnc-link hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

/**
 * Ask the (simulated) assistant about this client. Each answer shows what it
 * looked at, cites the client data and — for legal questions — the rules it
 * relied on, and suggests follow-ups. Only the newest answer animates in; a
 * screen reader hears it once, through a status message.
 */
export function AskPanel({
  facts,
  chat,
  animateId,
  onAsk,
  onClear,
}: {
  facts: ClientFacts;
  chat: ChatTurn[];
  animateId?: number;
  onAsk: (question: string) => void;
  onClear?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const suggestions = suggestedQuestions(facts);
  const latest = chat.at(-1);

  // A question asked from another tab lands here: take focus to the answer, unless typing.
  useEffect(() => {
    if (animateId === undefined || document.activeElement === inputRef.current) return;
    latestRef.current?.focus({ preventScroll: false });
  }, [animateId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <AssistantMark label="Ask about this client" />
          <p className="text-sm text-pnc-muted">
            Answers come only from {facts.c.name}&apos;s profile, accounts, family and history.
            Legal routes and dates come from the settlement rulebook, with their sources.
          </p>
        </div>
        {chat.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-pnc-muted hover:text-pnc-link"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Clear conversation
          </button>
        )}
      </header>

      {chat.length === 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Suggested questions">
          {suggestions.map((q) => (
            <li key={q}>
              <button type="button" onClick={() => onAsk(q)} className={chip}>
                <MessageCircleQuestion className="size-4 text-pnc-blue-700" aria-hidden="true" />{" "}
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="sr-only">
        {latest ? `Answer: ${latest.answer.paragraphs.join(" ")}` : ""}
      </p>

      <ol className="space-y-6" aria-label="Conversation">
        {chat.map((turn) => {
          const animate = turn.id === animateId;
          const delay = (i: number) => (animate ? { animationDelay: `${i * 160}ms` } : undefined);
          const reveal = animate ? "animate-reveal motion-reduce:animate-none" : "";
          const isLatest = turn.id === latest?.id;
          return (
            <li key={turn.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-pnc-blue-700 px-4 py-2.5 text-sm text-white">
                <span className="sr-only">You asked: </span>
                {turn.question}
              </p>
              <div
                ref={isLatest ? latestRef : undefined}
                tabIndex={isLatest ? -1 : undefined}
                aria-label={isLatest ? `Answer to: ${turn.question}` : undefined}
                className="rounded-2xl rounded-bl-sm bg-pnc-blue-50 px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-pnc-link"
              >
                <ul
                  className="space-y-0.5 text-xs text-pnc-muted"
                  aria-label="What the assistant checked"
                >
                  {turn.trace.map((t, i) => (
                    <li
                      key={t}
                      className={cn("flex items-center gap-1.5", reveal)}
                      style={delay(i)}
                    >
                      <Check className="size-3 text-pnc-positive" aria-hidden="true" /> {t}
                    </li>
                  ))}
                </ul>
                <div
                  className={cn("mt-3 space-y-2 text-[15px] leading-relaxed text-pnc-ink", reveal)}
                  style={delay(turn.trace.length + 1)}
                >
                  {turn.answer.paragraphs.map((p) => (
                    <p key={p} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                  {turn.answer.rules && turn.answer.rules.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-semibold text-pnc-muted">Rules:</span>
                      <SourceChips ids={turn.answer.rules} />
                    </div>
                  )}
                  {turn.answer.sources.length > 0 && (
                    <p className="text-xs text-pnc-muted">
                      Based on: {turn.answer.sources.join("; ")}
                    </p>
                  )}
                  {turn.answer.followUps.length > 0 && (
                    <ul className="flex flex-wrap gap-2 pt-1" aria-label="Follow-up questions">
                      {turn.answer.followUps.map((q) => (
                        <li key={q}>
                          <button type="button" onClick={() => onAsk(q)} className={chip}>
                            {q}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onAsk(draft.trim());
          setDraft("");
        }}
        className="flex items-center gap-2 rounded-full border border-pnc-line bg-white py-1.5 pl-4 pr-1.5 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
      >
        <label className="sr-only" htmlFor="ask-input">
          Ask about {facts.c.name}
        </label>
        <input
          id="ask-input"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask about ${facts.first}…`}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-pnc-muted"
        />
        <button
          type="submit"
          aria-label="Ask"
          disabled={!draft.trim()}
          className="grid size-9 place-items-center rounded-full bg-pnc-blue-700 text-white hover:bg-pnc-blue-800 disabled:opacity-40"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </form>

      {chat.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-pnc-link">
            More questions to try
          </summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => onAsk(q)} className={chip}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
