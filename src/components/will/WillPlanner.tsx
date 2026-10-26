"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import {
  PEOPLE_LIST_ID,
  PlannerContext,
  type FamilyPerson,
  type Planner,
} from "@/components/will/context";
import {
  AssetEstimateScreen,
  AssetListScreen,
  AssetMethodScreen,
} from "@/components/will/screens/assets";
import { BasicDetails, MaritalStatusScreen } from "@/components/will/screens/basics";
import { FuneralScreen } from "@/components/will/screens/funeral";
import { GiftsScreen } from "@/components/will/screens/gifts";
import { ChildrenScreen, GuardiansScreen, PetsScreen } from "@/components/will/screens/nominees";
import {
  AffidavitScreen,
  DigitalExecutorsScreen,
  ExecutorsScreen,
  IndependentAdministrationScreen,
  NoContestScreen,
  PersonalStatementScreen,
} from "@/components/will/screens/provisions";
import {
  CausesScreen,
  ConsentScreen,
  LastResortScreen,
  PrimaryScreen,
  ResiduarySummaryScreen,
  SecondaryScreen,
  TertiaryScreen,
} from "@/components/will/screens/residuary";
import { MirrorWillsScreen, ReviewScreen } from "@/components/will/screens/review";
import { buttonClass, ErrorBanner } from "@/components/will/ui";
import { cn } from "@/lib/format";
import {
  FIRST_SCREEN,
  firstScreenOf,
  nextScreen,
  PAGE_ERROR,
  prevScreen,
  REVIEW_SCREEN,
  screenDef,
  screenIndex,
  screens,
  sections,
  validateScreen,
  type Errors,
} from "@/lib/will/flow";
import {
  loadWill,
  readWillStatus,
  resetWill,
  saveWill,
  setWillStatus,
  useHydrated,
} from "@/lib/will/storage";
import { emptyDraft, type WillDraft, type WillProgress } from "@/lib/will/types";

const screenComponents: Record<string, ComponentType> = {
  "basics.details": BasicDetails,
  "basics.marital": MaritalStatusScreen,
  "nominees.children": ChildrenScreen,
  "nominees.guardians": GuardiansScreen,
  "nominees.pets": PetsScreen,
  "assets.method": AssetMethodScreen,
  "assets.estimate": AssetEstimateScreen,
  "assets.list": AssetListScreen,
  "residuary.causes": CausesScreen,
  "residuary.consent": ConsentScreen,
  "residuary.primary": PrimaryScreen,
  "residuary.secondary": SecondaryScreen,
  "residuary.tertiary": TertiaryScreen,
  "residuary.lastResort": LastResortScreen,
  "residuary.summary": ResiduarySummaryScreen,
  gifts: GiftsScreen,
  funeral: FuneralScreen,
  "provisions.executors": ExecutorsScreen,
  "provisions.digital": DigitalExecutorsScreen,
  "provisions.noContest": NoContestScreen,
  "provisions.affidavit": AffidavitScreen,
  "provisions.independent": IndependentAdministrationScreen,
  "provisions.statement": PersonalStatementScreen,
  "review.mirror": MirrorWillsScreen,
  "review.summary": ReviewScreen,
};

const startProgress = (): WillProgress => ({
  screen: FIRST_SCREEN,
  furthest: 0,
  returnToReview: false,
});

/** Sections finished so far (the will overview uses this for its progress). */
export function sectionsDone(progress: WillProgress | undefined): number {
  if (!progress) return 0;
  const reached = screens[Math.min(progress.furthest, screens.length - 1)];
  return progress.screen === REVIEW_SCREEN ? sections.length : reached.section;
}

/**
 * The step-by-step will planner. Answers are saved to this browser as the
 * customer goes (see `lib/will/storage.ts`), so it resumes where they left off.
 * Rendered only after hydration because the saved draft lives in localStorage.
 */
export function WillPlanner(props: PlannerProps) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return <p className="py-10 text-center text-sm text-pnc-muted">Loading your will…</p>;
  }
  return <PlannerBody {...props} />;
}

type PlannerProps = {
  accountHolder: string;
  /** Leave the planner (back to the will overview). Answers are already saved. */
  onExit: () => void;
  /** Family members offered as suggestions wherever the will names a person. */
  people?: FamilyPerson[];
  /** Fills a brand-new will from what the bank already knows (e.g. the family). */
  prefill?: (draft: WillDraft) => WillDraft;
};

type State = { draft: WillDraft; progress: WillProgress; errors: Errors };

function PlannerBody({ accountHolder, onExit, people = [], prefill }: PlannerProps) {
  const [state, setState] = useState<State>(() => {
    const saved = loadWill();
    const fresh = !saved.progress;
    return {
      draft: fresh && prefill ? prefill(saved.draft) : saved.draft,
      progress: saved.progress ?? startProgress(),
      errors: {},
    };
  });
  const top = useRef<HTMLDivElement>(null);
  const { draft, progress, errors } = state;
  const screen = screenComponents[progress.screen] ? progress.screen : FIRST_SCREEN;
  const section = screenDef(screen).section;
  const furthestSection = Math.max(
    section,
    screens[Math.min(progress.furthest, screens.length - 1)].section,
  );

  useEffect(() => saveWill({ draft, progress }), [draft, progress]);

  // Bring the new screen's heading into view (the mobile view scrolls inside <main>).
  const scrollTop = () =>
    requestAnimationFrame(() =>
      top.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );

  const move = (to: (s: State) => string, returnToReview = false) => {
    setState((s) => {
      const target = to(s);
      return {
        ...s,
        errors: {},
        progress: {
          screen: target,
          furthest: Math.max(s.progress.furthest, screenIndex(target)),
          returnToReview,
        },
      };
    });
    scrollTop();
  };

  const planner: Planner = {
    draft,
    errors,
    accountHolder,
    people,
    update: (fn) =>
      setState((s) => {
        const next = fn(s.draft);
        // Once errors are showing, re-check as the customer fixes them so stale messages clear.
        const stillShowing = Object.keys(s.errors).length > 0;
        return {
          ...s,
          draft: next,
          errors: stillShowing ? validateScreen(next, s.progress.screen) : s.errors,
        };
      }),
    previous: prevScreen(draft, screen)
      ? () => move((s) => prevScreen(s.draft, screen) ?? screen)
      : undefined,
    skip: () => move((s) => nextScreen(s.draft, screen)),
    goTo: (target, opts) => move(() => target, opts?.returnToReview),
    exit: onExit,
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateScreen(draft, screen);
    if (Object.keys(found).length > 0) {
      setState((s) => ({ ...s, errors: found }));
      scrollTop();
      return;
    }
    if (readWillStatus() === null) setWillStatus("in-progress");
    move((s) => (s.progress.returnToReview ? REVIEW_SCREEN : nextScreen(s.draft, screen)));
  }

  function startOver() {
    const sure = window.confirm(
      "Start over? This clears every answer saved for your will on this device.",
    );
    if (!sure) return;
    resetWill();
    const blank = emptyDraft();
    setState({ draft: prefill ? prefill(blank) : blank, progress: startProgress(), errors: {} });
    scrollTop();
  }

  const Screen = screenComponents[screen];
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <PlannerContext.Provider value={planner}>
      <div ref={top} className="@container scroll-mt-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onExit} className={buttonClass.link}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Will overview
          </button>
          {progress.returnToReview && screen !== REVIEW_SCREEN && (
            <button
              type="button"
              onClick={() => planner.goTo(REVIEW_SCREEN)}
              className={buttonClass.link}
            >
              Back to review
            </button>
          )}
        </div>

        <Stepper
          current={section}
          furthest={furthestSection}
          finished={screen === REVIEW_SCREEN}
          onSelect={(i) => planner.goTo(firstScreenOf(draft, i))}
        />

        {/* key: each screen starts with fresh local state (open modals, help toggles). */}
        <form key={screen} onSubmit={submit} className="space-y-6">
          {hasErrors && <ErrorBanner message={PAGE_ERROR} />}
          <Screen />
        </form>

        {people.length > 0 && (
          <datalist id={PEOPLE_LIST_ID}>
            {people.map((p) => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>
        )}

        <p className="flex flex-wrap items-center justify-between gap-2 border-t border-pnc-line pt-4 text-xs text-pnc-muted">
          Saved on this device as you go. The planner makes a draft for you to review; it isn&apos;t
          legal advice.
          <button
            type="button"
            onClick={startOver}
            className="inline-flex items-center gap-1 font-semibold text-pnc-muted hover:text-pnc-link"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Start over
          </button>
        </p>
      </div>
    </PlannerContext.Provider>
  );
}

/**
 * The eight sections as a connected track. Done sections get a blue check,
 * the current one an orange ring (PNC's "you are here" accent). On narrow
 * screens it collapses to "Step 3 of 8" with a progress bar.
 */
function Stepper({
  current,
  furthest,
  finished,
  onSelect,
}: {
  current: number;
  furthest: number;
  finished: boolean;
  onSelect: (section: number) => void;
}) {
  const percent = finished ? 100 : ((current + 0.5) / sections.length) * 100;
  return (
    <nav aria-label="Will sections">
      <div className="@2xl:hidden">
        <p className="text-sm text-pnc-muted">
          Step {current + 1} of {sections.length}:{" "}
          <span className="font-semibold text-pnc-ink">{sections[current]}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pnc-chip" aria-hidden="true">
          <div
            className="h-full rounded-full bg-pnc-blue-700 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ol className="hidden @2xl:flex">
        {sections.map((name, i) => {
          const isCurrent = i === current && !finished;
          const done = finished || (i <= furthest && !isCurrent);
          const reachable = i <= furthest;
          return (
            <li key={name} className="relative flex-1">
              {/* Connector to the previous step: blue once that stretch is complete. */}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 top-3.5 h-0.5 w-full",
                    i <= furthest || finished ? "bg-pnc-blue-700" : "bg-pnc-line",
                  )}
                />
              )}
              <button
                type="button"
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelect(i)}
                className={cn(
                  "relative z-10 mx-auto flex flex-col items-center gap-1.5 rounded-md px-1 text-xs focus-visible:outline-2 focus-visible:outline-pnc-link",
                  isCurrent
                    ? "font-semibold text-pnc-ink"
                    : reachable
                      ? "text-pnc-ink hover:text-pnc-link"
                      : "text-pnc-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-xs font-semibold",
                    done
                      ? "bg-pnc-blue-700 text-white"
                      : isCurrent
                        ? "bg-white text-pnc-orange-600 ring-2 ring-pnc-orange"
                        : "bg-white text-pnc-muted ring-1 ring-pnc-line",
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                {name}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
