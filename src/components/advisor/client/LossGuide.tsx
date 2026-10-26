"use client";

import { useMemo } from "react";
import { Check, ListChecks, MessageCircleQuestion, Quote, X } from "lucide-react";
import { AssistantMark, AssistantPanel, Chip } from "@/components/advisor/assistant/parts";
import type { OpenTab } from "@/components/advisor/client/ClientWorkspace";
import { pendingReviews } from "@/components/advisor/settlement/ReviewQueue";
import { Money } from "@/components/ui/Money";
import { lossBriefing, type ClientFacts } from "@/lib/assistant";
import { settlementInputFromFacts } from "@/lib/settlement/adapters";
import { settlementPlan } from "@/lib/settlement/engine";
import { useReviews } from "@/lib/settlement/reviews";
import { formatDate } from "@/lib/format";

const askButton =
  "inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-pnc-link ring-1 ring-pnc-blue-600/20 hover:ring-pnc-link";

/**
 * The advisor's guide to an unexpected loss: who died and what they held,
 * how to approach the bereaved client and each heir, a phased plan, and
 * advice personalized from the client's own records.
 */
export function LossGuide({
  facts,
  onAsk,
  onOpen,
}: {
  facts: ClientFacts;
  onAsk: (q: string) => void;
  onOpen?: OpenTab;
}) {
  const b = lossBriefing(facts);
  const reviews = useReviews();
  const plan = useMemo(() => {
    const input = settlementInputFromFacts(facts);
    return input ? settlementPlan(input) : undefined;
  }, [facts]);
  if (!b) return <p className="text-sm text-pnc-muted">No open loss for this client.</p>;
  const d = b.deceased;
  const accounts = facts.deceasedHoldings.filter((h) => !h.external);
  const pending = plan ? pendingReviews(plan.reviewQueue, reviews, facts.c.id).length : 0;

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <AssistantMark label="Loss guide" />
        <h3 className="font-display text-2xl font-medium text-pnc-ink">{b.headline}</h3>
        <p className="max-w-3xl text-[15px] leading-relaxed text-pnc-ink">{b.summary}</p>
        {plan && onOpen && (
          <button
            type="button"
            onClick={() => onOpen("transition")}
            className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-50 px-3 py-1.5 text-sm font-semibold text-pnc-link hover:underline"
          >
            <ListChecks className="size-4" aria-hidden="true" />
            Open the transition plan — {plan.deadlines.length} key dates, {pending} item
            {pending === 1 ? "" : "s"} to sign off
          </button>
        )}
      </header>

      <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <section className="space-y-4 rounded-md border border-pnc-line p-4 @3xl:p-5">
          <h4 className="font-display text-lg font-medium text-pnc-ink">{b.approachTitle}</h4>
          <figure className="rounded-md bg-pnc-surface px-4 py-3.5">
            <Quote className="size-4 text-pnc-blue-700" aria-hidden="true" />
            <blockquote className="mt-1 text-[15px] italic leading-relaxed text-pnc-ink">
              {b.opening.replace(/^"|"$/g, "")}
            </blockquote>
            <figcaption className="mt-1.5 text-xs text-pnc-muted">
              A way to open the first call
            </figcaption>
          </figure>
          <div className="grid gap-4 @2xl:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-pnc-ink">Do</p>
              <ul className="mt-1.5 space-y-1.5 text-sm leading-snug">
                {b.doList.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-pnc-positive"
                      aria-hidden="true"
                    />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-pnc-ink">Avoid</p>
              <ul className="mt-1.5 space-y-1.5 text-sm leading-snug">
                {b.avoidList.map((x) => (
                  <li key={x} className="flex gap-2">
                    <X className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden="true" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-md bg-pnc-surface p-4 @3xl:p-5">
          <p className="text-xs text-pnc-muted">In memory of</p>
          <h4 className="font-display text-lg font-medium text-pnc-ink">{d.name}</h4>
          <p className="text-sm text-pnc-muted">
            {facts.relToSurvivor && `${facts.first}'s ${facts.relToSurvivor}`}
            {d.age !== undefined && `, ${d.age}`}. Died{" "}
            {formatDate(d.died ?? facts.loss!.date, "medium")}.
          </p>
          {d.note && <p className="mt-2 text-sm leading-relaxed text-pnc-ink">{d.note}</p>}
          {accounts.length > 0 && (
            <>
              <p className="mt-4 flex items-baseline justify-between text-sm font-semibold text-pnc-ink">
                {accounts.length} PNC account{accounts.length > 1 ? "s" : ""}
                <Money value={b.deceasedValue} compact />
              </p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {accounts.map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span className="truncate text-pnc-ink">
                      {h.name}
                      <span className="text-xs text-pnc-muted"> {h.ownership.toLowerCase()}</span>
                    </span>
                    <Money value={h.value} compact className="shrink-0" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {b.heirs.length > 0 && (
        <section>
          <h4 className="font-display text-lg font-medium text-pnc-ink">The heirs</h4>
          <ul className="mt-3 grid gap-3 @3xl:grid-cols-2">
            {b.heirs.map((h) => (
              <li key={h.member.name} className="rounded-md border border-pnc-line p-4">
                <p className="text-sm">
                  <span className="font-semibold text-pnc-ink">{h.member.name}</span>{" "}
                  <span className="text-pnc-muted">
                    {h.member.relationship.toLowerCase()}
                    {h.member.age !== undefined && `, ${h.member.age}`}
                  </span>
                </p>
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {h.stake.map((s) => (
                    <Chip key={s} className="bg-pnc-blue-50 text-pnc-blue-800 ring-transparent">
                      {s}
                    </Chip>
                  ))}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-pnc-ink">
                  {h.approach.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="font-display text-lg font-medium text-pnc-ink">The next twelve months</h4>
        <ol className="mt-3 grid gap-3 @3xl:grid-cols-2 @5xl:grid-cols-4">
          {b.phases.map((phase, i) => (
            <li key={phase.title} className="rounded-md border border-pnc-line p-4">
              <p className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-pnc-blue-700 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="font-semibold text-pnc-ink">{phase.title}</span>
              </p>
              <p className="mt-0.5 pl-8 text-xs text-pnc-muted">{phase.window}</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {phase.steps.map((s) => (
                  <li key={s.label}>
                    <span className="font-semibold text-pnc-ink">{s.label}</span>
                    <span className="block leading-snug text-pnc-muted">{s.detail}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <AssistantPanel title={`Personalized for ${facts.first}`}>
        <ul className="space-y-2 text-sm leading-relaxed text-pnc-ink">
          {b.personalized.map((p) => (
            <li key={p} className="flex gap-2">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-pnc-blue-700"
                aria-hidden="true"
              />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            `How should I approach ${facts.first} right now?`,
            `Who inherits from ${d.name.split(" ")[0]}?`,
            "What's urgent in the first month?",
          ].map((q) => (
            <button key={q} type="button" onClick={() => onAsk(q)} className={askButton}>
              <MessageCircleQuestion className="size-4" aria-hidden="true" /> {q}
            </button>
          ))}
        </div>
      </AssistantPanel>
    </div>
  );
}
