"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { ArrowUp, SquarePen } from "lucide-react";
import { FindoeMonogram } from "@/components/advisor/assistant/parts";
import { SourceChip } from "@/components/advisor/settlement/SourceChip";
import { agentBriefing } from "@/lib/agent";
import type { ClientFacts } from "@/lib/assistant";
import type { Guidance } from "@/lib/nextSteps";
import type { AskOption, OpenQuestion } from "@/lib/settlement/engine";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

export type ChatItem =
  | { id: number; kind: "user"; text: string; prompt?: string }
  | {
      id: number;
      kind: "assistant";
      text: string;
      streaming?: boolean;
      /** Rulebook citations, for replies the simulated assistant wrote. */
      rules?: string[];
    }
  | {
      id: number;
      kind: "answered";
      answerLabel: string;
      lines: string[];
      keys: string[];
    };

export type FindoeMode = "live" | "offline" | "unknown";

/** Renders Findoe's plain-text replies: paragraphs, bullet and numbered lists, **bold**. */
function RichText({ text }: { text: string }) {
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-pnc-ink">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | undefined;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={blocks.length}
        className={cn("space-y-1 pl-5", list.ordered ? "list-decimal" : "list-disc")}
      >
        {list.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </Tag>,
    );
    list = undefined;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•])\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (line) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <>{blocks}</>;
}

function Thinking() {
  return (
    <span className="inline-flex gap-1 py-2" aria-label="Findoe is writing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-pnc-muted/60 motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * Findoe, docked beside the client page. A plain conversation: what Findoe
 * worked out, the advisor's questions, Findoe's replies, and — when the
 * rulebook needs a fact only the advisor can confirm — one question at a time.
 */
export function FindoePanel({
  ref,
  facts,
  guidance,
  items,
  mode,
  busy,
  focusKey,
  skipped,
  onAsk,
  onAnswer,
  onSkip,
  onUndo,
  onNewChat,
}: {
  ref?: Ref<HTMLElement>;
  facts: ClientFacts;
  guidance: Guidance;
  items: ChatItem[];
  mode: FindoeMode;
  busy: boolean;
  focusKey?: string;
  skipped: string[];
  onAsk: (text: string) => void;
  onAnswer: (q: OpenQuestion, option: AskOption) => void;
  onSkip: (q: OpenQuestion) => void;
  onUndo: (keys: string[]) => void;
  onNewChat: () => void;
}) {
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const brief = agentBriefing(facts, guidance);
  const pending =
    guidance.questions.find((q) => q.key === focusKey) ??
    guidance.questions.find((q) => !skipped.includes(q.key));
  const last = items.at(-1);
  const suggestions = [
    "What should I do first?",
    guidance.plan
      ? `How should I open the call with ${facts.first}?`
      : `What would you raise with ${facts.first}?`,
    guidance.plan ? "What are the key deadlines?" : `What if ${facts.first} died today?`,
  ];

  // Follow the conversation as it grows, including while a reply streams in.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [items, pending?.key]);

  function send() {
    const text = draft.trim();
    if (!text || busy) return;
    onAsk(text);
    setDraft("");
  }

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      aria-label="Findoe"
      className="flex scroll-mt-4 flex-col outline-none @5xl:h-[calc(100dvh-2rem)] @5xl:max-h-[52rem]"
    >
      <header className="flex items-center gap-2.5 px-5 py-4">
        <FindoeMonogram className="size-6 text-xs" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-semibold text-pnc-ink">Findoe</p>
          <p className="text-xs text-pnc-muted">
            {mode === "live"
              ? "Claude Haiku 5.5 · grounded in the rulebook"
              : mode === "offline"
                ? "Offline · answers from the rulebook only"
                : " "}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            title="New chat"
            className="grid size-8 place-items-center rounded-md text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
          >
            <SquarePen className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <div
        ref={logRef}
        role="log"
        aria-label="Conversation with Findoe"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 text-[15px] leading-relaxed text-pnc-ink"
      >
        <div className="space-y-2">
          <p>
            {brief.did} {brief.found}
          </p>
          <details className="group text-sm">
            <summary className="cursor-pointer list-none text-pnc-muted hover:text-pnc-ink [&::-webkit-details-marker]:hidden">
              <span className="underline decoration-pnc-line underline-offset-4 group-open:hidden">
                Show how I decided
              </span>
              <span className="hidden underline decoration-pnc-line underline-offset-4 group-open:inline">
                Hide
              </span>
            </summary>
            <ul className="mt-2 space-y-1.5 text-[13px] text-pnc-muted">
              {brief.reasoning.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Link
              href={routes.advisorRules}
              className="mt-2 inline-block text-[13px] text-pnc-link hover:underline"
            >
              Open the rulebook
            </Link>
          </details>
        </div>

        {items.map((item) => {
          if (item.kind === "user")
            return (
              <p
                key={item.id}
                className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl bg-pnc-surface px-4 py-2.5"
              >
                <span className="sr-only">You: </span>
                {item.text}
              </p>
            );
          if (item.kind === "answered")
            return (
              <div key={item.id} className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-pnc-surface px-4 py-2.5">
                  <span className="sr-only">You answered: </span>
                  {item.answerLabel}
                </p>
                <div className="space-y-1.5">
                  {item.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  <button
                    type="button"
                    onClick={() => onUndo(item.keys)}
                    className="text-sm text-pnc-muted underline decoration-pnc-line underline-offset-4 hover:text-pnc-ink"
                  >
                    Undo
                  </button>
                </div>
              </div>
            );
          return (
            <div key={item.id} className="space-y-2.5">
              {item.text ? <RichText text={item.text} /> : item.streaming && <Thinking />}
              {item.rules && item.rules.length > 0 && !item.streaming && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.rules.map((id) => (
                    <SourceChip key={id} id={id} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {pending && !busy && (
          <section
            aria-labelledby="findoe-question"
            className="rounded-xl border border-pnc-line bg-white p-4"
          >
            <p className="text-xs font-medium text-pnc-muted">One thing I need from you</p>
            <p id="findoe-question" className="mt-1 font-medium text-pnc-ink">
              {pending.question}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pending.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onAnswer(pending, o)}
                  className="rounded-full border border-pnc-line px-3.5 py-1.5 text-sm font-medium text-pnc-ink hover:border-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSkip(pending)}
                className="rounded-full px-3 py-1.5 text-sm text-pnc-muted hover:text-pnc-ink"
              >
                Not sure yet
              </button>
            </div>
          </section>
        )}
      </div>

      <p role="status" className="sr-only">
        {last?.kind === "assistant" && !last.streaming ? `Findoe: ${last.text}` : ""}
        {last?.kind === "answered" ? last.lines.join(" ") : ""}
      </p>

      <div className="px-4 pb-4">
        {items.length === 0 && (
          <div className="mb-2 flex flex-col items-start gap-1">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAsk(q)}
                className="rounded-lg px-2 py-1 text-left text-sm text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="rounded-2xl border border-pnc-line bg-white p-2 shadow-card focus-within:border-pnc-muted"
        >
          <label className="sr-only" htmlFor="findoe-input">
            Ask Findoe about {facts.c.name}
          </label>
          <textarea
            id="findoe-input"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Ask Findoe about ${facts.first}…`}
            className="block max-h-40 w-full resize-none bg-transparent px-2 py-1 text-[15px] outline-none placeholder:text-pnc-muted"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || busy}
              className="grid size-8 place-items-center rounded-lg bg-pnc-ink text-white hover:bg-pnc-navy disabled:bg-pnc-chip disabled:text-pnc-muted"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-[11px] text-pnc-muted">
          Findoe can make mistakes. Routes and dates come from the rulebook; mock data only.
        </p>
      </div>
    </aside>
  );
}
