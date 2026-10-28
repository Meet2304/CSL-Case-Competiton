"use client";

import { useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, CircleAlert, CircleHelp, Info, X } from "lucide-react";
import { MOCK_AS_OF } from "@/data/mock";
import { relationshipOptions, usStates } from "@/data/will";
import { PEOPLE_LIST_ID, PlannerContext } from "@/components/will/context";
import { cn } from "@/lib/format";
import { emptyPerson, type Address, type Person } from "@/lib/will/types";

/**
 * Building blocks for the will planner screens, in the family dashboard's
 * PNC style: bordered panels, white inputs, pill buttons, and option tiles
 * that turn light blue with a check when chosen.
 */

export const inputClass =
  "w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm text-pnc-ink outline-none placeholder:text-pnc-muted/70 focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15";

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-pnc-line bg-white px-5 py-2.5 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link",
  link: "inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline",
  danger: "text-sm font-semibold text-pnc-negative hover:underline",
};

/** Page title plus optional intro paragraphs above the question card. */
export function PageHeading({
  title,
  aside,
  children,
}: {
  title: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-medium text-pnc-ink @2xl:text-2xl">{title}</h2>
        {aside}
      </div>
      {children && (
        <div className="max-w-3xl space-y-3 text-[0.9375rem] leading-relaxed text-pnc-ink">
          {children}
        </div>
      )}
    </div>
  );
}

/** White panel holding a screen's questions. */
export function QuestionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "space-y-8 rounded-md border border-pnc-line bg-white px-4 py-6 @2xl:px-8 @2xl:py-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Red bar shown at the top of a screen when "Save & Continue" finds problems. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md bg-attention-bg px-4 py-3 text-sm text-attention ring-1 ring-attention-line"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/** One question: label (with optional required star and "?" help), hint, error and the answer control. */
export function Question({
  label,
  required = false,
  help,
  hint,
  error,
  size = "lg",
  children,
}: {
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  hint?: ReactNode;
  error?: string;
  size?: "lg" | "sm";
  children?: ReactNode;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const helpId = useId();
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p
          className={cn(
            "text-pnc-ink",
            size === "lg" ? "text-lg font-semibold leading-snug" : "text-base font-semibold",
          )}
        >
          {label}
          {required && <sup className="ml-0.5">*</sup>}
        </p>
        {help && (
          <button
            type="button"
            aria-label="Help"
            aria-expanded={showHelp}
            aria-controls={helpId}
            onClick={() => setShowHelp((s) => !s)}
            className="shrink-0 rounded-full text-pnc-muted hover:text-pnc-link aria-expanded:text-pnc-link"
          >
            <CircleHelp className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {help && showHelp && (
        <p
          id={helpId}
          className="rounded-md bg-pnc-blue-50 px-4 py-3 text-sm leading-relaxed text-pnc-ink"
        >
          {help}
        </p>
      )}
      {hint && <div className="max-w-3xl text-sm leading-relaxed text-pnc-muted">{hint}</div>}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-attention">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

export type TileOption<V extends string> = { value: V; label: ReactNode };

/** Single-choice answer as large tiles (radio group). */
export function OptionTiles<V extends string>({
  options,
  value,
  onChange,
  label,
  wide = false,
}: {
  options: TileOption<V>[];
  value: V | undefined;
  onChange: (v: V) => void;
  label: string;
  /** Stretch tiles across the row (e.g. the four gender options). */
  wide?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid grid-cols-2 gap-2",
        wide ? "@2xl:grid-cols-4" : "@2xl:grid-cols-[repeat(auto-fill,11.5rem)]",
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex min-h-18 items-center justify-center rounded-md border px-7 py-3 text-center text-sm leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
              selected
                ? "border-pnc-blue-700 bg-pnc-blue-50 font-semibold text-pnc-blue-900 ring-1 ring-pnc-blue-700"
                : "border-pnc-line bg-white text-pnc-ink hover:border-pnc-blue-600 hover:bg-pnc-surface/60",
            )}
          >
            {selected && (
              <span className="absolute right-1.5 top-1.5 grid size-4.5 place-items-center rounded-full bg-pnc-blue-700 text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden="true" />
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small segmented buttons ("Owned by"). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: TileOption<V>[];
  value: V | undefined;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-2 @md:grid-cols-3">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border px-3 py-2 text-sm transition-colors",
              selected
                ? "border-pnc-blue-700 bg-pnc-blue-50 font-semibold text-pnc-blue-900 ring-1 ring-pnc-blue-700"
                : "border-pnc-line bg-white hover:border-pnc-blue-600",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Label + control for form fields (bold label, optional hint line). */
export function Field({
  label,
  required = false,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-sm font-semibold text-pnc-ink">
        {label}
        {required && <sup className="ml-0.5">*</sup>}
      </span>
      {hint && <span className="block text-[0.8125rem] text-pnc-muted">{hint}</span>}
      {children}
      {error && <span className="block text-sm text-attention">{error}</span>}
    </label>
  );
}

/** Native select with the blue chevron box. */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Choose one...",
  required = false,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | readonly [string, string])[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span className={cn("relative block", className)}>
      <select
        value={value}
        required={required}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "appearance-none pr-10", !value && "text-pnc-muted")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const [v, label] = typeof o === "string" ? [o, o] : o;
          return (
            <option key={v} value={v} className="text-pnc-ink">
              {label}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-pnc-blue-700"
        aria-hidden="true"
      />
    </span>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={cn(inputClass, "min-h-20 resize-y", props.className)}
    />
  );
}

/** mm/dd/yyyy date picker (stores ISO yyyy-mm-dd). */
export function DateInput({
  value,
  onChange,
  required = false,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  "aria-label"?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      max={MOCK_AS_OF}
      min="1900-01-01"
      required={required}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

/** "$" amount input; keeps digits, commas and one decimal point. */
export function MoneyInput({
  value,
  onChange,
  required = false,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  "aria-label"?: string;
}) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-pnc-ink">
        $
      </span>
      <input
        inputMode="decimal"
        value={value}
        required={required}
        aria-label={ariaLabel}
        pattern="[0-9,]*(\.[0-9]{0,2})?"
        title="Enter an amount in US dollars, e.g. 25,000"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
        className={cn(inputClass, "pl-7")}
      />
    </span>
  );
}

/** Street / city / state / zip block used by Basics, real estate assets and gifts. */
export function AddressFields({
  value,
  onChange,
}: {
  value: Address;
  onChange: (a: Address) => void;
}) {
  const set = (patch: Partial<Address>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-5">
      <Field label="Street Address 1" required>
        <TextInput
          value={value.street1}
          required
          autoComplete="address-line1"
          onChange={(e) => set({ street1: e.target.value })}
        />
      </Field>
      <Field label="Street Address 2">
        <TextInput
          value={value.street2}
          autoComplete="address-line2"
          onChange={(e) => set({ street2: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 @lg:grid-cols-[1.4fr_1.2fr_1fr]">
        <Field label="City" required>
          <TextInput
            value={value.city}
            required
            autoComplete="address-level2"
            onChange={(e) => set({ city: e.target.value })}
          />
        </Field>
        <Field label="State" required>
          <Select
            value={value.state}
            required
            placeholder="State"
            options={usStates}
            onChange={(state) => set({ state })}
          />
        </Field>
        <Field label="Zip Code" required>
          <TextInput
            value={value.zip}
            required
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="\d{5}(-\d{4})?"
            title="5-digit ZIP code, e.g. 15222"
            onChange={(e) => set({ zip: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
export const choiceLabel = (i: number) => `Full name of ${ordinals[i] ?? `#${i + 1}`} choice`;

/** Dashed full-width button ("Click to add another", "Add Person", ...). */
export function DashedButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border border-dashed border-pnc-blue-600/60 px-4 py-2.5 text-sm font-semibold text-pnc-link hover:border-pnc-blue-600 hover:bg-pnc-blue-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Ordered list of people: "Full name of first choice" + Relationship + Delete,
 * with "Click to add another". With `required`, the first name is required.
 * Family members are suggested as you type; picking one fills in the relationship.
 */
export function PersonList({
  rows,
  onChange,
  required = false,
  nameLabel = choiceLabel,
  relationships = relationshipOptions,
  error,
}: {
  rows: Person[];
  onChange: (rows: Person[]) => void;
  required?: boolean;
  nameLabel?: (i: number) => string;
  relationships?: readonly string[];
  error?: string;
}) {
  const people = useContext(PlannerContext)?.people ?? [];
  const set = (id: string, patch: Partial<Person>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setName = (r: Person, name: string) => {
    const known = people.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    const relationship =
      known && !r.relationship && relationships.includes(known.relationship)
        ? known.relationship
        : r.relationship;
    set(r.id, { name, relationship });
  };
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="grid items-end gap-x-3 gap-y-2 @lg:grid-cols-[1fr_12rem_auto]">
          <Field label={nameLabel(i)}>
            <TextInput
              value={r.name}
              required={required && i === 0}
              autoComplete="off"
              list={people.length ? PEOPLE_LIST_ID : undefined}
              onChange={(e) => setName(r, e.target.value)}
            />
          </Field>
          <Field label="Relationship">
            <Select
              value={r.relationship}
              placeholder=""
              options={relationships}
              onChange={(relationship) => set(r.id, { relationship })}
            />
          </Field>
          <button
            type="button"
            onClick={() => onChange(rows.filter((x) => x.id !== r.id))}
            className={cn(buttonClass.danger, "justify-self-start py-2.5 @lg:px-1")}
          >
            Delete
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-attention">{error}</p>}
      <DashedButton
        onClick={() => onChange([...rows, emptyPerson()])}
        className="@lg:w-[calc(100%-4rem)]"
      >
        Click to add another
      </DashedButton>
    </div>
  );
}

/** Gray note box (e.g. the Mirror Will note under Married). */
export function InfoBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-md bg-pnc-surface px-4 py-3 text-sm leading-relaxed",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Light blue note for something the customer should know before answering. */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-md bg-pnc-blue-50 px-4 py-3 text-sm leading-relaxed">
      <Info className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Underlined link that reveals an explanation in place. */
export function LearnMore({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass.link}
      >
        {label}
      </button>
      {open && (
        <div className="rounded-md bg-pnc-blue-50 px-4 py-3 text-sm leading-relaxed text-pnc-ink">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Modal dialog with a title row and Cancel / primary footer. Rendered
 * in the top layer (native <dialog>) via a portal so its form is never nested
 * in the screen's form.
 */
export function Modal({
  title,
  submitLabel,
  tone = "blue",
  onClose,
  onSubmit,
  extraFooter,
  children,
}: {
  title: string;
  submitLabel: string;
  tone?: "blue" | "green";
  onClose: () => void;
  onSubmit: () => void;
  extraFooter?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="@container m-auto w-[min(40rem,calc(100vw-1.5rem))] rounded-xl bg-white p-0 text-pnc-ink shadow-raised backdrop:bg-pnc-navy/45"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation(); // React bubbles through portals; keep the screen's form out of it.
          onSubmit();
        }}
      >
        <header className="flex items-center justify-between border-b border-pnc-line px-6 py-4">
          <h3 className="font-display text-lg font-medium">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-pnc-muted hover:bg-pnc-surface hover:text-pnc-ink"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="max-h-[70dvh] space-y-5 overflow-y-auto px-6 py-6">{children}</div>
        <footer className="flex items-center justify-end gap-3 border-t border-pnc-line px-6 py-3">
          {extraFooter && <span className="mr-auto">{extraFooter}</span>}
          <button type="button" onClick={onClose} className={buttonClass.secondary}>
            Cancel
          </button>
          <button
            type="submit"
            className={cn(
              buttonClass.primary,
              tone === "green" && "bg-pnc-positive hover:bg-pnc-positive/90",
            )}
          >
            {submitLabel}
          </button>
        </footer>
      </form>
    </dialog>,
    document.body,
  );
}
