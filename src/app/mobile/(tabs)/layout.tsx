import { BottomTabBar } from "@/components/mobile/BottomTabBar";

export default function MobileTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-6">{children}</main>
      <BottomTabBar />
    </>
  );
}
