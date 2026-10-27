import type { Metadata } from "next";
import { Planning } from "@/components/customer/Planning";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Planning" };

export default function MobilePlanPage() {
  return (
    <>
      <MobileHeader title="Planning" backHref={routes.home} />
      <div className="px-3 pt-4">
        <Planning />
      </div>
    </>
  );
}
