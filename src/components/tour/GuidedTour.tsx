"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { tourCaptions, tourChapters, tourFacts, tourGlow, tourPeople } from "@/data/tour";
import { cn, formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  frameIds,
  lastBeat,
  layoutWidth,
  nextBeat,
  previousStop,
  stageLayout,
  stopAt,
  tourBeats,
  tourStates,
  tourStops,
  type StageLayout,
  type TourState,
} from "@/lib/tour";
import { Frame } from "./Frame";

// The stage fills the window; its size (and the root font size, which the
// presentation zoom changes) is read from the browser rather than kept in state.
function subscribeToStage(onChange: () => void) {
  window.addEventListener("resize", onChange);
  const zoom = new MutationObserver(onChange);
  zoom.observe(document.documentElement, { attributes: true, attributeFilter: ["data-scale"] });
  return () => {
    window.removeEventListener("resize", onChange);
    zoom.disconnect();
  };
}
const readStage = () =>
  `${window.innerWidth}x${window.innerHeight}x${parseFloat(getComputedStyle(document.documentElement).fontSize) || 16}`;
const noStage = () => "";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const roundButton = cn(
  "grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10",
  focusRing,
);

/**
 * The guided tour: a stage of people's screens that the presenter moves
 * through with the arrow keys. Nothing plays by itself; each press plays one
 * step of the story (see `src/lib/tour.ts`). The current stop is kept in the
 * URL hash, so a refresh or a shared link opens the tour at the same place.
 */
export function GuidedTour() {
  const [beat, setBeat] = useState(0);
  const stageKey = useSyncExternalStore(subscribeToStage, readStage, noStage);

  const forward = useCallback(() => setBeat(nextBeat), []);
  const back = useCallback(() => setBeat(previousStop), []);
  const restart = useCallback(() => setBeat(0), []);

  // Open at the stop named in the URL, if any, and follow the URL when its hash is edited. The
  // first read happens once, before the first stop rewrites the URL, and is not cancelled: in
  // development React runs this effect twice.
  const opened = useRef(false);
  useEffect(() => {
    const wanted = () => Number.parseInt(window.location.hash.slice(1), 10);
    const follow = () => {
      if (!Number.isNaN(wanted())) setBeat(stopAt(wanted()));
    };
    window.addEventListener("hashchange", follow);
    if (!opened.current) {
      opened.current = true;
      const first = wanted();
      if (first) requestAnimationFrame(() => setBeat(stopAt(first)));
    }
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  // A beat with `auto` runs on into the next; a stop waits, and is remembered in the URL.
  useEffect(() => {
    const auto = tourBeats[beat].auto;
    if (auto === undefined) {
      window.history.replaceState(null, "", beat ? `#${beat}` : window.location.pathname);
      return;
    }
    const timer = setTimeout(() => setBeat((b) => (b === beat ? beat + 1 : b)), auto);
    return () => clearTimeout(timer);
  }, [beat]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A held key counts once: every step of the story is its own press.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      // Space belongs to a focused button or link; everywhere else it moves the tour on.
      const onControl = e.target instanceof HTMLElement && e.target.closest("button, a") !== null;
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !onControl))
        forward();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") back();
      else if (e.key === "Home") restart();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forward, back, restart]);

  const s = tourStates[beat];
  const caption = tourCaptions[s.caption];
  const chapterIndex = tourChapters.findIndex((c) => c.id === caption.chapter);
  const [w, h, rem] = stageKey ? stageKey.split("x").map(Number) : [0, 0, 16];
  // Side-by-side screens cannot be read on a phone, so the tour asks for more room instead.
  const cramped = stageKey !== "" && (w < 900 || h < 540);
  const layout = stageKey && !cramped ? stageLayout(w, h) : null;

  return (
    <div className="tour-stage fixed inset-0 overflow-hidden text-white">
      <header className="absolute inset-x-0 top-0 z-30 flex h-12 items-center gap-3 px-5">
        <FindoeLogo className="size-6" />
        <p className="font-display text-sm font-semibold">
          Findoe <span className="ml-1.5 font-sans font-normal text-white/50">Guided tour</span>
        </p>
        <p className="ml-auto hidden items-center gap-2 text-xs text-white/45 sm:flex">
          <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-sans">←</kbd>
          <kbd className="rounded border border-white/20 px-1.5 py-0.5 font-sans">→</kbd>
          to move through the story
        </p>
        <Link
          href={routes.signOn}
          aria-label="Exit the tour"
          className={cn(
            "grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white",
            focusRing,
          )}
        >
          <X className="size-4.5" aria-hidden="true" />
        </Link>
      </header>

      {layout && (
        <>
          <Loss s={s} layout={layout} />
          {frameIds.map((id) => (
            <Frame
              key={id}
              id={id}
              s={s}
              beat={beat}
              rect={layout.slots[s.frames[id].slot]}
              lw={layoutWidth(s.frames[id]) * rem}
              stageKey={stageKey}
            />
          ))}
          <Ending show={s.ended} onReplay={restart} />
        </>
      )}

      {cramped && (
        <div className="absolute inset-0 z-20 grid place-items-center px-8 pb-28 text-center">
          <div className="max-w-sm">
            <FindoeLogo className="mx-auto size-12" />
            <p className="mt-5 font-display text-2xl font-medium leading-tight">
              This tour needs a larger screen
            </p>
            <p className="mt-3 text-white/65">
              It shows several people&rsquo;s screens side by side. Open it on a laptop or widen
              this window, and it picks up where you left off.
            </p>
          </div>
        </div>
      )}

      <footer
        className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-8 px-[clamp(1rem,2.6vw,3rem)] pb-2"
        style={{ height: layout?.captionH ?? 110 }}
      >
        <div key={s.caption} className="tour-caption min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/45">
            {chapterIndex + 1} · {tourChapters[chapterIndex].label}
          </p>
          <h2 className="mt-1 font-display text-[clamp(1.2rem,1.9vw,1.9rem)] font-medium leading-tight">
            {caption.title}
          </h2>
          <p className="mt-1 text-[clamp(0.875rem,1.15vw,1.125rem)] text-white/65">
            {caption.body}
          </p>
        </div>

        <ol aria-label="Chapters" className="hidden items-center gap-1.5 md:flex">
          {tourChapters.map((chapter, i) => {
            const stops = tourStops.filter(
              (stop) => tourCaptions[tourStates[stop].caption].chapter === chapter.id,
            );
            const passed = stops.filter((stop) => stop <= beat).length;
            return (
              <li
                key={chapter.id}
                aria-current={i === chapterIndex ? "step" : undefined}
                title={chapter.label}
                className="h-1 w-9 overflow-hidden rounded-full bg-white/15"
              >
                <span
                  className="block h-full rounded-full bg-white transition-[width] duration-500"
                  style={{ width: `${(passed / stops.length) * 100}%` }}
                />
              </li>
            );
          })}
        </ol>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back"
            disabled={beat === 0}
            onClick={back}
            className={roundButton}
          >
            <ArrowLeft className="size-4.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={beat === lastBeat}
            onClick={forward}
            className={roundButton}
          >
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The loss: a quiet moment for John, then word going out to three screens

const flowTo = ["husband", "wife", "advisor"] as const;
const flowSlots = ["third1", "third2", "third3"] as const;

function Loss({ s, layout }: { s: TourState; layout: StageLayout }) {
  const { center, source } = layout;
  const at = s.memorial === "source" ? source : center;
  const years = `${tourFacts.born.slice(0, 4)} – ${tourFacts.died.slice(0, 4)}`;
  return (
    <div aria-hidden={s.memorial === "off"} className="pointer-events-none absolute inset-0 z-10">
      <svg className="absolute inset-0 size-full overflow-visible">
        <defs>
          {flowTo.map((id, i) => {
            const end = layout.slots[flowSlots[i]];
            return (
              <linearGradient
                key={id}
                id={`tour-flow-${id}`}
                gradientUnits="userSpaceOnUse"
                x1={source.x}
                y1={source.y}
                x2={end.x + end.w / 2}
                y2={end.y}
              >
                <stop offset="0" stopColor="white" stopOpacity="0.9" />
                <stop offset="1" stopColor={tourGlow[id][0]} />
              </linearGradient>
            );
          })}
        </defs>
        {flowTo.map((id, i) => {
          const slot = layout.slots[flowSlots[i]];
          const x = slot.x + slot.w / 2;
          const y = slot.y - 8;
          const y0 = source.y + 12;
          const bend = (y - y0) * 0.62;
          return (
            <path
              key={id}
              d={`M ${source.x} ${y0} C ${source.x} ${y0 + bend}, ${x} ${y - bend}, ${x} ${y}`}
              pathLength={1}
              fill="none"
              stroke={`url(#tour-flow-${id})`}
              strokeWidth={2}
              strokeLinecap="round"
              data-on={s.flows}
              className="tour-flow"
              style={{
                opacity: s.flows ? 1 : 0,
                transitionDelay: s.flows ? `${i * 120}ms` : "0ms",
                filter: `drop-shadow(0 0 6px ${tourGlow[id][0]})`,
              }}
            />
          );
        })}
      </svg>

      {/* A single light: it rests at the centre, then becomes where the news starts from. */}
      <div
        className="absolute left-0 top-0 transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.6,0,0.2,1)]"
        style={{
          transform: `translate(${at.x}px, ${at.y}px)`,
          opacity: s.memorial === "off" ? 0 : 1,
        }}
      >
        <span
          className={cn(
            "tour-ember absolute -left-2 -top-2 block size-4 rounded-full bg-white transition-shadow duration-[1300ms]",
            s.memorial === "source"
              ? "shadow-[0_0_18px_6px_rgb(255_255_255/0.35),0_0_60px_20px_rgb(255_255_255/0.12)]"
              : "shadow-[0_0_30px_12px_rgb(255_244_214/0.4),0_0_120px_50px_rgb(255_244_214/0.14)]",
          )}
        />
      </div>

      <div
        className={cn(
          "absolute left-1/2 w-[min(90vw,40rem)] -translate-x-1/2 text-center transition-opacity ease-out",
          s.memorial === "center"
            ? "opacity-100 delay-500 duration-[1400ms]"
            : "opacity-0 duration-500",
        )}
        style={{ top: center.y + 44 }}
      >
        <p className="font-[Georgia,'Times_New_Roman',serif] text-[clamp(2.25rem,4vw,3.5rem)] leading-tight">
          {tourPeople.husband.name}
        </p>
        <p className="mt-3 text-[clamp(0.9rem,1.2vw,1.1rem)] tracking-[0.35em] text-white/60">
          {years}
        </p>
        <p className="mt-6 font-[Georgia,'Times_New_Roman',serif] text-[clamp(1rem,1.3vw,1.25rem)] italic text-white/55">
          Husband to Maya. Father to David and Alexa.
        </p>
      </div>

      <p
        className={cn(
          "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/60 transition-opacity",
          s.memorial === "source" ? "opacity-100 delay-700 duration-700" : "opacity-0 duration-300",
        )}
        style={{ top: source.y - 38 }}
      >
        The bank records John&rsquo;s passing · {formatDate(tourFacts.died, "medium")}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The close

function Ending({ show, onReplay }: { show: boolean; onReplay: () => void }) {
  const button =
    "flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "absolute inset-0 z-20 grid place-items-center pb-24 transition-opacity duration-1000",
        show ? "opacity-100 delay-300" : "pointer-events-none opacity-0",
      )}
    >
      <div className="max-w-2xl px-6 text-center">
        <FindoeLogo className="mx-auto size-14" />
        <p className="mt-6 font-display text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-tight">
          A family is never left to work it out alone.
        </p>
        <p className="mt-4 text-[clamp(1rem,1.3vw,1.2rem)] text-white/65">
          One family view before a loss. A prepared advisor and guided, cited claims after it.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            type="button"
            tabIndex={show ? 0 : -1}
            onClick={onReplay}
            className={cn(button, "bg-white/10 ring-1 ring-white/20 hover:bg-white/20", focusRing)}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Replay the tour
          </button>
          <Link
            href={routes.signOn}
            tabIndex={show ? 0 : -1}
            className={cn(button, "bg-pnc-orange hover:bg-pnc-orange-600", focusRing)}
          >
            Open the prototype <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
