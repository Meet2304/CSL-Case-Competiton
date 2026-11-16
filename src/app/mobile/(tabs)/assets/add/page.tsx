import type { Metadata } from "next";
import { AddAsset } from "@/components/customer/AddAsset";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Add an asset" };

export default function MobileAddAssetPage() {
  return (
    <>
      <MobileHeader title="Add an asset" backHref={routes.assets} />
      <div className="px-3 pb-6 pt-4">
        <AddAsset />
      </div>
    </>
  );
}
