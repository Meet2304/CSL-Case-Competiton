import { MessageCircleQuestion, Wrench } from "lucide-react";
import { Chip } from "@/components/advisor/assistant/parts";
import { Money } from "@/components/ui/Money";
import type { Finding } from "@/lib/settlement/simulate";
import { linkButton, severityLabels, severityTone } from "./parts";
import { SourceChips } from "./SourceChip";

/** What would go wrong if this person died today, and the fix for each. */
export function FindingList({
  findings,
  onAsk,
}: {
  findings: Finding[];
  onAsk: (q: string) => void;
}) {
  if (!findings.length)
    return (
      <p className="rounded-md bg-pnc-positive-bg px-4 py-3 text-sm text-pnc-ink">
        Nothing to fix: every account would pass the way it&apos;s set up.
      </p>
    );

  return (
    <ol className="space-y-3">
      {findings.map((f) => (
        <li key={f.id} className="rounded-md border border-pnc-line bg-white p-4 text-sm">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <Chip className={severityTone[f.severity]}>
              {severityLabels[f.severity]}
              <span className="sr-only"> priority</span>
            </Chip>
            <p className="min-w-0 flex-1 basis-48 font-semibold text-pnc-ink">{f.title}</p>
            {f.value !== 0 && <Money value={f.value} compact className="text-pnc-muted" />}
          </div>
          <p className="mt-1.5 leading-relaxed text-pnc-ink">{f.detail}</p>
          <p className="mt-2 flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-pnc-ink">
            <Wrench className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <span>
              <span className="font-semibold">Fix:</span> {f.fix}.
            </span>
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <SourceChips ids={f.sources} />
            <button type="button" onClick={() => onAsk(`Why: ${f.title}?`)} className={linkButton}>
              <MessageCircleQuestion className="size-4" aria-hidden="true" /> Ask about this
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}
