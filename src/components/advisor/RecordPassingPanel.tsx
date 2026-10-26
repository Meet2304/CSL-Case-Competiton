"use client";

import { useId, useState } from "react";
import { FilePlus2, RotateCcw } from "lucide-react";
import { advisorCustomers } from "@/data/advisor";
import { SELF_HOUSEHOLD_ID } from "@/data/bereavement";
import { MOCK_AS_OF } from "@/data/mock";
import type { LossEvent } from "@/data/types";
import { openLoss } from "@/lib/advisor";
import { bereavementActions, type RecordedLoss } from "@/lib/bereavement";
import { useAdvisorBook } from "./useAdvisorBook";

const reportedOptions: LossEvent["reportedVia"][] = [
  "Phone call",
  "Branch visit",
  "Estate attorney",
  "Mobile app",
];
const households = advisorCustomers.filter((c) => c.household.length > 0);

const input =
  "mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2 text-sm outline-none focus:border-pnc-link";
const label = "block text-xs font-semibold text-pnc-ink";

/**
 * Bank-side entry point: record that a member of a customer's household has
 * died. This starts the advisor's outreach and the family's next-steps journey.
 */
export function RecordPassingPanel({ className }: { className?: string }) {
  const { customers, recorded } = useAdvisorBook();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(SELF_HOUSEHOLD_ID);
  const household = households.find((h) => h.id === customerId) ?? households[0];
  const [memberName, setMemberName] = useState(household.household[0].name);
  const [date, setDate] = useState(MOCK_AS_OF);
  const [reportedVia, setReportedVia] = useState<LossEvent["reportedVia"]>("Phone call");

  const member = household.household.find((m) => m.name === memberName) ?? household.household[0];
  const current = customers.find((c) => c.id === household.id);
  const alreadyOpen = current && openLoss(current)?.memberName === member.name;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (alreadyOpen) return;
    const loss: Omit<RecordedLoss, "id"> = {
      customerId: household.id,
      memberName: member.name,
      relationship: member.relationship,
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
        {recorded.length > 0 && (
          <button
            type="button"
            onClick={bereavementActions.reset}
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
            Recording a death notifies the family&apos;s accounts and starts their guided next
            steps.
          </p>
          <div className="mt-3 grid gap-3 @2xl:grid-cols-4">
            <div>
              <label htmlFor={`${id}-household`} className={label}>
                Customer
              </label>
              <select
                id={`${id}-household`}
                value={household.id}
                onChange={(e) => {
                  const next = households.find((h) => h.id === e.target.value)!;
                  setCustomerId(next.id);
                  setMemberName(next.household[0].name);
                }}
                className={input}
              >
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-member`} className={label}>
                Who passed away
              </label>
              <select
                id={`${id}-member`}
                value={member.name}
                onChange={(e) => setMemberName(e.target.value)}
                className={input}
              >
                {household.household.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.relationship.toLowerCase()})
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
              disabled={alreadyOpen}
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
            {alreadyOpen && (
              <span className="text-xs text-pnc-muted">This passing is already recorded.</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
