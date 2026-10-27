"use client";

import { useId, useState } from "react";
import { Info, PencilLine } from "lucide-react";
import { nameList } from "@/components/customer/AccountList";
import { useViewer } from "@/components/customer/Viewer";
import { Money } from "@/components/ui/Money";
import { people } from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import type { BankAccount } from "@/data/types";
import { cn } from "@/lib/format";
import {
  accountLabel,
  accountsOf,
  designationTerm,
  isMinor,
  relationshipTo,
  takesBeneficiary,
} from "@/lib/household";
import { householdActions } from "@/lib/householdStore";

/**
 * Who inherits each of the signed-in person's accounts directly, outside the
 * will. Each account with a designation can be edited in place.
 */
export function Beneficiaries() {
  const { person, accounts, deceasedIds } = useViewer();
  const owned = accountsOf(accounts, person.id).owned.filter(takesBeneficiary);
  const names = nameList(deceasedIds);

  return (
    <section id="beneficiaries" aria-labelledby="bens-title" className="scroll-mt-24">
      <h2 id="bens-title" className="font-display text-2xl font-medium text-pnc-ink">
        Beneficiaries
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pnc-ink">
        A beneficiary inherits an account directly when you die, without waiting for probate. It
        overrides your will for that account, so keep these up to date.
      </p>
      {owned.length === 0 ? (
        <p className="mt-4 text-sm text-pnc-muted">None of your accounts take a beneficiary.</p>
      ) : (
        <ul className="mt-4 divide-y divide-pnc-line rounded-lg border border-pnc-line bg-white">
          {owned.map((a) => (
            <BeneficiaryRow
              key={a.id}
              account={a}
              current={names(a.beneficiaries ?? [])}
              stale={(a.beneficiaries ?? []).some((id) => deceasedIds.includes(id))}
              choices={people.filter(
                (p) =>
                  p.id !== person.id && !deceasedIds.includes(p.id) && p.relationship !== "Other",
              )}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function BeneficiaryRow({
  account: a,
  current,
  stale,
  choices,
}: {
  account: BankAccount;
  current: string;
  stale: boolean;
  choices: typeof people;
}) {
  const { person } = useViewer();
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>(a.beneficiaries ?? []);
  const minors = choices.filter((p) => picked.includes(p.id) && isMinor(p, MOCK_AS_OF));

  return (
    <li className="px-4 py-4 @2xl:px-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-semibold text-pnc-ink">{accountLabel(a)}</p>
          <p className="text-sm text-pnc-muted">
            <Money value={a.balance} compact /> · {designationTerm(a)}
          </p>
          {!editing && (
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                stale ? "text-attention" : current ? "text-pnc-ink" : "text-pnc-orange-600",
              )}
            >
              {current ? `Beneficiary: ${current}` : "No beneficiary named"}
            </p>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setPicked((a.beneficiaries ?? []).filter((x) => choices.some((p) => p.id === x)));
              setEditing(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-pnc-link ring-1 ring-pnc-line hover:ring-pnc-link"
          >
            <PencilLine className="size-3.5" aria-hidden="true" />
            {current ? "Change" : "Add beneficiary"}
            <span className="sr-only"> for {accountLabel(a)}</span>
          </button>
        )}
      </div>

      {editing && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            householdActions.setBeneficiaries(a.id, picked);
            setEditing(false);
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium text-pnc-ink">
              Who should inherit {a.name}? They share it equally.
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {choices.map((p) => {
                const on = picked.includes(p.id);
                return (
                  <label
                    key={p.id}
                    htmlFor={`${id}-${p.id}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm ring-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-pnc-link",
                      on
                        ? "bg-pnc-blue-50 ring-pnc-blue-700"
                        : "ring-pnc-line hover:ring-pnc-muted",
                    )}
                  >
                    <input
                      id={`${id}-${p.id}`}
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setPicked((xs) => (on ? xs.filter((x) => x !== p.id) : [...xs, p.id]))
                      }
                      className="size-4 accent-pnc-blue-700"
                    />
                    {p.name}
                    <span className="text-pnc-muted">{relationshipTo(person, p)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {minors.length > 0 && (
            <p className="flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-sm leading-relaxed text-pnc-ink">
              <Info className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
              {minors.map((m) => m.name.split(" ")[0]).join(" and ")}{" "}
              {minors.length > 1 ? "are" : "is"} under 18 and can&apos;t take an account directly. A
              custodian holds it for them until they turn 18 — your advisor can help set that up.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-pnc-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-pnc-muted hover:text-pnc-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
