"use client";

import { CircleHelp } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { nextDeadlines, type SettlementPlan } from "@/lib/settlement/engine";
import type { ReviewState } from "@/lib/settlement/reviews";
import { formatCompactMoney, formatDate, relativeDay } from "@/lib/format";
import { DeadlineList } from "./DeadlineList";
import { HouseholdChecklist } from "./HouseholdChecklist";
import { CopyButton, JumpNav, PlanSection, StatTile } from "./layout";
import { firstName, pillButton } from "./parts";
import { pendingReviews, ReviewQueue } from "./ReviewQueue";
import { RouteTable } from "./RouteTable";

/** A gentle note for the client: what happens to each account, with no dates or amounts owed. */
function clientNote(plan: SettlementPlan): string {
  const s = firstName(plan.survivor.name);
  const lines = plan.accounts
    .filter((a) => a.outcome.route !== "designation-update")
    .map((a) => `• ${a.holding.name}: ${a.plain}`);
  return [
    `${s}, here is a simple summary of what happens to ${firstName(plan.deceased.name)}'s accounts. Nothing here needs to be done today.`,
    "",
    ...lines,
    "",
    "I'll take care of the PNC side and walk you through each step whenever you're ready.",
  ].join("\n");
}

/**
 * After a recorded death: what happens to every account, the dated steps,
 * the household checklist, what we still need to find out and who signs off.
 */
export function SettlementView({
  plan,
  customerId,
  today,
  reviews,
  onAsk,
}: {
  plan: SettlementPlan;
  customerId: string;
  today: string;
  reviews: ReviewState;
  onAsk: (q: string) => void;
}) {
  const t = plan.totals;
  const d = firstName(plan.deceased.name);
  const soon = nextDeadlines(plan, today, 90);
  const pending = pendingReviews(plan.reviewQueue, reviews, customerId);
  const next = plan.deadlines.find((x) => x.due! >= today);
  const ids = {
    accounts: `tp-${customerId}-accounts`,
    deadlines: `tp-${customerId}-deadlines`,
    checklist: `tp-${customerId}-checklist`,
    questions: `tp-${customerId}-questions`,
    signoff: `tp-${customerId}-signoff`,
    assumptions: `tp-${customerId}-assumptions`,
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="max-w-3xl text-[15px] leading-relaxed text-pnc-ink">
          {plan.deceased.name} died {relativeDay(plan.deceased.dateOfDeath, today)}.{" "}
          <strong className="font-semibold">{formatCompactMoney(t.outsideProbate)}</strong> passes
          outside probate, {formatCompactMoney(t.uninterrupted)} of it with no paperwork at all.{" "}
          {t.probate > 0 ? (
            <>
              <strong className="font-semibold text-attention">
                {formatCompactMoney(t.probate)} goes through probate
              </strong>{" "}
              and waits for letters.
            </>
          ) : (
            "Nothing at PNC goes through probate."
          )}{" "}
          {next &&
            `The next date is ${formatDate(next.due!, "medium")}: ${next.action.deadline!.label}.`}
        </p>

        <div className="flex items-center justify-between gap-2">
          <h4 className="sr-only">At a glance</h4>
          <MockBadge className="ml-auto" />
        </div>
        <dl className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
          <StatTile
            label="Passes outside probate"
            value={<Money value={t.outsideProbate} compact />}
            sub={
              <>
                <Money value={t.uninterrupted} compact /> keeps working with no paperwork
              </>
            }
            tone="positive"
          />
          <StatTile
            label="Goes through probate"
            value={<Money value={t.probate} compact />}
            sub={t.probate > 0 ? "Executor needs letters first" : "None at PNC"}
            tone={t.probate > 0 ? "attention" : "default"}
          />
          <StatTile
            label="Dates in the next 90 days"
            value={soon.length}
            sub={next ? `Next: ${formatDate(next.due!, "monthDay")}` : "None"}
            tone={soon.length ? "attention" : "default"}
          />
          <StatTile
            label="Waiting for sign-off"
            value={pending.length}
            sub={`of ${plan.reviewQueue.length} items`}
          />
        </dl>

        <JumpNav
          label="Transition plan sections"
          items={[
            { id: ids.accounts, title: "Accounts", count: plan.accounts.length },
            { id: ids.deadlines, title: "Key dates", count: plan.deadlines.length },
            { id: ids.checklist, title: "Household checklist", count: plan.household.length },
            { id: ids.questions, title: "To find out", count: plan.openQuestions.length },
            { id: ids.signoff, title: "Sign-off", count: pending.length },
            { id: ids.assumptions, title: "Assumptions" },
          ]}
        />
      </div>

      <PlanSection
        id={ids.accounts}
        title="What happens to each account"
        count={plan.accounts.length}
        intro={`Open any account to see each decision, the evidence and the law behind it, and how to explain it to ${firstName(plan.survivor.name)}.`}
        aside={
          <CopyButton
            text={clientNote(plan)}
            label={`Copy a plain note for ${firstName(plan.survivor.name)}`}
          />
        }
      >
        <RouteTable
          accounts={plan.accounts}
          survivor={plan.survivor.name}
          mode="settlement"
          onAsk={onAsk}
        />
      </PlanSection>

      <PlanSection
        id={ids.deadlines}
        title="Key dates"
        count={plan.deadlines.length}
        intro={`Counted from ${d}'s date of death, ${formatDate(plan.deceased.dateOfDeath, "medium")}.`}
      >
        <DeadlineList
          deadlines={plan.deadlines}
          holdings={plan.accounts.map((a) => a.holding)}
          today={today}
          survivor={plan.survivor.name}
        />
      </PlanSection>

      <PlanSection
        id={ids.checklist}
        title="Household checklist"
        count={plan.household.length}
        intro="Rules that apply once for the household, not per account."
      >
        <HouseholdChecklist items={plan.household} survivor={plan.survivor.name} />
      </PlanSection>

      <PlanSection
        id={ids.questions}
        title="Still to find out"
        count={plan.openQuestions.length}
        intro="The rulebook won't guess. Until these are answered, the plan assumes the cautious option."
      >
        {plan.openQuestions.length === 0 ? (
          <p className="text-sm text-pnc-muted">Nothing outstanding.</p>
        ) : (
          <ul className="space-y-2">
            {plan.openQuestions.map((q) => (
              <li
                key={q.key}
                className="flex flex-wrap items-center gap-3 rounded-md border border-pnc-line p-3 text-sm"
              >
                <CircleHelp className="size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
                <span className="min-w-0 flex-1 basis-60">
                  <span className="text-pnc-ink">{q.question}</span>
                  {q.accountIds.length > 0 && (
                    <span className="block text-xs text-pnc-muted">
                      {q.accountIds
                        .map((id) => plan.accounts.find((a) => a.holding.id === id)?.holding.name)
                        .join(", ")}
                    </span>
                  )}
                </span>
                <button type="button" onClick={() => onAsk(q.question)} className={pillButton}>
                  Ask the assistant
                </button>
              </li>
            ))}
          </ul>
        )}
      </PlanSection>

      <PlanSection
        id={ids.signoff}
        title="Sign-off"
        count={pending.length}
        intro="Steps marked here need a person to confirm them before they're final."
      >
        <ReviewQueue items={plan.reviewQueue} reviews={reviews} customerId={customerId} />
      </PlanSection>

      <PlanSection id={ids.assumptions} title="Assumptions">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-pnc-muted">
          {plan.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </PlanSection>
    </div>
  );
}
