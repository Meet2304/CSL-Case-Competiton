import type { Metadata } from "next";
import { FamilyDashboard } from "@/components/family/FamilyDashboard";
import { FamilyProvider } from "@/components/family/FamilyProvider";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Family" };

export default function MobileFamilyPage() {
  return (
    <>
      <MobileHeader title="Family" backHref={routes.more} />
      <div className="px-3 pt-4">
        <FamilyProvider>
          <FamilyDashboard />
        </FamilyProvider>
      </div>
    </>
  );
}
