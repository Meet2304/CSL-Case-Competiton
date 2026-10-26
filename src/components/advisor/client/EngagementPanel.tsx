"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageSquare, Phone, Users } from "lucide-react";
import { AssistantPanel } from "@/components/advisor/assistant/parts";
import { engagementPlan, type ClientFacts } from "@/lib/assistant";

const channelIcon = { Phone, Email: Mail, Text: MessageSquare, "In person": Users } as const;

/** Next best action, a contact cadence, talking points and a ready-to-edit draft. */
export function EngagementPanel({ facts }: { facts: ClientFacts }) {
  const plan = engagementPlan(facts);
  const [body, setBody] = useState(plan.draft.body);
  const [copied, setCopied] = useState(false);
  const Icon = channelIcon[plan.next.channel as keyof typeof channelIcon] ?? Phone;

  return (
    <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        <AssistantPanel title="Next best action">
          <div className="flex items-start gap-3 rounded-md bg-white p-4 ring-1 ring-pnc-blue-600/10">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-pnc-ink">{plan.next.title}</p>
              <p className="text-sm text-pnc-muted">
                {plan.next.when}, by {plan.next.channel.toLowerCase()}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-pnc-ink">{plan.next.why}</p>
            </div>
          </div>
        </AssistantPanel>

        <section>
          <h3 className="font-display text-lg font-medium text-pnc-ink">
            Draft {plan.draft.channel.toLowerCase()}
          </h3>
          {plan.draft.subject && (
            <p className="mt-2 text-sm">
              <span className="text-pnc-muted">Subject: </span>
              {plan.draft.subject}
            </p>
          )}
          <label className="sr-only" htmlFor="draft-body">
            Message
          </label>
          <textarea
            id="draft-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setCopied(false);
            }}
            rows={11}
            className="mt-2 w-full resize-y rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(plan.draft.subject ? `${plan.draft.subject}\n\n${body}` : body)
                  .then(() => setCopied(true))
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy draft"}
            </button>
            <span className="text-xs text-pnc-muted">
              Edit it in your own words before sending.
            </span>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-md border border-pnc-line p-4">
          <h3 className="font-semibold text-pnc-ink">Cadence</h3>
          <ol className="mt-3 space-y-3">
            {plan.cadence.map((step, i) => (
              <li key={step.when + step.what} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-xs font-semibold text-pnc-blue-800">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-pnc-ink">{step.when}</span>
                  <span className="text-pnc-muted">{step.what}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-md border border-pnc-line p-4">
          <h3 className="font-semibold text-pnc-ink">Talking points</h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug">
            {plan.talkingPoints.map((t) => (
              <li key={t} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-pnc-positive" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold text-pnc-ink">Avoid</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-snug text-pnc-ink">
            {plan.avoid.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
