import type { Metadata } from "next";
import { NextStepsDashboard } from "@/components/bereavement/NextStepsDashboard";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Next steps" };

export default function WebNextStepsPage() {
  return (
    <>
      <WebHero title="Next steps" subtitle="We're here to help, at whatever pace feels right." />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <NextStepsDashboard />
      </div>
    </>
  );
}
