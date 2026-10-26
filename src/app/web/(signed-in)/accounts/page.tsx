import type { Metadata } from "next";
import { BereavementReminderItem } from "@/components/bereavement/BereavementReminders";
import { PiggyBank } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { AccountRow } from "@/components/web/AccountRow";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { WillReminder } from "@/components/will/WillReminder";
import { creditCardAccounts, depositAccounts, offers, reminders, totals } from "@/data/mock";

export const metadata: Metadata = { title: "Accounts" };

export default function WebAccountsPage() {
  return (
    <>
      <WebHero title="Welcome" />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 empty:hidden">
          <WillReminder variant="web" />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">Your Accounts</h2>
          <MockBadge />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <WebCard
              title="Deposit Accounts"
              subtitle={`(${depositAccounts.length} accounts)`}
              aside={
                <span className="flex items-baseline gap-6 text-sm text-pnc-muted">
                  Total Value
                  <Money value={totals.deposits} className="text-lg font-semibold text-pnc-ink" />
                </span>
              }
            >
              <ul>
                {depositAccounts.map((a) => (
                  <AccountRow
                    key={a.id}
                    name={a.name}
                    last4={a.last4}
                    primaryLabel="Available Balance"
                    primaryValue={a.availableBalance}
                    secondaryLabel="Ledger Balance"
                    secondaryValue={a.ledgerBalance}
                    transactions={a.transactions}
                  />
                ))}
              </ul>
            </WebCard>

            <WebCard
              title="Credit Card Accounts"
              subtitle={`(${creditCardAccounts.length} accounts)`}
              aside={
                <span className="flex items-baseline gap-6 text-sm text-pnc-muted">
                  Total Balance
                  <Money
                    value={totals.creditBalance}
                    className="text-lg font-semibold text-pnc-ink"
                  />
                </span>
              }
            >
              <ul>
                {creditCardAccounts.map((a) => (
                  <AccountRow
                    key={a.id}
                    name={a.name}
                    last4={a.last4}
                    primaryLabel="Balance"
                    primaryValue={a.balance}
                    secondaryLabel="Available Credit"
                    secondaryValue={a.availableCredit}
                    transactions={a.transactions}
                  />
                ))}
              </ul>
            </WebCard>
          </div>

          <aside className="space-y-6">
            <WebCard
              title="Reminders"
              aside={
                <a href="#" className="text-sm font-semibold text-pnc-link hover:underline">
                  View All
                </a>
              }
            >
              <ul className="divide-y divide-pnc-line">
                <BereavementReminderItem />
                {reminders.map((r) => (
                  <li key={r.id} className="px-5 py-3.5 text-sm leading-relaxed">
                    {r.text}{" "}
                    {r.linkText && (
                      <a href="#" className="font-semibold text-pnc-link hover:underline">
                        {r.linkText}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </WebCard>

            <WebCard
              title="Offers and Programs"
              aside={
                <a href="#" className="text-sm font-semibold text-pnc-link hover:underline">
                  View All
                </a>
              }
            >
              {offers.map((o) => (
                <div key={o.id} className="flex gap-4 px-5 py-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-pnc-orange/10 text-pnc-orange">
                    <PiggyBank className="size-8" strokeWidth={1.5} />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">{o.title}</p>
                    <p className="mt-1 leading-relaxed text-pnc-muted">{o.body}</p>
                    <a
                      href="#"
                      className="mt-2 inline-block font-semibold text-pnc-link hover:underline"
                    >
                      {o.cta}
                    </a>
                  </div>
                </div>
              ))}
            </WebCard>
          </aside>
        </div>
      </div>
    </>
  );
}
