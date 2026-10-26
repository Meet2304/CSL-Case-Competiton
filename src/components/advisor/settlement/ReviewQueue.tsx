"use client";

import { CircleCheck, Undo2 } from "lucide-react";
import { advisor } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import type { ReviewLevel } from "@/data/types";
import type { ReviewItem } from "@/lib/settlement/engine";
import { reviewActions, reviewKey, type ReviewState } from "@/lib/settlement/reviews";
import { formatDate } from "@/lib/format";
import { reviewLabels } from "./parts";

const advisorName = `${advisor.firstName} ${advisor.lastName}`;

/**
 * Steps that need a person to sign off before they're final. Recording a
 * sign-off is the only thing stored; the plan itself is always derived.
 */
export function ReviewQueue({
  items,
  reviews,
  customerId,
}: {
  items: ReviewItem[];
  reviews: ReviewState;
  customerId: string;
}) {
  if (!items.length) return <p className="text-sm text-pnc-muted">Nothing needs sign-off.</p>;

  return (
    <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
      {items.map((item) => {
        const key = reviewKey(customerId, item.key);
        const done = reviews[key] ?? [];
        const signed = (l: ReviewLevel) => done.find((d) => d.level === l);
        const complete = item.levels.every((l) => signed(l));
        return (
          <li key={item.key} className="space-y-2 p-3.5 text-sm">
            <p className="flex items-start gap-2 font-semibold text-pnc-ink">
              {complete && (
                <CircleCheck
                  className="mt-0.5 size-4 shrink-0 text-pnc-positive"
                  aria-label="Fully signed off"
                />
              )}
              {item.label}
            </p>
            <ul className="flex flex-wrap gap-2">
              {item.levels.map((level) => {
                const s = signed(level);
                return (
                  <li key={level}>
                    {s ? (
                      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full bg-pnc-positive-bg px-3 py-1 text-xs text-pnc-ink">
                        <span>
                          <span className="font-semibold">{reviewLabels[level]}</span> reviewed ·{" "}
                          {s.by} · {formatDate(s.on, "medium")}
                        </span>
                        <button
                          type="button"
                          onClick={() => reviewActions.undo(key, level)}
                          className="inline-flex items-center gap-0.5 font-semibold text-pnc-link hover:underline"
                        >
                          <Undo2 className="size-3" aria-hidden="true" /> Undo
                          <span className="sr-only">
                            {" "}
                            {reviewLabels[level]} sign-off for {item.label}
                          </span>
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          reviewActions.signOff(key, { level, by: advisorName, on: MOCK_AS_OF })
                        }
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link"
                      >
                        Mark {reviewLabels[level].toLowerCase()} reviewed
                        <span className="sr-only"> for {item.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
