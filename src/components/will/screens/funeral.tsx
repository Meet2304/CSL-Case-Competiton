"use client";

import { NavButtons, usePlanner } from "@/components/will/context";
import {
  buttonClass,
  DashedButton,
  PageHeading,
  PersonList,
  Question,
  QuestionCard,
  TextArea,
  TextInput,
} from "@/components/will/ui";
import { placeholderCharities } from "@/data/will";
import { cn } from "@/lib/format";
import type { WillDraft } from "@/lib/will/types";

export function FuneralScreen() {
  const { draft, update } = usePlanner();
  const funeral = draft.funeral;
  const set = (patch: Partial<WillDraft["funeral"]>) =>
    update((d) => ({ ...d, funeral: { ...d.funeral, ...patch } }));
  const listId = "funeral-charity-names";

  return (
    <>
      <PageHeading title="Funeral Wishes">
        <p>
          Here you can choose to include wishes for your funeral and final resting place. The wishes
          you enter will provide instructions to your funeral executor, but please note that they
          will not be legally binding. It is recommended that you keep these instructions separate
          from your estate planning documents, as these instructions usually need to be acted upon
          quickly prior to asset distribution.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question label="In order of preference, who will be responsible for carrying out your funeral and final resting place instructions?">
          <PersonList rows={funeral.people} onChange={(people) => set({ people })} />
        </Question>

        <Question
          label="What are your wishes for your funeral service?"
          hint="Some things that you may want to consider include provisions for visitation services, where you would like the service to be held, who will preside over your service, any readings you would like to be read, or songs you would like to be played."
        >
          <TextArea
            aria-label="Wishes for your funeral service"
            placeholder="You can use this space to leave a message."
            value={funeral.service}
            onChange={(e) => set({ service: e.target.value })}
          />
        </Question>

        <Question
          label="What are your wishes for your body and final resting place?"
          hint="Some things you may want to consider include how would you like your body to be treated and where you would like your remains to be settled."
        >
          <TextArea
            aria-label="Wishes for your body and final resting place"
            placeholder="You can use this space to leave a message."
            value={funeral.body}
            onChange={(e) => set({ body: e.target.value })}
          />
        </Question>

        <Question label="Choose any charities that you would like your loved ones to support in your memory">
          <p className="text-md font-semibold">Charity name</p>
          <datalist id={listId}>
            {placeholderCharities.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          {funeral.charities.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <TextInput
                aria-label={`Charity ${i + 1}`}
                list={listId}
                value={name}
                onChange={(e) =>
                  set({
                    charities: funeral.charities.map((c, j) => (j === i ? e.target.value : c)),
                  })
                }
              />
              <button
                type="button"
                onClick={() => set({ charities: funeral.charities.filter((_, j) => j !== i) })}
                className={cn(buttonClass.danger, "shrink-0")}
              >
                Delete
              </button>
            </div>
          ))}
          <DashedButton onClick={() => set({ charities: [...funeral.charities, ""] })}>
            Add charity
          </DashedButton>
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}
