import { ExternalLink } from "lucide-react";
import { rulebook } from "@/data/settlement";
import { cn } from "@/lib/format";

/**
 * A citation that opens the source. Unverified sources carry a visible dot
 * and say so in their accessible name, not only in a tooltip.
 */
export function SourceChip({ id, className }: { id: string; className?: string }) {
  const s = rulebook.sources[id];
  if (!s) return null;
  const unverified = !s.verifiedOn;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      title={unverified ? `${s.summary} — citation not yet verified` : s.summary}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
        className,
      )}
    >
      <span className="truncate">{s.citation}</span>
      {unverified && (
        <>
          <span className="size-1.5 shrink-0 rounded-full bg-pnc-orange" aria-hidden="true" />
          <span className="sr-only"> (citation not yet verified)</span>
        </>
      )}
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function SourceChips({ ids, className }: { ids: string[]; className?: string }) {
  if (!ids.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Sources">
      {ids.map((id) => (
        <li key={id} className="max-w-full">
          <SourceChip id={id} />
        </li>
      ))}
    </ul>
  );
}
