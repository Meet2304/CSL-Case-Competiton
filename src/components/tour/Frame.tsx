"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { tourGlow, tourPeople } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import { cameraFor, viewportFor, type FrameId, type SlotId } from "@/lib/tour";

/** How long a card takes to move to another place on the stage. */
export const GLIDE_MS = 1000;
/** How long a card's camera takes to move. */
export const MOVE_MS = 900;
/** How long a new page takes to fade in over the one it replaces. */
export const VEIL_MS = 320;
/** How long a card takes to fade back, or forward, when another one is picked out. */
export const DIM_MS = 360;

export type Pointer = { x: number; y: number; shown: boolean; down: boolean };

/** The same curve as the camera's, cubic-bezier(0.65, 0, 0.35, 1), near enough. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Placed = { rect: Rect; width: number };

/**
 * Where a card is drawn while it glides to a new place: its box and the width
 * its page is laid out at move together, frame by frame, the way a window
 * being resized reflows its page, so the page always fills the card.
 */
function useGlide(rect: Rect, width: number, glide: boolean): Placed {
  const [moving, setMoving] = useState<Placed | null>(null);
  const shown = moving ?? { rect, width };
  const last = useRef(shown);
  // Reads where the card was drawn before this change; the effect after it then records where it is now.
  useEffect(() => {
    const start = last.current;
    const same =
      start.width === width &&
      start.rect.x === rect.x &&
      start.rect.y === rect.y &&
      start.rect.w === rect.w &&
      start.rect.h === rect.h;
    if (same) return;
    let frame = 0;
    if (!glide) {
      frame = requestAnimationFrame(() => setMoving(null));
      return () => cancelAnimationFrame(frame);
    }
    const t0 = performance.now();
    const lerp = (a: number, b: number, e: number) => a + (b - a) * e;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / GLIDE_MS);
      const e = easeInOut(t);
      if (t >= 1) return setMoving(null);
      setMoving({
        rect: {
          x: lerp(start.rect.x, rect.x, e),
          y: lerp(start.rect.y, rect.y, e),
          w: lerp(start.rect.w, rect.w, e),
          h: lerp(start.rect.h, rect.h, e),
        },
        width: Math.round(lerp(start.width, width, e)),
      });
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rect.x, rect.y, rect.w, rect.h, width, glide]);
  useEffect(() => {
    last.current = shown;
  });
  return shown;
}

/** Everything about one person's card that the player changes as the tour plays. */
export type FrameView = {
  shown: boolean;
  slot: SlotId;
  /** The width the page is laid out at, in pixels. */
  width: number;
  /** The page in the card; a new key loads it afresh. */
  page: { key: number; src: string } | null;
  /**
   * The page it replaces, kept on screen exactly as it was (its width and
   * camera) until the new one is ready, so the card never goes blank.
   */
  old?: { key: number; src: string; width: number; transform: string };
  /**
   * Still copies of the page as it looked (its width, camera and scroll),
   * held over the live page while steps run beneath them out of sight, the
   * last one drawn on top. A copy's `hole` (in page pixels) lets that part of
   * the live page show through. They fade away (`fading`) to show where the
   * steps ended.
   */
  covers?: {
    key: number;
    html: string;
    width: number;
    transform: string;
    scroll: { x: number; y: number };
    hole?: Rect;
    fading: boolean;
  }[];
  /** The new page is still loading: it is hidden, over the old one (or white if none). */
  veil: boolean;
  /** Move to the slot rather than appear there. */
  glide: boolean;
  /** What the camera frames, in page pixels; the whole page when missing. */
  focus?: Rect;
  maxZoom?: number;
  fit?: "width";
  /** Fade everything but `focus` back, so only it stays clear. */
  spot?: boolean;
  /** Room around `focus` inside the spotlight, in page pixels. */
  pad?: number;
  /** Jump the camera rather than move it. */
  cut: boolean;
  pointer: Pointer;
  /** The person has died: the color drains from their screen and its glow goes out. */
  quiet: boolean;
  /** Another screen is picked out, so this one fades back. */
  dim: boolean;
  /** How long after the stop starts the card fades in, so several can arrive one by one. */
  delay: number;
  /** Where the card comes from when it appears: up from below, or in from the right. */
  from?: "below" | "right";
};

export const hiddenFrame: FrameView = {
  shown: false,
  slot: "solo",
  width: 1280,
  page: null,
  veil: true,
  glide: false,
  cut: true,
  pointer: { x: 640, y: 360, shown: false, down: false },
  quiet: false,
  dim: false,
  delay: 0,
};

/**
 * The app scrolls things into view by itself (a new chat message, an opened claim), and the
 * browser then also scrolls the boxes around the frame. Put them back, or the picture shifts.
 */
const holdStill = (e: UIEvent<HTMLElement>) => e.currentTarget.scrollTo(0, 0);

/**
 * One person's screen on the stage: a white card holding the working app,
 * signed in as them, with their color glowing softly behind it and their name
 * above it. The page is laid out at a fixed width and scaled to the card; a
 * camera inside the card can close in on part of it, and a pointer shows
 * where they click.
 */
export function Frame({
  id,
  view,
  rect: slot,
  register,
  onLoad,
  onCover,
}: {
  id: FrameId;
  view: FrameView;
  /** Where the card's slot is on the stage, in pixels. */
  rect: Rect;
  register: (id: FrameId, el: HTMLIFrameElement | null) => void;
  onLoad: (id: FrameId) => void;
  /** The still copy over the page is drawn. */
  onCover: (id: FrameId) => void;
}) {
  const person = tourPeople[id];
  const { rect, width } = useGlide(slot, view.width, view.glide);
  const page = viewportFor(rect, width);
  const scale = rect.w / page.w;
  const camera = cameraFor(page, view.focus, { maxZoom: view.maxZoom, fit: view.fit });
  const cameraTransform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
  const cameraMove = view.cut ? "none" : `transform ${MOVE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
  const away = view.from === "right" ? "translateX(72px)" : "translateY(18px)";
  const pages = [view.old, view.page].filter((p) => p !== null && p !== undefined);

  return (
    <div
      aria-hidden={!view.shown}
      data-quiet={view.quiet}
      className="tour-frame absolute"
      style={
        {
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          opacity: view.shown ? (view.dim ? 0.28 : 1) : 0,
          transform: !view.shown ? away : view.dim ? "scale(0.97)" : "none",
          // Arriving takes its time (and may wait its turn); fading back and forward is quick.
          // The card's place is moved frame by frame (useGlide); only its presence is a transition.
          transition: view.dim
            ? `opacity ${DIM_MS}ms ease, transform ${DIM_MS}ms ease`
            : `opacity ${view.shown ? 600 : 450}ms ease ${view.shown ? view.delay : 0}ms, transform ${view.shown ? 700 : 450}ms cubic-bezier(0.22, 0.8, 0.3, 1) ${view.shown ? view.delay : 0}ms`,
          "--glow": tourGlow[id],
        } as React.CSSProperties
      }
    >
      <p className="tour-name absolute bottom-full left-0.5 mb-3 flex items-center gap-2.5 whitespace-nowrap">
        <PersonAvatar seed={person.id} look={person.look} className="size-7" />
        <span className="font-display text-[0.9375rem] font-semibold text-pnc-navy">
          {person.name}
        </span>
        <span className="text-sm text-pnc-muted">{person.role}</span>
      </p>

      <div className="tour-glow" />

      <div
        onScroll={holdStill}
        className="tour-card absolute inset-0 overflow-hidden rounded-[1.125rem] bg-white"
      >
        <div
          onScroll={holdStill}
          className="tour-page absolute left-0 top-0 origin-top-left overflow-hidden"
          style={{ width: page.w, height: page.h, transform: `scale(${scale})` }}
        >
          {/*
            Each page sits in its own layer, the new one over the old. A page keeps its layer
            for as long as it is on screen (moving an iframe would reload it).
          */}
          {pages.map((p) => {
            const current = p.key === view.page?.key;
            const w = current ? page.w : (p as NonNullable<FrameView["old"]>).width;
            return (
              <div
                key={p.key}
                className="absolute left-0 top-0 size-full origin-top-left"
                style={{
                  transform: current
                    ? cameraTransform
                    : `scale(${page.w / w}) ${(p as NonNullable<FrameView["old"]>).transform}`,
                  transition: current
                    ? `${cameraMove === "none" ? "" : `${cameraMove}, `}opacity ${VEIL_MS}ms ease-out`
                    : "none",
                  opacity: current && view.veil ? 0 : 1,
                }}
              >
                <iframe
                  ref={current ? (el) => register(id, el) : undefined}
                  src={p.src}
                  title={`${person.name}'s screen`}
                  tabIndex={-1}
                  onLoad={current ? () => onLoad(id) : undefined}
                  className="pointer-events-none block border-0 bg-white"
                  style={{ width: w, height: Math.round((page.h * w) / page.w) }}
                />
              </div>
            );
          })}
          {view.covers?.map((c) => {
            const h = Math.round((page.h * c.width) / page.w);
            const hole = c.hole;
            return (
              <div
                key={`cover-${c.key}`}
                className="absolute left-0 top-0 size-full origin-top-left"
                style={{
                  transform: `scale(${page.w / c.width}) ${c.transform}`,
                  opacity: c.fading ? 0 : 1,
                  transition: `opacity ${VEIL_MS}ms ease-out`,
                }}
              >
                <iframe
                  srcDoc={c.html}
                  title={`${person.name}'s screen`}
                  tabIndex={-1}
                  aria-hidden="true"
                  onLoad={async (e) => {
                    const win = e.currentTarget.contentWindow;
                    win?.scrollTo(c.scroll.x, c.scroll.y);
                    await win?.document.fonts.ready;
                    onCover(id);
                  }}
                  className="pointer-events-none block border-0 bg-white"
                  style={{
                    width: c.width,
                    height: h,
                    clipPath: hole
                      ? `path(evenodd, "M0 0H${c.width}V${h}H0Z M${hole.x} ${hole.y}h${hole.w}v${hole.h}h${-hole.w}Z")`
                      : undefined,
                  }}
                />
              </div>
            );
          })}
          <div
            className="pointer-events-none absolute left-0 top-0 size-full origin-top-left"
            style={{ transform: cameraTransform, transition: cameraMove }}
          >
            {/* The spotlight: the rest of the page washes back to white around what matters. */}
            <span
              aria-hidden="true"
              className="tour-spot pointer-events-none absolute"
              style={
                view.focus
                  ? {
                      left: view.focus.x - (view.pad ?? 10),
                      top: view.focus.y - (view.pad ?? 10),
                      width: view.focus.w + (view.pad ?? 10) * 2,
                      height: view.focus.h + (view.pad ?? 10) * 2,
                      opacity: view.spot ? 1 : 0,
                      transitionDuration: view.cut ? "0ms" : undefined,
                    }
                  : { left: 0, top: 0, width: page.w, height: page.h, opacity: 0 }
              }
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-0 top-0 transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.3,0.7,0.2,1)]",
                view.pointer.shown ? "opacity-100" : "opacity-0",
              )}
              style={{ transform: `translate(${view.pointer.x}px, ${view.pointer.y}px)` }}
            >
              {/* Drawn at one size on the stage, however far the page is scaled or zoomed. */}
              <span
                className="absolute left-0 top-0 block origin-top-left"
                style={{ transform: `scale(${1 / (scale * camera.scale)})` }}
              >
                <span
                  className={cn(
                    "tour-press absolute -left-5 -top-5 size-10 rounded-full transition-[transform,opacity] duration-200",
                    view.pointer.down ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "relative size-7 drop-shadow-md transition-transform duration-150",
                    view.pointer.down && "scale-90",
                  )}
                >
                  <path
                    d="M5 3l13.5 8.2-6 1.3 3.6 6.6-2.6 1.4-3.6-6.7-4.3 4.2z"
                    className="fill-pnc-navy stroke-white"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                {/* Whose hand it is. */}
                <span className="tour-hand absolute left-5 top-6 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-white">
                  {person.first}
                </span>
              </span>
            </span>
          </div>
        </div>
        {/* White only while a card has no page to show yet. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white transition-opacity ease-out"
          style={{
            opacity: view.veil && !view.old ? 1 : 0,
            transitionDuration: `${VEIL_MS}ms`,
          }}
        />
      </div>
    </div>
  );
}
