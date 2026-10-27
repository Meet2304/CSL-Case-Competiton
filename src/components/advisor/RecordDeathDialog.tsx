"use client";

import { useId, useState } from "react";
import { FilePlus2, RotateCcw } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Dialog } from "@/components/ui/Dialog";
import { advisorCustomers } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import type { LossEvent } from "@/data/types";
import { customerDirectory } from "@/lib/advisor";
import { bereavementActions, type RecordedLoss } from "@/lib/bereavement";
import { householdActions } from "@/lib/householdStore";
import { caseworkActions, useHasCasework } from "@/lib/settlement/casework";
import { reviewActions, useReviews } from "@/lib/settlement/reviews";
import { resetAllWills } from "@/lib/will/storage";
import { useAdvisorBook } from "./useAdvisorBook";

const reportedOptions: LossEvent["reportedVia"][] = [
  "Phone call",
  "Branch visit",
  "Estate attorney",
  "Mobile app",
];
const people = customerDirectory(advisorCustomers);
// In the demo story Jordan is the one who dies; Casey, Avery and Riley survive.
const DEFAULT_PERSON = "Jordan Sample";

const input =
  "mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-pnc-link";
const label = "block text-xs font-semibold text-pnc-ink";

/** The ⋮ menu on the customer list: rare, book-level actions. */
export function BookActions() {
  const [recording, setRecording] = useState(false);
  const touched = useDemoTouched();
  return (
    <>
      <ActionMenu
        label="More actions"
        actions={[
          { label: "Record a death notice", icon: FilePlus2, onSelect: () => setRecording(true) },
          ...(touched
            ? [{ label: "Reset demo", icon: RotateCcw, onSelect: resetDemo, subtle: true }]
            : []),
        ]}
      />
      <RecordDeathDialog open={recording} onClose={() => setRecording(false)} />
    </>
  );
}

/** Whether there is anything for "Reset demo" to undo. */
export function useDemoTouched(): boolean {
  const { recorded } = useAdvisorBook();
  const reviews = useReviews();
  const hasCasework = useHasCasework();
  return recorded.length > 0 || Object.keys(reviews).length > 0 || hasCasework;
}

/** Clears every recorded death, answer, review and saved will in this browser. */
export function resetDemo() {
  bereavementActions.reset();
  reviewActions.reset();
  caseworkActions.reset();
  householdActions.reset();
  resetAllWills();
}

/**
 * Bank-side intake, opened from the Next Steps menu: record that a customer
 * has died. Only the person, date and source are taken here — the impact on
 * their family is assessed afterwards from the household records (see the
 * outreach banner).
 */
export function RecordDeathDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { recorded } = useAdvisorBook();
  const id = useId();
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
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record a death notice"
      description="We'll assess how it affects their family from the household records."
    >
      {open && (
        <form onSubmit={submit} className="p-5" aria-label="Record a death notice">
          <div className="grid gap-4">
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
              onClick={onClose}
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
    </Dialog>
  );
}
