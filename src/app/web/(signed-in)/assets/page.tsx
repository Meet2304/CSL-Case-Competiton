import type { Metadata } from "next";
import { MyAssets } from "@/components/customer/MyAssets";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "My Assets" };

export default function WebAssetsPage() {
  return (
    <>
      <WebHero
        title="My Assets"
        subtitle="Everything you own, the accounts you manage, and what family shares with you."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <MyAssets />
      </div>
    </>
  );
}
