"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { closing, lines } from "@/data/story";
import { cn } from "@/lib/format";
import {
  PLATE,
  WORLD,
  fit,
  flightTime,
  fly,
  lastStop,
  nextStop,
  plateIds,
  plateLit,
  plateOrigin,
  previousStop,
  stopFromHash,
  stopIndex,
  stops,
  threadLegs,
  viewOf,
  type PlateId,
  type Rect,
} from "@/lib/story";
import { type PlateProps } from "./parts";
import { JohnPlate, PreparePlate, WillPlate } from "./plates/before";
import { AdvisorPlate, EstatePlate } from "./plates/bank";
import { FamilyPlate } from "./plates/family";
import { KidsPlate, MayaPlate } from "./plates/after";
import { SharedPlate } from "./plates/shared";

const plates: Record<PlateId, ComponentType<PlateProps>> = {
  family: FamilyPlate,
  john: JohnPlate,
  prepare: PreparePlate,
  will: WillPlate,
  shared: SharedPlate,
  advisor: AdvisorPlate,
  estate: EstatePlate,
  maya: MayaPlate,
  kids: KidsPlate,
};

// The window's size is read from the browser rather than kept in state.
function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;
const noSize = () => "";

/** Height kept clear under the camera for the story's one line of words. */
const bandFor = (H: number) => Math.round(Math.min(120, Math.max(64, H * 0.12)));

/** Where something marked `data-focus` sits on its plate, in the plate's own units. */
function measureIn(world: HTMLElement) {
  return (plate: PlateId, focus: string): Rect | null => {
    const root = world.querySelector<HTMLElement>(`[data-plate="${plate}"]`);
    const el = root?.querySelector<HTMLElement>(`[data-focus="${focus}"]`);
    if (!root || !el) return null;
    let x = 0;
    let y = 0;
    for (let node: HTMLElement | null = el; node && node !== root;) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
}

/**
 * The product story: one light canvas of the Smith family's life with
 * Findoe, which a camera travels over one key press at a time. → or space
 * moves on, ← steps back, Home and End jump to either end, F fills the
 * screen. Nothing moves by itself. The current stop is kept in the URL.
 */
export function ProductStory() {
  const [at, setAt] = useState(0);
  const size = useSyncExternalStore(subscribe, readSize, noSize);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<Rect | null>(null);
  const lastSize = useRef("");

  const forward = useCallback(() => setAt(nextStop), []);
  const back = useCallback(() => setAt(previousStop), []);

  // Open at the stop named in the URL, and follow the URL when its hash is edited; either way the
  // camera cuts straight there. The hash is read once, before the first stop rewrites the URL, and
  // on a timer rather than an animation frame, which a background tab may never deliver.
  const opened = useRef(false);
  const cut = useRef(false);
  useEffect(() => {
    const follow = () => {
      cut.current = true;
      setAt(stopFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", follow);
    if (!opened.current) {
      opened.current = true;
      const first = stopFromHash(window.location.hash);
      if (first)
        setTimeout(() => {
          cut.current = true;
          setAt(first);
        }, 0);
    }
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  useEffect(() => {
    window.history.replaceState(
      null,
      "",
      at ? `#${stops[at].id}` : window.location.pathname + window.location.search,
    );
  }, [at]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A held key counts once: every step of the story is its own press.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter")
        forward();
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") back();
      else if (k === "Home") setAt(0);
      else if (k === "End") setAt(lastStop);
      else if (k === "f" || k === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.().catch(() => {});
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forward, back]);

  // The camera: glide from wherever it is to the view of this stop.
  useLayoutEffect(() => {
    const node = world.current;
    if (!node || !size) return;
    const [W, H] = size.split("x").map(Number);
    const band = bandFor(H);
    const target = viewOf(at, measureIn(node));
    const apply = (v: Rect) => {
      camera.current = v;
      const f = fit(v, W, H - band);
      node.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) scale(${f.scale})`;
    };
    const from = camera.current;
    const resized = lastSize.current !== size;
    lastSize.current = size;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const jump = cut.current;
    cut.current = false;
    if (!from || resized || still || jump || document.hidden) {
      apply(target);
      return;
    }
    const ms = flightTime(from, target);
    const start = performance.now();
    node.style.willChange = "transform";
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      apply(fly(from, target, t));
      if (t < 1) raf = requestAnimationFrame(tick);
      // Let the browser draw the canvas sharply again once it is still.
      else node.style.willChange = "";
    });
    return () => {
      cancelAnimationFrame(raf);
      node.style.willChange = "";
    };
  }, [at, size]);

  const stop = stops[at];
  const line = lines[stop.id];
  const ended = at >= stopIndex("close");
  const H = size ? Number(size.split("x")[1]) : 800;

  return (
    <div className="story-stage fixed inset-0 overflow-hidden text-pnc-ink">
      <h1 className="sr-only">Findoe, a product story</h1>
      {size && (
        <div
          ref={world}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: WORLD.w, height: WORLD.h }}
        >
          <div
            className="story-ease absolute inset-0"
            style={{ opacity: ended ? 0.1 : 1, filter: ended ? "blur(3px)" : "none" }}
          >
            <Thread at={at} />
            {plateIds.map((id) => {
              const Plate = plates[id];
              const o = plateOrigin(id);
              const lit = plateLit(id, at);
              return (
                <section
                  key={id}
                  data-plate={id}
                  data-lit={lit}
                  aria-hidden={!lit}
                  className="story-plate absolute"
                  style={{ left: o.x, top: o.y, width: PLATE.w, height: PLATE.h }}
                >
                  <Plate at={at} />
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* The story's one line of words, under the picture. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 grid place-items-center px-6"
        style={{ height: bandFor(H) }}
      >
        {line && (
          <p
            key={stop.id}
            aria-live="polite"
            className="story-line text-balance text-center font-display text-[clamp(1.05rem,1.7vw,1.75rem)] font-medium text-pnc-navy"
          >
            {line}
          </p>
        )}
      </div>

      {/* The close. */}
      <div
        aria-hidden={!ended}
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-1000",
          ended ? "opacity-100 delay-700" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex flex-col items-center rounded-full bg-[radial-gradient(closest-side,white,transparent)] px-[12vw] py-[10vh] text-center">
          <FindoeLogo className="size-[clamp(3.5rem,6vw,5.5rem)]" />
          <p className="mt-8 font-display text-[clamp(2.2rem,5vw,4.6rem)] font-semibold leading-tight tracking-tight text-pnc-navy">
            {closing.line}
          </p>
          <PrivateBankLogo tone="dark" size="sm" product={false} className="mt-10" />
          <p className="mt-6 text-[0.8125rem] text-pnc-muted">{closing.mock}</p>
        </div>
      </div>

      {/* Where the story is: a hairline along the bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-pnc-navy/[0.06]">
        <div
          className="h-full origin-left bg-pnc-orange/70 transition-transform duration-700 ease-out"
          style={{ transform: `scaleX(${at / lastStop})` }}
        />
      </div>

      {/* The first stop waits for the first press. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-[clamp(2rem,6vh,4rem)] left-1/2 -translate-x-1/2 transition-opacity duration-700",
          at === 0 ? "opacity-100 delay-[1600ms]" : "opacity-0",
        )}
      >
        <span className="story-nudge block text-[1.5rem] text-pnc-navy/40">→</span>
      </div>
    </div>
  );
}

/** The line that runs from plate to plate as the story reaches each one, and closes the circle. */
function Thread({ at }: { at: number }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={WORLD.w}
      height={WORLD.h}
    >
      {threadLegs.map((leg, i) => (
        <path
          key={i}
          d={leg.d}
          pathLength={1}
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="story-thread stroke-pnc-orange/55"
          strokeWidth={2.5}
          data-on={at >= stopIndex(leg.from)}
        />
      ))}
    </svg>
  );
}
