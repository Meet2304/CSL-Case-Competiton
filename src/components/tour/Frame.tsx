"use client";

import type { UIEvent } from "react";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { tourGlow, tourPeople } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import { cameraFor, viewportFor, type FrameId, type SlotId } from "@/lib/tour";

/** How long a card takes to move to another place on the stage. */
export const GLIDE_MS = 1000;
/** How long a card's camera takes to move. */
export const MOVE_MS = 900;
/** How long a card takes to go white, or come back, when its page is replaced. */
export const VEIL_MS = 320;

export type Pointer = { x: number; y: number; shown: boolean; down: boolean };

/** Everything about one person's card that the player changes as the tour plays. */
export type FrameView = {
  shown: boolean;
  slot: SlotId;
  /** The width the page is laid out at, in pixels. */
  width: number;
  /** The page in the card; a new key loads it afresh. */
  page: { key: number; src: string } | null;
  /** White over the page, while it loads or is put in place. */
  veil: boolean;
  /** Move to the slot rather than appear there. */
  glide: boolean;
  /** What the camera frames, in page pixels; the whole page when missing. */
  focus?: Rect;
  maxZoom?: number;
  fit?: "width";
  /** Fade everything but `focus` back, so only it stays clear. */
  spot?: boolean;
  /** Jump the camera rather than move it. */
  cut: boolean;
  pointer: Pointer;
  /** The person has died: the color drains from their screen and its glow goes out. */
  quiet: boolean;
  /** Another screen is picked out, so this one fades back. */
  dim: boolean;
  /** How long after the stop starts the card fades in, so several can arrive one by one. */
  delay: number;
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
  rect,
  years,
  register,
  onLoad,
}: {
  id: FrameId;
  view: FrameView;
  /** Where the card's slot is on the stage, in pixels. */
  rect: Rect;
  /** The years the person lived, shown beside their name once their screen falls quiet. */
  years?: string;
  register: (id: FrameId, el: HTMLIFrameElement | null) => void;
  onLoad: (id: FrameId) => void;
}) {
  const person = tourPeople[id];
  const page = viewportFor(rect, view.width);
  const scale = rect.w / page.w;
  const camera = cameraFor(page, view.focus, { maxZoom: view.maxZoom, fit: view.fit });
  const glide = view.glide ? `${GLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)` : "0ms";

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
          transform: view.dim ? "scale(0.97)" : "none",
          transition: `left ${glide}, top ${glide}, width ${glide}, height ${glide}, opacity 700ms ease ${view.shown && !view.dim ? view.delay : 0}ms, transform 700ms ease`,
          "--glow": tourGlow[id],
        } as React.CSSProperties
      }
    >
      <p className="tour-name absolute bottom-full left-0.5 mb-3 flex items-center gap-2.5 whitespace-nowrap">
        <PersonAvatar seed={person.id} look={person.look} className="size-7" />
        <span className="font-display text-[0.9375rem] font-semibold text-pnc-navy">
          {person.name}
        </span>
        <span className="text-sm text-pnc-muted">{view.quiet && years ? years : person.role}</span>
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
          <div
            className="size-full origin-top-left"
            style={{
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
              transition: view.cut
                ? "none"
                : `transform ${MOVE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
            }}
          >
            {view.page && (
              <iframe
                key={view.page.key}
                ref={(el) => register(id, el)}
                src={view.page.src}
                title={`${person.name}'s screen`}
                tabIndex={-1}
                onLoad={() => onLoad(id)}
                className="pointer-events-none block border-0 bg-white"
                style={{ width: page.w, height: page.h }}
              />
            )}
            {/* The spotlight: the rest of the page washes back to white around what matters. */}
            <span
              aria-hidden="true"
              className="tour-spot pointer-events-none absolute"
              style={
                view.focus
                  ? {
                      left: view.focus.x - 10,
                      top: view.focus.y - 10,
                      width: view.focus.w + 20,
                      height: view.focus.h + 20,
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white transition-opacity ease-out"
          style={{ opacity: view.veil ? 1 : 0, transitionDuration: `${VEIL_MS}ms` }}
        />
      </div>
    </div>
  );
}
