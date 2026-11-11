"use client";

import { Check, Heart } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { accountLabel, claimSteps, tourAccounts } from "@/data/tour";
import { cn } from "@/lib/format";
import { settlementSplit, stepIndex } from "@/lib/tour";
import { Sheet, TourButton, Visual, useTour } from "../parts";

const WHEN = "after the loss";

/** "A, B and C" */
const listOf = (items: string[]) =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

// ---------------------------------------------------------------------------
// The first thing Wife sees

export function CondolenceVisual() {
  const { dispatch } = useTour();
  return (
    <Visual person="wife" when={WHEN} figures={false}>
      <Sheet className="px-8 py-14 text-center">
        <Heart className="mx-auto size-9 text-attention" aria-hidden="true" />
        <p className="mt-5 font-display text-2xl font-medium @[600px]:text-3xl">
          We&apos;re so sorry for the loss of Husband.
        </p>
        <p className="mt-2 text-lg text-pnc-muted">There is nothing you need to do today.</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "next" })}
          className="mt-8 rounded text-lg font-semibold text-pnc-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pnc-link"
        >
          See what passes to you
        </button>
      </Sheet>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// Everything that can pass to her, with the reason

export function UnclaimedVisual() {
  const { state, dispatch } = useTour();
  const split = settlementSplit(state);
  return (
    <Visual person="wife" when={WHEN}>
      <Sheet>
        <p className="px-6 pb-3 pt-5 text-md text-pnc-muted">
          Husband&apos;s accounts that can pass to you
        </p>
        <ul className="divide-y divide-pnc-line border-t border-pnc-line">
          {split.toWife.map((r) => (
            <li key={r.account} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-md font-semibold">{accountLabel(r.account)}</p>
                <p className="text-sm text-pnc-muted">{r.reason}</p>
              </div>
              <Money value={tourAccounts[r.account].balance} className="text-lg font-semibold" />
              <span className="flex justify-end @[600px]:w-36">
                {r.account === "ira" ? (
                  <TourButton
                    tone="orange"
                    onClick={() => dispatch({ type: "go", step: stepIndex("claim") })}
                  >
                    Start claim
                  </TourButton>
                ) : (
                  <span className="hidden text-sm text-pnc-muted @[600px]:inline">
                    When you are ready
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Sheet>
      <p className="mt-4 text-md text-pnc-muted">
        The estate handles {listOf(split.viaEstate.map((r) => accountLabel(r.account)))}.
      </p>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// One claim, five steps

export function ClaimVisual() {
  const { state, dispatch } = useTour();
  const done = state.claimDone.length;
  const total = claimSteps.length;
  return (
    <Visual person="wife" when={WHEN}>
      <Sheet>
        <div className="px-6 pb-4 pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xl font-semibold">{tourAccounts.ira.name}</p>
            <Money value={tourAccounts.ira.balance} className="text-lg text-pnc-muted" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-pnc-chip"
              role="progressbar"
              aria-label="Claim progress"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
            >
              <div
                className="h-full rounded-full bg-pnc-link transition-[width] duration-300"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
            <span className="text-sm text-pnc-muted">
              {done} of {total} done
            </span>
          </div>
        </div>

        <ol className="divide-y divide-pnc-line border-t border-pnc-line">
          {claimSteps.map((s) => {
            const checked = state.claimDone.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={checked}
                  disabled={state.claimSent}
                  onClick={() => dispatch({ type: "toggleClaimStep", id: s.id })}
                  className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-pnc-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link disabled:hover:bg-transparent"
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full",
                      checked ? "bg-pnc-positive text-white" : "border-2 border-pnc-line",
                    )}
                  >
                    {checked && <Check className="size-4" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-md font-semibold">{s.title}</span>
                    <span className="block text-sm text-pnc-muted">{s.note}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex min-h-[4.25rem] items-center justify-between gap-4 border-t border-pnc-line px-6 py-3">
          {state.claimSent ? (
            <p className="text-md" aria-live="polite">
              <span className="font-semibold text-pnc-positive">In review.</span> PNC usually takes
              2 to 3 weeks.
            </p>
          ) : (
            <>
              <p className="text-sm text-pnc-muted">She can stop at any time.</p>
              <TourButton
                tone="orange"
                disabled={done < total}
                onClick={() => dispatch({ type: "sendClaim" })}
              >
                Send to PNC
              </TourButton>
            </>
          )}
        </div>
      </Sheet>
    </Visual>
  );
}
