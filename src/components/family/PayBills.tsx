"use client";

import { useId, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { billCategories } from "@/components/shared/catalog";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import { billers, MOCK_AS_OF } from "@/data/mock";
import type { BillCategory, Biller } from "@/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { accountLabel, assetsFor, canPayFrom, type PersonAsset } from "@/lib/household";
import { fieldInput, fieldLabel, primaryButton, secondaryButton } from "./parts";

/**
 * Everyday payments (electricity, phone, rent, tuition, ...) as a grid of
 * tiles under People. Each opens a short payment from an account the viewer
 * may pay from: their own, or a family account their role lets them pay and
 * transfer from. Someone with no such account gets no section at all.
 */
export function PayBills() {
  const { person, accounts, household, deceasedIds } = useViewer();
  const [open, setOpen] = useState<BillCategory | null>(null);
  const from = assetsFor(household, person.id, accounts, deceasedIds).filter((i) =>
    canPayFrom(i, person.id),
  );
  if (from.length === 0) return null;
  const category = billCategories.find((c) => c.id === open);
  const biller = billers.find((b) => b.category === open);

  return (
    <section aria-labelledby="pay-bills-title" className="rounded-lg bg-white shadow-card">
      <header className="border-b border-pnc-line px-5 py-4">
        <h3 id="pay-bills-title" className="font-semibold text-pnc-ink">
          Pay bills
        </h3>
        <p className="text-sm text-pnc-muted">From your own or shared family accounts.</p>
      </header>
      <ul className="grid grid-cols-3 gap-x-1 gap-y-4 px-3 py-4 @md:grid-cols-4 @2xl:grid-cols-6 @4xl:grid-cols-3">
        {billCategories.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setOpen(id)}
              className="group flex w-full flex-col items-center gap-1.5 rounded-lg p-1 text-center focus-visible:outline-2 focus-visible:outline-pnc-link"
            >
              <span className="grid size-12 place-items-center rounded-2xl border border-pnc-line bg-white text-pnc-blue-700 shadow-card transition-colors group-hover:border-pnc-link group-hover:bg-pnc-blue-50">
                <Icon className="size-5.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-xs leading-tight text-pnc-ink">{label}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title={category?.label ?? "Pay a bill"}
        description={
          biller && `${biller.payee}${biller.last4 ? ` · account ending ${biller.last4}` : ""}`
        }
      >
        {biller && (
          <PayForm key={biller.category} biller={biller} from={from} onDone={() => setOpen(null)} />
        )}
      </Dialog>
    </section>
  );
}

type Done = { amount: number; account: string; when: string; confirmation: string };

/** A short, stable reference for a payment (MOCK: real ones come from the payments system). */
const confirmationFor = (biller: Biller, amount: number) =>
  `PNC-${biller.last4 ?? "0000"}-${String(Math.round(amount * 100) % 100000).padStart(5, "0")}`;

function PayForm({
  biller,
  from,
  onDone,
}: {
  biller: Biller;
  from: PersonAsset[];
  onDone: () => void;
}) {
  const id = useId();
  const [fromId, setFromId] = useState(from[0].account.id);
  const [amount, setAmount] = useState(biller.amountDue?.toFixed(2) ?? "");
  const [when, setWhen] = useState<"today" | "due">("today");
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const account = from.find((i) => i.account.id === fromId)!.account;
  const value = Number.parseFloat(amount.replace(/[$,]/g, ""));
  const error = !(value > 0)
    ? "Enter an amount to pay."
    : value > account.balance
      ? `That's more than the ${formatMoney(account.balance)} in ${accountLabel(account)}.`
      : null;

  if (done)
    return (
      <div className="px-5 py-6 text-center">
        <CircleCheck className="mx-auto size-10 text-pnc-positive" aria-hidden="true" />
        <p role="status" className="mt-3 font-display text-xl font-medium text-pnc-ink">
          Payment scheduled
        </p>
        <p className="mt-1 text-sm leading-relaxed text-pnc-muted">
          {formatMoney(done.amount)} to {biller.payee} from {done.account}, {done.when}.
        </p>
        <p className="mt-2 text-xs text-pnc-muted">Confirmation {done.confirmation}</p>
        <button type="button" onClick={onDone} className={`${primaryButton} mt-5`}>
          Done
        </button>
      </div>
    );

  return (
    <form
      noValidate
      className="space-y-4 px-5 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return;
        setDone({
          amount: value,
          account: accountLabel(account),
          when:
            when === "due" && biller.dueDate
              ? `on ${formatDate(biller.dueDate, "medium")}`
              : `today, ${formatDate(MOCK_AS_OF, "medium")}`,
          confirmation: confirmationFor(biller, value),
        });
      }}
    >
      <div className="flex items-start justify-between gap-3 rounded-md bg-pnc-surface px-4 py-3">
        {biller.amountDue !== undefined ? (
          <div>
            <p className="text-xs text-pnc-muted">Amount due</p>
            <Money value={biller.amountDue} className="text-lg font-semibold text-pnc-ink" />
            {biller.dueDate && (
              <p className="text-xs text-pnc-muted">Due {formatDate(biller.dueDate, "medium")}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-pnc-ink">Choose how much to pay.</p>
        )}
        <MockBadge />
      </div>

      <div>
        <label htmlFor={`${id}-from`} className={fieldLabel}>
          Pay from
        </label>
        <select
          id={`${id}-from`}
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          className={fieldInput}
        >
          {from.map((i) => (
            <option key={i.account.id} value={i.account.id}>
              {accountLabel(i.account)} · {formatMoney(i.account.balance)}
              {i.relation === "shared" && i.family ? ` · ${i.family.familyName}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-amount`} className={fieldLabel}>
            Amount
          </label>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            aria-invalid={submitted && error ? true : undefined}
            aria-describedby={submitted && error ? `${id}-amount-error` : undefined}
            className={fieldInput}
          />
          {submitted && error && (
            <p id={`${id}-amount-error`} className="mt-1 text-xs text-pnc-negative">
              {error}
            </p>
          )}
        </div>
        {biller.dueDate && (
          <div>
            <label htmlFor={`${id}-when`} className={fieldLabel}>
              When
            </label>
            <select
              id={`${id}-when`}
              value={when}
              onChange={(e) => setWhen(e.target.value as "today" | "due")}
              className={fieldInput}
            >
              <option value="today">Today</option>
              <option value="due">On the due date</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-pnc-line pt-4">
        <button type="button" onClick={onDone} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" className={primaryButton}>
          {value > 0 ? `Pay ${formatMoney(value)}` : "Pay"}
        </button>
      </div>
    </form>
  );
}
