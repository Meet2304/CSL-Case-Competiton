"use client";

import { useId, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Plus } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { WillOverviewStrip } from "@/components/will/WillTab";
import {
  assetCategories,
  type AssetCategory,
  type FamilyAsset,
  type FamilyMember,
} from "@/data/types";
import { firstName, memberById, viewersOf } from "@/lib/family";
import { useFamily } from "./FamilyProvider";
import { MemberFamilyView } from "./MemberFamilyView";
import {
  AvatarStack,
  Checkbox,
  fieldInput,
  fieldLabel,
  linkButton,
  Pill,
  primaryButton,
  secondaryButton,
} from "./parts";

/** Admin overview of family assets, with a "preview as" member view. */
export function OverviewPanel() {
  const { state } = useFamily();
  const [previewId, setPreviewId] = useState("");
  const [adding, setAdding] = useState(false);
  const selectId = useId();

  if (adding) return <AddAssetForm onDone={() => setAdding(false)} />;

  const living = state.members.filter((m) => m.status !== "Deceased");
  const preview = living.find((m) => m.id === previewId);
  const indexOf = (m: FamilyMember) => state.members.findIndex((x) => x.id === m.id);

  return (
    <div>
      {!preview && <WillOverviewStrip />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={selectId} className="text-sm font-semibold text-pnc-ink">
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-pnc-blue-700" aria-hidden="true" /> Preview as
          </span>
          <select
            id={selectId}
            value={previewId}
            onChange={(e) => setPreviewId(e.target.value)}
            className="mt-1 rounded-md border border-pnc-line bg-white px-2.5 py-1.5 font-normal outline-none focus:border-pnc-link"
          >
            <option value="">Admin view (everything)</option>
            {living
              .filter((m) => m.id !== state.selfId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </label>
        {!preview && (
          <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
            <Plus className="size-4" aria-hidden="true" /> Add asset
          </button>
        )}
      </div>

      {preview ? (
        <>
          {/* Admin-only context. The member's own view below never mentions limits. */}
          <p className="mt-3 flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-sm text-pnc-ink">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <span>
              This is exactly what {firstName(preview.name)} sees. Members are never told which
              assets or actions are hidden from them — only admins can see access settings.
            </span>
          </p>
          <div className="mt-4" data-testid="member-preview">
            <MemberFamilyView member={preview} />
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-5">
          {assetCategories.map((category) => {
            const items = state.assets.filter((a) => a.category === category);
            if (items.length === 0) return null;
            return (
              <section key={category}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-pnc-muted">
                  {category}
                </h4>
                <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
                  {items.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} indexOf={indexOf} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetRow({
  asset,
  indexOf,
}: {
  asset: FamilyAsset;
  indexOf: (m: FamilyMember) => number;
}) {
  const { state } = useFamily();
  const owners = asset.owners.map((id) => memberById(state, id)?.name).filter(Boolean);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-pnc-ink">
            {asset.name}
            {asset.last4 && (
              <span className="text-xs font-normal text-pnc-muted"> x{asset.last4}</span>
            )}
          </span>
          {asset.closed && <Pill>Closed</Pill>}
          {asset.external && <Pill tone="blue">Outside PNC</Pill>}
        </p>
        <p className="truncate text-xs text-pnc-muted">
          {owners.length > 0 ? `Owned by ${owners.join(" & ")}` : "No owner"}
        </p>
      </div>
      <span className="flex items-center gap-2 text-xs text-pnc-muted">
        Visible to
        <AvatarStack members={viewersOf(state, asset)} indexOf={indexOf} />
      </span>
      <Money value={asset.value} className="w-28 text-right font-semibold" />
    </li>
  );
}

function AddAssetForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useFamily();
  const id = useId();
  const living = state.members.filter((m) => m.status !== "Deceased");
  const [form, setForm] = useState({
    name: "",
    category: assetCategories[0] as AssetCategory,
    value: "",
    last4: "",
    owners: [state.selfId],
  });
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const toggleOwner = (memberId: string) =>
    set(
      "owners",
      form.owners.includes(memberId)
        ? form.owners.filter((x) => x !== memberId)
        : [...form.owners, memberId],
    );

  const isDebt = form.category === "Debts";
  const value = Number(form.value.replace(/[$,\s]/g, ""));
  const errors = {
    name: form.name.trim() ? null : "Enter a name for the asset.",
    value:
      form.value.trim() && Number.isFinite(value)
        ? null
        : isDebt
          ? "Enter the balance owed."
          : "Enter the current value.",
    last4: form.last4 && !/^\d{4}$/.test(form.last4) ? "Use the last 4 digits only." : null,
    owners: form.owners.length > 0 ? null : "Choose at least one owner.",
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    dispatch({
      type: "addAsset",
      asset: {
        name: form.name.trim(),
        category: form.category,
        // Debts are stored as negative values so they reduce net assets.
        value: isDebt ? -Math.abs(value) : value,
        last4: form.last4 || undefined,
        owners: form.owners,
      },
    });
    onDone();
  }

  const error = (key: keyof typeof errors) =>
    submitted && errors[key] ? (
      <p id={`${id}-${key}-error`} className="mt-1 text-xs text-pnc-negative">
        {errors[key]}
      </p>
    ) : null;
  const invalid = (key: keyof typeof errors) =>
    submitted && errors[key]
      ? { "aria-invalid": true, "aria-describedby": `${id}-${key}-error` }
      : {};

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" onClick={onDone} className={linkButton}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All assets
      </button>
      <h3 className="mt-3 text-xl font-semibold text-pnc-ink">Add asset</h3>
      <p className="mt-1 text-sm text-pnc-muted">
        New assets are visible to admins only until you share them in Roles &amp; access.
      </p>

      <div className="mt-5 grid max-w-2xl gap-4 @xl:grid-cols-2">
        <div className="@xl:col-span-2">
          <label htmlFor={`${id}-name`} className={fieldLabel}>
            Asset name <span className="text-pnc-negative">*</span>
          </label>
          <input
            id={`${id}-name`}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Lake house"
            {...invalid("name")}
            className={fieldInput}
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${id}-category`} className={fieldLabel}>
            Category
          </label>
          <select
            id={`${id}-category`}
            value={form.category}
            onChange={(e) => set("category", e.target.value as AssetCategory)}
            className={fieldInput}
          >
            {assetCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-value`} className={fieldLabel}>
            {isDebt ? "Balance owed" : "Current value"} <span className="text-pnc-negative">*</span>
          </label>
          <input
            id={`${id}-value`}
            value={form.value}
            inputMode="decimal"
            placeholder="$0.00"
            onChange={(e) => set("value", e.target.value)}
            {...invalid("value")}
            className={fieldInput}
          />
          {error("value")}
        </div>
        <div>
          <label htmlFor={`${id}-last4`} className={fieldLabel}>
            Account number <span className="font-normal text-pnc-muted">(last 4, optional)</span>
          </label>
          <input
            id={`${id}-last4`}
            value={form.last4}
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => set("last4", e.target.value.replace(/\D/g, ""))}
            {...invalid("last4")}
            className={fieldInput}
          />
          {error("last4")}
        </div>
        <fieldset
          className="@xl:col-span-2"
          aria-describedby={submitted && errors.owners ? `${id}-owners-error` : undefined}
        >
          <legend className={fieldLabel}>Owners</legend>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
            {living.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm text-pnc-ink">
                <Checkbox checked={form.owners.includes(m.id)} onChange={() => toggleOwner(m.id)} />
                {m.name}
              </label>
            ))}
          </div>
          {error("owners")}
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-pnc-line pt-4">
        <button type="submit" className={primaryButton}>
          Add asset
        </button>
        <button type="button" onClick={onDone} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
