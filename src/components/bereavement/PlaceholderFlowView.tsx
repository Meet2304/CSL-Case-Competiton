"use client";

import { ArrowLeft, CalendarClock } from "lucide-react";
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

      {item.steps && (
        <section className="mt-5 rounded-md border border-pnc-line bg-white p-4">
          <h3 className="font-semibold text-pnc-ink">What happens</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-pnc-ink">
            {item.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
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
