import { BottomTabBar } from "@/components/mobile/BottomTabBar";

// Advisor (bank representative) screens. Only reachable with the "advisor" role.
export default function AdvisorMobileLayout({ children }: LayoutProps<"/mobile/advisor">) {
  return (
    <>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-6">{children}</main>
      <BottomTabBar variant="advisor" />
    </>
  );
}
