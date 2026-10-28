import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { payTransferGroups } from "@/components/shared/catalog";
import { IconChip } from "@/components/ui/IconChip";
import { Money } from "@/components/ui/Money";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { billPayHistory } from "@/data/mock";
import { cn, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pay & Transfer" };

export default function WebPayTransferPage() {
  return (
    <>
      <WebHero title="Pay & Transfer" />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {payTransferGroups.map((group) => (
            <section
              id={group.id}
              key={group.id}
              className="scroll-mt-6 rounded-md bg-white shadow-card"
            >
              <ul className="divide-y divide-pnc-line">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href="#"
                      className="flex items-center gap-4 px-5 py-4 hover:bg-pnc-surface/70"
                    >
                      <IconChip icon={item.icon} tint={item.tint} />
                      <span className="flex-1">
                        <span className="block font-semibold">{item.label}</span>
                        <span className="block text-sm text-pnc-muted">{item.description}</span>
                      </span>
                      <ChevronRight className="size-5 text-pnc-link" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <WebCard title="Payment History" aside={<MockBadge />} className="self-start">
          <ul className="divide-y divide-pnc-line">
            {billPayHistory.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3.5 text-sm">
                <span>
                  <span className="block font-semibold">{p.payee}</span>
                  <span className="block text-xs text-pnc-muted">
                    {p.account} · {formatDate(p.date)}
                  </span>
                </span>
                <span className="text-right">
                  <Money value={p.amount} className="block font-semibold" />
                  <span
                    className={cn(
                      "text-xs",
                      p.status === "Complete" ? "text-pnc-positive" : "text-pnc-muted",
                    )}
                  >
                    {p.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </WebCard>
      </div>
    </>
  );
}
