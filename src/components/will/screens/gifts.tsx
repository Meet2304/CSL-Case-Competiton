"use client";

import { useState } from "react";
import { NavButtons, usePlanner } from "@/components/will/context";
import {
  AddressFields,
  buttonClass,
  DashedButton,
  Field,
  LearnMore,
  Modal,
  MoneyInput,
  PageHeading,
  PersonList,
  Question,
  Select,
  TextArea,
} from "@/components/will/ui";
import { relationshipOptions } from "@/data/will";
import { cn } from "@/lib/format";
import { giftTitle, giftTypeLabels } from "@/lib/will/describe";
import { named } from "@/lib/will/flow";
import {
  emptyAddress,
  emptyPerson,
  newId,
  type Gift,
  type GiftType,
  type Person,
} from "@/lib/will/types";

const recipientRelationships = [...relationshipOptions, "Nonprofit organization"];

const names = (rows: Person[]) =>
  named(rows)
    .map((p) => p.name)
    .join(", ");

export function GiftsScreen() {
  const { draft, update, errors } = usePlanner();
  const [editing, setEditing] = useState<Gift | null>(null);
  const [assigning, setAssigning] = useState<Gift | null>(null);
  const gifts = draft.gifts;
  const setGifts = (next: Gift[]) => update((d) => ({ ...d, gifts: next }));
  const upsert = (g: Gift) =>
    setGifts(
      gifts.some((x) => x.id === g.id) ? gifts.map((x) => (x.id === g.id ? g : x)) : [...gifts, g],
    );
  const head = "text-xs font-semibold text-pnc-muted";

  return (
    <>
      <PageHeading title="Specific gifts">
        <p>
          Here you can choose to leave a specific gift in the form of real estate, vehicles, cash,
          or any other type of item to a particular individual or individuals, or to a nonprofit
          organization of your choosing.
        </p>
        <p>
          This section is completely optional, as you have already provided wishes for the
          distribution of your residual estate. To skip this step, proceed using &lsquo;Save &amp;
          Continue&rsquo; below.
          <br />
          To leave a specific gift:
        </p>
        <ol className="list-decimal space-y-1 pl-9">
          <li>
            Add a new gift by using the &lsquo;Click to add property&rsquo; button available at the
            bottom of &lsquo;List of property.&rsquo;
          </li>
          <li>
            Once your gift is created, it will be displayed in &lsquo;List of property&rsquo;. Click
            &lsquo;Assign&rsquo; on the appropriate gift to begin assigning beneficiaries.
          </li>
        </ol>
        <LearnMore label="Are there any assets that can't be passed down through a will?">
          Property that already has a named beneficiary or a co-owner passes outside your will:
          jointly owned accounts and real estate, life insurance, retirement accounts (401(k), IRA,
          pensions), and payable-on-death or transfer-on-death accounts. Leave those to people
          through the account or deed itself.
        </LearnMore>
      </PageHeading>

      <section className="overflow-hidden rounded-md border border-pnc-line bg-white">
        <h3 className="border-b border-pnc-line bg-pnc-surface/60 px-5 py-3 font-semibold text-pnc-ink">
          List of property
        </h3>
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_8rem] gap-4 px-6 py-4 @2xl:grid">
          <span className={head}>Property description</span>
          <span className={head}>Primary beneficiaries</span>
          <span className={head}>Contingent beneficiaries</span>
          <span />
        </div>
        <ul className="divide-y divide-pnc-line border-t border-pnc-line">
          {gifts.map((g) => (
            <li
              key={g.id}
              className={cn(
                "grid gap-x-4 gap-y-1 px-6 py-4 text-sm @2xl:grid-cols-[1.4fr_1fr_1fr_8rem]",
                errors[g.id] && "bg-attention-bg",
              )}
            >
              <span>
                <span className="block text-xs text-pnc-muted">{giftTypeLabels[g.type]}</span>
                {giftTitle(g)}
              </span>
              <span>
                <span className={cn(head, "@2xl:hidden")}>Primary: </span>
                {names(g.primary) || (
                  <span className={errors[g.id] ? "text-attention" : "text-pnc-muted"}>
                    {errors[g.id] ?? "Not assigned"}
                  </span>
                )}
              </span>
              <span>
                <span className={cn(head, "@2xl:hidden")}>Contingent: </span>
                {names(g.contingent) || <span className="text-pnc-muted">—</span>}
              </span>
              <span className="flex flex-wrap gap-3 @2xl:justify-end">
                <button
                  type="button"
                  onClick={() => setAssigning(g)}
                  className={cn(buttonClass.link, "font-semibold")}
                >
                  Assign
                </button>
                <button type="button" onClick={() => setEditing(g)} className={buttonClass.link}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setGifts(gifts.filter((x) => x.id !== g.id))}
                  className={buttonClass.danger}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="bg-pnc-surface px-6 py-3">
          <DashedButton
            onClick={() =>
              setEditing({
                id: newId("g"),
                type: "" as GiftType,
                description: "",
                amount: "",
                address: emptyAddress(),
                primary: [],
                contingent: [],
              })
            }
          >
            Click to add property
          </DashedButton>
        </div>
      </section>

      <NavButtons />

      {editing && (
        <PropertyModal
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(g) => {
            upsert(g);
            setEditing(null);
          }}
        />
      )}
      {assigning && (
        <AssignModal
          key={assigning.id}
          gift={assigning}
          onClose={() => setAssigning(null)}
          onSave={(g) => {
            upsert(g);
            setAssigning(null);
          }}
        />
      )}
    </>
  );
}

const propertyTypes = (Object.keys(giftTypeLabels) as GiftType[]).map(
  (t) => [t, giftTypeLabels[t]] as const,
);

/** "Add new property": the fields change with the property type. */
function PropertyModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Gift;
  onClose: () => void;
  onSave: (g: Gift) => void;
}) {
  const [gift, setGift] = useState(initial);
  const set = (patch: Partial<Gift>) => setGift((g) => ({ ...g, ...patch }));
  const describe = gift.type === "vehicle" || gift.type === "digital" || gift.type === "other";

  return (
    <Modal
      title="Add new property"
      submitLabel="Save & Exit"
      tone="green"
      onClose={onClose}
      onSubmit={() => onSave(gift)}
    >
      <Field label="What type of property are you adding?" required>
        <Select
          value={gift.type}
          required
          options={propertyTypes}
          onChange={(type) => set({ type: type as GiftType })}
        />
      </Field>

      {gift.type === "real-estate" && (
        <AddressFields value={gift.address} onChange={(address) => set({ address })} />
      )}

      {describe && (
        <div className="space-y-1.5">
          <p className="text-md font-semibold">
            Enter a clear description of the property<sup className="ml-0.5">*</sup>
          </p>
          <LearnMore
            label={`Please Read: How to clearly describe your ${gift.type === "digital" ? "digital " : ""}property`}
          >
            {gift.type === "digital"
              ? "Name the account or asset and where it lives, e.g. “my photo library stored in my cloud account” or “the domain sampledomain.example”. Never write passwords in your will — keep them with a password manager your digital executor can reach."
              : "Describe it so a stranger could pick it out: make, model, year and identifying numbers for vehicles (e.g. “my 2019 Example Motors sedan, VIN ending 1234”), or what, how many and where for other items (e.g. “my grandmother's gold locket kept in my jewelry box”)."}
          </LearnMore>
          <TextArea
            aria-label="Description of the property"
            value={gift.description}
            required
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>
      )}

      {gift.type === "cash" && (
        <Field label="What is the amount of this monetary gift (in US dollars)?" required>
          <MoneyInput
            aria-label="Amount of the gift"
            value={gift.amount}
            required
            onChange={(amount) => set({ amount })}
          />
        </Field>
      )}
    </Modal>
  );
}

function AssignModal({
  gift,
  onClose,
  onSave,
}: {
  gift: Gift;
  onClose: () => void;
  onSave: (g: Gift) => void;
}) {
  const [primary, setPrimary] = useState(gift.primary.length ? gift.primary : [emptyPerson()]);
  const [contingent, setContingent] = useState(gift.contingent);
  const [error, setError] = useState<string>();

  return (
    <Modal
      title="Assign beneficiaries"
      submitLabel="Save & Exit"
      tone="green"
      onClose={onClose}
      onSubmit={() => {
        if (named(primary).length === 0) {
          setError("Add at least one primary beneficiary");
          return;
        }
        onSave({ ...gift, primary: named(primary), contingent: named(contingent) });
      }}
    >
      <p className="text-sm text-pnc-muted">{giftTitle(gift)}</p>
      <Question
        label="Who should receive this gift?"
        required
        size="sm"
        hint="If you name more than one person, they share the gift equally."
      >
        <PersonList
          rows={primary}
          required
          error={error}
          relationships={recipientRelationships}
          nameLabel={(i) => `Full name of primary beneficiary ${i + 1}`}
          onChange={(rows) => {
            setPrimary(rows);
            setError(undefined);
          }}
        />
      </Question>
      <Question
        label="If they do not survive you, who should receive it instead?"
        size="sm"
        hint="Optional. Without a contingent beneficiary, the gift returns to your residual estate."
      >
        <PersonList
          rows={contingent}
          relationships={recipientRelationships}
          nameLabel={(i) => `Full name of contingent beneficiary ${i + 1}`}
          onChange={setContingent}
        />
      </Question>
    </Modal>
  );
}
