"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftRight, ArrowRight, CreditCard, UserRoundPen } from "lucide-react";
import { nameList } from "@/components/customer/AccountList";
import { accessText, RelationBadge } from "@/components/customer/assetDetail";
import { useViewer } from "@/components/customer/Viewer";
import { applyFamilyAction } from "@/components/family/FamilyProvider";
import { MockBadge } from "@/components/mock/Mock";
import { Dialog } from "@/components/ui/Dialog";
import { Money } from "@/components/ui/Money";
import { formatDate } from "@/lib/format";
import {
  accountLabel,
  designationTerm,
  familiesOf,
  kindLabels,
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
 * inherits it, which families it's shared with (owners who are a family's
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-pnc-ink">
              {a.beneficiaries.length ? (
                names(a.beneficiaries)
              ) : (
                <span className="font-medium text-pnc-orange-600">
                  No {designationTerm(a)} named
                </span>
              )}
            </p>
            {owns && takesBeneficiary(a) && (
              <Link href={`${routes.plan}#beneficiaries`} className={actionLink}>
                <UserRoundPen className="size-4" aria-hidden="true" />
                {a.beneficiaries.length ? "Change beneficiary" : "Add beneficiary"}
              </Link>
            )}
          </div>
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
