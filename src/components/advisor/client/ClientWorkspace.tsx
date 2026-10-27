"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { tabButton } from "@/components/advisor/assistant/parts";
import {
  agentSteps,
  FindoePanel,
  type ChatItem,
  type FindoeMode,
} from "@/components/advisor/client/FindoePanel";
import { NextStepsView } from "@/components/advisor/client/NextStepsView";
import { ClientPanel } from "@/components/advisor/client/panels";
import { useAdvisorBook } from "@/components/advisor/useAdvisorBook";
import { MockBadge } from "@/components/mock/Mock";
import { useHashTab } from "@/components/shared/useHashTab";
import { profileFor } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import { agentReply, answerEffect } from "@/lib/agent";
import { factsFor } from "@/lib/assistant";
import { askFindoe, findoeIsLive, type FindoeTurn } from "@/lib/findoe/client";
import { findoeContext } from "@/lib/findoe/context";
import { guidanceFor, type NextStep } from "@/lib/nextSteps";
import { caseworkActions, useCasework } from "@/lib/settlement/casework";
import type { AskOption, OpenQuestion } from "@/lib/settlement/engine";
import { useReviews } from "@/lib/settlement/reviews";
import { routes } from "@/lib/routes";
import { useFitToViewport } from "@/components/shared/useFitToViewport";

const allTabs = [
  { id: "next", label: "Next steps" },
  { id: "client", label: "Client" },
] as const;
type TabId = (typeof allTabs)[number]["id"];
const tabIds = allTabs.map((t) => t.id);
/** How long each working stage shows before the next one starts. */
const STAGE_MS = 420;

/**
 * One client, from the advisor's point of view. Next steps reads top to
 * bottom — where things stand, what to do, detail on demand — and every step
 * comes from the settlement rulebook. The assistant sits alongside: it says
 * what it worked out, asks for the facts the rulebook can't know, and explains
 * any step. Client is reference. Client-side so deaths the bank records show up immediately.
 */
export function ClientWorkspace({ customerId }: { customerId: string }) {
  const { customers } = useAdvisorBook();
  const customer = customers.find((c) => c.id === customerId);
  const profile = profileFor(customerId);
  const facts = useMemo(
    () => (customer && profile ? factsFor(customer, profile, MOCK_AS_OF) : undefined),
    [customer, profile],
  );
  const casework = useCasework(customerId);
  const reviews = useReviews();
  const guidance = useMemo(
    () => (facts ? guidanceFor(facts, casework, reviews) : undefined),
    [facts, casework, reviews],
  );
  const context = useMemo(
    () => (facts && guidance ? findoeContext(facts, guidance) : ""),
    [facts, guidance],
  );
  const [tab, setTab] = useHashTab<TabId>(tabIds);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<FindoeMode>("unknown");
  const [focusKey, setFocusKey] = useState<string>();
  const [skipped, setSkipped] = useState<string[]>([]);
  const findoeRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  useFitToViewport(dockRef);
  const abortRef = useRef<AbortController>(undefined);
  const nextId = useRef(1);
  const baseId = useId();

  // Learn whether Findoe can reach Claude; stop a streaming reply when the page goes away.
  useEffect(() => {
    let live = true;
    findoeIsLive().then((ok) => live && setMode(ok ? "live" : "offline"));
    return () => {
      live = false;
      abortRef.current?.abort();
    };
  }, []);

  // On narrow screens the tab strip scrolls; keep the open tab visible.
  useEffect(() => {
    document
      .getElementById(`${baseId}-tab-${tab}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [baseId, tab]);

  if (!customer || !profile || !facts || !guidance) {
    return <p className="py-10 text-center text-sm text-pnc-muted">Client not found.</p>;
  }

  /** Brings Findoe into view (it sits below the content on narrow screens). */
  function showFindoe() {
    const el = findoeRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight - 120 || r.bottom < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    el.focus({ preventScroll: true });
  }

  /**
   * Sends a question to Findoe and streams the reply in. `prompt` is what the
   * model sees when it differs from what the advisor sees (e.g. "Ask Findoe"
   * on a step); `fallback` is the simulated reply's question when offline.
   *
   * Each reply shows its working: read the client's file, walk the rulebook,
   * look up the rules that apply, write. The model request starts at once;
   * its first words are held until the earlier stages have been shown.
   */
  async function ask(text: string, opts: { prompt?: string; fallback?: string } = {}) {
    if (busy) return;
    const userId = nextId.current++;
    const replyId = nextId.current++;
    const user: ChatItem = { id: userId, kind: "user", text, prompt: opts.prompt };
    const history: FindoeTurn[] = [...items, user].flatMap((i): FindoeTurn[] =>
      i.kind === "user"
        ? [{ role: "user", content: i.prompt ?? i.text }]
        : i.kind === "assistant" && i.text
          ? [{ role: "assistant", content: i.text }]
          : [],
    );
    // The rulebook's own answer: its rules are the "look up" stage, and it's the offline reply.
    const simulated = agentReply(facts!, guidance!, opts.fallback ?? text, casework.answers);
    setItems((xs) => [
      ...xs,
      user,
      {
        id: replyId,
        kind: "assistant",
        text: "",
        streaming: true,
        related: simulated.rules,
        progress: 0,
        startedAt: Date.now(),
        by: mode === "offline" ? "offline" : "live",
      },
    ]);
    setBusy(true);
    showFindoe();
    const update = (fn: (i: Extract<ChatItem, { kind: "assistant" }>) => ChatItem) =>
      setItems((xs) => xs.map((i) => (i.id === replyId && i.kind === "assistant" ? fn(i) : i)));
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("Stopped", "AbortError"));
        });
      });
    /** Types the simulated reply out a few words at a time. */
    const typeOut = async (reply: string) => {
      const words = reply.split(/(\s+)/);
      for (let n = 0; n < words.length; n += 6) {
        const chunk = words.slice(n, n + 6).join("");
        update((i) => ({ ...i, text: i.text + chunk }));
        await wait(24);
      }
    };
    const finish = (extra: Partial<Extract<ChatItem, { kind: "assistant" }>> = {}) =>
      update((i) => ({
        ...i,
        ...extra,
        streaming: false,
        progress: agentSteps.length,
        finishedAt: Date.now(),
      }));

    let held = "";
    let writing = false;
    const request: Promise<"ok" | "offline"> =
      mode === "offline"
        ? Promise.resolve("offline")
        : askFindoe({
            context,
            messages: history,
            signal,
            onText: (chunk) => {
              if (writing) update((i) => ({ ...i, text: i.text + chunk }));
              else held += chunk;
            },
          });
    // Keep a failed request from surfacing before the stages have played.
    request.catch(() => {});

    try {
      for (let step = 1; step < agentSteps.length; step++) {
        await wait(STAGE_MS);
        update((i) => ({ ...i, progress: step }));
      }
      writing = true;
      if (held) update((i) => ({ ...i, text: i.text + held }));
      let result: "ok" | "offline";
      try {
        result = await request;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        result = "offline";
      }
      if (result === "offline") {
        setMode("offline");
        update((i) => ({ ...i, by: "offline", text: "" }));
        await typeOut(simulated.paragraphs.join("\n"));
        finish({ rules: simulated.rules });
      } else {
        setMode("live");
        finish();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") finish({ stopped: true });
      else finish({ rules: simulated.rules, text: simulated.paragraphs.join("\n"), by: "offline" });
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  /** "Ask Findoe" on a next step: personalized help with that step. */
  function askAboutStep(s: NextStep) {
    ask(`Help me with “${s.title}”`, {
      prompt: `Help me with this next step: "${s.title}". Using what you know about ${facts!.first} and the family, tell me how to approach it, what to say, and anything to watch for.`,
      fallback: `Why: ${s.title}?`,
    });
  }

  function answer(q: OpenQuestion, option: AskOption) {
    const answers = {
      ...casework.answers,
      ...Object.fromEntries(q.keys.map((k) => [k, option.value])),
    };
    const after = guidanceFor(facts!, { ...casework, answers }, reviews);
    caseworkActions.answer(customerId, q.keys, option.value);
    setItems((xs) => [
      ...xs,
      {
        id: nextId.current++,
        kind: "answered",
        answerLabel: option.label,
        lines: answerEffect(guidance!, after, q, option.label),
        keys: q.keys,
      },
    ]);
    setFocusKey(undefined);
  }

  function undo(keys: string[]) {
    caseworkActions.clearAnswer(customerId, keys);
    setItems((xs) => [
      ...xs,
      {
        id: nextId.current++,
        kind: "assistant",
        text: "Undone. The plan is back to assuming the cautious option until you confirm.",
      },
    ]);
  }

  function newChat() {
    abortRef.current?.abort();
    setItems([]);
    setBusy(false);
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next =
      allTabs[(index + (e.key === "ArrowRight" ? 1 : allTabs.length - 1)) % allTabs.length];
    setTab(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div className="@container space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={routes.advisor}
          className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All clients
        </Link>
        <MockBadge />
      </div>

      <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0 rounded-lg bg-white shadow-card">
          <div
            role="tablist"
            aria-label={`${customer.name}`}
            className="no-scrollbar flex overflow-x-auto border-b border-pnc-line px-3"
          >
            {allTabs.map((t, i) => (
              <button
                key={t.id}
                id={`${baseId}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`${baseId}-panel`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={tabButton(tab === t.id)}
              >
                {t.label}
                {t.id === "next" && guidance.steps.length > 0 && (
                  <span className="rounded-full bg-pnc-chip px-1.5 text-xs font-semibold text-pnc-ink">
                    {guidance.steps.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab}`}
            className="@container min-w-0 p-5 @3xl:p-7"
          >
            {tab === "next" && (
              <NextStepsView
                facts={facts}
                guidance={guidance}
                reviews={reviews}
                onAskAI={askAboutStep}
                onAnswer={(q) => {
                  setSkipped((s) => s.filter((k) => k !== q.key));
                  setFocusKey(q.key);
                  showFindoe();
                }}
                onAsk={(q) => ask(q)}
              />
            )}
            {tab === "client" && <ClientPanel facts={facts} />}
          </div>
        </section>

        {/*
          Its own card. On wide screens it sticks beside the content and is sized to
          what's left of the viewport, so the message box is always on screen.
        */}
        <div
          ref={dockRef}
          className="h-[40rem] overflow-hidden rounded-lg bg-white shadow-card @5xl:sticky @5xl:top-4"
        >
          <FindoePanel
            ref={findoeRef}
            facts={facts}
            guidance={guidance}
            items={items}
            mode={mode}
            busy={busy}
            focusKey={focusKey}
            skipped={skipped}
            onAsk={(q) => ask(q)}
            onStop={stop}
            onAnswer={answer}
            onSkip={(q) => {
              setSkipped((s) => [...s, q.key]);
              setFocusKey(undefined);
            }}
            onUndo={undo}
            onNewChat={newChat}
          />
        </div>
      </div>
    </div>
  );
}
