import type { Metadata } from "next";
import { MobileCard, MobileIconRow } from "@/components/mobile/MobileCard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { payTransferGroups } from "@/components/shared/catalog";
import { Money } from "@/components/ui/Money";
import { billPayHistory } from "@/data/mock";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pay & Transfer" };

export default function MobilePayTransferPage() {
  const [first, ...rest] = payTransferGroups;

  return (
    <>
      <MobileHeader title="Pay & Transfer">
        <GroupCard items={first.items} />
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        {rest.map((g) => (
          <GroupCard key={g.id} items={g.items} />
        ))}

        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3.5 font-semibold">
            Payment History <MockBadge />
          </h2>
          <ul>
            {billPayHistory.map((p) => (
              <li
                key={p.id}
                className="mx-4 flex justify-between gap-3 border-b border-pnc-line py-3 text-sm last:border-b-0"
              >
                <span>
                  <span className="block font-medium">{p.payee}</span>
                  <span className="block text-xs text-pnc-muted">
                    {p.account} · {formatDate(p.date)}
                  </span>
                </span>
                <span className="text-right">
                  <Money value={p.amount} className="block font-semibold" />
                  <span className="text-xs text-pnc-muted">{p.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </MobileCard>
      </div>
    </>
  );
}

function GroupCard({ items }: { items: (typeof payTransferGroups)[number]["items"] }) {
  return (
    <MobileCard>
      <ul>
        {items.map((item) => (
          <MobileIconRow key={item.id} icon={item.icon} label={item.label} tint={item.tint} />
        ))}
      </ul>
    </MobileCard>
  );
}
