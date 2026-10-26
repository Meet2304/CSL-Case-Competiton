"use client";

import { useId, useState } from "react";
import { FilePlus2, RotateCcw } from "lucide-react";
import { advisorCustomers } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import type { LossEvent } from "@/data/types";
import { customerDirectory } from "@/lib/advisor";
import { bereavementActions, type RecordedLoss } from "@/lib/bereavement";
import { caseworkActions, useHasCasework } from "@/lib/settlement/casework";
import { reviewActions, useReviews } from "@/lib/settlement/reviews";
import { useAdvisorBook } from "./useAdvisorBook";

const reportedOptions: LossEvent["reportedVia"][] = [
  "Phone call",
  "Branch visit",
  "Estate attorney",
  "Mobile app",
];
const people = customerDirectory(advisorCustomers);
const DEFAULT_PERSON = "Casey Sample";

const input =
  "mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2 text-sm outline-none focus:border-pnc-link";
const label = "block text-xs font-semibold text-pnc-ink";

/**
 * Bank-side intake: record that a customer has died. Only the person, date and
 * source are taken here — the impact on their family is assessed afterwards
 * from the household records (see the outreach banner).
 */
export function RecordPassingPanel({ className }: { className?: string }) {
  const { recorded } = useAdvisorBook();
  const reviews = useReviews();
  const hasCasework = useHasCasework();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState(
    people.includes(DEFAULT_PERSON) ? DEFAULT_PERSON : people[0],
  );
  const [date, setDate] = useState(MOCK_AS_OF);
  const [reportedVia, setReportedVia] = useState<LossEvent["reportedVia"]>("Phone call");

  const alreadyRecorded = recorded.some((l) => l.personName === personName);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (alreadyRecorded) return;
    const loss: Omit<RecordedLoss, "id"> = {
      personName,
      date,
      reportedVia,
      recordedOn: MOCK_AS_OF,
    };
    bereavementActions.recordLoss(loss);
    setOpen(false);
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-form`}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 rounded-full border border-pnc-line bg-white px-4 py-2 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link"
        >
          <FilePlus2 className="size-4" aria-hidden="true" /> Record a death notice
        </button>
        {(recorded.length > 0 || Object.keys(reviews).length > 0 || hasCasework) && (
          <button
            type="button"
            onClick={() => {
              bereavementActions.reset();
              reviewActions.reset();
              caseworkActions.reset();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-pnc-muted hover:text-pnc-link"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset demo
          </button>
        )}
      </div>

      {open && (
        <form
          id={`${id}-form`}
          onSubmit={submit}
          className="mt-3 rounded-md bg-white p-4 shadow-card"
          aria-label="Record a death notice"
        >
          <p className="text-sm text-pnc-muted">
            Record the customer who passed away. We&apos;ll assess how it affects their family from
            the household records.
          </p>
          <div className="mt-3 grid gap-3 @2xl:grid-cols-3">
            <div>
              <label htmlFor={`${id}-person`} className={label}>
                Customer who passed away
              </label>
              <select
                id={`${id}-person`}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className={input}
              >
                {people.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-date`} className={label}>
                Date of death
              </label>
              <input
                id={`${id}-date`}
                type="date"
                value={date}
                max={MOCK_AS_OF}
                required
                onChange={(e) => setDate(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label htmlFor={`${id}-via`} className={label}>
                How we heard
              </label>
              <select
                id={`${id}-via`}
                value={reportedVia}
                onChange={(e) => setReportedVia(e.target.value as LossEvent["reportedVia"])}
                className={input}
              >
                {reportedOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={alreadyRecorded}
              className="rounded-full bg-pnc-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800 disabled:opacity-50"
            >
              Record and notify
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-pnc-muted hover:text-pnc-link"
            >
              Cancel
            </button>
            {alreadyRecorded && (
              <span className="text-xs text-pnc-muted">
                {personName}&apos;s death is already recorded.
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
