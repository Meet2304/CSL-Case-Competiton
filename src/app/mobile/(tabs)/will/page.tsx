import type { Metadata } from "next";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { WillPage } from "@/components/will/WillPage";

export const metadata: Metadata = { title: "Your will" };

export default function MobileWillPage() {
  return (
    <>
      <MobileHeader title="Your will" />
      <div className="px-3 pb-6 pt-4">
        <WillPage />
      </div>
    </>
  );
}
