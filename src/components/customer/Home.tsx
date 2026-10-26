"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, HeartHandshake, Users } from "lucide-react";
import { AccountList, nameList } from "@/components/customer/AccountList";
import { Reminders } from "@/components/customer/Reminders";
import { useNudges } from "@/components/customer/useNudges";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import type { AssetAccess, BankAccount } from "@/data/types";
import { cn } from "@/lib/format";
import {
  accountsOf,
  familiesOf,
  firstName,
  personById,
  roleName,
  sharedWith,
  takesBeneficiary,
} from "@/lib/household";
import { routes } from "@/lib/routes";

const card = "rounded-lg bg-white shadow-card";

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={card} aria-label={title}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-1 pt-4 @2xl:px-5">
        <h2 className="font-semibold text-pnc-ink">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

const accessText = (a: AssetAccess) =>
  a.manage
    ? "You can manage it"
    : a.transact
      ? "You can make payments and transfers"
      : a.activity
        ? "You can see the balance and activity"
        : "You can see the balance";

/**
 * A household member's home: what to look after (planning reminders), their
 * own accounts, accounts they manage for a child, and accounts family
 * members share with them. Responsive with container queries.
 */
export function Home() {
  const { person, isMinor, accounts, household, deceasedIds, loss } = useViewer();
  const nudges = useNudges();
  const names = nameList(deceasedIds);
  const { owned, managed } = accountsOf(accounts, person.id);
  const shared = sharedWith(household, person.id, accounts, deceasedIds);
  const families = familiesOf(household, person.id);
  const total = owned.filter((a) => !a.external).reduce((s, a) => s + a.balance, 0);

  const ownedDetail = (a: BankAccount): ReactNode => {
    const others = a.owners.filter((o) => o !== person.id);
    if (others.length) return <span className="text-pnc-ink">Joint with {names(others)}</span>;
    if (a.custodian && a.custodian !== person.id)
      return (
        <span className="text-pnc-muted">Managed by {names([a.custodian])} until you turn 18</span>
      );
    if (!takesBeneficiary(a)) return null;
    const bens = a.beneficiaries ?? [];
    if (!bens.length)
      return <span className="font-medium text-pnc-orange-600">No beneficiary named</span>;
    const gone = bens.some((id) => deceasedIds.includes(id));
    return (
      <span className={gone ? "font-medium text-attention" : "text-pnc-ink"}>
        Beneficiary: {names(bens)}
      </span>
    );
  };

  return (
    <div className="@container">
      <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          {loss && !isMinor && (
            <Link
              href={routes.nextSteps}
              className={cn(
                card,
                "flex items-center gap-3 px-4 py-4 hover:ring-1 hover:ring-pnc-link @2xl:px-5",
              )}
            >
              <HeartHandshake className="size-6 shrink-0 text-attention" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-pnc-ink">
                  Looking after {firstName(loss.personName)}&apos;s accounts
                </span>
                <span className="block text-sm text-pnc-muted">
                  The few steps that remain, in the order we suggest. Nothing is urgent today.
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-pnc-link" aria-hidden="true" />
            </Link>
          )}

          <Reminders nudges={nudges} />

          <Section
            title="Your accounts"
            aside={
              <span className="flex items-center gap-3 text-sm text-pnc-muted">
                <MockBadge />
                Total <Money value={total} className="font-semibold text-pnc-ink" />
              </span>
            }
          >
            {owned.length ? (
              <AccountList accounts={owned} detail={ownedDetail} />
            ) : (
              <p className="px-5 pb-5 pt-2 text-sm text-pnc-muted">No accounts yet.</p>
            )}
          </Section>

          {managed.length > 0 && (
            <Section title="Accounts you manage">
              <AccountList
                accounts={managed}
                detail={(a) => (
                  <span className="text-pnc-ink">
                    {firstName(personById(a.owners[0])?.name ?? "")}&apos;s account · you&apos;re
                    the custodian until they turn 18
                  </span>
                )}
              />
            </Section>
          )}

          {shared.length > 0 && (
            <Section title="Shared with you">
              <AccountList
                accounts={shared.map((s) => s.account)}
                detail={(a) => {
                  const s = shared.find((x) => x.account.id === a.id)!;
                  return (
                    <span className="text-pnc-ink">
                      {names(a.owners)}&apos;s · {s.family.familyName}
                      <span className="block text-pnc-muted">{accessText(s.access)}</span>
                    </span>
                  );
                }}
              />
            </Section>
          )}
        </div>

        <aside className="space-y-5">
          <section className={cn(card, "p-4 @2xl:p-5")} aria-labelledby="families-title">
            <h2 id="families-title" className="flex items-center gap-2 font-semibold text-pnc-ink">
              <Users className="size-4 text-pnc-blue-700" aria-hidden="true" /> Your families
            </h2>
            {families.length ? (
              <ul className="mt-3 space-y-2.5">
                {families.map((f) => (
                  <li key={f.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-pnc-ink">
                      {f.familyName}
                    </span>
                    <span className="shrink-0 text-pnc-muted">{roleName(f, person.id)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-pnc-muted">
                A family is a group of people you trust with access to your finances. You choose
                what each person can see and do.
              </p>
            )}
            <Link
              href={routes.family}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
            >
              {families.length ? "Open family" : "Create a family"}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
