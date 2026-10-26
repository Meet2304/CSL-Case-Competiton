import type { Metadata } from "next";
import { FamilyHub } from "@/components/family/FamilyHub";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export const metadata: Metadata = { title: "Family" };

export default function MobileFamilyPage() {
  return (
    <>
      <MobileHeader title="Family" />
      <div className="px-3 pt-4 pb-6">
        <FamilyHub />
      </div>
    </>
  );
}
