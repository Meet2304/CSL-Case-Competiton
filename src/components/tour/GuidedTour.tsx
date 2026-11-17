"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { resetDemo } from "@/components/advisor/RecordDeathDialog";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import {
  FILM_STYLE,
  find,
  inView,
  rectOf,
  setValue,
  sleep,
  waitFor,
} from "@/components/film/driver";
import { useHashTab } from "@/components/shared/useHashTab";
import { tourLoss, tourPeople, tourScenes, tourStops, tourWillDraft } from "@/data/tour";
import { bereavementActions, currentBereavement } from "@/lib/bereavement";
import { visiblePart, type Rect, type Target } from "@/lib/film";
import { filmSignIn, filmSignOut } from "@/lib/filmSession";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  frameIds,
  planStop,
  stageLayout,
  viewportFor,
  type FrameId,
  type StageLayout,
  type TourFocus,
  type TourStep,
  type TourStop,
  type TourWorld,
} from "@/lib/tour";
import { REVIEW_SCREEN, screens } from "@/lib/will/flow";
import { loadWill, saveWill, setWillStatus } from "@/lib/will/storage";
import { Frame, GLIDE_MS, hiddenFrame, MOVE_MS, VEIL_MS, type FrameView } from "./Frame";

const stopIds = tourStops.map((s) => s.id);
/** The keys the stage answers to; inside a card they are handed back to it. */
const stageKeys = new Set(["ArrowRight", "ArrowLeft", "PageDown", "PageUp", " ", "Home", "Escape"]);
const lastStop = tourStops.length - 1;

// The stage fills the window; its size is read from the browser rather than kept in state.
function subscribeToStage(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const readStage = () => `${window.innerWidth}x${window.innerHeight}`;
const noStage = () => "";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

type Views = Record<FrameId, FrameView>;
const allHidden = Object.fromEntries(frameIds.map((id) => [id, hiddenFrame])) as Views;

/** Puts John's will where the story needs it: every answer given, or already on file. */
function seedWill(status: "in-progress" | "on-file") {
  saveWill(tourLoss.personId, {
    draft: tourWillDraft,
    progress: {
      screen: REVIEW_SCREEN,
      furthest: screens.length - 1,
      answered: screens.map((s) => s.id),
      returnToReview: false,
    },
  });
  setWillStatus(tourLoss.personId, status);
}

/**
 * Puts the demo's saved state where a scene needs it. Moving forward, the
 * state is whatever the people on stage just did; jumping in or stepping
 * back (`fresh`), it is rebuilt from nothing.
 */
function prepareWorld(world: TourWorld, fresh: boolean) {
  const told = () => currentBereavement().losses.some((l) => l.personName === tourLoss.personName);
  if (world === "before") {
    if (fresh || told()) resetDemo();
    if (!loadWill(tourLoss.personId).progress) seedWill("in-progress");
    return;
  }
  if (fresh) {
    resetDemo();
    seedWill("on-file");
  }
  if (!told())
    bereavementActions.recordLoss({
      personName: tourLoss.personName,
      date: tourLoss.date,
      reportedVia: tourLoss.reportedVia,
      recordedOn: tourLoss.date,
    });
  if (!currentBereavement().transfers?.[tourLoss.personId])
    bereavementActions.initiateTransfer(tourLoss.personId, new Date().toISOString());
  // Maya sent the bank John's death certificate; the advisor saw it verified.
  if (!currentBereavement().deathCertificate)
    bereavementActions.uploadCertificate("death-certificate.pdf", tourLoss.date);
}

/** Scrolls a page so the element can be seen, and waits for the page to come to rest. */
async function reveal(el: HTMLElement, smooth: boolean) {
  const view = el.ownerDocument.defaultView;
  if (!view || inView(el)) return;
  const fits = el.getBoundingClientRect().height + 48 <= view.innerHeight;
  el.scrollIntoView({
    block: fits ? "center" : "start",
    inline: "nearest",
    behavior: smooth ? "smooth" : "instant",
  });
  let last = Number.NaN;
  for (let i = 0; i < 16; i++) {
    await sleep(90);
    if (view.scrollY === last) break;
    last = view.scrollY;
  }
  // scrollIntoView also scrolls whatever holds the frame, which would shift the picture.
  const frame = view.frameElement;
  for (let box = frame?.parentElement; box; box = box.parentElement) box.scrollTo(0, 0);
  frame?.ownerDocument.defaultView?.scrollTo(0, 0);
}

/**
 * The guided tour: the working app on a plain white stage, one card per
 * person. The stop lives in the URL hash; the arrow keys step through it,
 * and each press plays one stop and then rests. There is nothing else on the
 * stage: no titles, no captions, no controls.
 */
export function GuidedTour() {
  const [stopId, setStopId] = useHashTab(stopIds);
  const index = stopIds.indexOf(stopId);
  const stop = tourStops[index];
  const stageKey = useSyncExternalStore(subscribeToStage, readStage, noStage);
  const [w, h] = stageKey ? stageKey.split("x").map(Number) : [0, 0];
  // Side-by-side screens cannot be read on a phone, so the tour asks for more room instead.
  const cramped = stageKey !== "" && (w < 900 || h < 520);
  const layout = stageKey && !cramped ? stageLayout(w, h) : null;

  const [views, setViews] = useState<Views>(allHidden);
  /** The stop that has finished playing; the stage is at rest only while it is the one showing. */
  const [settledAt, setSettledAt] = useState<number | null>(null);
  const settled = settledAt === index;

  const iframes = useRef<Partial<Record<FrameId, HTMLIFrameElement | null>>>({});
  const loaded = useRef<Partial<Record<FrameId, () => void>>>({});
  /** What each card's camera is framing, and how its page is laid out, as the run last set them. */
  const live = useRef<Views>(allHidden);
  const stage = useRef<StageLayout | null>(null);
  /** Who the browser is signed in as; the app's pages share one session. */
  const session = useRef<FrameId | "nobody" | null>(null);
  /** Counts the runs, so a run that has been overtaken by a newer stop stops. */
  const run = useRef(0);
  const previous = useRef<number | null>(null);
  /** Whether the stop on stage finished playing (a ref, so a run can read it as it starts). */
  const finished = useRef(false);

  useEffect(() => {
    stage.current = layout;
  });

  const settle = (done: number | null) => {
    finished.current = done !== null;
    setSettledAt(done);
  };

  const patch = (id: FrameId, change: Partial<FrameView>) => {
    live.current = { ...live.current, [id]: { ...live.current[id], ...change } };
    setViews(live.current);
  };

  const doc = (id: FrameId) => () => iframes.current[id]?.contentDocument;

  /** The size of a card's page, for clipping what the camera frames. */
  const pageSize = (id: FrameId) => {
    const view = live.current[id];
    const rect = stage.current?.slots[view.slot];
    return rect ? viewportFor(rect, view.width) : { w: view.width, h: 800 };
  };

  const signInAs = async (id: FrameId | "nobody") => {
    if (session.current === id) return;
    if (id === "nobody") await filmSignOut();
    else await filmSignIn(tourPeople[id].userId);
    session.current = id;
  };

  /** Loads a page of the app in a card and waits for it. */
  const load = (id: FrameId, path: string) =>
    new Promise<void>((resolve) => {
      loaded.current[id] = resolve;
      patch(id, { page: { key: (live.current[id].page?.key ?? 0) + 1, src: path } });
      setTimeout(resolve, 20_000);
    });

  /** Points a card's camera at an element, or at the whole page. */
  const frame = (id: FrameId, el: HTMLElement | null, cut: boolean, focus?: TourFocus) =>
    patch(id, {
      focus: el ? visiblePart(rectOf(el), pageSize(id)) : undefined,
      maxZoom: focus?.maxZoom,
      fit: focus?.fit,
      cut,
    });

  /** Moves a card's pointer to an element and presses. */
  const point = async (id: FrameId, el: HTMLElement) => {
    const r = rectOf(el);
    // Fields are entered at their start; everything else is pressed in the middle.
    const field = el.matches("input, textarea");
    const at = { x: field ? r.x + Math.min(40, r.w / 4) : r.x + r.w / 2, y: r.y + r.h / 2 };
    patch(id, { pointer: { ...at, shown: true, down: false } });
    await sleep(720);
    patch(id, { pointer: { ...at, shown: true, down: true } });
    await sleep(190);
    patch(id, { pointer: { ...at, shown: true, down: false } });
  };

  /** Whether an element is inside what a card's camera is showing. */
  const inFrame = (id: FrameId, r: Rect) => {
    const f = live.current[id].focus;
    return !f || (r.x >= f.x && r.y >= f.y && r.x + r.w <= f.x + f.w && r.y + r.h <= f.y + f.h);
  };

  /** Runs a stop's steps: played out with the pointer, or at once when `fast`. */
  const act = async (steps: TourStep[] | undefined, fast: boolean, alive: () => boolean) => {
    for (const step of steps ?? []) {
      if (!alive()) return;
      if (step.do === "pause") {
        if (!fast) await sleep(step.ms);
        continue;
      }
      const id = step.in;
      if (step.do === "wait") {
        await waitFor(doc(id), step.for, 20_000);
        continue;
      }
      if (step.do === "look") {
        if (fast) continue;
        const el = await waitFor(doc(id), step.at);
        if (!el || !alive()) continue;
        await reveal(el, true);
        frame(id, el, false, { on: step.at, maxZoom: 1.35 });
        await sleep(MOVE_MS + 500);
        continue;
      }
      const target: Target = step.do === "click" ? step.on : step.into;
      const el = await waitFor(doc(id), target, 12_000);
      if (!alive()) return;
      if (!el) continue;
      if (!fast) {
        await reveal(el, true);
        // Pull back when the control is outside what the camera is showing.
        if (!inFrame(id, rectOf(el))) {
          frame(id, null, false);
          await sleep(MOVE_MS * 0.7);
        }
        await point(id, el);
        if (!alive()) return;
      }
      if (step.do === "click") {
        // The app's pages share one session, so it must be this person's before they act.
        if (step.signsIn) session.current = id;
        else await signInAs(id);
        if (!alive()) return;
        el.click();
      } else {
        el.focus({ preventScroll: true });
        if (fast) setValue(el, step.text);
        else
          for (let i = 1; i <= step.text.length; i++) {
            setValue(el, step.text.slice(0, i));
            await sleep(step.text.length > 24 ? 22 : 70);
            if (!alive()) return;
          }
      }
      await sleep(fast ? 90 : 480);
    }
  };

  /** Points every card's camera at what the stop is about. */
  const aim = async (target: TourStop, cut: boolean, alive: () => boolean) => {
    const scene = tourScenes[target.scene!];
    const ids = frameIds.filter((id) => scene.frames[id]);
    const apply = async (id: FrameId, jump: boolean) => {
      const focus = target.focus?.[id];
      const view = doc(id)()?.defaultView;
      if (!focus) {
        if (!view) return;
        // The whole page, from the top.
        if (view.scrollY > 0) view.scrollTo({ top: 0, behavior: jump ? "instant" : "smooth" });
        frame(id, null, jump);
        return;
      }
      const el = await waitFor(doc(id), focus.on, 6000);
      if (!alive()) return;
      if (el) await reveal(el, !jump);
      frame(id, el, jump, focus);
    };
    await Promise.all(ids.map((id) => apply(id, cut)));
    // Follow the page if it is still settling (late content, an answer being written).
    for (const ms of [450, 900]) {
      await sleep(ms);
      if (!alive()) return;
      for (const id of ids) {
        const focus = target.focus?.[id];
        const page = doc(id)();
        const el = focus && page ? find(page, focus.on) : null;
        if (el) frame(id, el, false, focus);
      }
    }
  };

  const play = useEffectEvent(async (from: number | null, to: number, alive: () => boolean) => {
    const target = tourStops[to];
    // Leaving a stop before its steps finished: the pages are in an unknown state, so start over.
    const interrupted = from !== null && !finished.current;
    const plan = planStop(tourStops, interrupted ? null : from, to);
    settle(null);

    if (plan.kind === "card") {
      for (const id of frameIds)
        patch(id, { shown: false, pointer: { ...live.current[id].pointer, shown: false } });
      await sleep(900);
      if (alive()) settle(to);
      return;
    }

    if (plan.kind === "enter") {
      const scene = tourScenes[target.scene!];
      const ids = frameIds.filter((id) => scene.frames[id]);
      let moves = false;
      for (const id of frameIds) {
        const next = scene.frames[id];
        const was = live.current[id];
        if (!next) {
          patch(id, { shown: false, pointer: { ...was.pointer, shown: false } });
          continue;
        }
        const glide = was.shown && was.slot !== next.slot;
        moves ||= glide;
        patch(id, {
          shown: true,
          slot: next.slot,
          width: next.width,
          glide,
          veil: true,
          quiet: false,
          pointer: { ...was.pointer, shown: false },
        });
      }
      // The page changes behind white, once the card has reached its place.
      await sleep(from === null ? 0 : moves ? GLIDE_MS : VEIL_MS);
      if (!alive()) return;
      for (const id of ids) patch(id, { focus: undefined, cut: true });
      prepareWorld(scene.world, !plan.animate);
      for (const id of ids) {
        const next = scene.frames[id]!;
        await signInAs(next.signedOut ? "nobody" : id);
        if (!alive()) return;
        await load(id, next.path);
        if (!alive()) return;
        await waitFor(doc(id), next.ready, 20_000);
        await doc(id)()?.fonts.ready;
      }
      for (const earlier of plan.replay) {
        if (!alive()) return;
        await act(tourStops[earlier].steps, true, alive);
      }
      if (!alive()) return;
      const unveil = async () => {
        await nextFrame();
        await nextFrame();
        for (const id of ids) patch(id, { veil: false });
      };
      if (plan.animate && target.steps?.length) {
        // Open on the pages as they are, then play the steps out.
        if (plan.replay.length) await aim(tourStops[plan.replay.at(-1)!], true, alive);
        await unveil();
        await sleep(700);
        await act(target.steps, false, alive);
        if (!alive()) return;
        await aim(target, false, alive);
      } else {
        await act(target.steps, true, alive);
        if (!alive()) return;
        await aim(target, true, alive);
        if (!alive()) return;
        await unveil();
      }
    } else {
      await act(target.steps, false, alive);
      if (!alive()) return;
      await aim(target, false, alive);
    }
    if (!alive()) return;
    for (const id of frameIds)
      if (live.current[id].pointer.shown)
        patch(id, { pointer: { ...live.current[id].pointer, shown: false } });
    if (target.quiet) {
      patch(target.quiet, { quiet: true });
      // Moving forward, the color drains slowly; the stop rests once it has gone.
      if (plan.kind !== "enter" || plan.animate) await sleep(2600);
    }
    // Keys go to the stage, not to a field the app focused inside a card.
    if (document.activeElement instanceof HTMLIFrameElement) document.activeElement.blur();
    if (alive()) settle(to);
  });

  const ready = layout !== null;
  useEffect(() => {
    if (!ready) return;
    const token = ++run.current;
    const from = previous.current;
    previous.current = index;
    void play(from, index, () => run.current === token);
  }, [index, ready]);

  const go = (n: number) => setStopId(stopIds[Math.min(Math.max(n, 0), lastStop)]);
  const exit = async () => {
    run.current++;
    await filmSignOut();
    window.location.assign(routes.signOn);
  };

  const onKey = useEffectEvent((key: string) => {
    // Every stop is its own press: a press while a stop is still playing is not kept for later.
    if (key === "ArrowRight" || key === "PageDown" || key === " ") {
      if (settled) go(index + 1);
    } else if (key === "ArrowLeft" || key === "PageUp") go(index - 1);
    else if (key === "Home") go(0);
    else if (key === "Escape") void exit();
    else return false;
    return true;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // A held key counts once.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      // Space belongs to a focused button or link; everywhere else it moves the tour on.
      if (e.key === " " && (e.target as HTMLElement | null)?.closest?.("button, a")) return;
      if (onKey(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /** Every page a card loads: tidy it for the stage and keep the tour's keys working inside it. */
  const onPageLoad = (id: FrameId) => {
    const d = iframes.current[id]?.contentDocument;
    if (!d?.head) return;
    if (!d.getElementById("tour-style")) {
      const style = d.createElement("style");
      style.id = "tour-style";
      // The sign-on page links to this tour; inside the tour that link would only be in the way.
      style.textContent = `${FILM_STYLE}a[href="${routes.tour}"]{visibility:hidden}`;
      d.head.append(style);
    }
    // Nobody types into the app during the tour, so its keys all belong to the stage.
    d.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      if (!stageKeys.has(e.key)) return;
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
    });
    loaded.current[id]?.();
    loaded.current[id] = undefined;
  };

  const register = (id: FrameId, el: HTMLIFrameElement | null) => {
    iframes.current[id] = el;
  };

  const ended = !stop.scene;
  const years = `${tourLoss.born.slice(0, 4)} – ${tourLoss.date.slice(0, 4)}`;

  return (
    <div
      data-settled={settled}
      data-stop={stop.id}
      onClick={(e) => {
        if (settled && !(e.target as HTMLElement).closest("button, a")) go(index + 1);
      }}
      onScroll={(e) => e.currentTarget.scrollTo(0, 0)}
      className="tour-stage fixed inset-0 overflow-hidden bg-white text-pnc-ink"
    >
      <p className="sr-only" aria-live="polite">
        {stop.say}
      </p>

      {layout &&
        frameIds.map((id) => (
          <Frame
            key={id}
            id={id}
            view={views[id]}
            rect={layout.slots[views[id].slot]}
            years={id === tourLoss.frame ? years : undefined}
            register={register}
            onLoad={onPageLoad}
          />
        ))}

      {layout && (
        <div
          aria-hidden={!ended}
          className={cn(
            "absolute inset-0 grid place-items-center transition-opacity duration-1000",
            ended ? "opacity-100 delay-500" : "pointer-events-none opacity-0",
          )}
        >
          <div className="max-w-3xl px-8 text-center">
            <FindoeLogo className="mx-auto size-12" />
            <p className="mt-8 text-balance font-display text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-tight text-pnc-navy">
              {stop.scene ? "" : stop.say}
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <button
                type="button"
                tabIndex={ended ? 0 : -1}
                onClick={() => go(0)}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-pnc-ink ring-1 ring-pnc-line transition-colors hover:bg-pnc-surface",
                  focusRing,
                )}
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Watch again
              </button>
              <button
                type="button"
                tabIndex={ended ? 0 : -1}
                onClick={() => void exit()}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-full bg-pnc-blue-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-pnc-blue-800",
                  focusRing,
                )}
              >
                Open the prototype <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {cramped && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          <div className="max-w-sm">
            <FindoeLogo className="mx-auto size-12" />
            <p className="mt-5 font-display text-2xl font-medium leading-tight text-pnc-navy">
              This tour needs a larger screen
            </p>
            <p className="mt-3 text-pnc-muted">
              It shows the laptop version of the app, sometimes two people side by side. Open it on
              a laptop or widen this window, and it picks up where you left off.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
