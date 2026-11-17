import type { Metadata } from "next";
import { DpoaFlow } from "@/components/dpoa/DpoaFlow";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Durable Power of Attorney (DPOA)" };

export default function MobileDpoaPage() {
  return (
    <>
      <MobileHeader title="Power of attorney" backHref={routes.home} />
      <div className="@container px-3 pb-6 pt-4">
        <DpoaFlow />
      </div>
    </>
  );
}
