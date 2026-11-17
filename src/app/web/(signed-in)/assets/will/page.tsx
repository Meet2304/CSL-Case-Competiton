import type { Metadata } from "next";
import { PageBreadcrumb } from "@/components/web/PageBreadcrumb";
import { WebHero } from "@/components/web/WebHero";
import { WillPage } from "@/components/will/WillPage";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Your will" };

export default function WebWillPage() {
  return (
    <>
      <WebHero
        title="Your will"
        subtitle="Who inherits what you own, and who carries out your wishes."
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <PageBreadcrumb
          trail={[{ label: "Assets and Debts", href: routes.assets }]}
          current="Your will"
        />
        <WillPage />
      </div>
    </>
  );
}
