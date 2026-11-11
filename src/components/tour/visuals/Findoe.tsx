"use client";

import { useEffect, useState } from "react";
import { ChevronRight, CircleCheck } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { RULEBOOK_VERSION, rulebook } from "@/data/settlement";
import {
  accountLabel,
  benefitsQuestion,
  findoeQuestions,
  iraDecisionPath,
  iraOutcome,
  type FindoeQuestionId,
} from "@/data/tour";
import { cn } from "@/lib/format";
import {
  benefitsReply,
  findoeAnswer,
  routesFor,
  type BenefitsAnswer,
  type FindoeAnswer,
} from "@/lib/tour";
import { Citation, Sheet, TourButton, Visual, useTour } from "../parts";

const WHEN = "after the loss";

// ---------------------------------------------------------------------------
// Wife asks Findoe

/** "…the beneficiary [1]." with the markers turned into small numbered marks. */
function Cited({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[12]\])/).map((part, i) =>
        part === "[1]" || part === "[2]" ? (
          <sup
            key={i}
            className={cn(
              "mx-0.5 rounded px-1 text-2xs font-bold",
              part === "[1]" ? "bg-pnc-blue-50 text-pnc-link" : "bg-law-bg text-law",
            )}
          >
            {part.slice(1, 2)}
          </sup>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Source({ n, from, children }: { n: 1 | 2; from: string; children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm motion-safe:animate-reveal">
      <span
        className={cn(
          "rounded px-1.5 text-2xs font-bold",
          n === 1 ? "bg-pnc-blue-50 text-pnc-link" : "bg-law-bg text-law",
        )}
      >
        {n}
      </span>
      <span className="shrink-0 text-pnc-muted">{from}</span>
      {children}
    </p>
  );
}

function Conversation({ question, answer }: { question: string; answer: FindoeAnswer }) {
  // How far Findoe has got: 0 looking in her records, 1 looking in the law, 2 answered.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [1, 2].map((n) => setTimeout(() => setStage(n), instant ? 0 : 900 * n));
    return () => timers.forEach(clearTimeout);
  }, []);
  const law = rulebook.sources[answer.lawSourceId];

  return (
    // Room is held for the answer so the visual does not resize while Findoe works.
    <div className="flex min-h-[17.5rem] flex-col gap-4 p-6" aria-live="polite">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-pnc-navy px-4 py-2.5 text-md text-white">
        {question}
      </p>
      <div className="space-y-2">
        {stage >= 1 && (
          <Source n={1} from="Your PNC records">
            <span className="truncate font-semibold">{answer.record}</span>
          </Source>
        )}
        {stage >= 2 && law && (
          <Source n={2} from="The law">
            <Citation id={answer.lawSourceId} className="font-semibold" />
          </Source>
        )}
        {stage < 2 && (
          <p className="flex items-center gap-2 text-sm text-pnc-muted">
            <FindoeLogo className="size-4" thinking />
            {stage === 0 ? "Looking in your PNC records" : "Looking in the law"}
          </p>
        )}
      </div>
      {stage >= 2 && (
        <div className="space-y-2 text-md leading-relaxed motion-safe:animate-reveal">
          {answer.sentences.map((s) => (
            <p key={s}>
              <Cited text={s} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function AskVisual() {
  const { state } = useTour();
  const [asked, setAsked] = useState<FindoeQuestionId>("claim-ira");
  return (
    <Visual person="wife" when={WHEN} figures={false}>
      <Sheet>
        <p className="flex items-center gap-2.5 border-b border-pnc-line px-6 py-4 text-lg font-semibold">
          <FindoeLogo className="size-7" /> Findoe
        </p>
        <Conversation
          key={asked}
          question={findoeQuestions[asked]}
          answer={findoeAnswer(asked, state)}
        />
        <div className="flex flex-wrap gap-2 border-t border-pnc-line px-6 py-4">
          {(Object.keys(findoeQuestions) as FindoeQuestionId[]).map((id) => (
            <TourButton
              key={id}
              tone={asked === id ? "navy" : "quiet"}
              aria-pressed={asked === id}
              onClick={() => setAsked(id)}
            >
              {findoeQuestions[id]}
            </TourButton>
          ))}
        </div>
      </Sheet>
      <p className="mt-3 text-sm text-pnc-muted">
        Scripted for this tour. General guidance, not legal or tax advice.
      </p>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The fixed path the rules took for one account

export function TreeVisual() {
  const { state } = useTour();
  const route = routesFor(state).find((r) => r.account === "ira");
  return (
    <Visual person="advisor" when={WHEN} figures={false}>
      <Sheet className="p-6 @[600px]:p-8">
        <p className="text-md text-pnc-muted">How the rules decided</p>
        <p className="text-xl font-semibold">{accountLabel("ira")}</p>

        <ol className="mt-7 flex flex-col gap-3 @[600px]:grid @[600px]:grid-cols-4 @[600px]:items-start">
          {iraDecisionPath.map((node, i) => (
            <li key={node.question} className="flex items-center gap-2">
              {i > 0 && (
                <ChevronRight
                  className="size-5 shrink-0 rotate-90 text-pnc-muted @[600px]:rotate-0"
                  aria-hidden="true"
                />
              )}
              <span>
                <span className="block text-sm text-pnc-muted">{node.question}</span>
                <span className="block text-md font-semibold @[600px]:text-lg">{node.answer}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex items-center gap-4 border-t border-pnc-line pt-6">
          <CircleCheck className="size-9 shrink-0 text-pnc-positive" aria-hidden="true" />
          <div>
            <p className="font-display text-xl font-medium">{iraOutcome}</p>
            <p className="text-md text-pnc-muted">Outside probate. Review takes {route?.review}.</p>
          </div>
        </div>
      </Sheet>
      <p className="mt-3 flex flex-wrap gap-x-2 text-sm text-pnc-muted">
        Rulebook version {RULEBOOK_VERSION}. Source:
        <Citation id="irs-pub-590b" />
      </p>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The fact the rules cannot see

const answers: { id: BenefitsAnswer; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure yet" },
];

export function AsksVisual() {
  const { state, dispatch } = useTour();
  return (
    <Visual person="advisor" when={WHEN} figures={false}>
      <Sheet className="p-6 @[600px]:p-10">
        <p className="flex items-center gap-2.5 text-md text-pnc-muted">
          <FindoeLogo className="size-6" /> Findoe needs one fact for the plan
        </p>
        <p className="mt-4 font-display text-2xl font-medium">{benefitsQuestion}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {answers.map((a) => (
            <TourButton
              key={a.id}
              tone={state.benefits === a.id ? "navy" : "quiet"}
              aria-pressed={state.benefits === a.id}
              className="px-6 py-2.5 text-md"
              onClick={() => dispatch({ type: "answerBenefits", answer: a.id })}
            >
              {a.label}
            </TourButton>
          ))}
        </div>
        <p className="mt-7 min-h-[4.5rem] border-t border-pnc-line pt-5 text-md" aria-live="polite">
          {state.benefits ? (
            <span key={state.benefits} className="block motion-safe:animate-reveal">
              {benefitsReply(state.benefits)}
            </span>
          ) : (
            <span className="text-pnc-muted">
              Until this is answered, the plan assumes payments may need to be returned.
            </span>
          )}
        </p>
      </Sheet>
    </Visual>
  );
}
