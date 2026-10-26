import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { PncMark } from "@/components/brand/PncLogo";
import { MobileCard } from "@/components/mobile/MobileCard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { CardArt } from "@/components/ui/CardArt";
import { Money } from "@/components/ui/Money";
import { creditCardAccounts, paybackOffers, rewardsProfile } from "@/data/mock";

export const metadata: Metadata = { title: "Rewards" };

export default function MobileRewardsPage() {
  const rewardCards = creditCardAccounts.filter((c) => c.rewardsBalance > 0);

  return (
    <>
      <MobileHeader
        title={
          <>
            <p className="flex items-center gap-2 text-2xl font-bold">
              <PncMark size={24} /> PNC <span className="font-light text-white/60">|</span>
              <span className="font-semibold">{rewardsProfile.program}</span>
            </p>
            <p className="mt-0.5 text-xs font-semibold">{rewardsProfile.tier}</p>
          </>
        }
      >
        <a href="#" className="block rounded-full bg-white py-3 text-center font-semibold text-pnc-blue-800 shadow-raised">
          View Rewards
        </a>
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            Card Rewards <MockBadge />
          </h2>
          {rewardCards.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-4">
              <CardArt style={c.cardStyle} last4={c.last4} compact className="w-16 shrink-0 rounded" />
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {c.name} x{c.last4}
                </p>
                <p className="text-pnc-muted">
                  Rewards Balance: <Money value={c.rewardsBalance} className="font-semibold text-pnc-ink" />
                </p>
              </div>
              <a href="#" className="rounded-full border border-pnc-link px-3 py-1 text-xs font-semibold text-pnc-link">
                View Details
              </a>
            </div>
          ))}
        </MobileCard>

        <MobileCard>
          <h2 className="border-b border-pnc-line px-4 py-3 font-semibold">
            Purchase Payback Offers{" "}
            <span className="text-xs font-normal text-pnc-muted">({paybackOffers.length} offers)</span>
          </h2>
          <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-4">
            {paybackOffers.map((o) => (
              <li key={o.id} className="w-32 shrink-0 rounded-xl border border-pnc-line p-3 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-pnc-orange/10 text-pnc-orange">
                  <Tag className="size-5" />
                </span>
                <p className="mt-2 text-sm font-semibold">{o.cashBack}</p>
                <p className="truncate text-xs text-pnc-muted">{o.merchant}</p>
                <a href="#" className="mt-2 inline-block rounded-full border border-pnc-link px-3 py-0.5 text-xs font-semibold text-pnc-link">
                  Learn More
                </a>
              </li>
            ))}
          </ul>
        </MobileCard>
      </div>
    </>
  );
}
