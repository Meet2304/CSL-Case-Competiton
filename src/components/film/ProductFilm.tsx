"use client";

import { useEffect, useEffectEvent, useRef, useState, type UIEvent } from "react";
import Link from "next/link";
import { Pause, Play, X } from "lucide-react";
import { resetDemo } from "@/components/advisor/RecordDeathDialog";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PncLogo } from "@/components/brand/PncLogo";
import { useHashTab } from "@/components/shared/useHashTab";
import { Avatar } from "@/components/tour/parts";
import { filmChapters, filmScenes, filmShots } from "@/data/film";
import { MOCK_AS_OF } from "@/data/mock";
import { tourPeople } from "@/data/tour";
import { bereavementActions, currentBereavement } from "@/lib/bereavement";
import {
  frameFor,
  planShot,
  visiblePart,
  type Action,
  type FilmPersona,
  type FilmShot,
  type FilmWorld,
  type Rect,
  type Size,
} from "@/lib/film";
import { filmSignIn } from "@/lib/filmSession";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  FILM_STYLE,
  bringIntoView,
  find,
  inView,
  rectOf,
  setValue,
  sleep,
  waitFor,
} from "./driver";

/** The size the app's pages are laid out at, whatever the size of the window showing them. */
const SCREEN: Size = { w: 1440, h: 860 };
/** How long a camera move takes. */
const MOVE_MS = 1000;
/** How long the stage takes to go dark, or come back, at a cut. */
const CUT_MS = 200;
/** How long a shot is held before the next one, when the film is playing by itself. */
const HOLD_MS = 4500;
const CARD_HOLD_MS = 2800;

const shotIds = filmShots.map((s) => s.id);

/** What the camera is framing. `cut` jumps there; otherwise it glides. */
type View = { focus?: Rect; maxZoom?: number; fit?: "width"; cut: boolean };
type Pointer = { x: number; y: number; shown: boolean; down: boolean };

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The app scrolls things into view by itself (a new chat message, an opened claim), and the
 * browser then also scrolls the boxes around the frame. Put them back, or the picture shifts.
 */
const holdStill = (e: UIEvent<HTMLElement>) => e.currentTarget.scrollTo(0, 0);

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Puts the demo's saved state where a scene needs it: before or after the bank records the death. */
function prepareWorld(world: FilmWorld, fresh: boolean) {
  const lost = currentBereavement().losses.some((l) => l.personName === tourPeople.husband.name);
  if (world === "before") {
    if (lost || fresh) resetDemo();
    return;
  }
  if (fresh) bereavementActions.resetProgress();
  if (!lost)
    bereavementActions.recordLoss({
      personName: tourPeople.husband.name,
      date: MOCK_AS_OF,
      reportedVia: "Phone call",
      recordedOn: MOCK_AS_OF,
    });
}

/**
 * The product film: the working app runs in a frame on a dark stage, and each
 * shot signs in as the right person, clicks through the real controls and
 * moves a camera over the page. The shot lives in the URL hash; the arrow
 * keys and the buttons step through it, and Play runs it like a film.
 */
export function ProductFilm() {
  const [shotId, setShotId] = useHashTab(shotIds);
  const index = shotIds.indexOf(shotId);
  const shot = filmShots[index];
  const scene = shot.scene ? filmScenes[shot.scene] : undefined;

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [stage, setStage] = useState<Size>({ w: 0, h: 0 });
  const [page, setPage] = useState<{ key: number; src: string } | null>(null);
  const [view, setView] = useState<View>({ cut: true });
  const [ring, setRing] = useState<Rect | null>(null);
  const [pointer, setPointer] = useState<Pointer>({
    x: SCREEN.w / 2,
    y: SCREEN.h / 2,
    shown: false,
    down: false,
  });
  const [dark, setDark] = useState(true);
  const [settled, setSettled] = useState(false);
  const [playing, setPlaying] = useState(false);

  /** Counts the runs, so a run that has been overtaken by a newer shot stops. */
  const run = useRef(0);
  const previous = useRef<number | null>(null);
  const signedIn = useRef<FilmPersona | null>(null);
  const framed = useRef<Rect | undefined>(undefined);
  const pageLoaded = useRef<(() => void) | null>(null);
  /** Whether the shot on screen finished playing (a ref, so a run can read it as it starts). */
  const finished = useRef(false);
  const settle = (done: boolean) => {
    finished.current = done;
    setSettled(done);
  };

  const doc = () => frameRef.current?.contentDocument;
  const go = (n: number) => setShotId(shotIds[Math.min(Math.max(n, 0), shotIds.length - 1)]);

  const show = (next: View) => {
    framed.current = next.focus;
    setView(next);
  };

  /** Loads a page of the app in the frame and waits for it. */
  const load = (path: string) =>
    new Promise<void>((resolve) => {
      pageLoaded.current = resolve;
      setPage((p) => ({ key: (p?.key ?? 0) + 1, src: path }));
      setTimeout(resolve, 15_000);
    });

  /** Goes dark, changes something that must not be seen changing, and comes back. */
  const cutTo = async (change: () => void) => {
    setDark(true);
    await sleep(CUT_MS);
    change();
    await nextFrame();
    await nextFrame();
    setDark(false);
  };

  /** Moves the cursor to an element and presses. */
  const point = async (el: HTMLElement) => {
    const r = rectOf(el);
    setPointer({ x: r.x + r.w / 2, y: r.y + r.h / 2, shown: true, down: false });
    await sleep(650);
    setPointer((p) => ({ ...p, down: true }));
    await sleep(170);
    setPointer((p) => ({ ...p, down: false }));
  };

  /** Runs a shot's actions: played out with the cursor, or instantly when `fast`. */
  const act = async (actions: Action[] | undefined, fast: boolean, alive: () => boolean) => {
    for (const action of actions ?? []) {
      if (!alive()) return;
      if (action.do === "wait") {
        await waitFor(doc, action.for, 12_000);
        continue;
      }
      if (action.do === "look") {
        if (fast) continue;
        const el = await waitFor(doc, action.at);
        if (!el || !alive()) continue;
        const frame = () => {
          setRing(null);
          show({ focus: visiblePart(rectOf(el), SCREEN), maxZoom: 1.5, cut: !inView(el) });
        };
        if (inView(el)) frame();
        else
          await cutTo(() => {
            bringIntoView(el);
            frame();
          });
        await sleep(MOVE_MS);
        continue;
      }
      const el = await waitFor(doc, action.do === "click" ? action.on : action.into);
      if (!alive()) return;
      if (!el) continue;
      if (!fast) {
        bringIntoView(el);
        // Pull back when the control is outside what the camera is showing.
        const r = rectOf(el);
        const f = framed.current;
        const inFrame =
          !f || (r.x >= f.x && r.y >= f.y && r.x + r.w <= f.x + f.w && r.y + r.h <= f.y + f.h);
        if (!inFrame) {
          setRing(null);
          show({ cut: false });
          await sleep(MOVE_MS * 0.7);
        }
        await point(el);
        if (!alive()) return;
      }
      if (action.do === "click") el.click();
      else {
        el.focus();
        if (fast) setValue(el, action.text);
        else
          for (let i = 1; i <= action.text.length; i++) {
            setValue(el, action.text.slice(0, i));
            await sleep(26);
            if (!alive()) return;
          }
      }
      await sleep(fast ? 80 : 450);
    }
  };

  /** Points the camera at what the shot is about. */
  const aim = async (target: FilmShot, cut: boolean, alive: () => boolean) => {
    const d = doc();
    const win = d?.defaultView;
    if (!d || !win) return;
    const apply = (el: HTMLElement | null, jump: boolean) => {
      const page = doc();
      const mark = target.mark && page ? find(page, target.mark) : null;
      setRing(mark ? visiblePart(rectOf(mark), SCREEN) : null);
      show(
        el
          ? {
              focus: visiblePart(rectOf(el), SCREEN),
              maxZoom: target.maxZoom,
              fit: target.fit,
              cut: jump,
            }
          : { cut: jump },
      );
    };
    if (!target.focus) {
      if (cut || win.scrollY === 0) {
        win.scrollTo(0, 0);
        apply(null, cut);
      } else await cutTo(() => (win.scrollTo(0, 0), apply(null, true)));
      return;
    }
    const el = await waitFor(doc, target.focus, 6000);
    if (!alive()) return;
    if (!el) return apply(null, cut);
    if (cut || inView(el)) {
      bringIntoView(el);
      apply(el, cut);
    } else await cutTo(() => (bringIntoView(el), apply(el, true)));
    // Follow the page if it is still settling (late content, an answer being written).
    for (const ms of [400, 900]) {
      await sleep(ms);
      if (!alive() || !el.isConnected) return;
      apply(el, false);
    }
  };

  const play = useEffectEvent(async (from: number | null, to: number, alive: () => boolean) => {
    const target = filmShots[to];
    // Leaving a shot before its actions finished: the page is in an unknown state, so start over.
    const interrupted = from !== null && !finished.current;
    const plan = planShot(filmShots, interrupted ? null : from, to);
    settle(false);
    // The film starts from a clean demo, whatever was left in this browser.
    if (from === null) resetDemo();
    if (plan.kind === "card") {
      await sleep(400);
      if (alive()) settle(true);
      return;
    }
    if (plan.kind === "enter") {
      const next = filmScenes[target.scene!];
      setDark(true);
      setPointer((p) => ({ ...p, shown: false }));
      await sleep(from === null ? 0 : CUT_MS);
      if (!alive()) return;
      prepareWorld(next.world, !plan.animate);
      if (signedIn.current !== next.as) {
        await filmSignIn(next.as);
        if (!alive()) return;
        signedIn.current = next.as;
      }
      await load(next.path);
      if (!alive()) return;
      await waitFor(doc, next.ready, 12_000);
      await doc()?.fonts.ready;
      for (const earlier of plan.replay) {
        if (!alive()) return;
        await act(filmShots[earlier].actions, true, alive);
      }
      if (!alive()) return;
      if (plan.animate && target.actions?.length) {
        // Open on the whole page, then play the actions out.
        doc()?.defaultView?.scrollTo(0, 0);
        setRing(null);
        show({ cut: true });
        await nextFrame();
        setDark(false);
        await sleep(600);
        await act(target.actions, false, alive);
        if (!alive()) return;
        await aim(target, false, alive);
      } else {
        await act(target.actions, true, alive);
        if (!alive()) return;
        await aim(target, true, alive);
        await nextFrame();
        if (alive()) setDark(false);
      }
    } else {
      await act(target.actions, false, alive);
      if (!alive()) return;
      await aim(target, false, alive);
    }
    if (alive()) settle(true);
  });

  useEffect(() => {
    const token = ++run.current;
    const from = previous.current;
    previous.current = index;
    void play(from, index, () => run.current === token);
  }, [index]);

  // Playing: hold each shot, then move on. The film stops at the last shot.
  useEffect(() => {
    if (!playing || !settled) return;
    const last = index === filmShots.length - 1;
    const timer = setTimeout(
      () => (last ? setPlaying(false) : setShotId(shotIds[index + 1])),
      last ? 0 : shot.scene ? HOLD_MS : CARD_HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [playing, settled, index, shot.scene, setShotId]);

  const onKey = useEffectEvent((key: string) => {
    if (key === "ArrowRight") go(index + 1);
    else if (key === "ArrowLeft") go(index - 1);
    else if (key === " ") setPlaying((p) => !p);
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if ((e.target as HTMLElement | null)?.closest("button, a, input, textarea") && e.key === " ")
        return;
      onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Every page the frame loads: tidy it for filming and keep the film's keys working inside it. */
  const onPageLoad = () => {
    const d = doc();
    if (!d?.head) return;
    if (!d.getElementById("film-style")) {
      const style = d.createElement("style");
      style.id = "film-style";
      style.textContent = FILM_STYLE;
      d.head.append(style);
    }
    d.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, button, a")) return;
      // Hand the arrow keys back to the film's own key handler.
      if (e.key === "ArrowRight" || e.key === "ArrowLeft")
        window.dispatchEvent(new KeyboardEvent("keydown", { key: e.key }));
    });
    pageLoaded.current?.();
    pageLoaded.current = null;
  };

  const camera = frameFor(stage, SCREEN, view.focus, { maxZoom: view.maxZoom, fit: view.fit });
  const chapterIndex = filmChapters.findIndex((c) => c.id === shot.chapter);
  const first = index === 0;
  const last = index === filmShots.length - 1;

  return (
    <>
      <div
        data-settled={settled}
        onScroll={holdStill}
        className="hidden h-dvh w-full flex-col overflow-hidden bg-pnc-blue-950 text-white lg:flex"
      >
        <header className="flex h-16 shrink-0 items-center gap-4 bg-pnc-navy px-6">
          <PncLogo tone="light" size="sm" />
          <span className="h-6 w-px bg-white/25" aria-hidden="true" />
          <span className="flex items-center gap-2">
            <FindoeLogo className="size-6" />
            <span className="font-display font-semibold">Findoe</span>
          </span>
          <nav aria-label="Chapters" className="ml-auto h-full">
            <ol className="flex h-full">
              {filmChapters.map((c, i) => (
                <li key={c.id} className="h-full">
                  <button
                    type="button"
                    aria-current={i === chapterIndex ? "step" : undefined}
                    onClick={() => go(filmShots.findIndex((s) => s.chapter === c.id))}
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
          <Link
            href={routes.signOn}
            aria-label="Exit the film"
            className={cn(
              "grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white",
              focusRing,
            )}
          >
            <X className="size-5" aria-hidden="true" />
          </Link>
        </header>

        <div
          ref={stageRef}
          onScroll={holdStill}
          className="relative min-h-0 flex-1 overflow-hidden"
        >
          {stage.w > 0 && (
            <div
              onScroll={holdStill}
              className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-xl bg-white shadow-raised"
              style={{
                width: SCREEN.w,
                height: SCREEN.h,
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                transition: view.cut
                  ? "none"
                  : `transform ${MOVE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
              }}
            >
              {page && (
                <iframe
                  key={page.key}
                  ref={frameRef}
                  src={page.src}
                  title="The working prototype"
                  onLoad={onPageLoad}
                  className="block border-0 bg-white"
                  style={{ width: SCREEN.w, height: SCREEN.h }}
                />
              )}
              {ring && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-lg ring-[3px] ring-pnc-orange motion-safe:animate-reveal"
                  style={{
                    left: ring.x - 6,
                    top: ring.y - 6,
                    width: ring.w + 12,
                    height: ring.h + 12,
                  }}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute left-0 top-0 transition-[transform,opacity] duration-[600ms] ease-out",
                  pointer.shown ? "opacity-100" : "opacity-0",
                )}
                style={{ transform: `translate(${pointer.x}px, ${pointer.y}px)` }}
              >
                <span
                  className={cn(
                    "absolute -left-4 -top-4 size-8 rounded-full bg-pnc-orange/35 transition-transform duration-150",
                    pointer.down ? "scale-100" : "scale-0",
                  )}
                />
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "relative size-7 drop-shadow transition-transform duration-150",
                    pointer.down && "scale-90",
                  )}
                >
                  <path
                    d="M5 3l13.5 8.2-6 1.3 3.6 6.6-2.6 1.4-3.6-6.7-4.3 4.2z"
                    className="fill-pnc-navy stroke-white"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          )}

          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 bg-pnc-blue-950 transition-opacity",
              dark ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${CUT_MS}ms` }}
          />

          {!scene && (
            <div key={shot.id} className="absolute inset-0 isolate flex items-center px-[8%]">
              <FacetBackdrop className="-z-10" />
              <div className="max-w-4xl motion-safe:animate-reveal">
                <h1 className="font-display text-[clamp(2.25rem,4.4vw,4.5rem)] font-medium leading-tight">
                  {shot.title}
                </h1>
                <p className="mt-5 text-[clamp(1.1rem,1.7vw,1.75rem)] text-white/80">{shot.body}</p>
                {last && (
                  <p className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-lg font-semibold">
                    <Link
                      href={routes.signOn}
                      className={cn("rounded underline underline-offset-4", focusRing)}
                    >
                      Open the working prototype
                    </Link>
                    <Link
                      href={routes.tour}
                      className={cn("rounded underline underline-offset-4", focusRing)}
                    >
                      See the presentation
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="flex min-h-24 shrink-0 items-center gap-6 bg-pnc-navy px-6 py-4">
          <div key={shot.id} className="flex min-w-0 flex-1 items-center gap-5" aria-live="polite">
            {scene && (
              <>
                <span className="flex shrink-0 items-center gap-2.5 border-r border-white/20 pr-5">
                  <Avatar person={scene.as} className="size-10" />
                  <span className="text-sm font-semibold">{tourPeople[scene.as].name}</span>
                </span>
                <div className="min-w-0 motion-safe:animate-reveal">
                  <h1 className="font-display text-xl font-medium">{shot.title}</h1>
                  <p className="text-md text-white/75">{shot.body}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={first}
              onClick={() => go(index - 1)}
              className={cn(
                "rounded-full px-5 py-2.5 text-md font-semibold ring-1 ring-white/35 hover:bg-white/10 disabled:opacity-40",
                focusRing,
              )}
            >
              Back
            </button>
            <button
              type="button"
              aria-pressed={playing}
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => setPlaying((p) => !p)}
              className={cn(
                "grid size-11 place-items-center rounded-full ring-1 ring-white/35 hover:bg-white/10",
                focusRing,
              )}
            >
              {playing ? (
                <Pause className="size-5" aria-hidden="true" />
              ) : (
                <Play className="size-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => go(last ? 0 : index + 1)}
              className={cn(
                "rounded-full bg-pnc-orange px-7 py-2.5 text-md font-semibold hover:bg-pnc-orange-600",
                focusRing,
              )}
            >
              {last ? "Start again" : first ? "Start" : "Next"}
            </button>
            <p
              className="ml-3 w-14 text-right text-sm tabular-nums text-white/70"
              aria-label={`Shot ${index + 1} of ${filmShots.length}`}
            >
              {index + 1} / {filmShots.length}
            </p>
          </div>
        </footer>
      </div>

      <div className="flex min-h-dvh flex-col items-start justify-center gap-4 bg-pnc-navy p-8 text-white lg:hidden">
        <FindoeLogo className="size-10" />
        <h1 className="font-display text-2xl font-medium">The film needs a wider screen</h1>
        <p className="text-white/80">
          It shows the laptop version of the software. Open it on a laptop, or see the presentation
          here.
        </p>
        <Link
          href={routes.tour}
          className={cn("rounded text-lg font-semibold underline underline-offset-4", focusRing)}
        >
          See the presentation
        </Link>
      </div>
    </>
  );
}
