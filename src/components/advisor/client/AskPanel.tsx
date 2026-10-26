"use client";

import { useState } from "react";
import { ArrowUp, Check, MessageCircleQuestion } from "lucide-react";
import { AssistantMark } from "@/components/advisor/assistant/parts";
import { suggestedQuestions, type Answer, type ClientFacts } from "@/lib/assistant";
import { cn, formatDate } from "@/lib/format";

export type ChatTurn = { id: number; question: string; answer: Answer; trace: string[] };

/** What the assistant "looked at" for this client, shown before each answer. */
export function traceFor(f: ClientFacts): string[] {
  return [
    `Read ${f.first}'s profile and ${f.p.notes.length} note${f.p.notes.length === 1 ? "" : "s"}`,
    `Checked ${f.p.holdings.length} accounts and their beneficiaries`,
    `Looked at ${f.p.members.length - 1} family member${f.p.members.length === 2 ? "" : "s"} and their roles`,
    ...(f.loss ? [`Reviewed the loss reported ${formatDate(f.loss.date, "medium")}`] : []),
  ];
}

const chip =
  "inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-left text-sm text-pnc-ink ring-1 ring-pnc-line hover:text-pnc-link hover:ring-pnc-link";

/**
 * Ask the (simulated) assistant about this client. Each answer shows what it
 * looked at, cites its sources and suggests follow-ups. Only the newest
 * answer animates in.
 */
export function AskPanel({
  facts,
  chat,
  animateId,
  onAsk,
}: {
  facts: ClientFacts;
  chat: ChatTurn[];
  animateId?: number;
  onAsk: (question: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const suggestions = suggestedQuestions(facts);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <AssistantMark label="Ask about this client" />
        <p className="text-sm text-pnc-muted">
          Answers come only from {facts.c.name}&apos;s profile, accounts, family and history.
        </p>
      </header>

      {chat.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} className={chip}>
              <MessageCircleQuestion className="size-4 text-pnc-blue-700" aria-hidden="true" /> {q}
            </button>
          ))}
        </div>
      )}

      <ol className="space-y-6" aria-live="polite">
        {chat.map((turn) => {
          const animate = turn.id === animateId;
          const delay = (i: number) => (animate ? { animationDelay: `${i * 160}ms` } : undefined);
          const reveal = animate ? "animate-reveal motion-reduce:animate-none" : "";
          return (
            <li key={turn.id} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-pnc-blue-700 px-4 py-2.5 text-sm text-white">
                {turn.question}
              </p>
              <div className="rounded-2xl rounded-bl-sm bg-pnc-blue-50 px-4 py-3.5">
                <ul className="space-y-0.5 text-xs text-pnc-muted">
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
                  {turn.answer.sources.length > 0 && (
                    <p className="text-xs text-pnc-muted">
                      Sources: {turn.answer.sources.join("; ")}
                    </p>
                  )}
                  {turn.answer.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {turn.answer.followUps.map((q) => (
                        <button key={q} type="button" onClick={() => onAsk(q)} className={chip}>
                          {q}
                        </button>
                      ))}
                    </div>
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
    </div>
  );
}
