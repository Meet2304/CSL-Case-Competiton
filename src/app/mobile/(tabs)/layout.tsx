import { LossStrip } from "@/components/bereavement/LossStrip";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";

export default function MobileTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-6">{children}</main>
      {/* Appears only after the bank records a death in this household. */}
      <LossStrip variant="mobile" />
      <BottomTabBar />
    </>
  );
}
