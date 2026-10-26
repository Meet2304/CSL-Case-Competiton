import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { creditCardAccounts, paybackOffers, rewardsProfile } from "@/data/mock";

export const metadata: Metadata = { title: "Rewards" };

export default function WebRewardsPage() {
  const rewardCards = creditCardAccounts.filter((c) => c.rewardsBalance > 0);

  return (
    <>
      <WebHero title="PNC TotalRewards" showDate={false} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-white p-5 shadow-card">
          <div>
            <p className="text-sm text-pnc-muted">{rewardsProfile.tier}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {rewardsProfile.pointsBalance.toLocaleString("en-US")} points
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MockBadge />
            <a href="#" className="rounded-full bg-pnc-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800">
              View Rewards
            </a>
          </div>
        </div>

        <WebCard title="Card Rewards">
          <ul className="divide-y divide-pnc-line">
            {rewardCards.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <span className="font-semibold text-pnc-link">
                  {c.name} x{c.last4}
                </span>
                <span>
                  Rewards Balance <Money value={c.rewardsBalance} className="ml-2 font-semibold" />
                </span>
              </li>
            ))}
          </ul>
        </WebCard>

        <WebCard title="Purchase Payback Offers" subtitle={`(${paybackOffers.length} offers)`}>
          <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {paybackOffers.map((o) => (
              <li key={o.id} className="rounded-md border border-pnc-line p-4 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-pnc-orange/10 text-pnc-orange">
                  <Tag className="size-6" />
                </span>
                <p className="mt-3 font-semibold">{o.cashBack}</p>
                <p className="text-sm text-pnc-muted">{o.merchant}</p>
                <p className="mt-1 text-xs text-pnc-muted">{o.expires}</p>
                <a href="#" className="mt-3 inline-block rounded-full border border-pnc-link px-4 py-1 text-xs font-semibold text-pnc-link hover:bg-pnc-blue-50">
                  Learn More
                </a>
              </li>
            ))}
          </ul>
        </WebCard>
      </div>
    </>
  );
}
