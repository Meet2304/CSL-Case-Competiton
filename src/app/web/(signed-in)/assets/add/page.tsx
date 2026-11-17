import type { Metadata } from "next";
import { AddAsset } from "@/components/customer/AddAsset";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Add an asset" };

export default function WebAddAssetPage() {
  return (
    <>
      <WebHero
        title="Add an asset"
        subtitle="Bring everything you own into one view, wherever it's held."
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AddAsset />
      </div>
    </>
  );
}
