import type { Metadata } from "next";
import { MyAssets } from "@/components/customer/MyAssets";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export const metadata: Metadata = { title: "Assets and Debts" };

export default function MobileAssetsPage() {
  return (
    <>
      <MobileHeader title="Assets and Debts" />
      <div className="px-3 pb-6 pt-4">
        <MyAssets />
      </div>
    </>
  );
}
