import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientWorkspace } from "@/components/advisor/client/ClientWorkspace";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { advisorCustomers } from "@/data/advisor";
import { routes } from "@/lib/routes";

export function generateStaticParams() {
  return advisorCustomers.map((c) => ({ clientId: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/mobile/advisor/clients/[clientId]">): Promise<Metadata> {
  const { clientId } = await params;
  const customer = advisorCustomers.find((c) => c.id === clientId);
  return { title: customer ? customer.name : "Client" };
}

export default async function MobileAdvisorClientPage({
  params,
}: PageProps<"/mobile/advisor/clients/[clientId]">) {
  const { clientId } = await params;
  const customer = advisorCustomers.find((c) => c.id === clientId);
  if (!customer) notFound();

  return (
    <>
      <MobileHeader title={customer.name} backHref={routes.advisor} />
      <div className="px-3 pt-4">
        <ClientWorkspace customerId={customer.id} />
      </div>
    </>
  );
}
