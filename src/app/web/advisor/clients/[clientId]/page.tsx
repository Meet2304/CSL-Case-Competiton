import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientWorkspace } from "@/components/advisor/client/ClientWorkspace";
import { WebHero } from "@/components/web/WebHero";
import { advisorCustomers } from "@/data/advisor";
import { profileFor } from "@/data/clients";
import { formatCompactMoney } from "@/lib/format";

export function generateStaticParams() {
  return advisorCustomers.map((c) => ({ clientId: c.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/web/advisor/clients/[clientId]">): Promise<Metadata> {
  const { clientId } = await params;
  const customer = advisorCustomers.find((c) => c.id === clientId);
  return { title: customer ? customer.name : "Client" };
}

export default async function WebAdvisorClientPage({
  params,
}: PageProps<"/web/advisor/clients/[clientId]">) {
  const { clientId } = await params;
  const customer = advisorCustomers.find((c) => c.id === clientId);
  const profile = profileFor(clientId);
  if (!customer || !profile) notFound();

  return (
    <>
      <WebHero
        title={customer.name}
        subtitle={`${customer.segment} client since ${profile.clientSince} · ${formatCompactMoney(customer.relationshipValue)} · ${profile.city}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ClientWorkspace customerId={customer.id} />
      </div>
    </>
  );
}
