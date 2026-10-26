"use client";

import { NavButtons, usePlanner } from "@/components/will/context";
import {
  AddressFields,
  DateInput,
  Field,
  InfoBox,
  OptionTiles,
  PageHeading,
  Question,
  QuestionCard,
  TextInput,
} from "@/components/will/ui";
import { genderLabels, maritalLabels } from "@/lib/will/describe";
import type { Gender, MaritalStatus, WillDraft } from "@/lib/will/types";

export const genderOptions = (Object.keys(genderLabels) as Gender[]).map((value) => ({
  value,
  label: genderLabels[value],
}));

/** (999) 999-9999 as the customer types. */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function BasicDetails() {
  const { draft, update, errors } = usePlanner();
  const basics = draft.basics;
  const set = (patch: Partial<WillDraft["basics"]>) =>
    update((d) => ({ ...d, basics: { ...d.basics, ...patch } }));

  return (
    <>
      <PageHeading title="Basic details" />
      <QuestionCard>
        <Question
          label="Gender"
          required
          error={errors.gender}
          help="This lets your will describe you correctly. It does not change how your property is distributed."
        >
          <OptionTiles
            label="Gender"
            wide
            options={genderOptions}
            value={basics.gender}
            onChange={(gender) => set({ gender })}
          />
        </Question>

        <Question
          label="Birthdate"
          required
          size="sm"
          hint="Enter the date in mm/dd/yyyy order."
          error={errors.birthdate}
          help="You must be at least 18 years old to make a will. Your birthdate helps identify you as the person making it."
        >
          <DateInput
            aria-label="Birthdate"
            value={basics.birthdate}
            required
            onChange={(birthdate) => set({ birthdate })}
          />
        </Question>

        <Question
          label="Phone number"
          size="sm"
          hint="10 digits, U.S. only, for example (999) 999-9999."
          help="Optional. We only use it to contact you about your will."
        >
          <TextInput
            aria-label="Phone number"
            type="tel"
            placeholder="(999) 999-9999"
            pattern="\(\d{3}\) \d{3}-\d{4}"
            title="10 digits, for example (999) 999-9999"
            value={basics.phone}
            onChange={(e) => set({ phone: formatPhone(e.target.value) })}
          />
        </Question>

        <Question
          label="Your address"
          size="sm"
          help="Your legal residence decides which state's laws apply to your will, so use the address where you live most of the year."
        >
          <AddressFields value={basics.address} onChange={(address) => set({ address })} />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

const maritalOptions = (Object.keys(maritalLabels) as MaritalStatus[]).map((value) => ({
  value,
  label: maritalLabels[value],
}));

export function MaritalStatusScreen() {
  const { draft, update, errors } = usePlanner();
  const { marital, spouse } = draft.basics;
  const setSpouse = (patch: Partial<WillDraft["basics"]["spouse"]>) =>
    update((d) => ({ ...d, basics: { ...d.basics, spouse: { ...d.basics.spouse, ...patch } } }));

  return (
    <>
      <PageHeading title="Marital status" />
      <QuestionCard>
        <Question
          label="What is your current marital status?"
          required
          error={errors.marital}
          help="Choose Married if you are legally married, even if you are separated. If you are divorced or your spouse has passed away, choose Single / Widowed."
        >
          <OptionTiles
            label="Marital status"
            options={maritalOptions}
            value={marital}
            onChange={(m) => update((d) => ({ ...d, basics: { ...d.basics, marital: m } }))}
          />
        </Question>

        {marital === "married" && (
          <>
            <InfoBox>
              You will be given the option to create a Mirror Will for your spouse at the Review
              stage of the will-making process.
            </InfoBox>
            <SpouseNameFields spouse={spouse} onChange={setSpouse} />
          </>
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}

/** Spouse's first / middle / last name, shared with the Mirror Wills page. */
export function SpouseNameFields({
  spouse,
  onChange,
}: {
  spouse: WillDraft["basics"]["spouse"];
  onChange: (patch: Partial<WillDraft["basics"]["spouse"]>) => void;
}) {
  return (
    <Question
      label="Your spouse's legal name"
      size="sm"
      help="Use your spouse's full legal name as it appears on official documents."
    >
      <div className="grid gap-4 @2xl:grid-cols-3">
        <Field label="Spouse's first name" required>
          <TextInput
            value={spouse.first}
            required
            onChange={(e) => onChange({ first: e.target.value })}
          />
        </Field>
        <Field label="Spouse's middle name">
          <TextInput value={spouse.middle} onChange={(e) => onChange({ middle: e.target.value })} />
        </Field>
        <Field label="Spouse's last name" required>
          <TextInput
            value={spouse.last}
            required
            onChange={(e) => onChange({ last: e.target.value })}
          />
        </Field>
      </div>
    </Question>
  );
}
