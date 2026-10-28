"use client";

import { useState } from "react";
import {
  ArrowRight,
  Car,
  Gem,
  HeartPulse,
  House,
  Landmark,
  TrendingUp,
  TreePalm,
  type LucideIcon,
} from "lucide-react";
import { NavButtons, usePlanner } from "@/components/will/context";
import {
  AddressFields,
  buttonClass,
  Field,
  InfoBox,
  LearnMore,
  Modal,
  MoneyInput,
  OptionTiles,
  PageHeading,
  Question,
  QuestionCard,
  Segmented,
  Select,
  TextInput,
} from "@/components/will/ui";
import { estateValueBands, financialInstitutions, retirementAccountTypes } from "@/data/will";
import { assetCategories, assetTitle, money, ownedByLabels } from "@/lib/will/describe";
import {
  emptyAddress,
  newId,
  type Asset,
  type AssetCategory,
  type OwnedBy,
  type WillDraft,
} from "@/lib/will/types";

type Assets = WillDraft["assets"];

function useAssets() {
  const planner = usePlanner();
  const set = (patch: Partial<Assets>) =>
    planner.update((d) => ({ ...d, assets: { ...d.assets, ...patch } }));
  return { ...planner, assets: planner.draft.assets, set };
}

export function AssetMethodScreen() {
  const { assets, set, errors } = useAssets();
  return (
    <>
      <PageHeading title="Assets">
        <p>
          Listing out major assets helps your executor better handle your affairs by providing
          information about what assets you have and where they&apos;re held. This section may take
          a while but is completely optional. You can choose to skip this section and return to it
          later.
        </p>
      </PageHeading>
      <QuestionCard>
        <Question label="How would you like to provide your assets?" required error={errors.method}>
          <OptionTiles
            label="How would you like to provide your assets?"
            options={[
              { value: "list", label: "I'd like to list out each of my assets" },
              { value: "estimate", label: "I'll estimate my total assets for now" },
            ]}
            value={assets.method}
            onChange={(method) => set({ method })}
          />
        </Question>
      </QuestionCard>
      <NavButtons />
    </>
  );
}

export function AssetEstimateScreen() {
  const { assets, set, errors } = useAssets();
  return (
    <>
      <PageHeading title="What is the approximate total value of assets distributed by your will?">
        <p>
          This question helps us understand your estate value in relation to state and federal tax
          law. We may provide additional guidance throughout your estate planning process depending
          on your response.{" "}
          <strong>
            This estimate should not include any assets distributed outside of your will (e.g. Joint
            accounts, 401(k) accounts, life insurance, etc.).
          </strong>
        </p>
      </PageHeading>
      <Question
        label={<span className="sr-only">Approximate total value</span>}
        error={errors.estimate}
      >
        <OptionTiles
          label="Approximate total value of assets"
          wide
          options={estateValueBands.map((b) => ({ value: b, label: b }))}
          value={assets.estimate}
          onChange={(estimate) => set({ estimate })}
        />
      </Question>
      <NavButtons />
    </>
  );
}

const categoryIcons: Record<AssetCategory, LucideIcon> = {
  financial: Landmark,
  retirement: TreePalm,
  insurance: HeartPulse,
  "real-estate": House,
  vehicle: Car,
  brokerage: TrendingUp,
  other: Gem,
};

const newAsset = (category: AssetCategory): Asset => ({
  id: newId("a"),
  category,
  institution: "",
  accountType: "",
  description: "",
  location: "",
  value: "",
  payableOnDeath: false,
  nickname: "",
  address: emptyAddress(),
});

export function AssetListScreen() {
  const { assets, set, skip } = useAssets();
  const [editing, setEditing] = useState<Asset | null>(null);

  function save(asset: Asset) {
    const exists = assets.items.some((a) => a.id === asset.id);
    set({
      items: exists
        ? assets.items.map((a) => (a.id === asset.id ? asset : a))
        : [...assets.items, asset],
    });
    setEditing(null);
  }

  return (
    <>
      <PageHeading title="List your major assets (optional)">
        <button
          type="button"
          onClick={skip}
          className="inline-flex items-center gap-1 text-pnc-link hover:underline"
        >
          Skip for now <ArrowRight className="size-4" />
        </button>
        <p>
          Listing out major assets helps your executor better handle your affairs by providing
          information about what assets you have and where they&apos;re held. Some assets, such as
          jointly owned banked accounts or life insurance, will not be distributed through your
          will.
        </p>
      </PageHeading>

      <div className="grid gap-4 @2xl:grid-cols-2">
        <ExplainerBox
          title="Assets distributed by your will (probate)"
          items={[
            "Bank accounts solely owned by you",
            "Real estate solely owned by you or by tenants in common",
            "Brokerage accounts solely owned by you",
            "Personal property or valuables",
          ]}
        />
        <ExplainerBox
          title="Assets NOT distributed through your will (non-probate)"
          items={[
            "Jointly owned bank or brokerage accounts",
            "Jointly owned real estate or vehicle",
            "401(k) accounts, pensions, IRAs, etc.",
            "Life insurance",
          ]}
        />
      </div>

      {assets.items.length > 0 && (
        <section className="rounded-md border border-pnc-line bg-white">
          <h3 className="border-b border-pnc-line bg-pnc-surface/60 px-5 py-3 font-semibold text-pnc-ink">
            Your assets ({assets.items.length})
          </h3>
          <ul className="divide-y divide-pnc-line">
            {assets.items.map((a) => {
              const Icon = categoryIcons[a.category];
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                  <Icon
                    className="size-5 shrink-0 text-pnc-muted"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {assetTitle(a) || assetCategories[a.category].label}
                    </p>
                    <p className="text-xs text-pnc-muted">
                      {[
                        assetCategories[a.category].label,
                        a.ownedBy && ownedByLabels[a.ownedBy],
                        a.payableOnDeath && "Payable on death",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">{money(a.value)}</span>
                  <span className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditing(a)}
                      className={buttonClass.link}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ items: assets.items.filter((x) => x.id !== a.id) })}
                      className={buttonClass.danger}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="space-y-3">
        <h3 className="font-display text-lg font-medium text-pnc-ink">Select an asset to add</h3>
        <p className="text-sm text-pnc-muted">
          Add details for each asset you want to include in your will.
        </p>
        <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-4">
          {(Object.keys(assetCategories) as AssetCategory[]).map((c) => {
            const Icon = categoryIcons[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setEditing(newAsset(c))}
                className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-pnc-line bg-white px-3 py-4 text-sm font-semibold text-pnc-ink transition-colors hover:border-pnc-blue-600 hover:bg-pnc-blue-50/50"
              >
                <Icon className="size-7 text-pnc-blue-700" strokeWidth={1.5} aria-hidden="true" />
                {assetCategories[c].label}
              </button>
            );
          })}
        </div>
      </div>

      <NavButtons
        extra={
          <button type="button" onClick={skip} className={buttonClass.secondary}>
            Skip for now
          </button>
        }
      />

      {editing && (
        <AssetModal
          key={editing.id}
          initial={editing}
          isNew={!assets.items.some((a) => a.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function ExplainerBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-pnc-surface px-5 py-4 text-sm">
      <p className="mb-2 font-semibold">{title}</p>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

const ownedByOptions = (Object.keys(ownedByLabels) as OwnedBy[]).map((value) => ({
  value,
  label: ownedByLabels[value],
}));

/** "Add a financial account" etc. — fields differ by asset category. */
function AssetModal({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: Asset;
  isNew: boolean;
  onClose: () => void;
  onSave: (a: Asset) => void;
}) {
  const [asset, setAsset] = useState(initial);
  const [ownedByError, setOwnedByError] = useState(false);
  const set = (patch: Partial<Asset>) => setAsset((a) => ({ ...a, ...patch }));
  const c = asset.category;
  const needsOwner =
    c === "financial" || c === "real-estate" || c === "vehicle" || c === "brokerage";

  const institution = (label = "Financial institution") => (
    <Field label={label} required>
      <Select
        value={asset.institution}
        required
        options={financialInstitutions}
        onChange={(institution) => set({ institution })}
      />
    </Field>
  );
  const value = (label = "Approximate current value", required = true) => (
    <Field label={label} required={required}>
      <MoneyInput
        aria-label={label}
        value={asset.value}
        required={required}
        onChange={(v) => set({ value: v })}
      />
    </Field>
  );
  const nickname = (
    <Field label="Asset nickname">
      <TextInput value={asset.nickname} onChange={(e) => set({ nickname: e.target.value })} />
    </Field>
  );
  const ownedBy = (
    <div className="space-y-1.5">
      <p className="text-[0.9375rem] font-semibold">
        Owned by<sup className="ml-0.5">*</sup>
      </p>
      <Segmented
        label="Owned by"
        options={ownedByOptions}
        value={asset.ownedBy}
        onChange={(o) => {
          set({ ownedBy: o });
          setOwnedByError(false);
        }}
      />
      {ownedByError && <p className="text-sm text-attention">Required</p>}
    </div>
  );
  const payableOnDeath = (
    <div className="space-y-1.5">
      <p className="text-[0.9375rem] font-semibold">Payable on death designation</p>
      <LearnMore label="What does this mean?">
        Some accounts let you name beneficiaries directly with the bank (a &ldquo;payable on
        death&rdquo; or &ldquo;transfer on death&rdquo; designation). Those accounts pass straight
        to the people you named and are not distributed by your will.
      </LearnMore>
      <label className="flex items-center gap-3 pt-1 text-[0.9375rem]">
        <input
          type="checkbox"
          checked={asset.payableOnDeath}
          onChange={(e) => set({ payableOnDeath: e.target.checked })}
          className="size-5 accent-pnc-blue-700"
        />
        Yes, this account allows me to select beneficiaries
      </label>
    </div>
  );

  return (
    <Modal
      title={assetCategories[c].modalTitle}
      submitLabel={isNew ? "Add asset" : "Save asset"}
      onClose={onClose}
      onSubmit={() => {
        if (needsOwner && !asset.ownedBy) {
          setOwnedByError(true);
          return;
        }
        onSave(asset);
      }}
    >
      <h4 className="text-xl">Help your executor by providing additional information</h4>

      {c === "financial" && (
        <>
          {institution()}
          <Field
            label="Account description"
            required
            hint="e.g. Checking account ending in 1234, Money Market account ending in 9876"
          >
            <TextInput
              value={asset.description}
              required
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          {value()}
          {ownedBy}
          {payableOnDeath}
          {nickname}
        </>
      )}

      {c === "retirement" && (
        <>
          <Field label="Account type" required>
            <Select
              value={asset.accountType}
              required
              options={retirementAccountTypes}
              onChange={(accountType) => set({ accountType })}
            />
          </Field>
          {institution()}
          {value()}
          {nickname}
        </>
      )}

      {c === "insurance" && (
        <>
          {institution("Policy provider")}
          {value("Approximate policy value")}
          {nickname}
        </>
      )}

      {c === "real-estate" && (
        <>
          <AddressFields value={asset.address} onChange={(address) => set({ address })} />
          {value()}
          {ownedBy}
        </>
      )}

      {c === "vehicle" && (
        <>
          <Field label="Description of vehicle" required hint="e.g. 2022 Ford F-150 number ABC-123">
            <TextInput
              value={asset.description}
              required
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          {value()}
          {ownedBy}
        </>
      )}

      {c === "brokerage" && (
        <>
          <InfoBox>For IRA accounts, select the &ldquo;Retirement account&rdquo; option.</InfoBox>
          {institution()}
          {value()}
          {ownedBy}
          {payableOnDeath}
          {nickname}
        </>
      )}

      {c === "other" && (
        <>
          <Field
            label="Describe your asset in as much detail as possible"
            required
            hint="e.g. 1ct diamond engagement ring, all my books at the time of my passing, etc."
          >
            <TextInput
              value={asset.description}
              required
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <Field
            label="Where will your executor be able to find this?"
            hint="e.g. Safety-deposit box at a PNC branch"
          >
            <TextInput value={asset.location} onChange={(e) => set({ location: e.target.value })} />
          </Field>
          {value("Approximate current value", false)}
        </>
      )}
    </Modal>
  );
}
