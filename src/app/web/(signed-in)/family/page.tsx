import type { Metadata } from "next";
import { FamilyWebHero } from "@/components/family/FamilyHeader";
import { FamilyHub } from "@/components/family/FamilyHub";

export const metadata: Metadata = { title: "Family" };

export default function WebFamilyPage() {
  return (
    <>
      <FamilyWebHero />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <FamilyHub />
      </div>
    </>
  );
}
