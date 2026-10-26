"use client";

import { useId, useState } from "react";
import {
  CalendarClock,
  Check,
  CircleHelp,
  ClipboardCheck,
  Landmark,
  ListChecks,
  MessageSquareText,
  NotebookPen,
  Quote,
  ShieldAlert,
  Undo2,
  X,
} from "lucide-react";
import { AssistantMark, Chip } from "@/components/advisor/assistant/parts";
import { EngagementPanel } from "@/components/advisor/client/EngagementPanel";
import { DeadlineList } from "@/components/advisor/settlement/DeadlineList";
import { HouseholdChecklist } from "@/components/advisor/settlement/HouseholdChecklist";
import { CopyButton, Disclosure } from "@/components/advisor/settlement/layout";
import { whenTone } from "@/components/advisor/settlement/parts";
import { ReviewQueue } from "@/components/advisor/settlement/ReviewQueue";
import { RouteTable } from "@/components/advisor/settlement/RouteTable";
import { MockBadge } from "@/components/mock/Mock";
import { lossBriefing, type ClientFacts } from "@/lib/assistant";
import type { Guidance, NextStep } from "@/lib/nextSteps";
import { caseworkActions } from "@/lib/settlement/casework";
import type { OpenQuestion, SettlementPlan } from "@/lib/settlement/engine";
import { pendingReviews, type ReviewState } from "@/lib/settlement/reviews";
import { cn, formatCompactMoney, formatDate } from "@/lib/format";

const VISIBLE = 5;
const firstName = (name: string) => name.split(" ")[0];
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const small =
  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

/** A gentle note for the client: what happens to each account, with no dates or amounts owed. */
function clientNote(plan: SettlementPlan): string {
  const s = firstName(plan.survivor.name);
  return [
    `${s}, here is a simple summary of what happens to ${firstName(plan.deceased.name)}'s accounts. Nothing here needs to be done today.`,
    "",
    ...plan.accounts
      .filter((a) => a.outcome.route !== "designation-update")
      .map((a) => `• ${a.holding.name}: ${a.plain}`),
    "",
    "I'll take care of the PNC side and walk you through each step whenever you're ready.",
  ].join("\n");
}

function StepCard({
  step,
  index,
  onWhy,
  onAnswer,
  onDone,
}: {
  step: NextStep;
  index: number;
  onWhy: (s: NextStep) => void;
  onAnswer: (q: OpenQuestion) => void;
  onDone: (s: NextStep) => void;
}) {
  const isQuestion = step.kind === "question";
  return (
    <li
      className={cn(
        "flex gap-3 rounded-md p-4 ring-1",
        isQuestion ? "bg-pnc-blue-50 ring-pnc-blue-600/20" : "bg-white ring-pnc-line",
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
          isQuestion ? "bg-pnc-blue-700 text-white" : "bg-pnc-chip text-pnc-ink",
        )}
        aria-hidden="true"
      >
        {isQuestion ? <CircleHelp className="size-4" /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-pnc-ink">
          {isQuestion && <span className="sr-only">Question: </span>}
          {step.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-pnc-muted">{step.why}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Chip className={whenTone[step.when.tone]}>{step.when.label}</Chip>
          <span className="text-xs text-pnc-muted">Owner: {step.owner}</span>
          <span className="ml-auto flex flex-wrap gap-2">
            {isQuestion ? (
              <button
                type="button"
                onClick={() => onAnswer(step.question!)}
                className={cn(small, "bg-pnc-blue-700 text-white hover:bg-pnc-blue-800")}
              >
                Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onWhy(step)}
                className={cn(
                  small,
                  "bg-white text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link",
                )}
              >
                Why?<span className="sr-only"> {step.title}</span>
              </button>
            )}
            {step.checkable && (
              <button
                type="button"
                onClick={() => onDone(step)}
                className={cn(
                  small,
                  "bg-white text-pnc-ink ring-1 ring-pnc-line hover:ring-pnc-link",
                )}
              >
                <Check className="size-4" aria-hidden="true" /> Done
                <span className="sr-only">: {step.title}</span>
              </button>
            )}
          </span>
        </div>
      </div>
    </li>
  );
}

/**
 * The advisor's working view of a client, read top to bottom:
 * where things stand, what to do next, and the detail behind it on demand.
 * Every step comes from the settlement rulebook through `guidanceFor`.
 */
export function NextStepsView({
  facts,
  guidance: g,
  reviews,
  onWhy,
  onAnswer,
  onOpenWhatIf,
  onAsk,
}: {
  facts: ClientFacts;
  guidance: Guidance;
  reviews: ReviewState;
  onWhy: (s: NextStep) => void;
  onAnswer: (q: OpenQuestion) => void;
  onOpenWhatIf: () => void;
  onAsk: (q: string) => void;
}) {
  const baseId = useId();
  const [showAll, setShowAll] = useState(false);
  const [openDetail, setOpenDetail] = useState<string>();
  const id = facts.c.id;
  const sit = g.situation;
  const visible = showAll ? g.steps : g.steps.slice(0, VISIBLE);
  const done = (s: NextStep) => caseworkActions.toggleDone(id, s.id);
  const plan = g.plan;
  const briefing = lossBriefing(facts);
  const pending = plan ? pendingReviews(plan.reviewQueue, reviews, id).length : 0;
  const detail = (key: string) => ({
    id: `${baseId}-${key}`,
    open: openDetail === key,
    onToggle: (o: boolean) => setOpenDetail(o ? key : undefined),
  });

  return (
    <div className="space-y-8">
      {/* 1. Where things stand */}
      <section
        aria-labelledby={`${baseId}-situation`}
        className={cn(
          "rounded-md border-l-4 bg-white p-4 ring-1 ring-pnc-line @3xl:p-5",
          sit.tone === "loss" || sit.tone === "exposed"
            ? "border-l-attention"
            : sit.tone === "gaps"
              ? "border-l-pnc-orange"
              : "border-l-pnc-positive",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-pnc-muted">{sit.eyebrow}</p>
          <MockBadge />
        </div>
        <h3
          id={`${baseId}-situation`}
          className="mt-1 font-display text-2xl font-medium text-pnc-ink"
        >
          {sit.headline}
        </h3>
        <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-pnc-ink">{sit.summary}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          {sit.stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-pnc-muted">{s.label}</dt>
              <dd
                className={cn(
                  "font-display text-xl font-medium",
                  s.tone === "attention"
                    ? "text-attention"
                    : s.tone === "positive"
                      ? "text-pnc-positive"
                      : "text-pnc-ink",
                )}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 2. What to do next */}
      <section aria-labelledby={`${baseId}-next`} className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <AssistantMark label="From the settlement rulebook" />
            <h3 id={`${baseId}-next`} className="font-display text-xl font-medium text-pnc-ink">
              Do next{" "}
              <span className="text-sm font-semibold text-pnc-muted">
                {g.steps.length ? `${g.steps.length} open` : "all done"}
              </span>
            </h3>
          </div>
          {g.done.length > 0 && (
            <span className="text-xs text-pnc-muted">{g.done.length} done</span>
          )}
        </div>
        {g.steps.length === 0 ? (
          <p className="rounded-md bg-pnc-positive-bg px-4 py-3 text-sm text-pnc-ink">
            Nothing left on the list. The assistant will add steps if anything changes.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {visible.map((s, i) => (
              <StepCard
                key={s.id}
                step={s}
                index={i}
                onWhy={onWhy}
                onAnswer={onAnswer}
                onDone={done}
              />
            ))}
          </ol>
        )}
        {g.steps.length > VISIBLE && (
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-semibold text-pnc-link hover:underline"
          >
            {showAll ? "Show fewer" : `Show ${g.steps.length - VISIBLE} more`}
          </button>
        )}
        {g.done.length > 0 && (
          <details className="rounded-md bg-pnc-surface px-4 py-2 text-sm">
            <summary className="cursor-pointer py-1 font-semibold text-pnc-ink">
              Done ({g.done.length})
            </summary>
            <ul className="mt-1 space-y-1.5 pb-1">
              {g.done.map((s) => (
                <li key={s.id} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-pnc-positive" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-pnc-muted line-through">{s.title}</span>
                  <button
                    type="button"
                    onClick={() => done(s)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-pnc-link hover:underline"
                  >
                    <Undo2 className="size-3" aria-hidden="true" /> Undo
                    <span className="sr-only">: {s.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* 3. Detail, only when asked for */}
      <section aria-labelledby={`${baseId}-details`}>
        <h3 id={`${baseId}-details`} className="font-display text-xl font-medium text-pnc-ink">
          Details
        </h3>
        <p className="text-sm text-pnc-muted">
          Open what you need; everything above comes from here.
        </p>
        <div className="mt-2 border-t border-pnc-line">
          {briefing && (
            <Disclosure
              {...detail("approach")}
              icon={MessageSquareText}
              title={`How to talk to ${facts.first}`}
              summary="Opening words, what to do and avoid, and the heirs"
            >
              <div className="space-y-4 text-sm">
                <figure className="rounded-md bg-pnc-surface px-4 py-3">
                  <Quote className="size-4 text-pnc-blue-700" aria-hidden="true" />
                  <blockquote className="mt-1 text-[15px] italic leading-relaxed text-pnc-ink">
                    {briefing.opening.replace(/^"|"$/g, "")}
                  </blockquote>
                </figure>
                <div className="grid gap-4 @2xl:grid-cols-2">
                  <ul className="space-y-1.5">
                    {briefing.doList.map((x) => (
                      <li key={x} className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-pnc-positive"
                          aria-label="Do"
                        />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {briefing.avoidList.map((x) => (
                      <li key={x} className="flex gap-2">
                        <X className="mt-0.5 size-4 shrink-0 text-attention" aria-label="Avoid" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                {briefing.heirs.length > 0 && (
                  <ul className="space-y-2">
                    {briefing.heirs.map((h) => (
                      <li key={h.member.name} className="rounded-md border border-pnc-line p-3">
                        <p className="font-semibold text-pnc-ink">
                          {h.member.name}{" "}
                          <span className="font-normal text-pnc-muted">
                            {h.member.relationship.toLowerCase()}
                            {h.member.age !== undefined && `, ${h.member.age}`} ·{" "}
                            {h.stake.join("; ")}
                          </span>
                        </p>
                        <p className="mt-1 leading-relaxed text-pnc-ink">{h.approach[0]}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Disclosure>
          )}

          {plan && (
            <>
              <Disclosure
                {...detail("accounts")}
                icon={Landmark}
                title="What happens to each account"
                summary={`${plural(plan.accounts.length, "account")} · ${formatCompactMoney(plan.totals.outsideProbate)} outside probate`}
              >
                <div className="mb-3 flex justify-end">
                  <CopyButton
                    text={clientNote(plan)}
                    label={`Copy a plain note for ${facts.first}`}
                  />
                </div>
                <RouteTable
                  accounts={plan.accounts}
                  survivor={plan.survivor.name}
                  mode="settlement"
                  onAsk={onAsk}
                />
              </Disclosure>
              <Disclosure
                {...detail("dates")}
                icon={CalendarClock}
                title="Key dates"
                summary={`${plural(plan.deadlines.length, "date")}${plan.deadlines[0] ? ` · first ${formatDate(plan.deadlines[0].due!, "medium")}` : ""}`}
              >
                <DeadlineList
                  deadlines={plan.deadlines}
                  holdings={plan.accounts.map((a) => a.holding)}
                  today={facts.today}
                  survivor={plan.survivor.name}
                />
              </Disclosure>
              <Disclosure
                {...detail("household")}
                icon={ListChecks}
                title="Household checklist"
                summary={`${plural(plan.household.length, "rule")} that apply once for the household`}
              >
                <HouseholdChecklist items={plan.household} survivor={plan.survivor.name} />
              </Disclosure>
              <Disclosure
                {...detail("signoff")}
                icon={ClipboardCheck}
                title="Sign-off"
                summary={`${pending} of ${plan.reviewQueue.length} waiting`}
              >
                <ReviewQueue items={plan.reviewQueue} reviews={reviews} customerId={id} />
              </Disclosure>
            </>
          )}

          {!plan && g.readiness && (
            <Disclosure
              {...detail("whatif")}
              icon={ShieldAlert}
              title={`If ${facts.first} died today`}
              summary={`${plural(g.readiness.findings.length, "gap")} · ${formatCompactMoney(g.readiness.plan.totals.probate)} would go through probate`}
            >
              <p className="text-sm text-pnc-ink">
                The fixes above come from running the rulebook as if {facts.first} died today. The
                What if tab shows every account, and lets you run it for anyone in the household.
              </p>
              <button
                type="button"
                onClick={onOpenWhatIf}
                className={cn(small, "mt-3 bg-pnc-blue-700 text-white hover:bg-pnc-blue-800")}
              >
                Open the what-if
              </button>
            </Disclosure>
          )}

          <Disclosure
            {...detail("outreach")}
            icon={NotebookPen}
            title="Outreach plan and draft message"
            summary="When to get in touch, what to say, and a draft"
          >
            <EngagementPanel facts={facts} />
          </Disclosure>

          {(g.answered.length > 0 || (plan?.assumptions.length ?? 0) > 0) && (
            <Disclosure
              {...detail("answers")}
              icon={CircleHelp}
              title="Your answers and our assumptions"
              summary={`${plural(g.answered.length, "answer")}${plan ? ` · ${plural(plan.assumptions.length, "assumption")}` : ""}`}
            >
              {g.answered.length > 0 && (
                <ul className="mb-4 space-y-2 text-sm">
                  {g.answered.map((a) => (
                    <li
                      key={a.key}
                      className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-md bg-pnc-surface px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 basis-60">
                        <span className="block text-pnc-muted">{a.question}</span>
                        <span className="font-semibold text-pnc-ink">{a.answerLabel}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => caseworkActions.clearAnswer(id, a.keys)}
                        className="text-xs font-semibold text-pnc-link hover:underline"
                      >
                        Change<span className="sr-only"> answer to: {a.question}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {plan && (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-pnc-muted">
                  {plan.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}
            </Disclosure>
          )}
        </div>
      </section>
    </div>
  );
}
