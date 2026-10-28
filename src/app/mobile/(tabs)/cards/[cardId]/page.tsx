import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClipboardList, CreditCard, WalletCards } from "lucide-react";
import { MobileCard, MobileCardTitle, MobileLinkRow } from "@/components/mobile/MobileCard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { CardLockRow } from "@/components/shared/CardLockRow";
import { CardArt } from "@/components/ui/CardArt";
import { Money } from "@/components/ui/Money";
import { creditCardAccounts } from "@/data/mock";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Card Details" };

export function generateStaticParams() {
  return creditCardAccounts.map((c) => ({ cardId: c.id }));
}

export default async function MobileCardDetailsPage({
  params,
}: PageProps<"/mobile/cards/[cardId]">) {
  const { cardId } = await params;
  const card = creditCardAccounts.find((c) => c.id === cardId);
  if (!card) notFound();

  return (
    <>
      <MobileHeader title="Card Details" backHref={routes.more}>
        <MobileCard className="flex gap-4 p-3">
          <CardArt style={card.cardStyle} last4={card.last4} className="w-36 shrink-0" />
          <div className="min-w-0 text-[1.0625rem] leading-snug">
            {card.name} x{card.last4}
            <p className="mt-2 text-xs text-pnc-muted">
              Balance <Money value={card.balance} className="font-semibold text-pnc-ink" />
            </p>
            <MockBadge className="mt-2" />
          </div>
        </MobileCard>
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <MobileCard>
          <MobileCardTitle icon={CreditCard}>Card Actions</MobileCardTitle>
          <ul>
            <MobileLinkRow label="Lock card" trailing={<CardLockRow cardName={card.name} />} />
            <MobileLinkRow label="Replace card" />
          </ul>
        </MobileCard>

        <MobileCard>
          <MobileCardTitle icon={WalletCards}>Digital Card Management</MobileCardTitle>
          <ul>
            <MobileLinkRow label="Paze" />
            <MobileLinkRow label="Digital wallets" />
            <MobileLinkRow label="Merchants storing your card" />
          </ul>
        </MobileCard>

        <MobileCard>
          <MobileCardTitle icon={ClipboardList}>Account Actions</MobileCardTitle>
          <ul>
            <MobileLinkRow label="Make a payment" />
            <MobileLinkRow label="View statements" />
            <MobileLinkRow label="Set up alerts" />
          </ul>
        </MobileCard>
      </div>
    </>
  );
}
