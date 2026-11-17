"use client";

import type { CSSProperties } from "react";
import { BadgeCheck, Check, Database, Landmark, Scale, type LucideIcon } from "lucide-react";
import type { Rect } from "@/lib/film";
import { cn } from "@/lib/format";
import type { TourNote } from "@/lib/tour";

/** A note, where the thing it explains sits on the stage, and the card it sits on. */
export type PlacedNote = { note: TourNote; anchor: Rect; card: Rect };

/** The part of a box that is inside the card, so an outline never runs past the card's edge. */
function within(r: Rect, card: Rect): Rect {
  const x = Math.max(r.x, card.x + 4);
  const y = Math.max(r.y, card.y + 4);
  const right = Math.min(r.x + r.w, card.x + card.w - 4);
  const bottom = Math.min(r.y + r.h, card.y + card.h - 4);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

const icons: Record<"data" | "law" | "cited", LucideIcon> = {
  data: Database,
  law: Scale,
  cited: BadgeCheck,
};

/** The color each kind of note is tied with. */
const tone: Record<"data" | "law" | "cited" | "label" | "tree", string> = {
  data: "var(--tour-note-data)",
  law: "var(--tour-note-law)",
  cited: "var(--tour-note-cited)",
  label: "var(--tour-note-accent)",
  tree: "var(--tour-note-accent)",
};

const GAP = 56;
const MARGIN = 20;

/** Rough heights, to stack notes without overlapping before they are measured. */
function heightOf(n: TourNote) {
  if (n.kind === "label") return 52;
  if (n.kind === "card") return n.tag ? 168 : 132;
  return 58 + 70 + n.steps.length * 86 + 104;
}

/**
 * Notes beside a card that explain what the app is doing: white cards with
 * an icon, a short dark label, or the decisions a rule took for one account.
 * Each sits to the left of what it is about, tied to it by a line that ends
 * in a small ring, and what it is about is outlined in orange.
 */
export function Notes({ placed, stageH }: { placed: PlacedNote[]; stageH: number }) {
  if (placed.length === 0) return null;
  const width = Math.min(400, Math.max(280, placed[0].anchor.x - GAP - MARGIN * 2));
  const right = Math.min(...placed.map((p) => p.anchor.x)) - GAP;
  const left = Math.max(MARGIN, right - width);

  const boxes = stack(placed, stageH);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <svg className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        {boxes.map((b, i) => {
          const kind = b.note.kind === "card" ? b.note.icon : b.note.kind;
          const end = { x: b.anchor.x - 6, y: b.anchor.y + Math.min(b.anchor.h / 2, 22) };
          const start = { x: left + width, y: b.tieY };
          const mid = (start.x + end.x) / 2;
          return (
            <g
              key={i}
              className="tour-note-tie"
              style={{ "--tie": tone[kind], animationDelay: `${300 + i * 250}ms` } as CSSProperties}
            >
              <path
                d={`M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`}
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                stroke="var(--tie)"
              />
              <circle
                cx={end.x}
                cy={end.y}
                r={6}
                fill="white"
                stroke="var(--tie)"
                strokeWidth={2.5}
              />
            </g>
          );
        })}
      </svg>

      {/* What each note is about, outlined. */}
      {boxes.map((b, i) => {
        const r = within(
          { x: b.anchor.x - 6, y: b.anchor.y - 6, w: b.anchor.w + 12, h: b.anchor.h + 12 },
          b.card,
        );
        return (
          <span
            key={`ring-${i}`}
            aria-hidden="true"
            className="tour-note-ring absolute rounded-xl"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              animationDelay: `${300 + i * 250}ms`,
            }}
          />
        );
      })}

      {boxes.map((b, i) => (
        <div
          key={`note-${i}`}
          className="tour-note absolute"
          style={{ left, top: b.top, width, animationDelay: `${150 + i * 250}ms` }}
        >
          <Note note={b.note} />
        </div>
      ))}
    </div>
  );
}

/** Each note centred on what it explains, pushed down so none overlap. */
function stack(placed: PlacedNote[], stageH: number) {
  const out: (PlacedNote & { top: number; h: number; tieY: number })[] = [];
  for (const p of placed) {
    const floor = out.length ? out[out.length - 1].top + out[out.length - 1].h + 18 : MARGIN + 40;
    const h = heightOf(p.note);
    const wanted = p.note.kind === "tree" ? (stageH - h) / 2 : p.anchor.y + p.anchor.h / 2 - h / 2;
    const top = Math.min(Math.max(wanted, floor), stageH - h - MARGIN);
    // A tree is tied from its account; anything else from its middle.
    const tieY = p.note.kind === "tree" ? top + 58 + 34 : top + h / 2;
    out.push({ ...p, top, h, tieY });
  }
  return out;
}

function Note({ note }: { note: TourNote }) {
  if (note.kind === "label")
    return (
      <p className="ml-auto flex w-fit items-center gap-2.5 rounded-full bg-pnc-navy px-5 py-2.5 font-display text-lg font-semibold text-white shadow-[0_14px_30px_-12px_rgb(11_35_64/0.6)]">
        <span className="size-2.5 rounded-full bg-pnc-orange" aria-hidden="true" />
        {note.text}
      </p>
    );

  if (note.kind === "card") {
    const Icon = icons[note.icon];
    return (
      <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-[0_24px_60px_-24px_rgb(11_35_64/0.45)] ring-1 ring-pnc-line">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-xl"
          style={{
            background: `color-mix(in srgb, ${tone[note.icon]} 12%, white)`,
            color: tone[note.icon],
          }}
        >
          <Icon className="size-7" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-2xl font-semibold leading-tight text-pnc-ink">
            {note.title}
          </span>
          <span className="mt-1 block text-base leading-snug text-pnc-muted">{note.body}</span>
          {note.tag && (
            <span
              className="mt-2.5 inline-block rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                background: `color-mix(in srgb, ${tone[note.icon]} 12%, white)`,
                color: `color-mix(in srgb, ${tone[note.icon]} 70%, black)`,
              }}
            >
              {note.tag}
            </span>
          )}
        </span>
      </div>
    );
  }

  // The decisions a rule took for one account, from the first question to the outcome.
  return (
    <div className="relative space-y-2.5">
      <span
        aria-hidden="true"
        className="absolute bottom-10 left-7 top-12 w-[3px] rounded-full bg-pnc-orange/50"
      />
      <p className="relative flex w-fit items-center gap-2.5 rounded-full bg-pnc-navy px-5 py-2.5 font-display text-lg font-semibold text-white shadow-[0_14px_30px_-12px_rgb(11_35_64/0.6)]">
        <span className="size-2.5 rounded-full bg-pnc-orange" aria-hidden="true" />
        {note.title}
      </p>
      <p className="relative flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_0_0_2px_var(--tour-note-accent),0_10px_30px_-10px_color-mix(in_srgb,var(--tour-note-accent)_60%,transparent)]">
        <span className="grid size-9 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
          <Landmark className="size-4.5" aria-hidden="true" />
        </span>
        <span className="font-display text-xl font-semibold text-pnc-ink">{note.account}</span>
      </p>
      {note.steps.map((s, i) => (
        <div
          key={s.question}
          className="tour-note-step relative flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-[0_10px_24px_-14px_rgb(11_35_64/0.45)] ring-1 ring-pnc-line"
          style={{ animationDelay: `${500 + i * 180}ms` }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pnc-positive-bg text-pnc-positive">
            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm leading-snug text-pnc-muted">{s.question}</span>
            <span className="block font-display text-lg font-semibold leading-snug text-pnc-ink">
              {s.answer}
            </span>
          </span>
        </div>
      ))}
      <div
        className={cn(
          "tour-note-step relative flex items-center gap-3 rounded-xl bg-pnc-navy px-4 py-3 text-white",
        )}
        style={{ animationDelay: `${500 + note.steps.length * 180}ms` }}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-orange">
          <Check className="size-4.5" strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-pnc-orange">
            Outcome
          </span>
          <span className="block font-display text-lg font-semibold leading-snug">
            {note.outcome}
          </span>
        </span>
      </div>
    </div>
  );
}
