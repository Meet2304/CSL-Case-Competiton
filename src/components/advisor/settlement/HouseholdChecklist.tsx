import { Chip } from "@/components/advisor/assistant/parts";
import type { HouseholdItem } from "@/lib/settlement/engine";
import { formatDate } from "@/lib/format";
import { firstName, ownerLabel, reviewLabels, reviewTone } from "./parts";
import { SourceChips } from "./SourceChip";

/** Rules that apply once per death, grouped by whose law they come from. */
export function HouseholdChecklist({
  items,
  survivor,
}: {
  items: HouseholdItem[];
  survivor: string;
}) {
  const groups = [
    { title: "Federal", items: items.filter((x) => x.rule.jurisdiction === "US") },
    { title: "Pennsylvania", items: items.filter((x) => x.rule.jurisdiction === "PA") },
  ].filter((g) => g.items.length);

  return (
    <div className="grid gap-5 @4xl:grid-cols-2">
      {groups.map((g) => (
        <section key={g.title} aria-label={`${g.title} rules`}>
          <h4 className="text-sm font-bold text-pnc-ink">{g.title}</h4>
          <ul className="mt-2 space-y-3">
            {g.items.map(({ rule, detail, actions }) => (
              <li key={rule.id} className="rounded-md border border-pnc-line p-3.5 text-sm">
                <p className="font-semibold text-pnc-ink">{rule.title}</p>
                <p className="mt-0.5 leading-relaxed text-pnc-ink">{detail}</p>
                <ul className="mt-2 space-y-1">
                  {actions.map((a) => (
                    <li key={a.key} className="flex gap-2 leading-snug">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pnc-blue-700"
                        aria-hidden="true"
                      />
                      <span>
                        {a.label}{" "}
                        <span className="text-xs text-pnc-muted">
                          · {ownerLabel(a.action.owner, firstName(survivor))}
                          {a.due && ` · by ${formatDate(a.due, "medium")}`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {rule.review?.map((r) => (
                    <Chip key={r} className={reviewTone}>
                      {reviewLabels[r]} sign-off
                    </Chip>
                  ))}
                  <SourceChips ids={rule.sources} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
