import type { Metadata } from "next";
import { NextStepsDashboard } from "@/components/bereavement/NextStepsDashboard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Next steps" };

export default function MobileNextStepsPage() {
  return (
    <>
      <MobileHeader title="Next steps" backHref={routes.home} />
      <div className="px-3 pt-4">
        <NextStepsDashboard />
      </div>
    </>
  );
}
