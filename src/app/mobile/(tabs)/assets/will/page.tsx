import type { Metadata } from "next";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { WillPage } from "@/components/will/WillPage";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Your will" };

export default function MobileWillPage() {
  return (
    <>
      <MobileHeader title="Your will" backHref={routes.assets} />
      <div className="px-3 pb-6 pt-4">
        <WillPage />
      </div>
    </>
  );
}
