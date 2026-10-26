import { Chip } from "@/components/advisor/assistant/parts";
import type { Holding } from "@/data/types";
import type { PlannedAction } from "@/lib/settlement/engine";
import { daysBetween, formatDate, relativeDay } from "@/lib/format";
import { firstName, kindLabels, kindTone, ownerLabel } from "./parts";
import { SourceChips } from "./SourceChip";

/**
 * Every dated step on one timeline, soonest first. Items due within 90 days
 * are marked "Coming up" in text as well as color.
 */
export function DeadlineList({
  deadlines,
  holdings,
  today,
  survivor,
  hypothetical = false,
}: {
  deadlines: PlannedAction[];
  holdings: Holding[];
  today: string;
  survivor: string;
  /** Simulation: dates are "if it happened today". */
  hypothetical?: boolean;
}) {
  if (!deadlines.length) return <p className="text-sm text-pnc-muted">No dated steps.</p>;
  const name = (id: string) => holdings.find((h) => h.id === id)?.name ?? id;

  return (
    <ol className="divide-y divide-pnc-line">
      {deadlines.map((d) => {
        const kind = d.action.deadline!.kind;
        const days = daysBetween(today, d.due!);
        const soon = !hypothetical && days >= 0 && days <= 90;
        const past = !hypothetical && days < 0;
        return (
          <li key={`${d.action.id}@${d.due}`} className="py-3.5 first:pt-0 last:pb-0">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <time dateTime={d.due} className="font-semibold text-pnc-ink">
                {formatDate(d.due!, "medium")}
              </time>
              <span className="text-xs text-pnc-muted">
                {hypothetical
                  ? `${Math.round(days / 30.4)} months after`
                  : relativeDay(d.due!, today)}
              </span>
              {soon && (
                <Chip className="bg-attention-bg text-attention ring-attention-line">
                  Coming up
                </Chip>
              )}
              {past && <Chip className="bg-pnc-chip text-pnc-muted ring-transparent">Passed</Chip>}
            </p>
            <p className="mt-0.5 text-sm text-pnc-ink">
              <span className="font-semibold">{d.action.deadline!.label}.</span> {d.label}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-pnc-muted">
              <Chip className={kindTone[kind]}>{kindLabels[kind]}</Chip>
              <span>Owner: {ownerLabel(d.action.owner, firstName(survivor))}</span>
              {d.accountIds.length > 0 && <span>· {d.accountIds.map(name).join(", ")}</span>}
            </p>
            <SourceChips ids={d.action.sources} className="mt-1.5" />
          </li>
        );
      })}
    </ol>
  );
}
