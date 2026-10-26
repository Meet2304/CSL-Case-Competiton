"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { tabButton } from "@/components/advisor/assistant/parts";
import {
  FindoePanel,
  type ChatItem,
  type FindoeMode,
} from "@/components/advisor/client/FindoePanel";
import { NextStepsView } from "@/components/advisor/client/NextStepsView";
import { ClientPanel } from "@/components/advisor/client/panels";
import { SimulationView } from "@/components/advisor/settlement/SimulationView";
import { useAdvisorBook } from "@/components/advisor/useAdvisorBook";
import { MockBadge } from "@/components/mock/Mock";
import { useHashTab } from "@/components/shared/useHashTab";
import { profileFor } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import { DISCLAIMER } from "@/data/settlement";
import { agentReply, answerEffect } from "@/lib/agent";
import { factsFor } from "@/lib/assistant";
import { askFindoe, findoeIsLive, type FindoeTurn } from "@/lib/findoe/client";
import { findoeContext } from "@/lib/findoe/context";
import { guidanceFor, type NextStep } from "@/lib/nextSteps";
import { caseworkActions, useCasework } from "@/lib/settlement/casework";
import type { AskOption, OpenQuestion } from "@/lib/settlement/engine";
import { useReviews } from "@/lib/settlement/reviews";
import { routes } from "@/lib/routes";

const allTabs = [
  { id: "next", label: "Next steps" },
  { id: "client", label: "Client" },
  { id: "whatif", label: "What if" },
] as const;
type TabId = (typeof allTabs)[number]["id"];
const tabIds = allTabs.map((t) => t.id);

/**
 * One client, from the advisor's point of view. Next steps reads top to
 * bottom — where things stand, what to do, detail on demand — and every step
 * comes from the settlement rulebook. The assistant sits alongside: it says
 * what it worked out, asks for the facts the rulebook can't know, and explains
 * any step. Client is reference; What if runs the rulebook for anyone in the
 * household. Client-side so deaths the bank records show up immediately.
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
   * model sees when it differs from what the advisor sees (e.g. "Ask AI" on a
   * step); `fallback` is the simulated reply's question when Findoe is offline.
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
    setItems((xs) => [...xs, user, { id: replyId, kind: "assistant", text: "", streaming: true }]);
    setBusy(true);
    showFindoe();
    const update = (fn: (i: Extract<ChatItem, { kind: "assistant" }>) => ChatItem) =>
      setItems((xs) => xs.map((i) => (i.id === replyId && i.kind === "assistant" ? fn(i) : i)));
    const offline = () => {
      const a = agentReply(facts!, guidance!, opts.fallback ?? text, casework.answers);
      update((i) => ({ ...i, text: a.paragraphs.join("\n"), rules: a.rules, streaming: false }));
    };
    abortRef.current = new AbortController();
    try {
      if (mode === "offline") offline();
      else {
        const result = await askFindoe({
          context,
          messages: history,
          signal: abortRef.current.signal,
          onText: (chunk) => update((i) => ({ ...i, text: i.text + chunk })),
        });
        if (result === "offline") {
          setMode("offline");
          offline();
        } else {
          setMode("live");
          update((i) => ({ ...i, streaming: false }));
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) offline();
    } finally {
      setBusy(false);
    }
  }

  /** "Ask AI" on a next step: personalized help with that step. */
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
                onOpenWhatIf={() => setTab("whatif")}
                onAsk={(q) => ask(q)}
              />
            )}
            {tab === "client" && <ClientPanel facts={facts} />}
            {tab === "whatif" && (
              <div className="space-y-6">
                <header className="space-y-1.5">
                  <h3 className="font-display text-2xl font-medium text-pnc-ink">What if</h3>
                  <p className="max-w-3xl text-sm leading-relaxed text-pnc-muted">
                    The same rulebook, run before a death: pick anyone in the household to see what
                    would happen to their accounts today, and what to fix while they can still sign
                    the forms. {DISCLAIMER}
                  </p>
                </header>
                <SimulationView
                  customer={facts.c}
                  profile={facts.p}
                  defaultPerson={facts.self}
                  today={facts.today}
                  answers={casework.answers}
                  onAsk={(q) => ask(q)}
                />
              </div>
            )}
          </div>
        </section>

        {/* Its own card, no clipping: it stays in view with `sticky` on wide screens. */}
        <div className="rounded-lg bg-white shadow-card @5xl:sticky @5xl:top-4">
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
