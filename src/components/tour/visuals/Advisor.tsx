"use client";

import {
  ArrowRight,
  Bell,
  Check,
  Heart,
  Landmark,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { Money } from "@/components/ui/Money";
import { accountLabel, tourAccounts } from "@/data/tour";
import { cn, formatCompactMoney } from "@/lib/format";
import { advisorPlan, routesFor, settlementSplit, stepIndex } from "@/lib/tour";
import { Avatar, Citation, Sheet, TourButton, Visual, useTour } from "../parts";

const WHEN = "after the loss";

// ---------------------------------------------------------------------------
// The notification: what triggers it, and what it looks like

const trigger: { icon: LucideIcon; text: string; now?: boolean }[] = [
  { icon: Landmark, text: "The bank records the death" },
  { icon: Bell, text: "The Bank Advisor is told", now: true },
  { icon: ListChecks, text: "A plan is ready" },
];

export function NoticeVisual() {
  const { dispatch } = useTour();
  return (
    <Visual person="advisor" when={WHEN} figures={false}>
      <ol className="relative mt-4 grid grid-cols-3">
        <span
          className="absolute left-[16.67%] right-[16.67%] top-7 h-0.5 bg-pnc-line"
          aria-hidden="true"
        />
        {trigger.map((t) => (
          <li key={t.text} className="relative flex flex-col items-center gap-3 px-2 text-center">
            <span
              className={cn(
                "grid size-14 place-items-center rounded-full",
                t.now
                  ? "bg-pnc-navy text-white"
                  : "bg-white text-pnc-blue-700 ring-1 ring-pnc-line",
              )}
            >
              <t.icon className="size-6" aria-hidden="true" />
            </span>
            <span className={cn("text-md", t.now ? "font-semibold" : "text-pnc-muted")}>
              {t.text}
            </span>
          </li>
        ))}
      </ol>

      <Sheet className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-6">
        <Heart className="size-8 shrink-0 text-attention" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold">Husband has passed away</p>
          <p className="text-md text-pnc-muted">Recorded by the bank 2 days ago</p>
        </div>
        <TourButton tone="navy" onClick={() => dispatch({ type: "next" })}>
          Open the plan
        </TourButton>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The plan: people first, then the accounts

export function PlanVisual() {
  const { state, dispatch } = useTour();
  return (
    <Visual person="advisor" when={WHEN} figures={false}>
      <Sheet>
        <ol className="divide-y divide-pnc-line">
          {advisorPlan(state).map((s, i) => {
            const done = state.planDone.includes(s.id);
            return (
              <li key={s.id} className="flex items-center gap-4 px-6 py-3.5">
                <span className="w-4 shrink-0 text-md tabular-nums text-pnc-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-md font-semibold", done && "text-pnc-muted line-through")}>
                    {s.title}
                  </p>
                  {s.note && <p className="text-sm text-pnc-muted">{s.note}</p>}
                </div>
                <span className="hidden shrink-0 text-sm text-pnc-muted @[600px]:block">
                  {s.when}
                </span>
                {s.needsAnswer ? (
                  <TourButton onClick={() => dispatch({ type: "go", step: stepIndex("asks") })}>
                    Answer
                  </TourButton>
                ) : (
                  <button
                    type="button"
                    aria-pressed={done}
                    aria-label={`Mark "${s.title}" done`}
                    onClick={() => dispatch({ type: "togglePlanStep", id: s.id })}
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                      done
                        ? "bg-pnc-positive text-white"
                        : "border-2 border-pnc-line text-transparent hover:border-pnc-link hover:text-pnc-link",
                    )}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The transfer plan: where each account goes, and the law behind it

export function TransferVisual() {
  const { state } = useTour();
  const split = settlementSplit(state);
  const total = split.direct + split.estate;
  return (
    <Visual person="advisor" when={WHEN}>
      <Sheet>
        <div className="px-6 pb-5 pt-6">
          <div className="flex justify-between gap-4 text-md">
            <p>
              <span className="text-pnc-muted">Passes to Wife </span>
              <Money value={split.direct} compact className="font-semibold text-pnc-positive" />
            </p>
            <p className="text-right">
              <span className="text-pnc-muted">Through probate </span>
              <Money value={split.estate} compact className="font-semibold" />
            </p>
          </div>
          <div className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full">
            <span
              className="bg-pnc-positive transition-[width] duration-500"
              style={{ width: `${(split.direct / total) * 100}%` }}
            />
            <span className="flex-1 bg-pnc-muted/40" />
          </div>
          <p className="mt-2 text-sm text-pnc-muted">
            Plus the {formatCompactMoney(split.outside)} life policy, paid by the insurer.
          </p>
        </div>

        <ul className="divide-y divide-pnc-line border-t border-pnc-line">
          {routesFor(state).map((r) => (
            <li key={r.account} className="flex items-center gap-3 px-6 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold">{accountLabel(r.account)}</p>
                <p className="text-sm text-pnc-muted">{r.reason}</p>
              </div>
              <Money
                value={tourAccounts[r.account].balance}
                className="hidden text-md tabular-nums @[600px]:inline"
              />
              <ArrowRight className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
              <span className="flex w-28 shrink-0 items-center gap-2 text-md">
                {r.outcome === "estate" ? (
                  <>
                    <Landmark className="size-6 text-pnc-muted" aria-hidden="true" /> The estate
                  </>
                ) : (
                  <>
                    <Avatar person="wife" className="size-6" /> Wife
                  </>
                )}
              </span>
              <span className="hidden w-48 shrink-0 @[600px]:flex">
                {r.sources[0] && <Citation id={r.sources[0]} />}
              </span>
            </li>
          ))}
        </ul>
      </Sheet>
    </Visual>
  );
}
