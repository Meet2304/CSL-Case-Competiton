"use client";

import { useId, useState } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { Chip } from "@/components/advisor/assistant/parts";
import { Money } from "@/components/ui/Money";
import { displayOrder, type AccountPlan } from "@/lib/settlement/engine";
import { cn } from "@/lib/format";
import { reviewLabels, reviewTone, routeLabels, routeTone } from "./parts";
import { RuleTrace } from "./RuleTrace";

const cols =
  "@3xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_6.5rem_1rem]";
const colsSim =
  "@3xl:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_6.5rem_1rem]";
const cellLabel = "block text-xs text-pnc-muted @3xl:sr-only";

/**
 * Every account the death touches: how it passes, to whom, how long it takes
 * and who signs off. Each row expands to the rule trace behind it. Rows are
 * cards on narrow screens and line up as a table from @3xl.
 */
export function RouteTable({
  accounts,
  survivor,
  mode,
  onAsk,
}: {
  accounts: AccountPlan[];
  survivor: string;
  mode: "settlement" | "simulation";
  onAsk?: (q: string) => void;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<string[]>([]);
  const rows = displayOrder(accounts);
  const sim = mode === "simulation";
  const toggle = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const allOpen = rows.length > 0 && open.length === rows.length;

  if (!rows.length) return <p className="text-sm text-pnc-muted">No accounts would be affected.</p>;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? [] : rows.map((r) => r.holding.id))}
          className="text-xs font-semibold text-pnc-link hover:underline"
        >
          {allOpen ? "Collapse all" : "Explain every account"}
        </button>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "hidden gap-3 px-4 text-xs font-semibold text-pnc-muted @3xl:grid",
          sim ? colsSim : cols,
        )}
      >
        <span>Account</span>
        <span>Route</span>
        <span>Passes to</span>
        <span>Typical time</span>
        {!sim && <span>Sign-off</span>}
        <span className="text-right">Value</span>
        <span />
      </div>
      <ul className="space-y-2">
        {rows.map((a) => {
          const isOpen = open.includes(a.holding.id);
          const panelId = `${baseId}-${a.holding.id}`;
          return (
            <li
              key={a.holding.id}
              className={cn(
                "rounded-md bg-white ring-1",
                a.outcome.probate ? "ring-attention-line" : "ring-pnc-line",
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(a.holding.id)}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-md px-4 py-3 text-left text-sm hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link @3xl:items-center",
                  sim ? colsSim : cols,
                )}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-pnc-ink">
                    {a.attention && (
                      <TriangleAlert
                        className="mr-1 inline size-3.5 align-[-2px] text-pnc-orange-600"
                        aria-label="Needs attention"
                      />
                    )}
                    {a.holding.name}
                    {a.holding.last4 && (
                      <span className="text-xs font-normal text-pnc-muted">
                        {" "}
                        x{a.holding.last4}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-pnc-muted">
                    {a.holding.type}
                    {a.holding.external && " · outside PNC"}
                  </span>
                </span>
                <span className="col-start-2 row-start-1 text-right @3xl:hidden">
                  <Money value={a.holding.value} compact className="font-semibold" />
                </span>
                <span className="col-span-2 @3xl:col-span-1">
                  <span className={cellLabel}>Route</span>
                  <Chip className={routeTone[a.outcome.route]}>{routeLabels[a.outcome.route]}</Chip>
                </span>
                <span className="text-pnc-ink">
                  <span className={cellLabel}>Passes to</span>
                  {a.passesToNames.length ? (
                    a.passesToNames.join(", ")
                  ) : (
                    <span className="text-pnc-muted">
                      {a.outcome.passesTo === "nobody"
                        ? "Nobody — estate pays"
                        : a.outcome.passesTo === "unchanged"
                          ? "No change"
                          : "To be confirmed"}
                    </span>
                  )}
                </span>
                <span className="text-pnc-ink">
                  <span className={cellLabel}>Typical time</span>
                  {a.outcome.typicalTimeline}
                </span>
                {!sim && (
                  <span className="col-span-2 @3xl:col-span-1">
                    <span className={cellLabel}>Sign-off</span>
                    {a.review.length ? (
                      <span className="flex flex-wrap gap-1">
                        {a.review.map((r) => (
                          <Chip key={r} className={reviewTone}>
                            {reviewLabels[r]}
                          </Chip>
                        ))}
                      </span>
                    ) : (
                      <span className="text-pnc-muted">None</span>
                    )}
                  </span>
                )}
                <span className="hidden text-right @3xl:block">
                  <Money value={a.holding.value} compact className="font-semibold" />
                </span>
                <span className="col-span-2 flex items-center gap-1 text-xs font-semibold text-pnc-link @3xl:col-span-1 @3xl:justify-end">
                  <span className="@3xl:sr-only">{isOpen ? "Hide why" : "Why?"}</span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                    aria-hidden="true"
                  />
                </span>
              </button>
              <div
                id={panelId}
                hidden={!isOpen}
                className="border-t border-pnc-line px-4 py-4 @3xl:px-5"
              >
                {isOpen && <RuleTrace plan={a} survivor={survivor} mode={mode} onAsk={onAsk} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
