import type { Metadata } from "next";
import { Rulebook } from "@/components/advisor/rulebook/Rulebook";
import { WebHero } from "@/components/web/WebHero";
import { rulebook } from "@/data/settlement";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Rulebook" };

export default function WebAdvisorRulesPage() {
  return (
    <>
      <WebHero
        title="Settlement rulebook"
        subtitle={`Federal + Pennsylvania pilot · v${rulebook.version} · reviewed ${formatDate(rulebook.asOf, "medium")}`}
        showDate={false}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Rulebook />
      </div>
    </>
  );
}
