"use client";

import Link from "next/link";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { BookOpenCheck } from "lucide-react";
import { AssistantMark } from "@/components/advisor/assistant/parts";
import { DISCLAIMER, RULEBOOK_VERSION } from "@/data/settlement";
import type { ClientFacts } from "@/lib/assistant";
import { settlementInputFromFacts } from "@/lib/settlement/adapters";
import { settlementPlan } from "@/lib/settlement/engine";
import { stateFromCity } from "@/lib/settlement/facts";
import { useReviews } from "@/lib/settlement/reviews";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import { firstName } from "./parts";
import { SettlementView } from "./SettlementView";
import { SimulationView } from "./SimulationView";

type View = "settlement" | "simulation";

/**
 * The advisor's transition plan, from the settlement rulebook: after a death,
 * what happens to every account and what to do by when; before one, what
 * would happen today and what to fix. Same rules, both directions.
 */
export function TransitionPanel({
  facts,
  onAsk,
}: {
  facts: ClientFacts;
  onAsk: (q: string) => void;
}) {
  const baseId = useId();
  const reviews = useReviews();
  const plan = useMemo(() => {
    const input = settlementInputFromFacts(facts);
    return input ? settlementPlan(input) : undefined;
  }, [facts]);
  const views: { id: View; label: string }[] = [
    ...(plan
      ? [{ id: "settlement" as const, label: `After ${firstName(plan.deceased.name)}'s death` }]
      : []),
    { id: "simulation", label: "What if…" },
  ];
  const [picked, setPicked] = useState<View>();
  const view = views.some((v) => v.id === picked) ? picked! : views[0].id;
  const state = stateFromCity(facts.p.city);

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = views[(index + (e.key === "ArrowRight" ? 1 : views.length - 1)) % views.length];
    setPicked(next.id);
    document.getElementById(`${baseId}-${next.id}`)?.focus();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AssistantMark label="Transition plan" />
          <Link
            href={routes.advisorRules}
            className="inline-flex items-center gap-1 rounded-full bg-pnc-blue-50 px-2.5 py-1 text-xs font-semibold text-pnc-blue-800 hover:underline"
          >
            <BookOpenCheck className="size-3.5" aria-hidden="true" />
            Rules v{RULEBOOK_VERSION} · {state === "PA" ? "Pennsylvania" : "state not modelled"}
          </Link>
        </div>
        <h3 className="font-display text-2xl font-medium text-pnc-ink">
          {view === "settlement" && plan
            ? `What happens now that ${firstName(plan.deceased.name)} has died`
            : "What would happen if someone died today"}
        </h3>
        <p className="max-w-3xl text-xs leading-relaxed text-pnc-muted">
          {DISCLAIMER} Every route comes from a cited rule, not a language model.
        </p>
      </header>

      {views.length > 1 && (
        <div
          role="tablist"
          aria-label="Transition plan view"
          className="inline-flex gap-1 rounded-full bg-pnc-surface p-1"
        >
          {views.map((v, i) => (
            <button
              key={v.id}
              id={`${baseId}-${v.id}`}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              aria-controls={`${baseId}-view`}
              tabIndex={view === v.id ? 0 : -1}
              onClick={() => setPicked(v.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                view === v.id
                  ? "bg-white text-pnc-ink shadow-card"
                  : "text-pnc-muted hover:text-pnc-ink",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div
        id={`${baseId}-view`}
        role={views.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={views.length > 1 ? `${baseId}-${view}` : undefined}
      >
        {view === "settlement" && plan ? (
          <SettlementView
            plan={plan}
            customerId={facts.c.id}
            today={facts.today}
            reviews={reviews}
            onAsk={onAsk}
          />
        ) : (
          <SimulationView
            customer={facts.c}
            profile={facts.p}
            defaultPerson={facts.self}
            today={facts.today}
            onAsk={onAsk}
          />
        )}
      </div>
    </div>
  );
}
