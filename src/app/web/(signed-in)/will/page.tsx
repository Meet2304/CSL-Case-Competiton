import type { Metadata } from "next";
import { WebHero } from "@/components/web/WebHero";
import { WillPage } from "@/components/will/WillPage";

export const metadata: Metadata = { title: "Your will" };

export default function WebWillPage() {
  return (
    <>
      <WebHero
        title="Your will"
        subtitle="Who inherits what you own, and who carries out your wishes."
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <WillPage />
      </div>
    </>
  );
}
