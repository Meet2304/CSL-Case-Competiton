import type { Metadata } from "next";
import { FamilyMobileHeader } from "@/components/family/FamilyHeader";
import { FamilyHub } from "@/components/family/FamilyHub";

export const metadata: Metadata = { title: "Family" };

export default function MobileFamilyPage() {
  return (
    <>
      <FamilyMobileHeader />
      <div className="px-3 pt-4 pb-6">
        <FamilyHub />
      </div>
    </>
  );
}
