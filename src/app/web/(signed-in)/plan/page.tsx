import type { Metadata } from "next";
import { Planning } from "@/components/customer/Planning";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Planning" };

export default function WebPlanPage() {
  return (
    <>
      <WebHero
        title="Planning"
        subtitle="Your will and who inherits your accounts"
        showDate={false}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Planning />
      </div>
    </>
  );
}
