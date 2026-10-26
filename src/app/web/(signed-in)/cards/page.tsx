import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { CardLockRow } from "@/components/shared/CardLockRow";
import { CardArt } from "@/components/ui/CardArt";
import { Money } from "@/components/ui/Money";
import { WebHero } from "@/components/web/WebHero";
import { creditCardAccounts } from "@/data/mock";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Cards" };

const manageLinks = ["Replace card", "Digital wallets", "Merchants storing your card", "Travel notifications"];

export default function WebCardsPage() {
  return (
    <>
      <WebHero title="Cards" showDate={false} />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium">Your Cards</h2>
          <MockBadge />
        </div>

        {creditCardAccounts.map((card) => (
          <section key={card.id} className="grid gap-6 rounded-md bg-white p-5 shadow-card md:grid-cols-[14rem_1fr_16rem]">
            <CardArt style={card.cardStyle} last4={card.last4} />

            <div>
              <h3 className="text-lg font-semibold">
                {card.name} x{card.last4}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-pnc-muted">Current Balance</dt>
                  <dd className="text-lg font-semibold"><Money value={card.balance} /></dd>
                </div>
                <div>
                  <dt className="text-pnc-muted">Available Credit</dt>
                  <dd className="text-lg font-semibold"><Money value={card.availableCredit} /></dd>
                </div>
                <div>
                  <dt className="text-pnc-muted">Minimum Due</dt>
                  <dd className="font-semibold">
                    <Money value={card.minimumDue} />{" "}
                    <span className="text-xs font-normal text-pnc-muted">by {formatDate(card.dueDate)}</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3 border-t border-pnc-line pt-4 text-sm md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <CardLockRow cardName={card.name} />
              <ul className="divide-y divide-pnc-line border-t border-pnc-line">
                {manageLinks.map((label) => (
                  <li key={label}>
                    <a href="#" className="flex items-center justify-between py-2.5 hover:text-pnc-link">
                      {label} <ChevronRight className="size-4 text-pnc-link" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
