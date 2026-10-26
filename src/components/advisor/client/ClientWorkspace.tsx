"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { ArrowLeft, HeartCrack } from "lucide-react";
import { tabButton } from "@/components/advisor/assistant/parts";
import { AskPanel, traceFor, type ChatTurn } from "@/components/advisor/client/AskPanel";
import { EngagementPanel } from "@/components/advisor/client/EngagementPanel";
import { LossGuide } from "@/components/advisor/client/LossGuide";
import { AssetsPanel, FamilyPanel, OverviewPanel } from "@/components/advisor/client/panels";
import { useAdvisorBook } from "@/components/advisor/useAdvisorBook";
import { MockBadge } from "@/components/mock/Mock";
import { useHashTab } from "@/components/shared/useHashTab";
import { profileFor } from "@/data/clients";
import { MOCK_AS_OF } from "@/data/mock";
import { lossTag } from "@/lib/advisor";
import { answerQuestion, factsFor } from "@/lib/assistant";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";

const allTabs = [
  { id: "overview", label: "Overview" },
  { id: "assets", label: "Assets & advice" },
  { id: "family", label: "Family" },
  { id: "loss", label: "Loss guide" },
  { id: "ask", label: "Ask" },
  { id: "engagement", label: "Engagement" },
] as const;
type TabId = (typeof allTabs)[number]["id"];
const tabIds = allTabs.map((t) => t.id);

/**
 * One client's summary for the advisor: profile, holdings, family and the
 * (simulated) assistant's advice, Q&A and engagement plan. The Loss guide tab
 * only appears while the client has an open loss. Client-side so deaths the
 * bank records on the dashboard show up here immediately.
 */
export function ClientWorkspace({ customerId }: { customerId: string }) {
  const { customers } = useAdvisorBook();
  const customer = customers.find((c) => c.id === customerId);
  const profile = profileFor(customerId);
  const facts = useMemo(
    () => (customer && profile ? factsFor(customer, profile, MOCK_AS_OF) : undefined),
    [customer, profile],
  );
  const [tab, setHashTab] = useHashTab<TabId>(tabIds);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  // Only the newest answer animates; switching tabs settles it so it won't replay.
  const [animateId, setAnimateId] = useState<number>();
  const setTab = (id: TabId) => {
    setAnimateId(undefined);
    setHashTab(id);
  };
  const baseId = useId();

  // On narrow screens the tab strip scrolls; keep the open tab visible (e.g. after a #loss link).
  useEffect(() => {
    document
      .getElementById(`${baseId}-tab-${tab}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [baseId, tab]);

  if (!customer || !profile || !facts) {
    return <p className="py-10 text-center text-sm text-pnc-muted">Client not found.</p>;
  }

  const tabs = allTabs.filter((t) => t.id !== "loss" || facts.loss);
  const current = tabs.some((t) => t.id === tab) ? tab : "overview";
  const ask = (question: string) => {
    const turn: ChatTurn = {
      id: chat.length + 1,
      question,
      answer: answerQuestion(facts, question),
      trace: traceFor(facts),
    };
    setChat((c) => [...c, turn]);
    setHashTab("ask");
    setAnimateId(turn.id);
  };

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setTab(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div className="@container space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={routes.advisor}
          className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All clients
        </Link>
        <MockBadge />
      </div>

      {facts.loss && current !== "loss" && (
        <button
          type="button"
          onClick={() => setTab("loss")}
          className="flex w-full flex-wrap items-center gap-3 rounded-md bg-attention-bg px-4 py-3 text-left ring-1 ring-attention-line hover:bg-attention-line/30"
        >
          <HeartCrack className="size-5 shrink-0 text-attention" aria-hidden="true" />
          <span className="min-w-0 flex-1 basis-56 text-sm text-pnc-ink">
            <span className="font-semibold text-attention">{lossTag(facts.loss)}</span>:{" "}
            {facts.loss.memberName} died {formatDate(facts.loss.date, "medium")}. The loss guide has
            a plan for {facts.first} and the family.
          </span>
          <span className="text-sm font-semibold text-pnc-link">Open loss guide</span>
        </button>
      )}

      <section className="rounded-md bg-white shadow-card">
        <div
          role="tablist"
          aria-label={`${customer.name} client summary`}
          className="no-scrollbar flex overflow-x-auto border-b border-pnc-line px-2"
        >
          {tabs.map((t, i) => (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              aria-controls={`${baseId}-panel`}
              tabIndex={current === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={tabButton(current === t.id)}
            >
              {t.label}
              {t.id === "loss" && (
                <span className="size-1.5 rounded-full bg-attention" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${current}`}
          className="p-4 @3xl:p-6"
        >
          {current === "overview" && <OverviewPanel facts={facts} onAsk={ask} onOpen={setTab} />}
          {current === "assets" && <AssetsPanel facts={facts} onAsk={ask} />}
          {current === "family" && <FamilyPanel facts={facts} />}
          {current === "loss" && <LossGuide facts={facts} onAsk={ask} />}
          {current === "ask" && (
            <AskPanel facts={facts} chat={chat} animateId={animateId} onAsk={ask} />
          )}
          {current === "engagement" && <EngagementPanel facts={facts} />}
        </div>
      </section>
    </div>
  );
}

export type OpenTab = (tab: TabId) => void;
