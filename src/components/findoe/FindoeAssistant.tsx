"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Database, PenLine, Scale, SquarePen, X } from "lucide-react";
import { ActionList } from "@/components/ai-elements/actions";
import {
  ChainOfThought,
  ChainOfThoughtStep,
  useElapsed,
  type StepStatus,
} from "@/components/ai-elements/chain-of-thought";
import {
  SourceKindPill,
  SourceList,
  SourceMarker,
  sourceTitle,
} from "@/components/ai-elements/cited-sources";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, Response } from "@/components/ai-elements/message";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { onAskFindoe } from "./askFindoe";
import { RULEBOOK_VERSION } from "@/data/settlement";
import type { Reply, Source } from "@/lib/findoe/answer";
import { cn } from "@/lib/format";

/** How long each search shows before the next stage starts. */
const STAGE_MS = 650;

type Turn =
  | { id: number; kind: "user"; text: string }
  | {
      id: number;
      kind: "assistant";
      question: string;
      reply: Reply;
      /** How much of the reply has been typed out. */
      shown: string;
      /** 0 searching records, 1 searching the law, 2 writing, 3 done. */
      stage: number;
      startedAt: number;
      finishedAt?: number;
      stopped?: boolean;
    };

type Assistant = Extract<Turn, { kind: "assistant" }>;

export type FindoeAssistantProps = {
  variant: "web" | "mobile";
  /** Keep the conversation but show nothing (e.g. where Findoe is docked in the page). */
  hidden?: boolean;
  greeting: string;
  intro: string;
  /** What the bank's records are called for this reader, e.g. "Your PNC records". */
  bankLabel: string;
  /** Whose records the search runs over, shown in the tool call. */
  scope: string;
  suggestions: string[];
  placeholder: string;
  reply: (question: string) => Reply;
};

/**
 * Findoe on every page — SIMULATED. A launcher opens a side panel (web) or a
 * full-screen sheet (phone). Each answer shows its working: it searches the
 * bank's records, then the legal library, then writes; the text carries
 * numbered markers for its sources, listed underneath in two groups, and ends
 * with what the reader can do. The conversation survives moving between pages.
 */
export function FindoeAssistant(props: FindoeAssistantProps) {
  const { variant, hidden } = props;
  const [open, setOpen] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  /** A question a page handed over ("Ask Findoe" buttons), with when, so repeats still ask. */
  const [handed, setHanded] = useState<{ question: string; at: number }>();

  // "Ask Findoe" anywhere on the page opens the panel and asks the question.
  useEffect(() => {
    if (hidden) return;
    return onAskFindoe((question) => {
      setOpen(true);
      setHanded({ question, at: Date.now() });
    });
  }, [hidden]);

  // Back to the launcher when the panel closes, so keyboard users don't lose their place.
  useEffect(() => {
    if (wasOpen.current && !open) launcher.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // On web, the page makes room for the open panel (see `data-findoe-open` in globals.css).
  const shown = open && !hidden;
  useEffect(() => {
    if (variant !== "web") return;
    document.documentElement.toggleAttribute("data-findoe-open", shown);
    return () => document.documentElement.removeAttribute("data-findoe-open");
  }, [variant, shown]);

  // Hidden still keeps the conversation mounted, so it's there when Findoe comes back.
  const panel = (
    <Chat {...props} onClose={() => setOpen(false)} hiddenPanel={!shown} handed={handed} />
  );

  if (variant === "mobile")
    return (
      <>
        <div className="relative z-20 h-0">
          {!open && !hidden && (
            <button
              ref={launcher}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ask Findoe"
              className="absolute bottom-3 right-3 grid size-13 place-items-center rounded-full bg-pnc-navy shadow-raised ring-4 ring-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              <FindoeLogo className="size-8" />
            </button>
          )}
        </div>
        {/* Over the tab bar but under the simulated status bar (z-30). */}
        <div
          className={cn(
            "findoe-panel absolute inset-0 z-[29] flex-col bg-white pt-[var(--status-h)]",
            shown ? "flex motion-safe:animate-sheet-in" : "hidden",
          )}
        >
          {panel}
        </div>
      </>
    );

  return (
    <>
      {!open && !hidden && (
        <button
          ref={launcher}
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-pnc-navy py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-raised ring-1 ring-white/10 hover:bg-pnc-blue-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link motion-safe:animate-reveal"
        >
          <FindoeLogo className="size-8" />
          Ask Findoe
        </button>
      )}
      <aside
        aria-label="Findoe"
        hidden={!shown}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="findoe-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-pnc-line bg-white shadow-raised motion-safe:animate-panel-in sm:w-[27rem] lg:w-[var(--findoe-w)] lg:shadow-none"
      >
        {panel}
      </aside>
    </>
  );
}

function Chat({
  variant,
  greeting,
  intro,
  bankLabel,
  scope,
  suggestions,
  placeholder,
  reply,
  onClose,
  hiddenPanel,
  handed,
}: FindoeAssistantProps & {
  onClose: () => void;
  hiddenPanel: boolean;
  handed?: { question: string; at: number };
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<{ turn: number; n: number; at: number }>();
  /** The latest question, held at the top so its working and answer show under it. */
  const [anchor, setAnchor] = useState<string>();
  const abortRef = useRef<AbortController>(undefined);
  const nextId = useRef(1);
  const baseId = useId();
  const inputId = `${baseId}-input`;

  // Put the cursor in the message box when the panel opens (not on phones: no surprise keyboard).
  useEffect(() => {
    if (!hiddenPanel && variant === "web") document.getElementById(inputId)?.focus();
  }, [hiddenPanel, variant, inputId]);

  // Stop typing out a reply if the panel goes away entirely (sign off).
  useEffect(() => () => abortRef.current?.abort(), []);

  // Ask what a page handed over. The latest `ask` is read through a ref so this runs once per question.
  const askRef = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    askRef.current = ask;
  });
  useEffect(() => {
    if (handed) askRef.current(handed.question);
  }, [handed]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const answer = reply(question);
    const id = nextId.current++;
    const replyId = nextId.current++;
    setTurns((ts) => [
      ...ts,
      { id, kind: "user", text: question },
      {
        id: replyId,
        kind: "assistant",
        question,
        reply: answer,
        shown: "",
        stage: 0,
        startedAt: Date.now(),
      },
    ]);
    setDraft("");
    setAnchor(`${baseId}-q-${id}`);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const update = (fn: (t: Assistant) => Assistant) =>
      setTurns((ts) => ts.map((t) => (t.id === replyId && t.kind === "assistant" ? fn(t) : t)));
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        controller.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Stopped", "AbortError"));
        });
      });
    try {
      await wait(STAGE_MS);
      update((t) => ({ ...t, stage: 1 }));
      await wait(STAGE_MS);
      update((t) => ({ ...t, stage: 2 }));
      const words = answer.text.split(/(\s+)/);
      for (let n = 0; n < words.length; n += 6) {
        const chunk = words.slice(n, n + 6).join("");
        update((t) => ({ ...t, shown: t.shown + chunk }));
        await wait(26);
      }
      update((t) => ({ ...t, stage: 3, finishedAt: Date.now() }));
    } catch {
      update((t) => ({ ...t, stage: 3, finishedAt: Date.now(), stopped: true }));
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setTurns([]);
    setBusy(false);
  }

  const last = turns.at(-1);

  return (
    <>
      <header
        className={cn(
          "flex shrink-0 items-center gap-3 border-b border-pnc-line px-4 py-3",
          variant === "mobile" && "bg-white",
        )}
      >
        <FindoeLogo className="size-8" thinking={busy} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-display font-semibold text-pnc-ink">Findoe</p>
          <p className="truncate text-xs text-pnc-muted">
            Simulated · {bankLabel.replace(/^Your /, "your ")} + legal library
          </p>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={newChat}
            aria-label="New chat"
            title="New chat"
            className="grid size-9 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-pnc-link"
          >
            <SquarePen className="size-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Findoe"
          title="Close"
          className="grid size-9 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-pnc-link"
        >
          {variant === "mobile" ? (
            <ChevronDown className="size-5" aria-hidden="true" />
          ) : (
            <X className="size-4.5" aria-hidden="true" />
          )}
        </button>
      </header>

      <Conversation label="Conversation with Findoe" className="flex-1" anchorId={anchor}>
        <ConversationContent className={cn("pt-4", variant === "mobile" && "px-4")}>
          {turns.length === 0 ? (
            <Welcome
              greeting={greeting}
              intro={intro}
              bankLabel={bankLabel}
              suggestions={suggestions}
              onAsk={ask}
            />
          ) : (
            turns.map((t) =>
              t.kind === "user" ? (
                <div key={t.id} id={`${baseId}-q-${t.id}`}>
                  <Message from="user">{t.text}</Message>
                </div>
              ) : (
                <Answer
                  key={t.id}
                  turn={t}
                  bankLabel={bankLabel}
                  scope={scope}
                  idPrefix={`${baseId}-${t.id}`}
                  focus={focus?.turn === t.id ? focus : undefined}
                  onCite={(n) => setFocus({ turn: t.id, n, at: Date.now() })}
                  onNavigate={variant === "mobile" ? onClose : undefined}
                />
              ),
            )
          )}
        </ConversationContent>
      </Conversation>

      <p role="status" className="sr-only">
        {last?.kind === "assistant" && last.stage === 3
          ? `Findoe answered, citing ${last.reply.sources.length} sources.`
          : ""}
      </p>

      <div className="shrink-0 border-t border-pnc-line bg-white px-3 pb-3 pt-2.5">
        <PromptInput
          id={inputId}
          label="Ask Findoe"
          value={draft}
          onChange={setDraft}
          onSubmit={() => ask(draft)}
          onStop={() => abortRef.current?.abort()}
          busy={busy}
          placeholder={placeholder}
          tools={
            <span className="flex gap-1.5" aria-label="Findoe searches">
              <SourceKindPill
                kind="bank"
                label={variant === "mobile" ? "Records" : "PNC records"}
                className="py-0.5"
              />
              <SourceKindPill
                kind="law"
                label={variant === "mobile" ? "Law" : "Legal library"}
                className="py-0.5"
              />
            </span>
          }
        />
        <p className="mt-2 text-center text-2xs leading-snug text-pnc-muted">
          A simulation over mock data. General guidance, not legal or tax advice.
        </p>
      </div>
    </>
  );
}

function Welcome({
  greeting,
  intro,
  bankLabel,
  suggestions,
  onAsk,
}: {
  greeting: string;
  intro: string;
  bankLabel: string;
  suggestions: string[];
  onAsk: (q: string) => void;
}) {
  return (
    <div className="flex flex-col items-center pb-2 pt-4 text-center motion-safe:animate-reveal">
      <FindoeLogo className="size-12" />
      <h2 className="mt-4 font-display text-xl font-medium text-pnc-ink">{greeting}</h2>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-pnc-muted">{intro}</p>
      <div
        className="mt-4 flex flex-wrap justify-center gap-2"
        aria-label="Where answers come from"
      >
        <SourceKindPill kind="bank" label={bankLabel} />
        <SourceKindPill kind="law" label="Legal library" />
      </div>
      <ul className="mt-6 w-full space-y-2 text-left" aria-label="Suggested questions">
        {suggestions.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onAsk(q)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-pnc-line bg-white px-3.5 py-3 text-left text-sm text-pnc-ink hover:border-pnc-muted hover:bg-pnc-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              {q}
              <ArrowRight
                className="size-4 shrink-0 text-pnc-muted transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Answer({
  turn,
  bankLabel,
  scope,
  idPrefix,
  focus,
  onCite,
  onNavigate,
}: {
  turn: Assistant;
  bankLabel: string;
  scope: string;
  idPrefix: string;
  focus?: { n: number; at: number };
  onCite: (n: number) => void;
  onNavigate?: () => void;
}) {
  const done = turn.stage === 3;
  const { sources } = turn.reply;
  return (
    <Message from="assistant" thinking={!done}>
      <Working turn={turn} bankLabel={bankLabel} scope={scope} />
      {turn.shown ? (
        <Response
          text={turn.shown}
          streaming={!done}
          cite={(n) => (
            <SourceMarker n={n} source={sources[n - 1]} onSelect={done ? onCite : undefined} />
          )}
        />
      ) : (
        turn.stage === 2 && (
          <p className="text-sm">
            <Shimmer>Writing the answer…</Shimmer>
          </p>
        )
      )}
      {turn.stopped && <p className="text-xs text-pnc-muted">Stopped.</p>}
      {done && !turn.stopped && (
        <>
          <SourceList sources={sources} bankLabel={bankLabel} idPrefix={idPrefix} focus={focus} />
          <ActionList actions={turn.reply.actions} onNavigate={onNavigate} />
        </>
      )}
    </Message>
  );
}

/** The two searches and the writing, as a timeline that folds away once the answer is in. */
function Working({
  turn,
  bankLabel,
  scope,
}: {
  turn: Assistant;
  bankLabel: string;
  scope: string;
}) {
  const running = turn.stage < 3;
  const elapsed = useElapsed(turn.startedAt, running);
  const ms = turn.finishedAt ? turn.finishedAt - turn.startedAt : elapsed;
  const bank = turn.reply.sources.filter((s) => s.kind === "bank");
  const law = turn.reply.sources.filter((s) => s.kind === "law");
  const status = (i: number): StepStatus =>
    i < turn.stage ? "done" : i === turn.stage ? "active" : "pending";
  const records = bankLabel.replace(/^Your /, "your ");
  const labels = [
    turn.stage > 0 ? `Searched ${records}` : `Searching ${records}`,
    law.length
      ? turn.stage > 1
        ? "Searched the legal library"
        : "Searching the legal library"
      : "Checked the legal library: nothing needed",
    "Writing the answer",
  ];
  const found = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (turn.stage > 0) labels[0] += ` · ${found(bank.length, "found", "found")}`;
  if (turn.stage > 1 && law.length)
    labels[1] += ` · ${found(law.length, "law applies", "laws apply")}`;
  if (turn.stage > 2)
    labels[2] = `Wrote the answer · ${found(turn.reply.sources.length, "citation", "citations")}`;
  return (
    // Stays open once done: the record and law chips are the reasoning worth seeing.
    <ChainOfThought
      running={running}
      stayOpen
      title={labels[Math.min(turn.stage, 2)]}
      doneTitle={`Used ${found(bank.length, "record", "records")} and ${found(law.length, "law", "laws")} · ${(ms / 1000).toFixed(1)}s`}
    >
      <ChainOfThoughtStep icon={Database} status={status(0)} label={labels[0]}>
        {status(0) === "done" ? (
          <Found sources={bank} />
        ) : (
          <p className="text-xs text-pnc-muted">Looking through {scope}…</p>
        )}
      </ChainOfThoughtStep>
      <ChainOfThoughtStep icon={Scale} status={status(1)} label={labels[1]}>
        {status(1) === "done" ? (
          law.length > 0 && <Found sources={law} />
        ) : (
          <p className="text-xs text-pnc-muted">Matching against rulebook v{RULEBOOK_VERSION}…</p>
        )}
      </ChainOfThoughtStep>
      <ChainOfThoughtStep icon={PenLine} status={status(2)} label={labels[2]} />
    </ChainOfThought>
  );
}

/** What a search turned up, as chips in its source's colors: a record's name or a law's citation. */
function Found({ sources }: { sources: Source[] }) {
  const shown = sources.slice(0, 4);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <li key={s.key} className="min-w-0 max-w-full">
          <SourceKindPill
            kind={s.kind}
            label={s.kind === "bank" ? s.title : sourceTitle(s)}
            className="max-w-full py-0.5 font-medium"
          />
        </li>
      ))}
      {sources.length > shown.length && (
        <li className="self-center text-xs text-pnc-muted">
          +{sources.length - shown.length} more
        </li>
      )}
    </ul>
  );
}
