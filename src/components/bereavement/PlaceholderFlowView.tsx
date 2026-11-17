"use client";

import { ArrowLeft, CalendarClock, ExternalLink } from "lucide-react";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { askFindoe } from "@/components/findoe/askFindoe";
import { Money } from "@/components/ui/Money";
import { supportPeople } from "@/data/bereavement";
import { accountLabel } from "@/lib/household";
import type { SurvivorItem } from "@/lib/survivor";

/**
 * An account without a guided flow for this survivor: what happens to it,
 * what's usually needed, and who to talk to.
 */
export function PlaceholderFlowView({
  item,
  onBack,
  backLabel = "All unclaimed assets",
}: {
  item: SurvivorItem;
  onBack: () => void;
  backLabel?: string;
}) {
  const advisorContact = supportPeople[0];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {backLabel}
      </button>
      <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">{item.title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-pnc-muted">{item.summary}</p>
      <ul className="mt-3 space-y-1 text-sm text-pnc-ink">
        {item.accounts.map((a) => (
          <li key={a.id}>
            {accountLabel(a)} · <Money value={a.balance} className="font-semibold" />
          </li>
        ))}
      </ul>

      {item.guide ? (
        <section aria-labelledby="claim-guide-title" className="mt-5">
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-pnc-blue-50 px-4 py-3 text-sm text-pnc-ink">
            <ExternalLink className="size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              This one is held outside PNC, so we can&apos;t claim it for you. Here is each step.
            </span>
          </div>
          <h3 id="claim-guide-title" className="mt-5 font-semibold text-pnc-ink">
            How to claim it, step by step
          </h3>
          <ol className="mt-3 space-y-3">
            {item.guide.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-4 rounded-lg border border-pnc-line bg-white px-4 py-3.5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pnc-blue-700 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-pnc-ink">{s.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-pnc-muted">
                    {s.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => askFindoe(`How do I claim the ${item.title}?`)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-pnc-line bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-pnc-ink hover:border-pnc-muted hover:bg-pnc-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
          >
            <FindoeLogo className="size-6" />
            Ask Findoe about a step
          </button>
        </section>
      ) : (
        item.steps && (
          <section className="mt-5 rounded-md border border-pnc-line bg-white p-4">
            <h3 className="font-semibold text-pnc-ink">What happens</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-pnc-ink">
              {item.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
        )
      )}

      <p className="mt-4 flex gap-3 rounded-md bg-pnc-blue-50 p-4 text-sm text-pnc-ink">
        <CalendarClock className="size-5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          Questions? {advisorContact.name}, your PNC advisor, can talk it through with you.
        </span>
      </p>
    </div>
  );
}
