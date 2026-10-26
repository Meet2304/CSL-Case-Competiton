"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";
import { ArrowUp, BookOpenCheck, CircleHelp, RotateCcw, Undo2 } from "lucide-react";
import { AssistantMark } from "@/components/advisor/assistant/parts";
import { SourceChips } from "@/components/advisor/settlement/SourceChip";
import { agentBriefing } from "@/lib/agent";
import type { Answer, ClientFacts } from "@/lib/assistant";
import type { Guidance } from "@/lib/nextSteps";
import type { AskOption, OpenQuestion } from "@/lib/settlement/engine";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

export type AgentTurn =
  | { id: number; kind: "qa"; question: string; answer: Answer }
  | {
      id: number;
      kind: "answered";
      question: string;
      answerLabel: string;
      lines: string[];
      keys: string[];
    };

const chip =
  "inline-flex items-center rounded-full bg-white px-3 py-1.5 text-left text-sm text-pnc-ink ring-1 ring-pnc-line hover:text-pnc-link hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";
const bubble =
  "rounded-2xl rounded-bl-sm bg-white px-3.5 py-3 text-sm leading-relaxed ring-1 ring-pnc-line";

/**
 * The assistant, docked beside the client page. It opens with what it worked
 * out from the settlement rulebook, asks the advisor for the facts the
 * rulebook can't know (each answer re-runs the plan), and answers questions.
 */
export function AgentPanel({
  ref,
  facts,
  guidance,
  turns,
  animateId,
  focusKey,
  skipped,
  onAsk,
  onAnswer,
  onSkip,
  onUndo,
  onClear,
}: {
  ref?: Ref<HTMLElement>;
  facts: ClientFacts;
  guidance: Guidance;
  turns: AgentTurn[];
  animateId?: number;
  /** The question to put in front of the advisor; defaults to the first not skipped. */
  focusKey?: string;
  skipped: string[];
  onAsk: (q: string) => void;
  onAnswer: (q: OpenQuestion, option: AskOption) => void;
  onSkip: (q: OpenQuestion) => void;
  onUndo: (keys: string[]) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const brief = agentBriefing(facts, guidance);
  const pending =
    guidance.questions.find((q) => q.key === focusKey) ??
    guidance.questions.find((q) => !skipped.includes(q.key));
  const latest = turns.at(-1);
  const accountName = (id: string) =>
    (guidance.plan ?? guidance.readiness!.plan).accounts.find((a) => a.holding.id === id)?.holding
      .name ?? id;
  const suggestions = [
    "What should I do next?",
    guidance.plan ? "What are the key deadlines?" : `What if ${facts.first} died today?`,
    guidance.plan
      ? "Why does anything go to probate?"
      : "Which beneficiary designations need attention?",
  ];

  // Keep the newest turn in view inside the panel.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [turns.length]);

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      aria-label="Assistant"
      className="flex scroll-mt-4 flex-col outline-none @5xl:sticky @5xl:top-4 @5xl:max-h-[calc(100dvh-2rem)]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-pnc-line px-4 py-3">
        <AssistantMark />
        <Link
          href={routes.advisorRules}
          className="inline-flex items-center gap-1 text-xs font-semibold text-pnc-link hover:underline"
        >
          <BookOpenCheck className="size-3.5" aria-hidden="true" /> Rulebook
        </Link>
      </header>

      <ol
        ref={logRef}
        aria-label="Conversation"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        <li className={bubble}>
          <p className="text-pnc-ink">
            {brief.did} {brief.found}
          </p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-semibold text-pnc-link">How I decided</summary>
            <ul className="mt-1.5 space-y-1 text-pnc-muted">
              {brief.reasoning.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
        </li>

        {turns.map((t) => {
          const reveal = t.id === animateId ? "animate-reveal motion-reduce:animate-none" : "";
          if (t.kind === "answered")
            return (
              <li key={t.id} className="space-y-2">
                <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-pnc-blue-700 px-3.5 py-2 text-sm text-white">
                  <span className="sr-only">You answered: </span>
                  {t.answerLabel}
                </p>
                <div className={cn(bubble, reveal)}>
                  {t.lines.map((l) => (
                    <p key={l} className="text-pnc-ink">
                      {l}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={() => onUndo(t.keys)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-pnc-link hover:underline"
                  >
                    <Undo2 className="size-3" aria-hidden="true" /> Undo this answer
                  </button>
                </div>
              </li>
            );
          return (
            <li key={t.id} className="space-y-2">
              <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-pnc-blue-700 px-3.5 py-2 text-sm text-white">
                <span className="sr-only">You asked: </span>
                {t.question}
              </p>
              <div className={cn(bubble, "space-y-1.5", reveal)}>
                {t.answer.paragraphs.map((p, i) => (
                  <p key={`${i}-${p}`} className="whitespace-pre-line text-pnc-ink">
                    {p}
                  </p>
                ))}
                {t.answer.rules && t.answer.rules.length > 0 && (
                  <SourceChips ids={t.answer.rules} className="pt-1" />
                )}
                {t.answer.followUps.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Follow-up questions">
                    {t.answer.followUps.map((q) => (
                      <li key={q}>
                        <button
                          type="button"
                          onClick={() => onAsk(q)}
                          className={cn(chip, "text-xs")}
                        >
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}

        {pending && (
          <li className="rounded-2xl rounded-bl-sm bg-pnc-blue-50 px-3.5 py-3 text-sm ring-1 ring-pnc-blue-600/20">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-pnc-blue-800">
              <CircleHelp className="size-3.5" aria-hidden="true" /> I need you to confirm
            </p>
            <p id="agent-question" className="mt-1 font-semibold text-pnc-ink">
              {pending.question}
            </p>
            {pending.accountIds.length > 0 && (
              <p className="text-xs text-pnc-muted">
                Affects {pending.accountIds.map(accountName).join(", ")}
              </p>
            )}
            <div
              role="group"
              aria-labelledby="agent-question"
              className="mt-2.5 flex flex-wrap gap-1.5"
            >
              {pending.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onAnswer(pending, o)}
                  className="rounded-full bg-pnc-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSkip(pending)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-pnc-link hover:underline"
              >
                Not sure yet
              </button>
            </div>
          </li>
        )}
      </ol>

      <p role="status" className="sr-only">
        {latest?.kind === "qa"
          ? `Answer: ${latest.answer.paragraphs.join(" ")}`
          : latest?.kind === "answered"
            ? latest.lines.join(" ")
            : ""}
      </p>

      <div className="space-y-2 border-t border-pnc-line px-4 py-3">
        {turns.length === 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Suggested questions">
            {suggestions.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => onAsk(q)} className={cn(chip, "text-xs")}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-pnc-muted hover:text-pnc-link"
          >
            <RotateCcw className="size-3" aria-hidden="true" /> Clear conversation
          </button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            onAsk(draft.trim());
            setDraft("");
          }}
          className="flex items-center gap-2 rounded-full border border-pnc-line bg-white py-1 pl-3.5 pr-1 focus-within:border-pnc-link focus-within:ring-2 focus-within:ring-pnc-link/15"
        >
          <label className="sr-only" htmlFor="agent-input">
            Ask about {facts.c.name}
          </label>
          <input
            id="agent-input"
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
            className="grid size-8 place-items-center rounded-full bg-pnc-blue-700 text-white hover:bg-pnc-blue-800 disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
