"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { tourGlow, tourPeople } from "@/data/tour";
import { cn } from "@/lib/format";
import type { FrameId, PageId, Rect, TourState } from "@/lib/tour";
import {
  AdvClientPage,
  AdvHomePage,
  AlertPage,
  ClosedPage,
  CondolencePage,
} from "./screens/advisor";
import {
  AdminPage,
  AssetsPage,
  ClaimPage,
  FamilyPage,
  HowToPage,
  KidPage,
  SignInPage,
  UnclaimedPage,
  type PageProps,
} from "./screens/customer";

const pages: Record<PageId, ComponentType<PageProps>> = {
  signin: SignInPage,
  assets: AssetsPage,
  family: FamilyPage,
  admin: AdminPage,
  kid: KidPage,
  closed: ClosedPage,
  condolence: CondolencePage,
  alert: AlertPage,
  advHome: AdvHomePage,
  advClient: AdvClientPage,
  unclaimed: UnclaimedPage,
  claim: ClaimPage,
  howto: HowToPage,
};

const GLIDE = 1150;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Where something marked `data-tour` sits on its page, in the page's own pixels. */
function rectOf(page: HTMLElement, id: string): Rect | null {
  const el = page.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  if (!el) return null;
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = el; node && node !== page;) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * One person's screen on the stage. It glides to wherever its slot is, wears
 * that person's glow and name, and shows one page at a time, scaled to fit
 * its width. When the page changes the old one fades under the new one; if
 * the screen is also on the move, the old page travels with it first and the
 * new one arrives as it settles.
 */
export function Frame({
  id,
  s,
  beat,
  rect,
  lw,
  stageKey,
}: {
  id: FrameId;
  s: TourState;
  /** The beat being shown; pointers and the camera re-measure when it changes. */
  beat: number;
  /** Where the frame's slot is on the stage, in pixels. */
  rect: Rect;
  /** How wide the page is laid out, in pixels, before scaling to the slot. */
  lw: number;
  /** Changes when the stage is resized, so the frame snaps rather than glides. */
  stageKey: string;
}) {
  const f = s.frames[id];
  const box = useRef<HTMLDivElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const movePointer = useCallback((x: number, y: number) => {
    if (pointer.current) pointer.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);
  const at = useRef<Rect | null>(null);
  const last = useRef({ shown: false, stageKey: "" });
  const lh = rect.h / (rect.w / lw);

  // Glide to the slot. A hidden frame, or a resized stage, moves at once.
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const apply = (r: Rect) => {
      at.current = r;
      node.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
      node.style.width = `${r.w}px`;
      node.style.height = `${r.h}px`;
      node.style.setProperty("--fw", String(r.w));
    };
    const to = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    const from = at.current;
    const jump = !from || !last.current.shown || last.current.stageKey !== stageKey;
    last.current = { shown: f.shown, stageKey };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || jump || still || document.hidden) {
      apply(to);
      return;
    }
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const t = clamp((now - start) / GLIDE, 0, 1);
      const e = easeInOut(t);
      apply({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
        h: from.h + (to.h - from.h) * e,
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    });
    // If the browser held frames back (a hidden tab), still arrive.
    const settle = setTimeout(() => apply(to), GLIDE + 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [rect.x, rect.y, rect.w, rect.h, f.shown, stageKey]);

  // The page on show, and any page still fading out beneath it.
  const pageKey = `${f.page}@${lw}`;
  const [layers, setLayers] = useState({
    key: pageKey,
    n: 0,
    s,
    page: f.page,
    lw,
    lh,
    glide: false,
    leaving: [] as {
      n: number;
      s: TourState;
      page: PageId;
      lw: number;
      lh: number;
      glide: boolean;
    }[],
  });
  if (layers.key !== pageKey) {
    const { n, s: was, page, lw: wasLw, lh: wasLh, leaving } = layers;
    // A screen that changes page while it moves across the stage swaps pages late in the move.
    const before = was.frames[id];
    const glide = before.shown && f.shown && before.slot !== f.slot;
    setLayers({
      key: pageKey,
      n: n + 1,
      s,
      page: f.page,
      lw,
      lh,
      glide,
      leaving: [...leaving, { n, s: was, page, lw: wasLw, lh: wasLh, glide }],
    });
  } else if (layers.s !== s || layers.lh !== lh) {
    setLayers({ ...layers, s, lh });
  }
  const leavingCount = layers.leaving.length;
  useEffect(() => {
    if (!leavingCount) return;
    const timer = setTimeout(
      () => setLayers((l) => ({ ...l, leaving: [] })),
      layers.glide ? 1300 : 700,
    );
    return () => clearTimeout(timer);
  }, [leavingCount, layers.n, layers.glide]);

  const [glow, glow2] = tourGlow[id];
  const person = tourPeople[id];
  const narrow = f.slot.startsWith("third");
  const dim = s.ended ? 0.1 : s.spot !== null && s.spot !== id ? 0.22 : 1;

  return (
    <div
      ref={box}
      aria-hidden={!f.shown}
      className="absolute left-0 top-0 transition-opacity duration-700 ease-out"
      style={
        {
          opacity: f.shown ? dim : 0,
          zIndex: id === "husband" ? 3 : 2,
          "--glow": glow,
          "--glow-2": glow2,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-700 ease-out",
          !f.shown && "translate-y-3 scale-[0.975]",
        )}
      >
        <div
          className={cn(
            "transition-opacity duration-[900ms]",
            f.border ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="tour-halo" />
          <div className="tour-ring" />
          <p className="absolute bottom-full left-2 mb-3 flex items-center gap-2 whitespace-nowrap rounded-full bg-white/[0.07] py-1 pl-2.5 pr-3 text-[0.8125rem] font-semibold text-white ring-1 ring-white/15">
            <span
              className="size-2 rounded-full"
              style={{ background: glow, boxShadow: `0 0 10px ${glow}` }}
            />
            {person.name}
            {!narrow && <span className="font-normal text-white/55">{person.role}</span>}
          </p>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)]">
          {layers.leaving.map((l) => (
            <Screen
              key={l.n}
              id={id}
              page={l.page}
              s={l.s}
              lw={l.lw}
              lh={l.lh}
              beat={beat}
              glide={l.glide}
            />
          ))}
          <Screen
            key={layers.n}
            id={id}
            page={f.page}
            s={s}
            lw={lw}
            lh={lh}
            beat={beat}
            glide={layers.glide}
            onPoint={movePointer}
          />
        </div>

        {/* The person's pointer rides above the screen, so its name is never cut off at an edge. */}
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: lw, height: lh, transform: `scale(calc(var(--fw) / ${lw}))` }}
        >
          <div
            ref={pointer}
            className="absolute left-0 top-0 transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.3,0.7,0.2,1)]"
            style={{
              opacity: f.cursor ? 1 : 0,
              transform: `translate(${lw * 0.56}px, ${lh * 0.72}px)`,
            }}
          >
            {f.clicks > 0 && (
              <span
                key={f.clicks}
                className="tour-ripple absolute left-0 top-0 size-16 rounded-full border-2"
                style={{
                  borderColor: glow,
                  background: `color-mix(in srgb, ${glow} 22%, transparent)`,
                }}
              />
            )}
            <span
              key={`pointer-${f.clicks}`}
              className={cn("block origin-top-left", f.clicks > 0 && "tour-press")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="drop-shadow-md"
                aria-hidden="true"
              >
                <path
                  d="M4 2.5v16.8l4.7-4.2 3 6.6 2.9-1.3-3-6.5 6.3-.3z"
                  fill={glow}
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="absolute left-5 top-5 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-bold text-pnc-navy shadow-card"
                style={{ background: glow }}
              >
                {person.first}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A page inside a frame, with the camera that can close in on part of it. The
 * page on show also places the person's pointer. Both are placed by measuring
 * the page, so they follow whatever the page lays out.
 */
function Screen({
  id,
  page,
  s,
  lw,
  lh,
  beat,
  glide,
  onPoint,
}: {
  id: FrameId;
  page: PageId;
  s: TourState;
  lw: number;
  lh: number;
  beat: number;
  /** The frame was moving when this page changed, so the swap waits for it. */
  glide: boolean;
  /**
   * Moves the frame's pointer, in this page's own pixels. Given only to the page on show; a
   * page that is fading out keeps the camera it had.
   */
  onPoint?: (x: number, y: number) => void;
}) {
  const live = onPoint !== undefined;
  const f = s.frames[id];
  const root = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!live) return;
    const place = () => {
      const el = root.current;
      if (!el || !camera.current) return;
      let z = 1;
      let tx = 0;
      let ty = 0;
      const target = f.zoom ? rectOf(el, f.zoom) : null;
      if (target) {
        const margin = 28;
        z = clamp(Math.min(lw / (target.w + margin * 2), lh / (target.h + margin * 2)), 1, 1.75);
        tx = clamp(lw / 2 - (target.x + target.w / 2) * z, lw - lw * z, 0);
        ty = clamp(lh / 2 - (target.y + target.h / 2) * z, lh - lh * z, 0);
      }
      camera.current.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;

      // The pointer sits outside the camera, so it follows where the camera puts its target.
      const on = f.cursor ? rectOf(el, f.cursor) : null;
      if (on && onPoint) {
        const start = el.querySelector<HTMLElement>(`[data-tour="${f.cursor}"]`)?.dataset.anchor;
        const x = start === "start" ? on.x + Math.min(48, on.w * 0.2) : on.x + on.w / 2;
        const y = on.y + on.h / 2;
        onPoint(tx + x * z, ty + y * z);
      }
    };
    place();
    // Again once what the beat opened or closed has settled.
    const timers = [340, 780].map((ms) => setTimeout(place, ms));
    return () => timers.forEach(clearTimeout);
  }, [live, onPoint, beat, f.zoom, f.cursor, lw, lh]);

  const Page = pages[page];
  return (
    <div
      className={cn(
        "tour-screen absolute left-0 top-0 origin-top-left text-pnc-ink",
        live ? "tour-page-in" : "tour-page-out",
        glide && "tour-page-glide",
      )}
      style={{ width: lw, height: lh, transform: `scale(calc(var(--fw) / ${lw}))` }}
    >
      <div
        ref={camera}
        className="size-full origin-top-left transition-transform duration-[1200ms] ease-[cubic-bezier(0.6,0,0.2,1)]"
      >
        <div ref={root} className="relative size-full overflow-hidden">
          <Page who={id} s={s} />
        </div>
      </div>
    </div>
  );
}
