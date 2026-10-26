import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { CustomerList } from "@/components/advisor/CustomerList";
import { NotificationList } from "@/components/advisor/NotificationList";
import { MobileCard } from "@/components/mobile/MobileCard";
import { iconButton, MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { advisor, advisorCustomers, routineNotifications } from "@/data/advisor";
import { buildNotifications, needsAttention, sortByAttention } from "@/lib/advisor";

export const metadata: Metadata = { title: "Advisor Home" };

const pill = "rounded-full bg-attention-bg px-2 py-0.5 text-xs font-semibold text-attention ring-1 ring-attention-line";

export default function MobileAdvisorHomePage() {
  const customers = sortByAttention(advisorCustomers);
  const notifications = buildNotifications(advisorCustomers, routineNotifications);
  const urgentCount = notifications.filter((n) => n.urgent).length;
  const attentionCount = customers.filter(needsAttention).length;

  return (
    <>
      <MobileHeader
        leading={
          <SignOffButton className={iconButton}>
            <LogOut className="size-4.5" />
          </SignOffButton>
        }
        title={
          <>
            <h1 className="truncate text-[28px] font-bold leading-tight">Hello, {advisor.firstName}</h1>
            <p className="flex items-center gap-2 text-xs font-semibold">
              {advisor.title} <MockBadge />
            </p>
          </>
        }
      >
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            <span>
              Notifications <span className="text-xs font-normal text-pnc-muted">({notifications.length})</span>
            </span>
            {urgentCount > 0 && <span className={pill}>{urgentCount} urgent</span>}
          </h2>
          <NotificationList notifications={notifications} />
        </MobileCard>
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            <span>
              Your Customers <span className="text-xs font-normal text-pnc-muted">({customers.length})</span>
            </span>
            {attentionCount > 0 && <span className={pill}>{attentionCount} need attention</span>}
          </h2>
          <CustomerList customers={customers} />
        </MobileCard>
      </div>
    </>
  );
}
