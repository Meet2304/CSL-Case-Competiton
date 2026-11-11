"use client";

import { useEffect, useMemo, useReducer, type ComponentType } from "react";
import Link from "next/link";
import { MousePointerClick, X } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PncLogo } from "@/components/brand/PncLogo";
import { useHashTab } from "@/components/shared/useHashTab";
import { tourChapters, tourSteps, type TourVisualId } from "@/data/tour";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  chapterStart,
  clampStep,
  initialTourState,
  tourReducer,
  type TourAction,
} from "@/lib/tour";
import { FitCanvas, TourContext } from "./parts";
import { NoticeVisual, PlanVisual, TransferVisual } from "./visuals/Advisor";
import { GapsVisual, OneViewVisual, PreviewVisual, SharingVisual } from "./visuals/Before";
import { AskVisual, AsksVisual, TreeVisual } from "./visuals/Findoe";
import { CloseVisual, FamilyVisual, TodayVisual } from "./visuals/Problem";
import { ClaimVisual, CondolenceVisual, UnclaimedVisual } from "./visuals/Widow";

const visuals: Record<TourVisualId, ComponentType> = {
  family: FamilyVisual,
  today: TodayVisual,
  "one-view": OneViewVisual,
  gaps: GapsVisual,
  sharing: SharingVisual,
  preview: PreviewVisual,
  notice: NoticeVisual,
  plan: PlanVisual,
  transfer: TransferVisual,
  condolence: CondolenceVisual,
  unclaimed: UnclaimedVisual,
  claim: ClaimVisual,
  ask: AskVisual,
  tree: TreeVisual,
  asks: AsksVisual,
  close: CloseVisual,
};

const stepIds = tourSteps.map((s) => s.id);

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

/**
 * The guided tour: one headline, one sentence and one visual per step, for a
 * presenter to talk over. The words sit on the left and the visual on the
 * right, scaled to fit so nothing scrolls. The current step lives in the URL
 * hash, so a step can be linked to; the arrow keys and the buttons move
 * through it.
 */
export function GuidedTour() {
  const [stepId, setStepId] = useHashTab(stepIds);
  const [state, rawDispatch] = useReducer(tourReducer, initialTourState);
  const index = stepIds.indexOf(stepId);
  const step = tourSteps[index];

  const context = useMemo(() => {
    const go = (n: number) => setStepId(stepIds[clampStep(n)]);
    const dispatch = (action: TourAction) => {
      if (action.type === "go") go(action.step);
      else if (action.type === "next") go(index + 1);
      else if (action.type === "back") go(index - 1);
      else {
        if (action.type === "restart") go(0);
        rawDispatch(action);
      }
    };
    return { state, dispatch, step };
  }, [state, step, index, setStepId]);
  const { dispatch } = context;

  // Arrow keys move through the tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") dispatch({ type: "next" });
      else if (e.key === "ArrowLeft") dispatch({ type: "back" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const VisualFor = visuals[step.id];
  const chapterIndex = tourChapters.findIndex((c) => c.id === step.chapter);
  const first = index === 0;
  const last = index === tourSteps.length - 1;

  return (
    <TourContext.Provider value={context}>
      <div className="flex min-h-dvh w-full flex-col bg-white text-pnc-ink lg:h-dvh lg:overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 bg-pnc-navy px-4 text-white sm:px-6 lg:h-16">
          <PncLogo tone="light" size="sm" />
          <span className="h-6 w-px bg-white/25" aria-hidden="true" />
          <span className="flex items-center gap-2">
            <FindoeLogo className="size-6" />
            <span className="hidden font-display font-semibold sm:inline">Findoe</span>
          </span>

          <nav aria-label="Chapters" className="ml-auto hidden h-full lg:block">
            <ol className="flex h-full">
              {tourChapters.map((c, i) => (
                <li key={c.id} className="h-full">
                  <button
                    type="button"
                    aria-current={i === chapterIndex ? "step" : undefined}
                    onClick={() => dispatch({ type: "go", step: chapterStart(c.id) })}
                    className={cn(
                      "relative h-full whitespace-nowrap px-4 text-sm font-semibold text-white/75 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
                      i === chapterIndex &&
                        "text-white after:absolute after:inset-x-4 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange",
                    )}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p className="ml-auto whitespace-nowrap text-sm font-semibold lg:hidden">
            {tourChapters[chapterIndex].label}
          </p>

          <Link
            href={routes.signOn}
            aria-label="Exit the tour"
            className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="size-5" aria-hidden="true" />
          </Link>
        </header>

        <main className="flex min-h-0 flex-1 flex-col pb-20 lg:flex-row lg:pb-0">
          <section
            aria-label="This step"
            className="flex shrink-0 flex-col px-6 py-8 lg:w-[34%] lg:max-w-[36rem] lg:px-12 lg:py-10"
          >
            <div key={step.id} className="lg:my-auto">
              <h1 className="font-display text-3xl font-medium leading-tight lg:text-[clamp(1.75rem,2.7vw,3.25rem)]">
                {step.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-pnc-muted lg:mt-6 lg:text-[clamp(1.05rem,1.4vw,1.6rem)]">
                {step.body}
              </p>
              {step.tryIt && (
                <p className="mt-6 flex items-center gap-2 text-md font-semibold text-pnc-link lg:text-[clamp(0.95rem,1.1vw,1.25rem)]">
                  <MousePointerClick className="size-5 shrink-0" aria-hidden="true" />
                  {step.tryIt}
                </p>
              )}
              {last && (
                <Link
                  href={routes.signOn}
                  className={cn(
                    "mt-8 inline-block rounded text-lg font-semibold text-pnc-link underline underline-offset-4",
                    focusRing,
                  )}
                >
                  Open the working prototype
                </Link>
              )}
            </div>

            <div className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t border-pnc-line bg-white px-6 py-3 lg:static lg:border-0 lg:p-0">
              <button
                type="button"
                disabled={first}
                onClick={() => dispatch({ type: "back" })}
                className={cn(
                  "rounded-full px-5 py-2.5 text-md font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link disabled:opacity-40 disabled:hover:ring-pnc-line",
                  focusRing,
                )}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => dispatch(last ? { type: "restart" } : { type: "next" })}
                className={cn(
                  "rounded-full bg-pnc-orange px-7 py-2.5 text-md font-semibold text-white hover:bg-pnc-orange-600",
                  focusRing,
                )}
              >
                {last ? "Start again" : first ? "Start" : "Next"}
              </button>
              <p
                className="ml-auto text-sm tabular-nums text-pnc-muted"
                aria-label={`Step ${index + 1} of ${tourSteps.length}`}
              >
                {index + 1} / {tourSteps.length}
              </p>
            </div>
          </section>

          <section
            aria-label="What it looks like"
            className="min-h-0 flex-1 bg-pnc-surface p-4 sm:p-8 lg:p-10"
          >
            <FitCanvas>
              <VisualFor key={step.id} />
            </FitCanvas>
          </section>
        </main>
      </div>
    </TourContext.Provider>
  );
}
