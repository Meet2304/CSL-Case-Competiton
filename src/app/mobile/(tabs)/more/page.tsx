import type { Metadata } from "next";
import { Bell, CircleHelp, CreditCard, FileText, Settings, Shield, Users } from "lucide-react";
import { MobileCard, MobileIconRow, MobileSignOffRow } from "@/components/mobile/MobileCard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { creditCardAccounts } from "@/data/mock";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "More" };

export default function MobileMorePage() {
  return (
    <>
      <MobileHeader title="More">
        <MobileCard>
          <ul>
            {creditCardAccounts.map((c) => (
              <MobileIconRow
                key={c.id}
                icon={CreditCard}
                label={`${c.name.replace(/®/g, "")} x${c.last4}`}
                href={routes.card(c.id)}
              />
            ))}
          </ul>
        </MobileCard>
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <MobileCard>
          <ul>
            <MobileIconRow icon={Users} label="Family Dashboard" href={routes.family} />
          </ul>
        </MobileCard>
        <MobileCard>
          <ul>
            <MobileIconRow icon={Settings} label="Profile & Settings" />
            <MobileIconRow icon={Shield} label="Security" />
            <MobileIconRow icon={Bell} label="Alerts" />
            <MobileIconRow icon={FileText} label="Statements & Documents" />
          </ul>
        </MobileCard>
        <MobileCard>
          <ul>
            <MobileIconRow icon={CircleHelp} label="Help" />
            <MobileSignOffRow />
          </ul>
        </MobileCard>
      </div>
    </>
  );
}
