import type { Metadata } from "next";
import { FamilyDashboard } from "@/components/family/FamilyDashboard";
import { FamilyProvider } from "@/components/family/FamilyProvider";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Family" };

export default function WebFamilyPage() {
  return (
    <>
      <WebHero
        title="Family"
        subtitle="Decide who in your family can see and manage each account, and plan what happens next with your will."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <FamilyProvider>
          <FamilyDashboard />
        </FamilyProvider>
      </div>
    </>
  );
}
