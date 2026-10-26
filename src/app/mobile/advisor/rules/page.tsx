import type { Metadata } from "next";
import { Rulebook } from "@/components/advisor/rulebook/Rulebook";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Rulebook" };

export default function MobileAdvisorRulesPage() {
  return (
    <>
      <MobileHeader title="Rulebook" backHref={routes.advisor} />
      <div className="px-3 pt-4">
        <Rulebook />
      </div>
    </>
  );
}
