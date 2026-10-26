"use client";

import { NavButtons, usePlanner } from "@/components/will/context";
import { yesNoOptions } from "@/components/will/screens/nominees";
import {
  LearnMore,
  OptionTiles,
  PageHeading,
  PersonList,
  Question,
  QuestionCard,
  TextArea,
} from "@/components/will/ui";
import type { WillDraft } from "@/lib/will/types";

type Provisions = WillDraft["provisions"];

function useProvisions() {
  const planner = usePlanner();
  const set = (patch: Partial<Provisions>) =>
    planner.update((d) => ({ ...d, provisions: { ...d.provisions, ...patch } }));
  return { ...planner, provisions: planner.draft.provisions, set };
}

export function ExecutorsScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="Executors of your Will" />
      <QuestionCard>
        <Question
          label="Nominating an executor"
          required
          help="Your executor pays your final bills, files your last tax returns and distributes your property as your will directs. Name a first choice, then backups in order of preference."
        >
          <PersonList
            rows={provisions.executors}
            required
            error={errors.people}
            onChange={(executors) => set({ executors })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function DigitalExecutorsScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="Digital Executors">
        <p>
          Your digital executor&apos;s primary responsibility is to distribute your digital assets
          to the beneficiaries that you specify. In order to fulfill this responsibility, your
          digital executor will have the power to access, download, and backup digital assets,
          convert file formats, access to any devices as necessary to manage digital assets, to
          clear computer caches and to delete files.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="By default, your estate's executor will also serve as your digital executor. Would you like to nominate someone else to act as your digital executor instead?"
          required
          error={errors.digital}
        >
          <OptionTiles
            label="Nominate a different digital executor"
            options={yesNoOptions}
            value={provisions.digital}
            onChange={(digital) => set({ digital })}
          />
        </Question>

        {provisions.digital === "yes" && (
          <Question
            label="In order of preference, what is the full legal name of the person who will be your digital executor?"
            required
            help="Choose someone comfortable with technology who you trust with your accounts, photos and messages."
          >
            <PersonList
              rows={provisions.digitalExecutors}
              required
              error={errors.people}
              onChange={(digitalExecutors) => set({ digitalExecutors })}
            />
          </Question>
        )}

        <Question
          label="Would you like your digital executor to have access to the contents of your electronic communications?"
          required
          error={errors.digitalComms}
        >
          <OptionTiles
            label="Access to electronic communications"
            options={yesNoOptions}
            value={provisions.digitalComms}
            onChange={(digitalComms) => set({ digitalComms })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function NoContestScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="No contest clause">
        <p>
          A &ldquo;no-contest clause&rdquo; is a provision that discourages challenges to your
          estate plan. It states that anyone who baselessly challenges the distributions you&apos;ve
          made will be treated as though they&apos;ve predeceased you—in other words, they will not
          receive any gifts you have left them.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Would you like to include a no-contest clause in your documents?"
          required
          error={errors.noContest}
          help="Some states limit or don't enforce no-contest clauses. Including one does no harm where it isn't enforced."
        >
          <OptionTiles
            label="Include a no-contest clause"
            options={yesNoOptions}
            value={provisions.noContest}
            onChange={(noContest) => set({ noContest })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function AffidavitScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="Self-proving Affidavit" />
      <QuestionCard>
        <Question
          label="Do you want to add a self-proving affidavit to your Will?"
          required
          error={errors.affidavit}
          help="A self-proving affidavit is a sworn statement, signed by you and your witnesses in front of a notary, that the will was properly signed."
          hint={
            <div className="space-y-2">
              <p>
                You will need to sign your will in the presence of a notary public for the
                self-proving affidavit. However, adding one can reduce the burden on your witnesses
                to prove the validity of your will and speed up the probate process for your loved
                ones.
              </p>
              <LearnMore label="Learn more about self-proving affidavits">
                Without the affidavit, a probate court may ask your witnesses to testify that they
                saw you sign. With it, the court can usually accept the will as valid on its own.
                PNC branches offer notary services to customers.
              </LearnMore>
            </div>
          }
        >
          <OptionTiles
            label="Add a self-proving affidavit"
            options={yesNoOptions}
            value={provisions.affidavit}
            onChange={(affidavit) => set({ affidavit })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function IndependentAdministrationScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="Independent Administration">
        <p>
          Illinois, Missouri, Texas, Louisiana, California, Nevada, and Washington permit
          independent administration of estates (called &ldquo;nonintervention powers&rdquo; in
          Washington), largely free of court supervision. This means that after an executor is
          approved and an inventory of the estate&apos;s assets is filed with the court, the
          executor can administer the estate with minimal further court involvement or supervision.
          For example, an executor can settle claims by creditors, sell assets for the payment of
          taxes, and distribute property to estate beneficiaries, all without the court&apos;s
          oversight or approval. Even if your state does not currently permit independent
          administration, you can still include language authorizing it in your will if you like -
          that way, if your state law someday changes, or you move to one of the states that do
          permit it, your wishes will be clear. If you have specific questions about your
          state&apos;s laws, please seek out an attorney for legal advice.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Would you like to give permission for your estate to be administered independent of court supervision?"
          required
          error={errors.independent}
          help="Choose “Say Nothing” to leave the decision to your state's default rules."
        >
          <OptionTiles
            label="Independent administration"
            options={[...yesNoOptions, { value: "say-nothing" as const, label: "Say Nothing" }]}
            value={provisions.independent}
            onChange={(independent) => set({ independent })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function PersonalStatementScreen() {
  const { provisions, set, errors } = useProvisions();
  return (
    <>
      <PageHeading title="Personal Statement">
        <p>
          If you would like, you can choose to attach an additional personal statement to your will.
          Some use this space to document their spiritual or moral values for their next-of-kin,
          leave a letter to their children or loved ones, provide additional messages for
          beneficiaries of gifts, or simply to write about their life experiences.
        </p>
        <p className="font-semibold">
          Please note that this is not a legally binding document. Please do not use this space to
          leave gifts to your beneficiaries.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question
          label="Would you like to attach a personal statement to your will?"
          required
          error={errors.statement}
        >
          <OptionTiles
            label="Attach a personal statement"
            options={yesNoOptions}
            value={provisions.statement}
            onChange={(statement) => set({ statement })}
          />
        </Question>
        {provisions.statement === "yes" && (
          <TextArea
            aria-label="Personal statement"
            rows={8}
            required
            placeholder="You can use this space to leave a message."
            value={provisions.statementText}
            onChange={(e) => set({ statementText: e.target.value })}
          />
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}
