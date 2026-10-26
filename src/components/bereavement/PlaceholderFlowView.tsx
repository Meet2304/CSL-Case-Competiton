"use client";

import { ArrowLeft, CalendarClock } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { familyAsset, placeholderSteps, supportPeople, type AssetGroup } from "@/data/bereavement";
import { methodLabels } from "@/data/family";
import { stepsFor } from "@/lib/family";

/**
 * Placeholder for assets without a guided flow yet: what's generally needed,
 * and a way to get help from the advisor in the meantime.
 */
export function PlaceholderFlowView({ group, onBack }: { group: AssetGroup; onBack: () => void }) {
  const assets = group.assetIds.map(familyAsset);
  const first = assets[0];
  const steps = first.method
    ? stepsFor(first).map((s) => s.label)
    : (placeholderSteps[group.id] ?? ["Your advisor will confirm exactly what's needed"]);
  const advisorContact = supportPeople[0];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All next steps
      </button>
      <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">{group.title}</h2>
      <ul className="mt-2 space-y-1 text-sm text-pnc-ink">
        {assets.map((a) => (
          <li key={a.id}>
            {a.name}
            {a.last4 && <span className="text-pnc-muted"> x{a.last4}</span>} ·{" "}
            <Money value={a.value} className="font-semibold" />
            {a.method && <span className="text-pnc-muted"> · {methodLabels[a.method]}</span>}
          </li>
        ))}
      </ul>

      <section className="mt-5 rounded-md border border-pnc-line bg-white p-4">
        <h3 className="font-semibold text-pnc-ink">What&apos;s usually needed</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-pnc-ink">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <p className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-pnc-blue-50 p-4 text-sm text-pnc-ink">
        <CalendarClock className="size-5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          A guided flow for this is coming soon. In the meantime, {advisorContact.name} can take
          care of it with you.
        </span>
        <a href="#" className="font-semibold text-pnc-link hover:underline">
          {advisorContact.action}
        </a>
      </p>
    </div>
  );
}
