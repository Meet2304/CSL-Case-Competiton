"use client";

import { useId, useState } from "react";
import { ArrowLeft, ChevronDown, Settings2, Share2 } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import {
  assetCategories,
  type AssetAccess,
  type FamilyAsset,
  type FamilyMember,
} from "@/data/types";
import { effectiveAccess, isAdminMember, memberById, roleById, viewersOf } from "@/lib/family";
import { cn } from "@/lib/format";
import { accountLabel, accountsOf, familySummary, firstName } from "@/lib/household";
import { useFamily } from "./FamilyProvider";
import { ManageFamily, type ManageTab } from "./ManageFamily";
import { MemberFamilyView } from "./MemberFamilyView";
import { PayBills } from "./PayBills";
import { Avatar, AvatarStack, Pill, secondaryButton, StatusBadge } from "./parts";

/** What a member can do with an asset, in a few words (admin view only). */
function accessLabel(a: AssetAccess): string {
  if (a.manage) return "Full control";
  if (a.transact) return "Can pay and transfer";
  if (a.activity) return "Sees balance and activity";
  if (a.view) return "Sees balance";
  return "No access";
}

/**
 * One family, in the viewer's role. Everyone sees the accounts shared with
 * them; admins also see who can see each account, can share their own, and
 * open "Manage family" for members, roles and visibility. Non-admins get no
 * hint of what is hidden from them. Under People, everyday bills can be paid
 * from any account the viewer may pay from.
 */
export function FamilyDetail({ onBack }: { onBack: () => void }) {
  const { state, family } = useFamily();
  const { person, accounts, deceasedIds } = useViewer();
  const s = familySummary(family, person.id, accounts, deceasedIds);
  const [manage, setManage] = useState<ManageTab | null>(null);
  const [sharing, setSharing] = useState(false);
  const indexOf = (m: FamilyMember) => state.members.findIndex((x) => x.id === m.id);

  return (
    <div className="space-y-5">
      {/* The family's name and the viewer's role are in the page header above. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> All families
        </button>
        <div className="flex items-center gap-3">
          {/* Only admins can manage; everyone else never sees the control. */}
          {s.isAdmin && (
            <button type="button" onClick={() => setManage("members")} className={secondaryButton}>
              <Settings2 className="size-4" aria-hidden="true" /> Manage family
            </button>
          )}
          <MockBadge />
        </div>
      </div>

      <section
        aria-label={`${family.familyName} at a glance`}
        className="rounded-lg bg-white shadow-card"
      >
        <dl
          className={cn(
            "grid divide-pnc-line",
            s.isAdmin ? "grid-cols-2 @2xl:grid-cols-4 @2xl:divide-x" : "grid-cols-3 divide-x",
          )}
        >
          {(s.isAdmin
            ? [
                { label: "Accounts shared", value: s.visible.length },
                { label: "Total value", value: <Money value={s.total} compact /> },
                { label: "Yours in this family", value: s.yours },
                { label: "Invites pending", value: s.invited.length },
              ]
            : [
                { label: "Shared with you", value: s.visible.length },
                { label: "Their value", value: <Money value={s.total} compact /> },
                { label: "Members", value: s.living.length },
              ]
          ).map(({ label, value }) => (
            <div key={label} className="px-5 py-4 @2xl:px-6">
              <dt className="text-xs text-pnc-muted">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums text-pnc-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="family-assets-title" className="rounded-lg bg-white shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-pnc-line px-5 py-4">
            <div>
              <h3 id="family-assets-title" className="font-semibold text-pnc-ink">
                {s.isAdmin ? "Shared assets" : "Shared with you"}
              </h3>
              {s.isAdmin && (
                <p className="text-sm text-pnc-muted">Open an account to see who can see it.</p>
              )}
            </div>
            {s.isAdmin &&
              accountsOf(accounts, person.id).owned.some(
                (a) => !family.accountIds.includes(a.id),
              ) && (
                <button type="button" onClick={() => setSharing(true)} className={secondaryButton}>
                  <Share2 className="size-4" aria-hidden="true" /> Share an account
                </button>
              )}
          </header>
          <div className="p-5">
            {s.isAdmin ? (
              <AdminAssets indexOf={indexOf} onChangeAccess={() => setManage("roles")} />
            ) : (
              s.me && <MemberFamilyView member={s.me} />
            )}
          </div>
        </section>

        <div className="space-y-5">
          <aside aria-labelledby="family-people-title" className="rounded-lg bg-white shadow-card">
            <header className="flex items-center justify-between gap-3 border-b border-pnc-line px-5 py-4">
              <h3 id="family-people-title" className="font-semibold text-pnc-ink">
                People
              </h3>
              {s.isAdmin && (
                <button
                  type="button"
                  onClick={() => setManage("members")}
                  className="text-sm font-semibold text-pnc-link hover:underline"
                >
                  Edit
                </button>
              )}
            </header>
            <ul className="divide-y divide-pnc-line">
              {state.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar member={m} index={indexOf(m)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-pnc-ink">
                      {m.id === person.id ? `${m.name} (you)` : m.name}
                    </p>
                    {/* Other members' roles are confidential to admins. */}
                    {(s.isAdmin || m.id === person.id) && (
                      <p className="truncate text-xs text-pnc-muted">
                        {roleById(state, m.roleId)?.name}
                      </p>
                    )}
                  </div>
                  {m.status !== "Active" && <StatusBadge status={m.status} />}
                </li>
              ))}
            </ul>
          </aside>
          <PayBills />
        </div>
      </div>

      {s.isAdmin && (
        <>
          <ManageFamily tab={manage} onTab={setManage} onClose={() => setManage(null)} />
          <ShareDialog open={sharing} onClose={() => setSharing(false)} />
        </>
      )}
    </div>
  );
}

/** Admin list of shared accounts; each opens to who can see it and what they can do. */
function AdminAssets({
  indexOf,
  onChangeAccess,
}: {
  indexOf: (m: FamilyMember) => number;
  onChangeAccess: () => void;
}) {
  const { state } = useFamily();
  if (state.assets.length === 0)
    return (
      <p className="rounded-md border border-dashed border-pnc-line px-4 py-8 text-center text-sm text-pnc-muted">
        No accounts are shared yet. Use “Share an account” to share one of yours.
      </p>
    );
  return (
    <div className="space-y-5">
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
                  onChangeAccess={onChangeAccess}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AssetRow({
  asset,
  indexOf,
  onChangeAccess,
}: {
  asset: FamilyAsset;
  indexOf: (m: FamilyMember) => number;
  onChangeAccess: () => void;
}) {
  const { state, dispatch } = useFamily();
  const { person } = useViewer();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const owners = asset.owners.map((id) => memberById(state, id)?.name).filter(Boolean);
  const living = state.members.filter((m) => m.status !== "Deceased");
  const isOwner = asset.owners.includes(person.id);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
      >
        <span className="min-w-0 flex-1 basis-48">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-pnc-ink">
              {asset.name}
              {asset.last4 && (
                <span className="text-xs font-normal text-pnc-muted"> x{asset.last4}</span>
              )}
            </span>
            {asset.external && <Pill tone="blue">Outside PNC</Pill>}
            {isOwner && <Pill>Yours</Pill>}
          </span>
          <span className="block truncate text-xs text-pnc-muted">
            {owners.length > 0 ? `Owned by ${owners.join(" & ")}` : "No owner"}
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs text-pnc-muted">
          <span className="sr-only">Visible to</span>
          <AvatarStack members={viewersOf(state, asset)} indexOf={indexOf} />
        </span>
        <Money value={asset.value} className="w-28 text-right font-semibold" />
        <ChevronDown
          className={cn("size-4 shrink-0 text-pnc-link transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="border-t border-pnc-line bg-pnc-surface/50 px-4 py-3"
      >
        <p className="text-xs font-semibold text-pnc-muted">Who can see and do what</p>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 @2xl:grid-cols-2">
          {living.map((m) => {
            const access = effectiveAccess(state, m, asset);
            return (
              <li key={m.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-pnc-ink">
                  {m.id === person.id ? "You" : firstName(m.name)}
                </span>
                <span
                  className={cn(
                    "shrink-0",
                    access.view ? "font-medium text-pnc-ink" : "text-pnc-muted",
                  )}
                >
                  {isAdminMember(state, m) ? "Admin · full control" : accessLabel(access)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
          <button type="button" onClick={onChangeAccess} className="text-pnc-link hover:underline">
            Change access
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => dispatch({ type: "unshareAccount", accountId: asset.id })}
              className="text-pnc-muted hover:text-pnc-link"
            >
              Stop sharing<span className="sr-only"> {asset.name}</span>
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Pick one of your own accounts to share with the family. */
function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { family, dispatch } = useFamily();
  const { person, accounts } = useViewer();
  const unshared = accountsOf(accounts, person.id).owned.filter(
    (a) => !family.accountIds.includes(a.id),
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Share an account"
      description={`Nobody in ${family.familyName} can see it until you give their role access.`}
    >
      {unshared.length === 0 ? (
        <p className="px-5 py-6 text-sm text-pnc-muted">All your accounts are already shared.</p>
      ) : (
        <ul className="divide-y divide-pnc-line">
          {unshared.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1 basis-40 font-medium text-pnc-ink">
                {accountLabel(a)}
              </span>
              <Money value={a.balance} compact className="text-sm text-pnc-muted" />
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "shareAccount", accountId: a.id });
                  if (unshared.length === 1) onClose();
                }}
                className={secondaryButton}
              >
                Share<span className="sr-only"> {accountLabel(a)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
