import type { Metadata } from "next";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";
import { RemindersPill } from "@/components/bereavement/BereavementReminders";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { NoticeCarousel } from "@/components/mobile/NoticeCarousel";
import { WalletCard } from "@/components/mobile/WalletCard";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  creditCardAccounts,
  customer,
  reminders,
  securityNotices,
  virtualWallet,
} from "@/data/mock";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Accounts" };

export default function MobileAccountsPage() {
  return (
    <>
      <MobileHeader
        title={
          <>
            <h1 className="truncate text-[28px] font-bold leading-tight">
              Hello, {customer.firstName}
            </h1>
            <p className="flex items-center gap-2 text-xs font-semibold">
              {customer.tier} <MockBadge />
            </p>
          </>
        }
        right={<RemindersPill count={reminders.length} />}
      >
        <NoticeCarousel notices={securityNotices} />
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <WalletCard title={virtualWallet.title} accounts={virtualWallet.accounts} />

        <section className="overflow-hidden rounded-2xl bg-white shadow-card">
          <header className="flex items-center justify-between bg-pnc-chip px-4 py-3">
            <h2 className="text-[15px]">Credit Cards</h2>
            <MockBadge />
          </header>
          <ul>
            {creditCardAccounts.map((c) => (
              <li
                key={c.id}
                className="mx-4 flex items-start gap-2 border-b border-pnc-line py-4 last:border-b-0"
              >
                <Link href={routes.card(c.id)} className="flex-1 pt-1 text-[15px] text-pnc-link">
                  {c.name} x{c.last4}
                </Link>
                <span className="text-right">
                  <Money value={c.balance} className="block text-xl font-bold" />
                  <span className="text-xs text-pnc-muted">Current Balance</span>
                </span>
                <button type="button" aria-label={`Options for ${c.name}`} className="pt-1.5">
                  <EllipsisVertical className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
