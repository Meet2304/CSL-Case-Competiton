"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { RotateCcw } from "lucide-react";
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
import { WillStepper } from "@/components/will/progress";
import { sectionMeta } from "@/components/will/sections";
import { buttonClass, ErrorBanner } from "@/components/will/ui";
import {
  answeredScreens,
  FIRST_SCREEN,
  nextScreen,
  PAGE_ERROR,
  percentDone,
  prevScreen,
  REVIEW_SCREEN,
  screenDef,
  screenIndex,
  screenTitles,
  sectionProgress,
  sections,
  validateScreen,
  type Errors,
  type SectionProgress,
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
  answered: [],
});

/** Sections finished so far (the will overview and reminders use this). */
export function sectionsDone(
  draft: WillDraft | undefined,
  progress: WillProgress | undefined,
): number {
  if (!draft || !progress) return 0;
  return sectionProgress(draft, progress).filter((p) => p.status === "complete").length;
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
  /** Person id of the testator; their will is saved under it. */
  owner: string;
  /** Leave the planner (back to the will overview). Answers are already saved. */
  onExit: () => void;
  /** Open this section instead of where the customer left off. */
  openAt?: number;
  /** Family members offered as suggestions wherever the will names a person. */
  people?: FamilyPerson[];
  /** Fills a brand-new will from what the bank already knows (e.g. the family). */
  prefill?: (draft: WillDraft) => WillDraft;
};

type State = { draft: WillDraft; progress: WillProgress; errors: Errors };

/** The screen to open for a section: its first unanswered step, else its first. */
function entryScreen(part: SectionProgress): string | undefined {
  return part.screens.find((s) => !part.done.includes(s)) ?? part.screens[0];
}

function PlannerBody({ accountHolder, owner, onExit, openAt, people = [], prefill }: PlannerProps) {
  const [state, setState] = useState<State>(() => {
    const saved = loadWill(owner);
    const draft = !saved.progress && prefill ? prefill(saved.draft) : saved.draft;
    const base = saved.progress ?? startProgress();
    const progress: WillProgress = { ...base, answered: [...answeredScreens(base)] };
    if (openAt !== undefined) {
      progress.screen = entryScreen(sectionProgress(draft, progress)[openAt]) ?? progress.screen;
      progress.returnToReview = false;
    }
    return { draft, progress, errors: {} };
  });
  const top = useRef<HTMLDivElement>(null);
  const region = useRef<HTMLElement>(null);
  const { draft, progress, errors } = state;
  const screen = screenComponents[progress.screen] ? progress.screen : FIRST_SCREEN;
  const section = screenDef(screen).section;
  const parts = sectionProgress(draft, progress);

  useEffect(() => saveWill(owner, { draft, progress }), [owner, draft, progress]);

  // Bring the new screen into view (the mobile view scrolls inside <main>).
  const scrollTop = () =>
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      top.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    });

  /** Open another screen; focus moves to it so keyboard and screen-reader users follow. */
  const move = (
    to: (s: State) => string,
    opts: { returnToReview?: boolean; answered?: string } = {},
  ) => {
    setState((s) => {
      const target = to(s);
      const answered = new Set(s.progress.answered);
      if (opts.answered) {
        answered.add(opts.answered);
        // Reaching the review by answering the last step counts as visiting it.
        if (target === REVIEW_SCREEN) answered.add(REVIEW_SCREEN);
      }
      return {
        ...s,
        errors: {},
        progress: {
          screen: target,
          furthest: Math.max(s.progress.furthest, screenIndex(target)),
          returnToReview: opts.returnToReview ?? false,
          answered: [...answered],
        },
      };
    });
    requestAnimationFrame(() => region.current?.focus({ preventScroll: true }));
    scrollTop();
  };

  const planner: Planner = {
    draft,
    errors,
    accountHolder,
    owner,
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
    skip: () => move((s) => nextScreen(s.draft, screen), { answered: screen }),
    goTo: (target, opts) => move(() => target, { returnToReview: opts?.returnToReview }),
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
    if (readWillStatus(owner) === null) setWillStatus(owner, "in-progress");
    move((s) => (s.progress.returnToReview ? REVIEW_SCREEN : nextScreen(s.draft, screen)), {
      answered: screen,
    });
  }

  function startOver() {
    const sure = window.confirm(
      "Start over? This clears every answer saved for your will on this device.",
    );
    if (!sure) return;
    resetWill(owner);
    const blank = emptyDraft();
    setState({ draft: prefill ? prefill(blank) : blank, progress: startProgress(), errors: {} });
    scrollTop();
  }

  const Screen = screenComponents[screen];
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <PlannerContext.Provider value={planner}>
      <div ref={top} className="@container scroll-mt-4">
        {/* The way back out lives in the breadcrumb above the planner (see WillSection). */}
        {progress.returnToReview && screen !== REVIEW_SCREEN && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => planner.goTo(REVIEW_SCREEN)}
              className={buttonClass.link}
            >
              Back to review
            </button>
          </div>
        )}

        <div>
          <WillStepper
            title={`${accountHolder.split(" ")[0]}'s last will & testament`}
            parts={parts}
            current={section}
            screen={screen}
            percent={percentDone(parts)}
            onGo={(s) => planner.goTo(s)}
          />
        </div>

        <section
          ref={region}
          tabIndex={-1}
          aria-label={`${sectionMeta[sections[section]].label}: ${screenTitles[screen]}`}
          className="mt-6 space-y-6 rounded-lg outline-none"
        >
          {/* key: each screen starts with fresh local state (open modals, help toggles). */}
          <form key={screen} onSubmit={submit} className="space-y-6">
            {hasErrors && <ErrorBanner message={PAGE_ERROR} />}
            <Screen />
          </form>
        </section>

        {people.length > 0 && (
          <datalist id={PEOPLE_LIST_ID}>
            {people.map((p) => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>
        )}

        <p className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-pnc-line pt-4 text-xs text-pnc-muted">
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
