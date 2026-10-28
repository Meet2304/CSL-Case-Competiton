"use client";

import { LogOut } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { iconButton, MobileHeader } from "@/components/mobile/MobileHeader";
import { MockBadge } from "@/components/mock/Mock";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";
import { advisor } from "@/data/advisor";
import { AdvisorStats } from "./AdvisorStats";
import { ClientSearch } from "./ClientSearch";
import { CustomerList } from "./CustomerList";
import { CustomerTable } from "./CustomerTable";
import { NotificationList } from "./NotificationList";
import { OutreachBanner } from "./OutreachBanner";
import { BookActions } from "./RecordDeathDialog";
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
        className="pb-16"
        aside={
          <div className="@container flex w-full items-center gap-3 md:w-[26rem]">
            <ClientSearch customers={customers} className="min-w-0 flex-1" />
            <MockBadge />
          </div>
        }
      />

      <div className="@container mx-auto max-w-7xl space-y-6 px-4 pb-10 sm:px-6">
        {/* Headline numbers first, lifted onto the hero band. */}
        <AdvisorStats stats={stats} className="relative -mt-10" />

        <OutreachBanner />

        {/* Like the customer home: the main list, with a slimmer notifications card beside it. */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <WebCard
            title="Your Customers"
            subtitle={`(${customers.length})`}
            aside={
              <span className="flex items-center gap-2">
                <MockBadge />
                <BookActions />
              </span>
            }
            className="min-w-0 overflow-hidden rounded-lg"
          >
            <CustomerTable customers={customers} />
          </WebCard>
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
            className="flex h-[32rem] flex-col overflow-hidden rounded-lg lg:sticky lg:top-4"
          >
            <ScrollArea label="Notifications" className="flex-1">
              <NotificationList notifications={notifications} />
            </ScrollArea>
          </WebCard>
        </div>
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
            <h1 className="truncate text-[1.75rem] font-bold leading-tight">
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
        <MobileCard>
          <h2 className="flex items-center justify-between border-b border-pnc-line px-4 py-3 font-semibold">
            <span>
              Your Customers{" "}
              <span className="text-xs font-normal text-pnc-muted">({customers.length})</span>
            </span>
            <span className="flex items-center gap-1">
              {attentionCount > 0 && <span className={pill}>{attentionCount} need attention</span>}
              <BookActions />
            </span>
          </h2>
          <CustomerList customers={customers} />
        </MobileCard>
      </div>
    </>
  );
}
