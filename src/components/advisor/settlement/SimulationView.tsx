"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import type { AdvisorCustomer, ClientProfile } from "@/data/types";
import type { Answers } from "@/lib/settlement/engine";
import { readinessReport, simulatablePeople } from "@/lib/settlement/simulate";
import { cn, formatCompactMoney, formatDate } from "@/lib/format";
import { DeadlineList } from "./DeadlineList";
import { FindingList } from "./FindingList";
import { PlanSection, StatTile } from "./layout";
import { firstName, statusCopy } from "./parts";
import { RouteTable } from "./RouteTable";

/**
 * "What if {person} died today?" — the same rulebook run before a death,
 * turning every bad outcome into a finding with a fix.
 */
export function SimulationView({
  customer,
  profile,
  defaultPerson,
  today,
  answers,
  onAsk,
}: {
  customer: AdvisorCustomer;
  profile: ClientProfile;
  defaultPerson: string;
  today: string;
  answers: Answers;
  onAsk: (q: string) => void;
}) {
  const baseId = useId();
  const people = useMemo(() => simulatablePeople(profile), [profile]);
  const [picked, setPicked] = useState(defaultPerson);
  const person: string | undefined = people.includes(picked) ? picked : people[0];
  const report = useMemo(
    () => (person ? readinessReport(customer, profile, person, today, answers) : undefined),
    [customer, profile, person, today, answers],
  );

  function onRadioKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : people.length - 1;
    const next = people[(index + step) % people.length];
    setPicked(next);
    document.getElementById(`${baseId}-p-${people.indexOf(next)}`)?.focus();
  }

  if (!report || !person)
    return (
      <p className="text-sm text-pnc-muted">
        Nobody in this household owns an account at PNC to simulate.
      </p>
    );

  const t = report.plan.totals;
  const p = firstName(person);
  const status = statusCopy[report.status];
  const names = report.findings.find((f) => f.id === "f.names-deceased");
  const StatusIcon = report.status === "ready" ? ShieldCheck : ShieldAlert;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p id={`${baseId}-label`} className="text-sm font-semibold text-pnc-ink">
            If this person died today ({formatDate(today, "medium")}):
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${baseId}-label`}
            className="inline-flex flex-wrap gap-1 rounded-full bg-pnc-surface p-1"
          >
            {people.map((name, i) => (
              <button
                key={name}
                id={`${baseId}-p-${i}`}
                type="button"
                role="radio"
                aria-checked={name === person}
                tabIndex={name === person ? 0 : -1}
                onClick={() => setPicked(name)}
                onKeyDown={(e) => onRadioKey(e, i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                  name === person
                    ? "bg-white text-pnc-ink shadow-card"
                    : "text-pnc-muted hover:text-pnc-ink",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div
          role="status"
          className={cn("flex items-start gap-3 rounded-md px-4 py-3.5 ring-1", status.tone)}
        >
          <StatusIcon
            className={cn(
              "mt-0.5 size-5 shrink-0",
              report.status === "ready"
                ? "text-pnc-positive"
                : report.status === "gaps"
                  ? "text-pnc-orange-600"
                  : "text-attention",
            )}
            aria-hidden="true"
          />
          <p className="text-md leading-relaxed">
            <span className="font-semibold">{status.label}.</span>{" "}
            {t.probate > 0
              ? `If ${p} died today, ${formatCompactMoney(t.probate)} would go through probate`
              : `If ${p} died today, nothing at PNC would go through probate`}
            {names
              ? `, and ${names.holdingIds.length} beneficiary designation${names.holdingIds.length > 1 ? "s name" : " names"} someone who has died.`
              : "."}{" "}
            {report.findings.length > 0
              ? `${report.findings.length} thing${report.findings.length > 1 ? "s" : ""} to fix while ${p} can still sign the forms.`
              : "Every account would pass the way it's set up."}{" "}
            <span className="text-pnc-muted">
              {firstName(report.survivor)} would be the main survivor.
            </span>
          </p>
        </div>

        <div className="flex justify-end">
          <MockBadge />
        </div>
        <dl className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
          <StatTile
            label="Would pass outside probate"
            value={<Money value={t.outsideProbate} compact />}
            tone="positive"
          />
          <StatTile
            label="Would go through probate"
            value={<Money value={t.probate} compact />}
            tone={t.probate > 0 ? "attention" : "default"}
          />
          <StatTile
            label="Keeps working with no paperwork"
            value={<Money value={t.uninterrupted} compact />}
          />
          <StatTile
            label="Things to fix"
            value={report.findings.length}
            tone={report.status === "exposed" ? "attention" : "default"}
          />
        </dl>
      </div>

      <PlanSection
        id={`${baseId}-findings`}
        title="What to fix now"
        count={report.findings.length}
        intro="Same rules as after a death — run while there's still time to change the outcome."
      >
        <FindingList findings={report.findings} onAsk={onAsk} />
      </PlanSection>

      <PlanSection
        id={`${baseId}-accounts`}
        title={`What would happen to ${p}'s accounts`}
        count={report.plan.accounts.length}
      >
        <RouteTable
          accounts={report.plan.accounts}
          survivor={report.survivor}
          mode="simulation"
          onAsk={onAsk}
        />
      </PlanSection>

      <details className="group rounded-md border border-pnc-line">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-pnc-ink marker:hidden hover:text-pnc-link">
          Dates this would start ({report.plan.deadlines.length})
          <span className="ml-2 font-normal text-pnc-muted">
            — hypothetical, if it happened today
          </span>
        </summary>
        <div className="border-t border-pnc-line px-4 py-4">
          <DeadlineList
            deadlines={report.plan.deadlines}
            holdings={report.plan.accounts.map((a) => a.holding)}
            today={today}
            survivor={report.survivor}
            hypothetical
          />
        </div>
      </details>
    </div>
  );
}
