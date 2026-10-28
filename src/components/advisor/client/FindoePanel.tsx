"use client";

import { useState, type Ref } from "react";
import {
  BookOpenCheck,
  GitBranch,
  PenLine,
  Scale,
  SquarePen,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtResults,
  ChainOfThoughtStep,
  useElapsed,
  type StepStatus,
} from "@/components/ai-elements/chain-of-thought";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, Response } from "@/components/ai-elements/message";
import { PromptInput, Suggestion, Suggestions } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Sources } from "@/components/ai-elements/sources";
import { Tool } from "@/components/ai-elements/tool";
import { SourceChip } from "@/components/advisor/settlement/SourceChip";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { agentBriefing } from "@/lib/agent";
import type { ClientFacts } from "@/lib/assistant";
import type { Guidance } from "@/lib/nextSteps";
import type { AskOption, OpenQuestion } from "@/lib/settlement/engine";
import { cn } from "@/lib/format";

/** The stages every reply goes through, in order. */
export const agentSteps = ["read", "walk", "rules", "write"] as const;

export type ChatItem =
  | { id: number; kind: "user"; text: string; prompt?: string }
  | {
      id: number;
      kind: "assistant";
      text: string;
      streaming?: boolean;
      /** Rulebook citations the reply itself rests on (simulated replies). */
      rules?: string[];
      /** Rules the rulebook ties to the question, shown as a working step. */
      related?: string[];
      /** Index into `agentSteps` of the stage in progress; its length once done. */
      progress?: number;
      startedAt?: number;
      finishedAt?: number;
      /** Who wrote the reply. */
      by?: "live" | "offline";
      stopped?: boolean;
    }
  | {
      id: number;
      kind: "answered";
      answerLabel: string;
      lines: string[];
      keys: string[];
    };

export type FindoeMode = "live" | "offline" | "unknown";

const MODEL_NAME = "Claude Haiku 5.5";

/**
 * Findoe, docked beside the client page. Every reply shows its working — it
 * reads the client's file, walks the settlement rulebook, looks up the rules
 * that apply, then writes — as a timeline that folds away once the answer is
 * in. When the rulebook needs a fact only the advisor can confirm, Findoe asks
 * for it, one question at a time.
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
  onStop,
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
  onStop: () => void;
  onAnswer: (q: OpenQuestion, option: AskOption) => void;
  onSkip: (q: OpenQuestion) => void;
  onUndo: (keys: string[]) => void;
  onNewChat: () => void;
}) {
  const [draft, setDraft] = useState("");
  const brief = agentBriefing(facts, guidance);
  const plan = guidance.plan ?? guidance.readiness!.plan;
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
      className="flex h-full min-h-0 scroll-mt-4 flex-col outline-none"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-pnc-line px-5 py-3.5">
        <FindoeLogo className="size-8" thinking={busy} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-display font-semibold text-pnc-ink">Findoe</p>
          <p className="flex items-center gap-1.5 text-xs text-pnc-muted">
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                mode === "live"
                  ? "bg-pnc-positive"
                  : mode === "offline"
                    ? "bg-pnc-muted"
                    : "bg-pnc-line",
              )}
            />
            {mode === "live"
              ? `${MODEL_NAME} · grounded in the rulebook`
              : mode === "offline"
                ? "Offline · answers from the rulebook only"
                : "Connecting…"}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            title="New chat"
            className="grid size-8 place-items-center rounded-md text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-pnc-link"
          >
            <SquarePen className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <Conversation label={`Conversation with Findoe about ${facts.c.name}`} className="flex-1">
        <ConversationContent className="pt-4">
          <Message from="assistant">
            <Response text={`${brief.did} ${brief.found}`} />
            <ChainOfThought
              running={false}
              title=""
              doneTitle={`How I decided · ${plan.accounts.length} accounts`}
            >
              {brief.reasoning.map((r) => (
                <ChainOfThoughtStep key={r} icon={Scale} status="done" label={r} />
              ))}
            </ChainOfThought>
          </Message>

          {items.map((item) => {
            if (item.kind === "user")
              return (
                <Message key={item.id} from="user">
                  {item.text}
                </Message>
              );
            if (item.kind === "answered")
              return (
                <div key={item.id} className="space-y-5">
                  <Message from="user">{item.answerLabel}</Message>
                  <Message from="assistant">
                    <div className="space-y-1.5">
                      {item.lines.map((l) => (
                        <p key={l}>{l}</p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onUndo(item.keys)}
                      className="text-sm text-pnc-muted underline decoration-pnc-line underline-offset-4 hover:text-pnc-ink"
                    >
                      Undo
                    </button>
                  </Message>
                </div>
              );
            const writing = item.progress !== undefined && item.progress >= agentSteps.length - 1;
            return (
              <Message key={item.id} from="assistant" thinking={item.streaming}>
                {item.progress !== undefined && (
                  <AgentWork item={item} facts={facts} guidance={guidance} mode={mode} />
                )}
                {item.text ? (
                  <Response text={item.text} streaming={item.streaming} />
                ) : (
                  item.streaming &&
                  writing && (
                    <p className="text-sm">
                      <Shimmer>Writing the answer…</Shimmer>
                    </p>
                  )
                )}
                {item.stopped && <p className="text-xs text-pnc-muted">Stopped.</p>}
                {!item.streaming && item.rules && <Sources ids={item.rules} />}
              </Message>
            );
          })}

          {pending && !busy && (
            <Message from="assistant">
              <section
                aria-labelledby="findoe-question"
                className="rounded-xl border border-pnc-blue-600/20 bg-pnc-blue-50/50 p-4"
              >
                <p className="text-xs font-semibold text-pnc-blue-800">One thing I need from you</p>
                <p id="findoe-question" className="mt-1 font-medium text-pnc-ink">
                  {pending.question}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pending.options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => onAnswer(pending, o)}
                      className="rounded-full border border-pnc-line bg-white px-3.5 py-1.5 text-sm font-medium text-pnc-ink hover:border-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
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
            </Message>
          )}
        </ConversationContent>
      </Conversation>

      <p role="status" className="sr-only">
        {last?.kind === "assistant" && !last.streaming ? `Findoe: ${last.text}` : ""}
        {last?.kind === "answered" ? last.lines.join(" ") : ""}
      </p>

      <div className="shrink-0 border-t border-pnc-line bg-white px-4 pb-3 pt-3">
        {items.length === 0 && (
          <Suggestions>
            {suggestions.map((q) => (
              <Suggestion key={q} onClick={() => onAsk(q)}>
                {q}
              </Suggestion>
            ))}
          </Suggestions>
        )}
        <PromptInput
          id="findoe-input"
          label={`Ask Findoe about ${facts.c.name}`}
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          onStop={onStop}
          busy={busy}
          placeholder={`Ask Findoe about ${facts.first}…`}
          tools={
            <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-pnc-surface px-2.5 py-1 text-xs text-pnc-muted">
              <BookOpenCheck className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {mode === "live" ? "Haiku 5.5" : "Rulebook"} · v{plan.rulebookVersion}
              </span>
            </span>
          }
        />
        <p className="mt-2 text-center text-2xs text-pnc-muted">
          Findoe can make mistakes. Routes and dates come from the rulebook; mock data only.
        </p>
      </div>
    </aside>
  );
}

const stepIcons: Record<(typeof agentSteps)[number], LucideIcon> = {
  read: UserRound,
  walk: GitBranch,
  rules: BookOpenCheck,
  write: PenLine,
};

/** The timeline of what Findoe did for one reply, from the client's real file and plan. */
function AgentWork({
  item,
  facts,
  guidance,
  mode,
}: {
  item: Extract<ChatItem, { kind: "assistant" }>;
  facts: ClientFacts;
  guidance: Guidance;
  mode: FindoeMode;
}) {
  const progress = item.progress ?? agentSteps.length;
  const running = progress < agentSteps.length;
  const elapsed = useElapsed(item.startedAt, running);
  const ms = item.finishedAt && item.startedAt ? item.finishedAt - item.startedAt : elapsed;
  const plan = guidance.plan ?? guidance.readiness!.plan;
  const status = (i: number): StepStatus =>
    i < progress ? "done" : i === progress ? "active" : "pending";
  const by = item.by ?? (mode === "live" ? "live" : "offline");
  const related = item.related ?? [];

  const labels = {
    read: `Read ${facts.c.name}'s file`,
    walk: `Walked ${plan.accounts.length} accounts through the rulebook`,
    rules: related.length
      ? "Looked up the rules that apply"
      : "Checked the rulebook for this question",
    write: by === "live" ? `Writing with ${MODEL_NAME}` : "Writing from the rulebook",
  };

  return (
    <ChainOfThought
      running={running}
      title={labels[agentSteps[Math.min(progress, agentSteps.length - 1)]]}
      doneTitle={`Worked through ${agentSteps.length} steps in ${(ms / 1000).toFixed(1)}s`}
    >
      {agentSteps.map((id, i) => (
        <ChainOfThoughtStep key={id} icon={stepIcons[id]} status={status(i)} label={labels[id]}>
          {id === "read" && (
            <Tool
              name="client.profile"
              state={status(i) === "done" ? "completed" : "running"}
              input={{ client: facts.c.name }}
              output={
                <ChainOfThoughtResults
                  items={[
                    facts.c.segment,
                    `${facts.c.accountCount} accounts`,
                    `${facts.p.members.length} people in the household`,
                  ]}
                />
              }
            />
          )}
          {id === "walk" && (
            <Tool
              name="rulebook.walk"
              state={status(i) === "done" ? "completed" : "running"}
              input={{ rulebook: plan.rulebookVersion, accounts: plan.accounts.length }}
              output={
                <ChainOfThoughtResults
                  items={[
                    `${guidance.steps.length} next steps`,
                    `${guidance.questions.length} open ${guidance.questions.length === 1 ? "question" : "questions"}`,
                  ]}
                />
              }
            />
          )}
          {id === "rules" && related.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Rules that apply">
              {related.slice(0, 4).map((r) => (
                <li key={r} className="max-w-full">
                  <SourceChip id={r} />
                </li>
              ))}
            </ul>
          )}
        </ChainOfThoughtStep>
      ))}
    </ChainOfThought>
  );
}
