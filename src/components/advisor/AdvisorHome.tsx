"use client";

import { LogOut } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { iconButton, MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { advisor } from "@/data/advisor";
import { AdvisorStats } from "./AdvisorStats";
import { ClientSearch } from "./ClientSearch";
import { CustomerList } from "./CustomerList";
import { CustomerTable } from "./CustomerTable";
import { DailyBrief } from "./DailyBrief";
import { NotificationList } from "./NotificationList";
import { OutreachBanner } from "./OutreachBanner";
import { RecordPassingPanel } from "./RecordPassingPanel";
import { useAdvisorBook } from "./useAdvisorBook";

const pill =
  "rounded-full bg-attention-bg px-2 py-0.5 text-xs font-semibold text-attention ring-1 ring-attention-line";

/** Laptop advisor home. Client-side so deaths recorded by the bank show immediately. */
export function WebAdvisorHome() {
  const { customers, notifications, stats, urgentCount } = useAdvisorBook();

  return (
    <>
      <WebHero
        title={`Welcome, ${advisor.firstName}`}
        subtitle={`${advisor.title} · ${advisor.team}`}
      />

      <div className="@container mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-medium text-pnc-ink">Your Customers</h2>
            <MockBadge />
          </div>
          <RecordPassingPanel className="w-full @3xl:w-auto" />
        </div>

        <ClientSearch customers={customers} className="max-w-2xl" />
        <OutreachBanner />

        {/* What needs the advisor today, side by side; both panels share one height. */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <DailyBrief customers={customers} className="h-full" />
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
            className="h-full overflow-hidden"
          >
            <NotificationList notifications={notifications} />
          </WebCard>
        </div>

        <AdvisorStats stats={stats} />

        {/* Full width, so every column of the table fits without scrolling. */}
        <WebCard title="Assigned Customers" subtitle={`(${customers.length} customers)`}>
          <CustomerTable customers={customers} />
        </WebCard>
      </div>
    </>
  );
}

/** Phone advisor home. */
export function MobileAdvisorHome() {
  const { customers, notifications, urgentCount, attentionCount } = useAdvisorBook();

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
            <h1 className="truncate text-[28px] font-bold leading-tight">
              Hello, {advisor.firstName}
            </h1>
            <p className="flex items-center gap-2 text-xs font-semibold">
              {advisor.title} <MockBadge />
            </p>
          </>
        }
      >
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            <span>
              Notifications{" "}
              <span className="text-xs font-normal text-pnc-muted">({notifications.length})</span>
            </span>
            {urgentCount > 0 && <span className={pill}>{urgentCount} urgent</span>}
          </h2>
          <NotificationList notifications={notifications} />
        </MobileCard>
      </MobileHeader>

      <div className="@container space-y-4 px-3 pt-4">
        <ClientSearch customers={customers} />
        <OutreachBanner />
        <DailyBrief customers={customers} />
        <RecordPassingPanel />
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            <span>
              Your Customers{" "}
              <span className="text-xs font-normal text-pnc-muted">({customers.length})</span>
            </span>
            {attentionCount > 0 && <span className={pill}>{attentionCount} need attention</span>}
          </h2>
          <CustomerList customers={customers} />
        </MobileCard>
      </div>
    </>
  );
}
