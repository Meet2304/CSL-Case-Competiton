"use client";

import { CalendarHeart } from "lucide-react";
import { Beneficiaries } from "@/components/customer/Beneficiaries";
import { Reminders } from "@/components/customer/Reminders";
import { useNudges } from "@/components/customer/useNudges";
import { useViewer } from "@/components/customer/Viewer";
import { WillExecutionCard } from "@/components/will/WillExecution";
import { WillSection } from "@/components/will/WillTab";
import { people } from "@/data/household";

/**
 * Planning: making sure what you own goes where you want. Adults write a will
 * and name beneficiaries; once the bank records a death, anyone a will names
 * sees it here to execute or follow. Minors see what changes at 18.
 */
export function Planning() {
  const { person, isMinor, age } = useViewer();
  const nudges = useNudges();
  const testators = people.filter((p) => p.login && p.id !== person.id);

  return (
    <div className="@container space-y-6">
      {/* After a death: wills that name the viewer. Each renders nothing until it applies. */}
      {testators.map((t) => (
        <WillExecutionCard key={t.id} testatorId={t.id} />
      ))}

      {isMinor ? (
        <section className="rounded-lg bg-white p-5 shadow-card @2xl:p-6">
          <CalendarHeart className="size-6 text-pnc-blue-700" aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">
            Planning starts at 18
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pnc-ink">
            You&apos;re {age}. At 18 your accounts become fully yours, and you&apos;ll be able to
            write a will and choose who inherits them. Until then, your parent manages your accounts
            with you.
          </p>
          {nudges.length > 0 && (
            <div className="mt-5">
              <Reminders nudges={nudges} />
            </div>
          )}
        </section>
      ) : (
        <>
          <Reminders nudges={nudges} limit={6} />
          <section
            id="will"
            aria-label="Your will"
            className="scroll-mt-24 rounded-lg bg-white p-5 shadow-card @2xl:p-6"
          >
            <WillSection />
          </section>
          <div className="rounded-lg bg-white p-5 shadow-card @2xl:p-6">
            <Beneficiaries />
          </div>
        </>
      )}
    </div>
  );
}
