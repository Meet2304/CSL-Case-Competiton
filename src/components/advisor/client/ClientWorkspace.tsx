"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { AssistantMark, tabButton } from "@/components/advisor/assistant/parts";
import { AgentPanel, type AgentTurn } from "@/components/advisor/client/AgentPanel";
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
  const [tab, setTab] = useHashTab<TabId>(tabIds);
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [animateId, setAnimateId] = useState<number>();
  const [focusKey, setFocusKey] = useState<string>();
  const [skipped, setSkipped] = useState<string[]>([]);
  const agentRef = useRef<HTMLElement>(null);
  const baseId = useId();

  // On narrow screens the tab strip scrolls; keep the open tab visible.
  useEffect(() => {
    document
      .getElementById(`${baseId}-tab-${tab}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [baseId, tab]);

  if (!customer || !profile || !facts || !guidance) {
    return <p className="py-10 text-center text-sm text-pnc-muted">Client not found.</p>;
  }

  const nextId = () => (turns.at(-1)?.id ?? 0) + 1;
  /** Brings the assistant into view (it sits below the content on narrow screens). */
  function showAgent() {
    const el = agentRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight - 120 || r.bottom < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    el.focus({ preventScroll: true });
  }

  function ask(question: string) {
    const turn: AgentTurn = {
      id: nextId(),
      kind: "qa",
      question,
      answer: agentReply(facts!, guidance!, question, casework.answers),
    };
    setTurns((t) => [...t, turn]);
    setAnimateId(turn.id);
    showAgent();
  }

  function answer(q: OpenQuestion, option: AskOption) {
    const answers = {
      ...casework.answers,
      ...Object.fromEntries(q.keys.map((k) => [k, option.value])),
    };
    const after = guidanceFor(facts!, { ...casework, answers }, reviews);
    const turn: AgentTurn = {
      id: nextId(),
      kind: "answered",
      question: q.question,
      answerLabel: option.label,
      lines: answerEffect(guidance!, after, q, option.label),
      keys: q.keys,
    };
    caseworkActions.answer(customerId, q.keys, option.value);
    setTurns((t) => [...t, turn]);
    setAnimateId(turn.id);
    setFocusKey(undefined);
  }

  function undo(keys: string[]) {
    caseworkActions.clearAnswer(customerId, keys);
    const turn: AgentTurn = {
      id: nextId(),
      kind: "qa",
      question: "Undo that answer",
      answer: {
        paragraphs: ["Undone. The plan is back to assuming the cautious option until you confirm."],
        sources: [],
        followUps: [],
      },
    };
    setTurns((t) => [...t, turn]);
    setAnimateId(turn.id);
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

      {/* No overflow clipping here: the assistant column stays in view with `sticky`. */}
      <section className="rounded-md bg-white shadow-card">
        <div
          role="tablist"
          aria-label={`${customer.name}`}
          className="no-scrollbar flex overflow-x-auto border-b border-pnc-line px-2"
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

        <div className="grid @5xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab}`}
            className="@container min-w-0 p-4 @3xl:p-6"
          >
            {tab === "next" && (
              <NextStepsView
                facts={facts}
                guidance={guidance}
                reviews={reviews}
                onWhy={(s: NextStep) => ask(`Why: ${s.title}?`)}
                onAnswer={(q) => {
                  setSkipped((s) => s.filter((k) => k !== q.key));
                  setFocusKey(q.key);
                  showAgent();
                }}
                onOpenWhatIf={() => setTab("whatif")}
                onAsk={ask}
              />
            )}
            {tab === "client" && <ClientPanel facts={facts} />}
            {tab === "whatif" && (
              <div className="space-y-5">
                <header className="space-y-1">
                  <AssistantMark label="What if" />
                  <p className="max-w-3xl text-sm text-pnc-muted">
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
                  onAsk={ask}
                />
              </div>
            )}
          </div>

          <div className="rounded-b-md border-t border-pnc-line bg-pnc-surface/50 @5xl:rounded-bl-none @5xl:border-l @5xl:border-t-0">
            <AgentPanel
              ref={agentRef}
              facts={facts}
              guidance={guidance}
              turns={turns}
              animateId={animateId}
              focusKey={focusKey}
              skipped={skipped}
              onAsk={ask}
              onAnswer={answer}
              onSkip={(q) => {
                setSkipped((s) => [...s, q.key]);
                setFocusKey(undefined);
              }}
              onUndo={undo}
              onClear={() => {
                setTurns([]);
                setAnimateId(undefined);
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
