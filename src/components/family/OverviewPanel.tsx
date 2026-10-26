"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Share2 } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { Money } from "@/components/ui/Money";
import { assetCategories, type FamilyAsset, type FamilyMember } from "@/data/types";
import { firstName, memberById, viewersOf } from "@/lib/family";
import { accountLabel, accountsOf } from "@/lib/household";
import { useFamily } from "./FamilyProvider";
import { MemberFamilyView } from "./MemberFamilyView";
import { AvatarStack, Pill, primaryButton, secondaryButton } from "./parts";

/** Admin overview of the accounts shared with the family, with a "preview as" member view. */
export function OverviewPanel() {
  const { state, family, dispatch } = useFamily();
  const { person, accounts } = useViewer();
  const [previewId, setPreviewId] = useState("");
  const [sharing, setSharing] = useState(false);
  const selectId = useId();

  const living = state.members.filter((m) => m.status !== "Deceased");
  const preview = living.find((m) => m.id === previewId);
  const indexOf = (m: FamilyMember) => state.members.findIndex((x) => x.id === m.id);
  const unshared = accountsOf(accounts, person.id).owned.filter(
    (a) => !family.accountIds.includes(a.id),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor={selectId} className="text-sm font-semibold text-pnc-ink">
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 text-pnc-blue-700" aria-hidden="true" /> Preview as
          </span>
          <select
            id={selectId}
            value={previewId}
            onChange={(e) => setPreviewId(e.target.value)}
            className="mt-1 max-w-full rounded-md border border-pnc-line bg-white px-2.5 py-1.5 font-normal outline-none focus:border-pnc-link"
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
        {!preview && unshared.length > 0 && (
          <button
            type="button"
            aria-expanded={sharing}
            onClick={() => setSharing(!sharing)}
            className={primaryButton}
          >
            <Share2 className="size-4" aria-hidden="true" /> Share an account
          </button>
        )}
      </div>

      {sharing && !preview && (
        <section
          aria-label="Share one of your accounts"
          className="mt-4 rounded-md border border-pnc-line p-4"
        >
          <p className="text-sm text-pnc-ink">
            Share one of your accounts with {family.familyName}. Nobody can see it until you give
            their role access in <strong>Roles &amp; access</strong>.
          </p>
          <ul className="mt-3 divide-y divide-pnc-line">
            {unshared.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1 basis-40 font-medium text-pnc-ink">
                  {accountLabel(a)}
                </span>
                <Money value={a.balance} compact className="text-sm text-pnc-muted" />
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "shareAccount", accountId: a.id });
                    if (unshared.length === 1) setSharing(false);
                  }}
                  className={secondaryButton}
                >
                  Share<span className="sr-only"> {accountLabel(a)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {preview ? (
        <>
          {/* Admin-only context. The member's own view below never mentions limits. */}
          <p className="mt-3 flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-sm text-pnc-ink">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <span>
              This is exactly what {firstName(preview.name)} sees. Members are never told which
              accounts or actions are hidden from them — only admins can see access settings.
            </span>
          </p>
          <div className="mt-4">
            <MemberFamilyView member={preview} />
          </div>
        </>
      ) : state.assets.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-pnc-line px-4 py-8 text-center text-sm text-pnc-muted">
          No accounts are shared yet.{" "}
          {unshared.length > 0 && "Use “Share an account” to share one of yours."}
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {assetCategories.map((category) => {
            const items = state.assets.filter((a) => a.category === category);
            if (items.length === 0) return null;
            return (
              <section key={category}>
                <h4 className="mb-2 text-xs font-semibold text-pnc-muted">{category}</h4>
                <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
                  {items.map((asset) => (
                    <AssetRow
                      key={asset.id}
                      asset={asset}
                      indexOf={indexOf}
                      onUnshare={
                        asset.owners.includes(person.id)
                          ? () => dispatch({ type: "unshareAccount", accountId: asset.id })
                          : undefined
                      }
                    />
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
  onUnshare,
}: {
  asset: FamilyAsset;
  indexOf: (m: FamilyMember) => number;
  /** Only the account's owner can stop sharing it. */
  onUnshare?: () => void;
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
      {onUnshare && (
        <button
          type="button"
          onClick={onUnshare}
          className="text-xs font-semibold text-pnc-muted hover:text-pnc-link"
        >
          Stop sharing<span className="sr-only"> {asset.name}</span>
        </button>
      )}
    </li>
  );
}
