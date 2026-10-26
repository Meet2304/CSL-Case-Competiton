import type { Metadata } from "next";
import { FamilyHub } from "@/components/family/FamilyHub";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Family" };

export default function WebFamilyPage() {
  return (
    <>
      <WebHero
        title="Family"
        subtitle="Choose the people you trust, and decide what each of them can see and do with your accounts."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <FamilyHub />
      </div>
    </>
  );
}
