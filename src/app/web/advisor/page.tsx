import type { Metadata } from "next";
import { AdvisorStats } from "@/components/advisor/AdvisorStats";
import { CustomerTable } from "@/components/advisor/CustomerTable";
import { NotificationList } from "@/components/advisor/NotificationList";
import { MockBadge } from "@/components/mock/Mock";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { advisor, advisorCustomers, routineNotifications } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import { advisorStats, buildNotifications, sortByAttention } from "@/lib/advisor";

export const metadata: Metadata = { title: "Advisor Home" };

export default function WebAdvisorHomePage() {
  const customers = sortByAttention(advisorCustomers);
  const notifications = buildNotifications(advisorCustomers, routineNotifications);
  const urgentCount = notifications.filter((n) => n.urgent).length;
  const stats = advisorStats(advisorCustomers, MOCK_AS_OF);

  return (
    <>
      <WebHero
        title={`Welcome, ${advisor.firstName}`}
        subtitle={`${advisor.title} · ${advisor.team}`}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">Your Customers</h2>
          <MockBadge />
        </div>

        <AdvisorStats stats={stats} />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
          <WebCard title="Assigned Customers" subtitle={`(${customers.length} customers)`}>
            <CustomerTable customers={customers} />
          </WebCard>

          {/* Stays in view while scrolling the table on large screens. */}
          <WebCard
            title="Notifications"
            subtitle={`(${notifications.length})`}
            aside={
              urgentCount > 0 && (
                <span className="rounded-full bg-attention-bg px-2.5 py-0.5 text-xs font-semibold text-attention ring-1 ring-attention-line">
                  {urgentCount} urgent
                </span>
              )
            }
            className="overflow-hidden lg:sticky lg:top-6"
          >
            <NotificationList notifications={notifications} />
          </WebCard>
        </div>
      </div>
    </>
  );
}
