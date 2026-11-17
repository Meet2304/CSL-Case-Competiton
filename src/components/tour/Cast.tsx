"use client";

import type { CSSProperties, ReactNode } from "react";
import { CreditCard, Landmark, PiggyBank, TrendingUp, Umbrella, Wallet } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { Money } from "@/components/ui/Money";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { carried, familyIds, familyTotals, tourGlow, tourLoss, tourPeople } from "@/data/tour";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import type { FrameId, TourCast } from "@/lib/tour";

/** The moments are drawn in a box of this size, then scaled to the stage. */
export const BOX = { w: 1100, h: 620 };

/** How much the box is scaled to fit the area it is drawn in. */
export const castScale = (area: Rect) => Math.min(area.w / BOX.w, area.h / BOX.h);

/** Where a point in the box lands on the stage. */
export function castPoint(area: Rect, p: { x: number; y: number }) {
  const s = castScale(area);
  return {
    x: area.x + area.w / 2 + (p.x - BOX.w / 2) * s,
    y: area.y + area.h / 2 + (p.y - BOX.h / 2) * s,
  };
}

/** Where the family stands in the closing moments; the four parts of Findoe surround it. */
export const closingCentre = { x: 570, y: 310 };
export const closingSpots = {
  will: { x: 125, y: 310 },
  family: { x: 570, y: 96 },
  assets: { x: 570, y: 505 },
  advisory: { x: 1005, y: 310 },
};
/** How wide each part of Findoe is drawn at the close, in the box's units. */
export const CLOSING_D = 144;

type Place = { x: number; y: number; scale: number; opacity: number; back?: boolean };

const ROW = 300;

/** Where each person stands, and how present they are, in each moment. */
function places(cast: TourCast): Record<FrameId, Place> {
  const at = (x: number, y = ROW, scale = 1, opacity = 1, back = false): Place => ({
    x,
    y,
    scale,
    opacity,
    back,
  });
  const four = [325, 475, 625, 775];
  const withAdvisor = [215, 365, 515, 665];
  const closing = [300, 430, 560, 690];
  const out = {} as Record<FrameId, Place>;
  const family = (xs: number[], y: number, scale = 1, opacity = 1) =>
    familyIds.forEach((id, i) => (out[id] = at(xs[i], y, scale, opacity)));
  switch (cast) {
    case "title":
      family(four, ROW + 90, 1, 0);
      out.advisor = at(900, ROW + 90, 1, 0);
      break;
    case "family":
      family(four, ROW);
      out.advisor = at(900, ROW, 1, 0);
      break;
    case "carries":
      // John steps forward; the others stay in the picture, further back and quieter.
      out.husband = at(550, 270, 1.3);
      out.wife = at(400, 515, 0.72, 0.4, true);
      out.child1 = at(550, 525, 0.72, 0.4, true);
      out.child2 = at(700, 515, 0.72, 0.4, true);
      out.advisor = at(900, ROW, 1, 0);
      break;
    case "gathered":
      family(four, ROW - 20);
      out.advisor = at(900, ROW - 20, 1, 0);
      break;
    case "advisor":
    case "loss":
      family(withAdvisor, ROW - 20);
      out.advisor = at(885, ROW - 20);
      break;
    case "memorial":
      family(withAdvisor, ROW - 20, 1, 0);
      out.advisor = at(885, ROW - 20, 1, 0);
      break;
    case "circle":
    case "vision":
      family(closing, closingCentre.y, 0.9);
      out.advisor = at(830, closingCentre.y, 0.9);
      break;
  }
  return out;
}

/** John's accounts around him, each tied to him by a dotted line. */
const chipAt = [
  { x: 215, y: 150 },
  { x: 550, y: 70 },
  { x: 885, y: 150 },
  { x: 175, y: 330 },
  { x: 925, y: 330 },
  { x: 885, y: 470 },
];
const JOHN_AT = { x: 550, y: 270 };
/** Where the accounts gather into one family view. */
const SUMMARY = { x: 550, y: 470 };

const chipIcons = [Landmark, Umbrella, TrendingUp, PiggyBank, CreditCard, Wallet];

/** The advisor's tie to each person, as a curve from above the advisor down to them. */
function tie(fromX: number, toX: number, i: number, rowY: number, low: boolean) {
  const y = rowY - 62;
  // At the close the arc stays low, under the circle above the family.
  const peak = low ? rowY - 150 + i * 12 : 90 + i * 18;
  return `M ${fromX} ${y} Q ${(fromX + toX) / 2} ${peak} ${toX} ${y}`;
}

/**
 * The family themselves, between the acts that show their screens: the
 * product's name, the Smiths, John holding everything alone, their accounts
 * gathered into one family view, their advisor in touch with each of them,
 * the tie to John breaking, and everyone at the end. Drawn from the moment
 * alone, so any stop can be opened directly.
 */
export function Cast({ cast, area }: { cast: TourCast | null; area: Rect }) {
  const shown = cast !== null && cast !== "memorial";
  const now = cast ?? "family";
  const scale = castScale(area);
  const spots = places(now);
  const gone = now === "loss" || now === "memorial" || now === "circle" || now === "vision";
  const advisorTies = now === "advisor" || now === "loss" || now === "circle" || now === "vision";
  const years = `${tourLoss.born.slice(0, 4)} – ${tourLoss.date.slice(0, 4)}`;
  const xs = (["husband", "wife", "child1", "child2"] as const).map((id) => spots[id].x);

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
          <p className="mt-6 text-2xl text-pnc-muted">Care that carries on.</p>
        </Fade>

        <svg
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={BOX.w}
          height={BOX.h}
          aria-hidden="true"
        >
          {/* Everything John looks after, tied to him alone. */}
          {chipAt.map((c, i) => (
            <line
              key={i}
              x1={JOHN_AT.x}
              y1={JOHN_AT.y}
              x2={c.x}
              y2={c.y}
              strokeWidth={2}
              strokeDasharray="3 7"
              strokeLinecap="round"
              className="stroke-pnc-navy/30 transition-opacity duration-700"
              style={{
                opacity: now === "carries" ? 1 : 0,
                transitionDelay: now === "carries" ? `${700 + i * 110}ms` : "0ms",
              }}
            />
          ))}
          {/* The advisor, in touch with each of them. John's tie breaks when he dies. */}
          {familyIds.map((id, i) => {
            const broken = id === "husband" && now === "loss";
            const lit = advisorTies && !(id === "husband" && gone);
            return (
              <path
                key={id}
                d={tie(
                  spots.advisor.x,
                  xs[i],
                  i,
                  spots.advisor.y,
                  now === "circle" || now === "vision",
                )}
                pathLength={1}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                // When John dies his tie snaps in the middle, then fades.
                strokeDasharray={broken ? "0.43 0.14 0.43 1" : "1 1"}
                className={cn("tour-tie stroke-pnc-blue-600/45", broken && "tour-tie-broken")}
                style={{
                  strokeDashoffset: lit || broken ? 0 : 1,
                  // The broken tie stays, faintly: he was in touch with them too.
                  opacity: lit ? 1 : broken ? 0.3 : 0,
                  transitionDelay: lit && now === "advisor" ? `${600 + i * 180}ms` : "0ms",
                }}
              />
            );
          })}
        </svg>

        {/* John's accounts: loose around him, then gathered into one family view. */}
        {carried.map((a, i) => {
          const Icon = chipIcons[i % chipIcons.length];
          const c = chipAt[i];
          const loose = now === "carries";
          const gathering = now === "gathered";
          return (
            <div
              key={`${a.id}-${gathering}`}
              className={cn("absolute", gathering ? "tour-gather" : "tour-chip")}
              style={
                {
                  left: c.x,
                  top: c.y,
                  opacity: loose ? 1 : 0,
                  transform: `translate(-50%, -50%) scale(${loose ? 1 : 0.85})`,
                  transitionDelay: loose ? `${300 + i * 110}ms` : "0ms",
                  "--dx": `${SUMMARY.x - c.x}px`,
                  "--dy": `${SUMMARY.y - c.y}px`,
                  animationDelay: `${150 + i * 90}ms`,
                } as CSSProperties
              }
            >
              <div className="flex items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-4 shadow-[0_12px_30px_-14px_rgb(11_35_64/0.4)] ring-1 ring-pnc-line">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-blue-700">
                  <Icon className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="text-left">
                  <span className="block whitespace-nowrap text-[0.9375rem] font-semibold text-pnc-ink">
                    {a.name}
                  </span>
                  <Money
                    value={a.balance}
                    className={cn(
                      "text-sm",
                      a.balance < 0 ? "text-pnc-negative" : "text-pnc-muted",
                    )}
                  />
                </span>
              </div>
            </div>
          );
        })}

        {/* The same accounts, now one view the family shares. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform,left] duration-700 ease-out"
          style={{
            left: now === "advisor" ? 440 : SUMMARY.x,
            top: SUMMARY.y,
            opacity: now === "gathered" || now === "advisor" ? 1 : 0,
            transitionDelay: now === "gathered" ? "1500ms" : "0ms",
          }}
        >
          <div className="flex w-[30rem] items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_24px_60px_-28px_rgb(11_35_64/0.5)] ring-1 ring-pnc-line">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-pnc-navy font-display text-lg font-semibold text-white">
              S
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold text-pnc-navy">
                {familyTotals.name}
              </span>
              <span className="block text-sm text-pnc-muted">
                {familyTotals.members} members · {familyTotals.shared} accounts shared
              </span>
            </span>
            <Money
              value={familyTotals.value}
              compact
              className="font-display text-2xl font-semibold text-pnc-navy"
            />
          </div>
        </div>

        {/* John, remembered: small, above the family. */}
        <Fade on={now === "loss"} slow className="absolute inset-x-0 top-[40px] text-center">
          <p className="font-[Georgia,'Times_New_Roman',serif] text-[1.75rem] leading-tight text-pnc-navy">
            {tourLoss.personName}
          </p>
          <p className="mt-1 text-sm tracking-[0.35em] text-pnc-muted">{years}</p>
        </Fade>

        {/* The people. */}
        {(["husband", "wife", "child1", "child2", "advisor"] as const).map((id) => {
          const p = tourPeople[id];
          const spot = spots[id];
          const dead = id === "husband" && gone;
          return (
            <div
              key={id}
              className={cn("tour-person absolute w-40 text-center", spot.back && "tour-back")}
              style={{
                left: spot.x,
                top: spot.y,
                zIndex: spot.back ? 0 : 1,
                opacity: dead && spot.opacity ? 0.5 : spot.opacity,
                transform: `translate(-50%, -50%) translateY(${dead ? -8 : 0}px) scale(${spot.scale})`,
              }}
            >
              <span
                className={cn("tour-face mx-auto block size-28 rounded-full", dead && "grayscale")}
                style={{ "--glow": tourGlow[id] } as CSSProperties}
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

        {/* The close: what Findoe is for, in its own words. */}
        <Fade on={now === "vision"} slow className="absolute inset-x-0 top-[598px] text-center">
          <p className="font-display text-lg font-medium text-pnc-navy">Care that carries on.</p>
        </Fade>
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
        slow ? "duration-[1400ms]" : "duration-700",
        on ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        on && slow && "delay-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
