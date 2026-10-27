"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, CreditCard, Info, UserRoundPen } from "lucide-react";
import { nameList } from "@/components/customer/AccountList";
import { accessText, RelationBadge } from "@/components/customer/assetDetail";
import { useViewer } from "@/components/customer/Viewer";
import { applyFamilyAction } from "@/components/family/FamilyProvider";
import { MockBadge } from "@/components/mock/Mock";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import { people } from "@/data/household";
import { MOCK_AS_OF } from "@/data/mock";
import type { BankAccount } from "@/data/types";
import { cn, formatDate } from "@/lib/format";
import {
  accountLabel,
  designationTerm,
  familiesOf,
  isMinor,
  kindLabels,
  relationshipTo,
  takesBeneficiary,
  type PersonAsset,
} from "@/lib/household";
import { householdActions } from "@/lib/householdStore";
import { routes } from "@/lib/routes";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-pnc-line px-5 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-pnc-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const actionLink =
  "inline-flex items-center gap-1.5 rounded-full border border-pnc-line bg-white px-4 py-2 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";

/**
 * Managing one account from My Assets: what it is, quick actions, who
 * inherits it (owners name or change the beneficiary here), which families it's shared with (owners who are a family's
 * admin can share or stop sharing here), and recent activity. Only opened for
 * accounts the person may manage (see `canManage`).
 */
export function ManageAsset({ item, onClose }: { item: PersonAsset | null; onClose: () => void }) {
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      side="right"
      title={item ? `Manage ${accountLabel(item.account)}` : "Manage"}
      description={item ? kindLabels[item.account.kind] : undefined}
    >
      {item && <ManageBody item={item} />}
    </Dialog>
  );
}

function ManageBody({ item }: { item: PersonAsset }) {
  const { person, household, accounts, deceasedIds } = useViewer();
  const names = nameList(deceasedIds);
  const a = item.account;
  const owns = item.relation === "owned";
  const families = familiesOf(household, person.id);
  const isAdminOf = (familyId: string) => {
    const f = families.find((x) => x.id === familyId)!;
    const me = f.members.find((m) => m.id === person.id);
    return f.roles.find((r) => r.id === me?.roleId)?.isAdmin === true;
  };
  const activity = a.transactions ?? [];

  function setShared(familyId: string, share: boolean) {
    householdActions.updateFamily(familyId, (f) =>
      applyFamilyAction(
        f,
        { type: share ? "shareAccount" : "unshareAccount", accountId: a.id },
        person.id,
        accounts,
      ),
    );
  }

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-5">
        <div>
          <p className="text-sm text-pnc-muted">
            {a.kind === "credit-card" ? "Current balance" : "Balance"}
            <RelationBadge relation={item.relation} />
          </p>
          <Money value={a.balance} className="font-display text-3xl font-medium" />
        </div>
        <MockBadge />
      </div>

      {!a.external && (
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {a.kind === "credit-card" ? (
            <>
              <Link href={routes.payTransfer} className={actionLink}>
                <ArrowLeftRight className="size-4" aria-hidden="true" /> Make a payment
              </Link>
              <Link href={routes.cards} className={actionLink}>
                <CreditCard className="size-4" aria-hidden="true" /> Card settings
              </Link>
            </>
          ) : (
            <Link href={routes.payTransfer} className={actionLink}>
              <ArrowLeftRight className="size-4" aria-hidden="true" /> Transfer money
            </Link>
          )}
        </div>
      )}

      <Section title="Details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-pnc-muted">Type</dt>
            <dd className="font-medium text-pnc-ink">
              {kindLabels[a.kind]}
              {a.external && " · held outside PNC"}
            </dd>
          </div>
          {a.last4 && (
            <div>
              <dt className="text-pnc-muted">Account number</dt>
              <dd className="font-medium text-pnc-ink">ending {a.last4}</dd>
            </div>
          )}
          <div>
            <dt className="text-pnc-muted">{a.owners.length > 1 ? "Owners" : "Owner"}</dt>
            <dd className="font-medium text-pnc-ink">{names(a.owners)}</dd>
          </div>
          {a.custodian && (
            <div>
              <dt className="text-pnc-muted">Custodian</dt>
              <dd className="font-medium text-pnc-ink">{names([a.custodian])} until 18</dd>
            </div>
          )}
          {item.relation === "shared" && item.access && (
            <div className="col-span-2">
              <dt className="text-pnc-muted">Shared through {item.family?.familyName}</dt>
              <dd className="font-medium text-pnc-ink">{accessText(item.access)}</dd>
            </div>
          )}
        </dl>
      </Section>

      {a.beneficiaries !== undefined && (
        <Section title="Beneficiary">
          {owns && takesBeneficiary(a) ? (
            <BeneficiaryEditor key={a.id} account={a} />
          ) : (
            <p className="text-sm text-pnc-ink">
              {a.beneficiaries.length ? (
                names(a.beneficiaries)
              ) : (
                <span className="font-medium text-pnc-orange-600">
                  No {designationTerm(a)} named
                </span>
              )}
            </p>
          )}
        </Section>
      )}

      {owns && families.length > 0 && (
        <Section title="Family sharing">
          <ul className="divide-y divide-pnc-line rounded-md border border-pnc-line">
            {families.map((f) => {
              const shared = f.accountIds.includes(a.id);
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-pnc-ink">{f.familyName}</span>
                    <span className="block text-pnc-muted">
                      {shared ? "Shared · roles decide who sees what" : "Not shared"}
                    </span>
                  </span>
                  {isAdminOf(f.id) ? (
                    <button
                      type="button"
                      onClick={() => setShared(f.id, !shared)}
                      className="font-semibold text-pnc-link hover:underline"
                    >
                      {shared ? "Stop sharing" : "Share"}
                      <span className="sr-only"> with {f.familyName}</span>
                    </button>
                  ) : (
                    <Link
                      href={routes.familyDetail(f.id)}
                      className="inline-flex items-center gap-1 font-semibold text-pnc-link hover:underline"
                    >
                      Open <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {activity.length > 0 && (
        <Section title="Recent activity">
          <ul className="divide-y divide-pnc-line text-sm">
            {activity.map((t) => (
              <li key={t.id} className="flex items-baseline gap-3 py-2">
                <span className="w-16 shrink-0 text-pnc-muted">
                  {formatDate(t.date, "monthDay")}
                </span>
                <span className="min-w-0 flex-1 truncate text-pnc-ink">
                  {t.description}
                  {t.status === "Pending" && (
                    <span className="ml-2 text-xs italic text-pnc-muted">Pending</span>
                  )}
                </span>
                <Money value={t.amount} signed className="shrink-0" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/**
 * Who inherits this account directly, outside the will, with an in-place
 * editor. A beneficiary overrides the will for this account.
 */
function BeneficiaryEditor({ account: a }: { account: BankAccount }) {
  const { person, deceasedIds } = useViewer();
  const id = useId();
  const names = nameList(deceasedIds);
  const current = a.beneficiaries ?? [];
  const stale = current.some((x) => deceasedIds.includes(x));
  const choices = people.filter(
    (p) => p.id !== person.id && !deceasedIds.includes(p.id) && p.relationship !== "Other",
  );
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>(current);
  const minors = choices.filter((p) => picked.includes(p.id) && isMinor(p, MOCK_AS_OF));

  if (!editing)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <p
            className={cn(
              "text-sm font-medium",
              stale ? "text-attention" : current.length ? "text-pnc-ink" : "text-pnc-orange-600",
            )}
          >
            {current.length ? names(current) : `No ${designationTerm(a)} named`}
          </p>
          <p className="mt-0.5 text-xs text-pnc-muted">
            Inherits this account directly, without probate. It overrides your will for this
            account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPicked(current.filter((x) => choices.some((p) => p.id === x)));
            setEditing(true);
          }}
          className={actionLink}
        >
          <UserRoundPen className="size-4" aria-hidden="true" />
          {current.length ? "Change beneficiary" : "Add beneficiary"}
        </button>
      </div>
    );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        householdActions.setBeneficiaries(a.id, picked);
        setEditing(false);
      }}
    >
      <fieldset>
        <legend className="text-sm font-medium text-pnc-ink">
          Who should inherit {a.name}? They share it equally.
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {choices.map((p) => {
            const on = picked.includes(p.id);
            return (
              <label
                key={p.id}
                htmlFor={`${id}-${p.id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm ring-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-pnc-link",
                  on ? "bg-pnc-blue-50 ring-pnc-blue-700" : "ring-pnc-line hover:ring-pnc-muted",
                )}
              >
                <input
                  id={`${id}-${p.id}`}
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    setPicked((xs) => (on ? xs.filter((x) => x !== p.id) : [...xs, p.id]))
                  }
                  className="size-4 accent-pnc-blue-700"
                />
                {p.name}
                <span className="text-pnc-muted">{relationshipTo(person, p)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {minors.length > 0 && (
        <p className="flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-sm leading-relaxed text-pnc-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
          {minors.map((m) => m.name.split(" ")[0]).join(" and ")} {minors.length > 1 ? "are" : "is"}{" "}
          under 18 and can&apos;t take an account directly. A custodian holds it for them until they
          turn 18 — your advisor can help set that up.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-pnc-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-pnc-muted hover:text-pnc-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
