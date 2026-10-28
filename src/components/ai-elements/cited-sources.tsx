"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Database, Scale, type LucideIcon } from "lucide-react";
import { rulebook } from "@/data/settlement";
import type { SourceKind } from "@/data/types";
import type { Source } from "@/lib/findoe/answer";
import { cn } from "@/lib/format";

// Findoe's two kinds of source, told apart by icon as well as color: a
// database for the bank's own records, scales for the legal library.

type Kind = Source["kind"];

const look: Record<Kind, { icon: LucideIcon; chip: string; tile: string; eyebrow: string }> = {
  bank: {
    icon: Database,
    chip: "bg-pnc-blue-50 text-pnc-blue-800 ring-pnc-blue-600/25 hover:bg-pnc-blue-700 hover:text-white hover:ring-pnc-blue-700",
    tile: "bg-pnc-blue-50 text-pnc-blue-700",
    eyebrow: "text-pnc-blue-800",
  },
  law: {
    icon: Scale,
    chip: "bg-law-bg text-law ring-law-line hover:bg-law hover:text-white hover:ring-law",
    tile: "bg-law-bg text-law",
    eyebrow: "text-law",
  },
};

const lawKinds: Record<SourceKind, string> = {
  statute: "Statute",
  regulation: "Regulation",
  "agency-guidance": "Agency guidance",
  "form-instructions": "Form instructions",
  "bank-policy": "Bank policy",
  "plan-document": "Plan document",
};

/** What a source is called, for markers' accessible names and tooltips. */
export function sourceTitle(s: Source): string {
  return s.kind === "bank" ? `${s.table}: ${s.title}` : rulebook.sources[s.key].citation;
}

/** "Your PNC records" / "Legal library", with its icon: the legend for both kinds. */
export function SourceKindPill({
  kind,
  label,
  className,
}: {
  kind: Kind;
  label: string;
  className?: string;
}) {
  const { icon: Icon, tile } = look[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tile,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** The "[n]" in an answer: which source backs the sentence, by number and kind. */
export function SourceMarker({
  n,
  source,
  onSelect,
}: {
  n: number;
  source?: Source;
  onSelect?: (n: number) => void;
}) {
  if (!source) return null;
  const { icon: Icon, chip } = look[source.kind];
  const title = sourceTitle(source);
  return (
    <button
      type="button"
      onClick={() => onSelect?.(n)}
      title={title}
      aria-label={`Source ${n}, ${source.kind === "bank" ? "PNC records" : "legal library"}: ${title}`}
      className={cn(
        "relative -top-px mx-0.5 inline-flex h-[1.125rem] items-center gap-0.5 rounded-md px-1 align-middle text-2xs font-bold leading-none ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pnc-link",
        chip,
      )}
    >
      <Icon className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
      {n}
    </button>
  );
}

const SHOWN = 3;

/**
 * Every source an answer rests on, in two groups — the bank's records and the
 * legal library — each card numbered to match the markers in the text.
 * `focus` (a marker was clicked) opens the list and flashes that card.
 */
export function SourceList({
  sources,
  bankLabel,
  idPrefix,
  focus,
}: {
  sources: Source[];
  /** What the bank group is called, e.g. "Your PNC records" or "Client records". */
  bankLabel: string;
  idPrefix: string;
  focus?: { n: number; at: number };
}) {
  const [all, setAll] = useState(false);
  const [flash, setFlash] = useState<{ n: number; at: number }>();
  const numbered = sources.map((source, i) => ({ source, n: i + 1 }));
  const groups = (["bank", "law"] as const)
    .map((kind) => ({ kind, items: numbered.filter((x) => x.source.kind === kind) }))
    .filter((g) => g.items.length);
  const hidden = groups.reduce((s, g) => s + Math.max(0, g.items.length - SHOWN), 0);

  // A clicked marker: show everything, then bring its card into view and flash it.
  const [seen, setSeen] = useState(focus?.at);
  if (focus && focus.at !== seen) {
    setSeen(focus.at);
    setAll(true);
    setFlash(focus);
  }
  useEffect(() => {
    if (!flash) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById(`${idPrefix}-src-${flash.n}`)
      ?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [flash, idPrefix]);

  if (!sources.length) return null;
  return (
    <section
      aria-label="Sources"
      className="rounded-xl border border-pnc-line bg-pnc-surface/60 p-2.5 motion-safe:animate-reveal"
    >
      <div className="flex flex-wrap items-center gap-1.5 px-0.5 pb-2">
        <p className="mr-auto text-xs font-semibold text-pnc-ink">Sources</p>
        {groups.map((g) => (
          <SourceKindPill
            key={g.kind}
            kind={g.kind}
            className="py-0.5"
            label={`${g.items.length} ${g.kind === "bank" ? (g.items.length === 1 ? "record" : "records") : g.items.length === 1 ? "law" : "laws"}`}
          />
        ))}
      </div>
      <div className="space-y-2.5">
        {groups.map((g) => (
          <div key={g.kind}>
            <p
              className={cn(
                "px-0.5 pb-1 text-2xs font-bold uppercase tracking-wide",
                look[g.kind].eyebrow,
              )}
            >
              {g.kind === "bank" ? bankLabel : "Legal library"}
            </p>
            <ul className="space-y-1.5">
              {(all ? g.items : g.items.slice(0, SHOWN)).map(({ source, n }) => (
                <li
                  key={flash?.n === n ? `${n}-${flash.at}` : n}
                  id={`${idPrefix}-src-${n}`}
                  className={cn(
                    "flex scroll-my-3 gap-2.5 rounded-lg bg-white p-2.5 ring-1 ring-pnc-line",
                    flash?.n === n && "animate-flash",
                  )}
                >
                  <SourceCard source={source} n={n} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="mt-2 w-full rounded-md py-1 text-xs font-semibold text-pnc-link hover:bg-white focus-visible:outline-2 focus-visible:outline-pnc-link"
        >
          {all ? "Show fewer" : `Show ${hidden} more`}
        </button>
      )}
    </section>
  );
}

function SourceCard({ source, n }: { source: Source; n: number }) {
  const { icon: Icon, tile, eyebrow } = look[source.kind];
  const badge = (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-pnc-chip text-2xs font-bold text-pnc-muted">
      {n}
    </span>
  );
  const iconTile = (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", tile)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
  if (source.kind === "bank")
    return (
      <>
        {iconTile}
        <div className="min-w-0 flex-1">
          <p className={cn("text-2xs font-semibold", eyebrow)}>PNC · {source.table}</p>
          <p className="text-sm font-semibold leading-snug text-pnc-ink">{source.title}</p>
          <p className="text-xs leading-snug text-pnc-muted">{source.detail}</p>
        </div>
        {badge}
      </>
    );
  const s = rulebook.sources[source.key];
  return (
    <>
      {iconTile}
      <div className="min-w-0 flex-1">
        <p className={cn("text-2xs font-semibold", eyebrow)}>
          {s.authority} · {lawKinds[s.kind]}
          {!s.verifiedOn && (
            <span className="ml-1.5 inline-flex items-center gap-1 text-pnc-orange-600">
              <span className="size-1.5 rounded-full bg-pnc-orange" aria-hidden="true" />
              not yet verified
            </span>
          )}
        </p>
        <a
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="group/link inline-flex max-w-full items-start gap-1 text-sm font-semibold leading-snug text-pnc-ink hover:text-pnc-link focus-visible:outline-2 focus-visible:outline-pnc-link"
        >
          <span>{s.citation}</span>
          <ArrowUpRight
            className="mt-0.5 size-3.5 shrink-0 text-pnc-muted group-hover/link:text-pnc-link"
            aria-hidden="true"
          />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <p className="mt-0.5 text-xs leading-snug text-pnc-muted">
          <span className="font-semibold text-pnc-ink/80">{s.title}.</span> {s.summary}
        </p>
      </div>
      {badge}
    </>
  );
}
