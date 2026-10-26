"use client";

import { NavButtons, usePlanner } from "@/components/will/context";
import {
  buttonClass,
  DashedButton,
  DateInput,
  Field,
  OptionTiles,
  PageHeading,
  PersonList,
  Question,
  QuestionCard,
  TextInput,
} from "@/components/will/ui";
import { minorChildren } from "@/lib/will/flow";
import { newId, type Child, type WillDraft, type YesNo } from "@/lib/will/types";
import { cn } from "@/lib/format";

export const yesNoOptions: { value: YesNo; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

type Nominees = WillDraft["nominees"];

function useNominees() {
  const planner = usePlanner();
  const set = (patch: Partial<Nominees>) =>
    planner.update((d) => ({ ...d, nominees: { ...d.nominees, ...patch } }));
  return { ...planner, nominees: planner.draft.nominees, set };
}

const emptyChild = (): Child => ({ id: newId("c"), name: "", birthdate: "" });

export function ChildrenScreen() {
  const { nominees, set, errors } = useNominees();
  const setChild = (id: string, patch: Partial<Child>) =>
    set({ children: nominees.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <>
      <PageHeading title="Your children">
        <p>
          List all of your children, including adult children and children from prior relationships.
          Naming them makes clear you did not forget anyone, and lets you nominate a guardian for
          any child under 18.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Do you have any children?"
          required
          error={errors.hasChildren}
          help="Include biological and legally adopted children. Stepchildren only inherit if you name them as beneficiaries."
        >
          <OptionTiles
            label="Do you have any children?"
            options={yesNoOptions}
            value={nominees.hasChildren}
            onChange={(hasChildren) =>
              set({
                hasChildren,
                children:
                  hasChildren === "yes" && nominees.children.length === 0
                    ? [emptyChild()]
                    : nominees.children,
              })
            }
          />
        </Question>

        {nominees.hasChildren === "yes" && (
          <Question
            label="What are your children's names and birthdates?"
            required
            size="sm"
            error={errors.children}
          >
            <div className="space-y-3">
              {nominees.children.map((c, i) => (
                <div
                  key={c.id}
                  className="grid items-end gap-x-3 gap-y-2 @lg:grid-cols-[1fr_12rem_auto]"
                >
                  <Field label={`Full name of child ${i + 1}`}>
                    <TextInput
                      value={c.name}
                      required
                      onChange={(e) => setChild(c.id, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="Birthdate">
                    <DateInput
                      aria-label={`Birthdate of child ${i + 1}`}
                      value={c.birthdate}
                      required
                      onChange={(birthdate) => setChild(c.id, { birthdate })}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() =>
                      set({ children: nominees.children.filter((x) => x.id !== c.id) })
                    }
                    className={cn(buttonClass.danger, "justify-self-start py-2.5 @lg:px-1")}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <DashedButton
                onClick={() => set({ children: [...nominees.children, emptyChild()] })}
                className="@lg:w-[calc(100%-4rem)]"
              >
                Click to add another
              </DashedButton>
            </div>
          </Question>
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function GuardiansScreen() {
  const { nominees, set, errors, draft } = useNominees();
  const minors = minorChildren(draft);
  return (
    <>
      <PageHeading title="Guardian for your minor children">
        <p>
          A guardian raises your minor {minors.length === 1 ? "child" : "children"} (
          {minors.map((c) => c.name).join(", ")}) if no parent is able to. Name your first choice,
          then backups in order of preference in case your first choice cannot serve.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="In order of preference, who should be the guardian of your minor children?"
          required
          help="Courts give strong weight to the guardian you nominate. Talk to the people you name first so they are ready to serve."
        >
          <PersonList
            rows={nominees.guardians}
            required
            error={errors.people}
            onChange={(guardians) => set({ guardians })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function PetsScreen() {
  const { nominees, set, errors } = useNominees();
  return (
    <>
      <PageHeading title="Pet guardian (optional)">
        <p>
          You can name someone to take care of your pets. Pets are treated as property, so naming a
          caretaker keeps them with someone you trust.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Would you like to name a guardian for your pets?"
          required
          error={errors.hasPets}
        >
          <OptionTiles
            label="Name a pet guardian"
            options={yesNoOptions}
            value={nominees.hasPets}
            onChange={(hasPets) => set({ hasPets })}
          />
        </Question>
        {nominees.hasPets === "yes" && (
          <>
            <Field label="Your pets' names" hint="e.g. Biscuit (dog), Pepper (cat)">
              <TextInput
                value={nominees.petNames}
                onChange={(e) => set({ petNames: e.target.value })}
              />
            </Field>
            <Question
              label="In order of preference, who should take care of your pets?"
              required
              size="sm"
            >
              <PersonList
                rows={nominees.petGuardians}
                required
                error={errors.people}
                onChange={(petGuardians) => set({ petGuardians })}
              />
            </Question>
          </>
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}
