import type { Metadata } from "next";
import { MyAssets } from "@/components/customer/MyAssets";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Assets and Debts" };

export default function WebAssetsPage() {
  return (
    <>
      <WebHero title="Assets and Debts" subtitle="Everything you own and owe, in one place." />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <MyAssets />
      </div>
    </>
  );
}
