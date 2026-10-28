"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  GraduationCap,
  Globe,
  HandHeart,
  Leaf,
  Medal,
  PawPrint,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { NavButtons, usePlanner } from "@/components/will/context";
import {
  buttonClass,
  DashedButton,
  Field,
  Modal,
  OptionTiles,
  PageHeading,
  Question,
  QuestionCard,
  Select,
  TextInput,
} from "@/components/will/ui";
import type { CharityCause } from "@/data/types";
import { charityCauses, placeholderCharities, relationshipOptions } from "@/data/will";
import { cn } from "@/lib/format";
import {
  contingentLines,
  lastResortSummary,
  primarySummary,
  secondaryQuestion,
  tertiaryQuestion,
} from "@/lib/will/describe";
import {
  firstScreenOf,
  lastResortOptions,
  primaryOptions,
  primaryRows,
  round2,
  secondaryOptions,
  spouseName,
  tertiaryOptions,
  toggleCharity,
  totalPercent,
  type Option,
} from "@/lib/will/flow";
import { newId, type Beneficiary, type Distribution, type WillDraft } from "@/lib/will/types";

const causeIcons: Record<CharityCause, LucideIcon> = {
  Health: Stethoscope,
  Education: GraduationCap,
  Environment: Leaf,
  Animals: PawPrint,
  Veterans: Medal,
  "Human Services": HandHeart,
  International: Globe,
};

const FEATURED = "Featured Nonprofits";

export function CausesScreen() {
  const { draft, update, skip } = usePlanner();
  const [cause, setCause] = useState(FEATURED);
  const [adding, setAdding] = useState(false);
  const selected = draft.residuary.charities;
  const shown = placeholderCharities.filter((c) =>
    cause === FEATURED ? c.featured : c.cause === cause,
  );
  const custom = selected.filter((name) => !placeholderCharities.some((c) => c.name === name));

  const card = (key: string, name: string, icon: LucideIcon, blurb?: string) => {
    const on = selected.includes(name);
    const Icon = icon;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={on}
        title={blurb}
        onClick={() => update((d) => toggleCharity(d, name))}
        className={cn(
          "relative flex min-h-40 flex-col overflow-hidden rounded-md border bg-white text-left transition-colors",
          on
            ? "border-pnc-blue-700 ring-2 ring-pnc-blue-700"
            : "border-pnc-line hover:border-pnc-blue-600",
        )}
      >
        <span className="grid h-20 place-items-center bg-pnc-blue-50 text-pnc-blue-700">
          <Icon className="size-9" strokeWidth={1.25} aria-hidden="true" />
        </span>
        {on && (
          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-pnc-blue-700 text-white">
            <Check className="size-4" aria-hidden="true" />
          </span>
        )}
        <span className="flex flex-1 items-center justify-center px-3 py-3 text-center text-sm leading-snug">
          {name}
        </span>
      </button>
    );
  };

  return (
    <>
      <PageHeading title="What do you care about?" aside={<MockBadge />}>
        <p>
          Many people use their will to support a cause they care about, such as medical research,
          human rights, environmental conservation, and education. Will you consider leaving a gift
          in support of a cause that is important to you? Click &lsquo;No thanks&rsquo; if you
          don&apos;t want to leave any gifts to charity at this time.
        </p>
      </PageHeading>

      <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        Browse by causes:
        <Select
          value={cause}
          placeholder={FEATURED}
          options={charityCauses}
          onChange={(v) => setCause(v || FEATURED)}
          className="w-64 font-normal"
          aria-label="Browse by causes"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
        {shown.map((c) => card(c.id, c.name, causeIcons[c.cause], c.blurb))}
        {cause === FEATURED && custom.map((name) => card(name, name, HandHeart))}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-h-40 rounded-md border border-dashed border-pnc-blue-600/60 px-4 font-semibold text-pnc-link hover:border-pnc-blue-600 hover:bg-pnc-blue-50"
        >
          Choose another nonprofit
        </button>
      </div>

      <NavButtons
        extra={
          <button
            type="button"
            onClick={() => {
              update((d) =>
                d.residuary.charities.reduce((acc, name) => toggleCharity(acc, name), d),
              );
              skip();
            }}
            className={buttonClass.secondary}
          >
            No thanks
          </button>
        }
      />

      {adding && (
        <BeneficiaryModal
          kind="charity"
          onClose={() => setAdding(false)}
          onSave={(b) => {
            if (!selected.includes(b.name)) update((d) => toggleCharity(d, b.name));
            setAdding(false);
          }}
        />
      )}
    </>
  );
}

export function ConsentScreen() {
  const { draft, update, errors } = usePlanner();
  return (
    <>
      <PageHeading title="Supporting nonprofits" />
      <QuestionCard>
        <Question
          label="Will you make the work of nonprofits easier by letting them know who you are?"
          required
          error={errors.consent}
          hint="Anonymous gifts may be less helpful to nonprofits because they often cannot be included in planned giving goals."
          help="If you agree, the nonprofits you name may be told about your intended gift so they can thank you and plan for it. The rest of your will stays private."
        >
          <OptionTiles
            label="Let nonprofits know who you are"
            options={[
              { value: "yes", label: "Sure, let them know" },
              { value: "no", label: "No, I do not consent" },
            ]}
            value={draft.residuary.consent}
            onChange={(consent) =>
              update((d) => ({ ...d, residuary: { ...d.residuary, consent } }))
            }
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

type DistKey = "primary" | "secondary" | "tertiary" | "lastResort";

function setDistribution<K extends DistKey>(
  d: WillDraft,
  key: K,
  patch: Partial<WillDraft["residuary"][K]>,
): WillDraft {
  return { ...d, residuary: { ...d.residuary, [key]: { ...d.residuary[key], ...patch } } };
}

function Term({ children, title }: { children: ReactNode; title: string }) {
  return (
    <span title={title} className="underline decoration-1 underline-offset-4">
      {children}
    </span>
  );
}

export function PrimaryScreen() {
  const { draft, update, errors } = usePlanner();
  const { plan, beneficiaries } = draft.residuary.primary;
  const rows = primaryRows(draft);
  const setRows = (next: Beneficiary[]) =>
    update((d) =>
      setDistribution(d, "primary", {
        // In "rest to spouse" mode only charities are edited; keep any people from a custom plan.
        beneficiaries:
          plan === "spouse"
            ? [...beneficiaries.filter((b) => b.kind !== "charity"), ...next]
            : next,
      }),
    );

  return (
    <>
      <PageHeading
        title={
          <>
            <Term title="First in line to inherit">Primary beneficiaries</Term> of your residual
            estate
          </>
        }
      >
        <p>A primary beneficiary is first in line to inherit property when you pass away.</p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Who should inherit your residual estate when you pass away?"
          required
          error={errors.plan}
          hint="You will be able to specify on the next page what will happen if any of the beneficiaries specified below do not survive you."
          help="Your residual estate is everything you own at death that isn't left as a specific gift and doesn't pass outside your will (like joint accounts or life insurance)."
        >
          <OptionTiles
            label="Primary beneficiaries"
            options={primaryOptions(draft)}
            value={plan}
            onChange={(p) => update((d) => setDistribution(d, "primary", { plan: p }))}
          />
        </Question>
        {plan === "custom" && (
          <AllocationEditor rows={rows} onChange={setRows} error={errors.allocation} />
        )}
        {plan === "spouse" && rows.length > 0 && (
          <AllocationEditor
            rows={rows}
            onChange={setRows}
            error={errors.allocation}
            charityOnly
            spouseRest={spouseName(draft)}
          />
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}

function ContingentScreen<K extends "secondary" | "tertiary" | "lastResort">({
  field,
  title,
  intro,
  question,
  options,
  help,
}: {
  field: K;
  title: ReactNode;
  intro: string;
  question: string;
  options: Option<NonNullable<WillDraft["residuary"][K]["plan"]>>[];
  help: string;
}) {
  const { draft, update, errors } = usePlanner();
  const dist = draft.residuary[field] as Distribution<string>;
  const charityOnly = dist.plan === "charity";
  const rows = charityOnly
    ? dist.beneficiaries.filter((b) => b.kind === "charity")
    : dist.beneficiaries;
  const setRows = (next: Beneficiary[]) =>
    update((d) =>
      setDistribution(d, field, {
        beneficiaries: charityOnly
          ? [...dist.beneficiaries.filter((b) => b.kind !== "charity"), ...next]
          : next,
      } as Partial<WillDraft["residuary"][K]>),
    );

  return (
    <>
      <PageHeading title={title}>
        <p>{intro}</p>
      </PageHeading>
      <QuestionCard>
        <Question label={question} required error={errors.plan} help={help}>
          <OptionTiles
            label={question}
            options={options}
            value={dist.plan as WillDraft["residuary"][K]["plan"]}
            onChange={(p) =>
              update((d) =>
                setDistribution(d, field, { plan: p } as Partial<WillDraft["residuary"][K]>),
              )
            }
          />
        </Question>
        {(dist.plan === "charity" || dist.plan === "custom") && (
          <AllocationEditor
            rows={rows}
            onChange={setRows}
            error={errors.allocation}
            charityOnly={charityOnly}
          />
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function SecondaryScreen() {
  const { draft } = usePlanner();
  return (
    <ContingentScreen
      field="secondary"
      title={
        <>
          <Term title="Alternate or contingent beneficiaries">Secondary beneficiaries</Term> of your
          residual estate
        </>
      }
      intro="A secondary beneficiary (also known as an alternate, or contingent, beneficiary) will inherit property only if the primary beneficiary or beneficiaries do not survive you."
      question={secondaryQuestion(draft)}
      options={secondaryOptions(draft)}
      help="Naming a backup keeps your estate from passing under state law if a beneficiary dies before you."
    />
  );
}

export function TertiaryScreen() {
  const { draft } = usePlanner();
  return (
    <ContingentScreen
      field="tertiary"
      title={
        <>
          <Term title="Next in line after secondary beneficiaries">Tertiary beneficiaries</Term> of
          your residual estate
        </>
      }
      intro="A tertiary beneficiary is the next to inherit property if the primary and secondary beneficiaries do not survive you."
      question={tertiaryQuestion(draft)}
      options={tertiaryOptions}
      help="This only applies if everyone you named so far dies before you."
    />
  );
}

export function LastResortScreen() {
  return (
    <ContingentScreen
      field="lastResort"
      title="Takers of last resort"
      intro="The takers of last resort will inherit any leftover property if all named beneficiaries do not survive you."
      question="Who should inherit your estate property if all of your named beneficiaries do not survive you?"
      options={lastResortOptions}
      help="Your heirs are the relatives your state's law would choose if you had no will, usually your closest living family."
    />
  );
}

export function ResiduarySummaryScreen() {
  const { draft, goTo } = usePlanner();
  const lines = contingentLines(draft);
  return (
    <>
      <PageHeading title="Summary of residuary distribution">
        <p>
          This is a summary of your residuary distribution as previously specified. If you would
          like to make any changes, press &lsquo;Edit&rsquo; to return to the beginning of this
          section, otherwise click &lsquo;Save &amp; Continue&rsquo; below.
        </p>
      </PageHeading>
      <ResiduarySummaryCard
        primary={primarySummary(draft)}
        contingent={lines}
        lastResort={lastResortSummary(draft)}
        onEdit={() => goTo(firstScreenOf(draft, 3))}
      />
      <NavButtons />
    </>
  );
}

export function ResiduarySummaryCard({
  primary,
  contingent,
  lastResort,
  onEdit,
}: {
  primary: string;
  contingent: string[];
  lastResort: string;
  onEdit: () => void;
}) {
  const label = "mb-1.5 text-xs font-semibold text-pnc-muted";
  return (
    <section className="overflow-hidden rounded-md border border-pnc-line bg-white">
      <h3 className="border-b border-pnc-line bg-pnc-surface/60 px-5 py-3 font-semibold text-pnc-ink">
        Residuary
      </h3>
      <div className="grid gap-8 px-6 py-6 text-md @2xl:grid-cols-2">
        <div>
          <p className={label}>Primary beneficiaries</p>
          <p>{primary}</p>
        </div>
        <div>
          <p className={label}>Contingent beneficiaries</p>
          {contingent.length ? (
            contingent.map((l, i) => (
              <p key={l} className="mb-2" style={{ paddingLeft: `${i * 2.5}rem` }}>
                &rarr; {l}
              </p>
            ))
          ) : (
            <p>—</p>
          )}
        </div>
        <div>
          <p className={label}>Takers of last resort</p>
          <p>{lastResort}</p>
        </div>
      </div>
      <div className="flex justify-end border-t border-pnc-line px-6 py-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center rounded-full border border-pnc-line bg-white px-4 py-1.5 text-sm font-semibold hover:border-pnc-link hover:text-pnc-link"
        >
          Edit
        </button>
      </div>
    </section>
  );
}

/**
 * "Please specify one or more beneficiaries below": rows with an allocation
 * %, Add Person / Add Charity and a running total that must reach 100%.
 * With `spouseRest`, the spouse takes whatever the charities don't.
 */
function AllocationEditor({
  rows,
  onChange,
  error,
  charityOnly = false,
  spouseRest,
}: {
  rows: Beneficiary[];
  onChange: (rows: Beneficiary[]) => void;
  error?: string;
  charityOnly?: boolean;
  spouseRest?: string;
}) {
  const [modal, setModal] = useState<{ kind: Beneficiary["kind"]; editing?: Beneficiary } | null>(
    null,
  );
  const total = totalPercent(rows);
  const head = "text-xs font-semibold text-pnc-muted";

  function save(b: Beneficiary) {
    onChange(
      rows.some((r) => r.id === b.id) ? rows.map((r) => (r.id === b.id ? b : r)) : [...rows, b],
    );
    setModal(null);
  }

  return (
    <div className="space-y-3 rounded-md bg-pnc-surface px-4 py-5 @2xl:px-6">
      <p className="text-lg">
        {spouseRest
          ? "Gifts to charity before the rest goes to your spouse"
          : "Please specify one or more beneficiaries below"}
      </p>
      <p
        className={cn("text-[0.8125rem]", error && "font-semibold text-attention")}
        role={error ? "alert" : undefined}
      >
        {error ??
          (spouseRest
            ? "Charity gifts must total less than 100%"
            : "Your distribution must equal exactly 100% to continue")}
      </p>
      <div className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-x-3 gap-y-2 @lg:grid-cols-[1fr_6rem_3rem]">
        <span className={head}>Beneficiary</span>
        <span className={head}>Allocation</span>
        <span />
        {rows.map((b) => (
          <Row
            key={b.id}
            b={b}
            onPercent={(percent) =>
              onChange(rows.map((r) => (r.id === b.id ? { ...r, percent } : r)))
            }
            onEdit={() => setModal({ kind: b.kind, editing: b })}
          />
        ))}
        {spouseRest && (
          <>
            <span className="truncate rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm text-pnc-ink">
              Your spouse, {spouseRest} (the rest)
            </span>
            <span className="px-1 text-sm tabular-nums">{round2(Math.max(0, 100 - total))}%</span>
            <span />
          </>
        )}
        <div className={cn("grid gap-2", !charityOnly && "@lg:grid-cols-2")}>
          {!charityOnly && (
            <DashedButton onClick={() => setModal({ kind: "person" })}>Add Person</DashedButton>
          )}
          <DashedButton onClick={() => setModal({ kind: "charity" })}>Add Charity</DashedButton>
        </div>
        <span />
        <span />
      </div>
      <div className="grid grid-cols-[1fr_5rem_2.5rem] gap-x-3 border-t border-pnc-line pt-3 text-md @lg:grid-cols-[1fr_6rem_3rem]">
        <span>{spouseRest ? "Total to charity" : "Your total distribution must equal 100%"}</span>
        <span
          className={cn(
            "px-1 tabular-nums",
            !spouseRest && total !== 100 && rows.length > 0 && "text-attention",
          )}
        >
          {total}%
        </span>
      </div>

      {modal && (
        <BeneficiaryModal
          kind={modal.kind}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSave={save}
          onRemove={
            modal.editing
              ? () => {
                  onChange(rows.filter((r) => r.id !== modal.editing?.id));
                  setModal(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function Row({
  b,
  onPercent,
  onEdit,
}: {
  b: Beneficiary;
  onPercent: (p: string) => void;
  onEdit: () => void;
}) {
  return (
    <>
      <span className="truncate rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm text-pnc-ink">
        {b.name}
        {b.relationship && <span className="text-xs"> · {b.relationship}</span>}
      </span>
      <span className="relative">
        <input
          inputMode="decimal"
          aria-label={`Allocation for ${b.name}`}
          value={b.percent}
          onChange={(e) => onPercent(e.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full rounded-md border border-pnc-line bg-white py-2.5 pl-3 pr-6 text-sm tabular-nums focus:border-pnc-link focus:outline-none"
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-pnc-muted">
          %
        </span>
      </span>
      <button type="button" onClick={onEdit} className={buttonClass.link}>
        Edit
      </button>
    </>
  );
}

/** "Add a person" / "Add a charity" (also used to edit or remove a row). */
export function BeneficiaryModal({
  kind,
  editing,
  onClose,
  onSave,
  onRemove,
}: {
  kind: Beneficiary["kind"];
  editing?: Beneficiary;
  onClose: () => void;
  onSave: (b: Beneficiary) => void;
  onRemove?: () => void;
}) {
  const [b, setB] = useState<Beneficiary>(
    editing ?? { id: newId("b"), kind, name: "", relationship: "", percent: "" },
  );
  const listId = "will-charity-names";
  return (
    <Modal
      title={`${editing ? "Edit" : "Add"} ${kind === "person" ? "a person" : "a charity"}`}
      submitLabel={editing ? "Save" : "Add"}
      onClose={onClose}
      onSubmit={() => onSave({ ...b, name: b.name.trim() })}
      extraFooter={
        onRemove && (
          <button type="button" onClick={onRemove} className={buttonClass.danger}>
            Remove
          </button>
        )
      }
    >
      {kind === "person" ? (
        <>
          <Field label="Full legal name" required>
            <TextInput
              value={b.name}
              required
              autoFocus
              onChange={(e) => setB({ ...b, name: e.target.value })}
            />
          </Field>
          <Field label="Relationship" required>
            <Select
              value={b.relationship}
              required
              options={relationshipOptions}
              onChange={(relationship) => setB({ ...b, relationship })}
            />
          </Field>
        </>
      ) : (
        <Field
          label="Charity name"
          required
          hint="Choose a nonprofit from the list or type the organization's legal name."
        >
          <TextInput
            value={b.name}
            required
            autoFocus
            list={listId}
            onChange={(e) => setB({ ...b, name: e.target.value })}
          />
          <datalist id={listId}>
            {placeholderCharities.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </Field>
      )}
    </Modal>
  );
}
