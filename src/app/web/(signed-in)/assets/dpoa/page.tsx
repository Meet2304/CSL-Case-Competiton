import type { Metadata } from "next";
import { DpoaFlow } from "@/components/dpoa/DpoaFlow";
import { PageBreadcrumb } from "@/components/web/PageBreadcrumb";
import { WebHero } from "@/components/web/WebHero";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Durable Power of Attorney (DPOA)" };

export default function WebDpoaPage() {
  return (
    <>
      <WebHero
        title="Durable Power of Attorney (DPOA)"
        subtitle="Someone you trust to handle your finances if you ever can't."
      />
      <div className="@container mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <PageBreadcrumb
          trail={[{ label: "Assets and Debts", href: routes.assets }]}
          current="Durable Power of Attorney"
        />
        <DpoaFlow />
      </div>
    </>
  );
}
