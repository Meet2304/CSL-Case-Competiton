"use client";

import type { ReactNode } from "react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { Money } from "@/components/ui/Money";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { carried, familyIds, tourGlow, tourLoss, tourPeople } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import type { FrameId, TourCast } from "@/lib/tour";

/** The moments are drawn in a box of this size, then scaled to the stage. */
const BOX = { w: 1100, h: 620 };
const ROW_Y = 330;
const ROW_LOW = 400;

type Place = { x: number; y: number; scale: number; opacity: number };

/** Where each person stands, and how present they are, in each moment. */
function places(cast: TourCast): Record<FrameId, Place> {
  const at = (x: number, y = ROW_Y, scale = 1, opacity = 1): Place => ({ x, y, scale, opacity });
  const four = [325, 475, 625, 775];
  const withAdvisor = [215, 365, 515, 665];
  const out = {} as Record<FrameId, Place>;
  const family = (xs: number[], y: number, opacity = 1) =>
    familyIds.forEach((id, i) => (out[id] = at(xs[i], y, 1, opacity)));
  switch (cast) {
    case "title":
      family(four, ROW_LOW + 40, 0);
      out.advisor = at(900, ROW_LOW + 40, 1, 0);
      break;
    case "family":
      family(four, ROW_Y);
      out.advisor = at(900, ROW_Y, 1, 0);
      break;
    case "carries":
      family([325, 475, 625, 775], ROW_Y + 30, 0);
      out.husband = at(550, ROW_Y, 1.25);
      out.advisor = at(900, ROW_Y, 1, 0);
      break;
    case "advisor":
      family(withAdvisor, ROW_Y);
      out.advisor = at(885, ROW_Y);
      break;
    case "memorial":
    case "close":
      family(withAdvisor, ROW_LOW);
      out.advisor = at(885, ROW_LOW);
      break;
  }
  return out;
}

/** John's accounts around him, as loose pieces only he holds. */
const chipAt = [
  { x: 300, y: 130 },
  { x: 800, y: 120 },
  { x: 180, y: 320 },
  { x: 920, y: 330 },
  { x: 300, y: 520 },
  { x: 800, y: 520 },
];

/**
 * The family themselves, between the acts that show their screens: the
 * product's name, the Smiths, John carrying everything alone, their advisor
 * beside them, the memorial and the close. Drawn from the moment alone, so
 * any stop can be opened directly.
 */
export function Cast({
  cast,
  area,
  closing,
  actions,
}: {
  /** The moment on stage; null when the stage shows screens instead. */
  cast: TourCast | null;
  /** The part of the stage the moment fills, in pixels. */
  area: Rect;
  /** The closing line, shown large at the close. */
  closing: string;
  /** Buttons under the closing line. */
  actions: ReactNode;
}) {
  const shown = cast !== null;
  const now = cast ?? "family";
  const scale = Math.min(area.w / BOX.w, area.h / BOX.h);
  const spots = places(now);
  const gone = now === "memorial" || now === "close";
  const years = `${tourLoss.born.slice(0, 4)} – ${tourLoss.date.slice(0, 4)}`;

  return (
    <div
      aria-hidden={!shown}
      className={cn(
        "absolute transition-opacity duration-700 ease-out",
        shown ? "opacity-100 delay-200" : "pointer-events-none opacity-0",
      )}
      style={{ left: area.x, top: area.y, width: area.w, height: area.h }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: BOX.w,
          height: BOX.h,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* The product's name. */}
        <Fade on={now === "title"} className="absolute inset-x-0 top-[150px] text-center">
          <div className="flex justify-center">
            <PrivateBankLogo tone="dark" size="sm" product={false} />
          </div>
          <p className="mt-7 flex items-center justify-center gap-5">
            <FindoeLogo className="size-20" />
            <span className="font-display text-[5.5rem] font-semibold leading-none tracking-tight text-pnc-navy">
              Findoe
            </span>
          </p>
          <p className="mt-6 text-xl text-pnc-muted">
            For the people you love, when it matters most.
          </p>
        </Fade>

        {/* John's accounts, scattered around him. */}
        {carried.map((a, i) => (
          <div
            key={a.id}
            className="tour-chip absolute -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-2.5 text-left shadow-[0_8px_24px_-6px_rgb(16_24_40/0.18)] ring-1 ring-pnc-line"
            style={{
              left: chipAt[i].x,
              top: chipAt[i].y,
              opacity: now === "carries" ? 1 : 0,
              transform: `translate(-50%, -50%) rotate(${i % 2 ? 2 : -2}deg) scale(${now === "carries" ? 1 : 0.85})`,
              transitionDelay: now === "carries" ? `${300 + i * 110}ms` : "0ms",
            }}
          >
            <p className="whitespace-nowrap text-[0.9375rem] font-semibold text-pnc-link">
              {a.name}
              {a.external && (
                <span className="ml-2 rounded-full bg-pnc-blue-50 px-2 py-0.5 align-middle text-xs text-pnc-blue-800">
                  Outside PNC
                </span>
              )}
            </p>
            <Money
              value={a.balance}
              className={cn(
                "text-sm font-semibold",
                a.balance < 0 ? "text-pnc-negative" : "text-pnc-ink",
              )}
            />
          </div>
        ))}

        {/* John, remembered. */}
        <Fade on={now === "memorial"} slow className="absolute inset-x-0 top-[70px] text-center">
          <p className="font-[Georgia,'Times_New_Roman',serif] text-[3.75rem] leading-tight text-pnc-navy">
            {tourLoss.personName}
          </p>
          <p className="mt-3 text-lg tracking-[0.4em] text-pnc-muted">{years}</p>
          <p className="mt-5 font-[Georgia,'Times_New_Roman',serif] text-xl italic text-pnc-muted">
            {tourLoss.remembered}
          </p>
        </Fade>

        {/* The close. */}
        <Fade on={now === "close"} slow className="absolute inset-x-0 top-[60px] text-center">
          <FindoeLogo className="mx-auto size-14" />
          <p className="mx-auto mt-7 max-w-[56rem] text-balance font-display text-[3.25rem] font-medium leading-[1.15] text-pnc-navy">
            {closing}
          </p>
        </Fade>
        <Fade on={now === "close"} slow className="absolute inset-x-0 top-[540px]">
          <div className="flex justify-center gap-3">{actions}</div>
        </Fade>

        {/* The people. */}
        {(["husband", "wife", "child1", "child2", "advisor"] as const).map((id) => {
          const p = tourPeople[id];
          const spot = spots[id];
          const dead = id === "husband" && gone;
          return (
            <div
              key={id}
              className="tour-person absolute w-40 text-center"
              style={{
                left: spot.x,
                top: spot.y,
                opacity: dead ? 0.45 : spot.opacity,
                transform: `translate(-50%, -50%) scale(${spot.scale})`,
              }}
            >
              <span
                className={cn("tour-face mx-auto block size-28 rounded-full", dead && "grayscale")}
                style={{ "--glow": tourGlow[id] } as React.CSSProperties}
              >
                <PersonAvatar seed={p.id} look={p.look} className="size-28" />
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-pnc-navy">
                {id === "advisor" ? p.name : p.first}
              </p>
              <p className="mt-0.5 text-sm text-pnc-muted">
                {id === "advisor" ? "PNC Private Bank" : p.role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Fade({
  on,
  slow = false,
  className,
  children,
}: {
  on: boolean;
  slow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "transition-[opacity,transform] ease-out",
        slow ? "duration-[1600ms]" : "duration-700",
        on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        on && slow && "delay-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
