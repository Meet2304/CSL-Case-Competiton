"use client";

import { CalendarHeart } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { WillSection } from "@/components/will/WillTab";

/** The Will page. Wills start at 18, so a minor who lands here gets a gentle note instead. */
export function WillPage() {
  const { isMinor, age } = useViewer();
  if (!isMinor) return <WillSection />;
  return (
    <section className="rounded-lg bg-white p-6 shadow-card">
      <CalendarHeart className="size-6 text-pnc-blue-700" aria-hidden="true" />
      <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">Wills start at 18</h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-pnc-ink">
        You&apos;re {age}. At 18 your accounts become fully yours, and you&apos;ll be able to write
        a will and choose who inherits them.
      </p>
    </section>
  );
}
