import type { Metadata } from "next";
import { Home } from "@/components/customer/Home";
import { WebHero } from "@/components/web/WebHero";
import { firstName, personById } from "@/lib/household";
import { viewerId } from "@/lib/viewer";

export const metadata: Metadata = { title: "Accounts" };

export default async function WebAccountsPage() {
  const person = personById(await viewerId())!;
  return (
    <>
      <WebHero title={`Welcome, ${firstName(person.name)}`} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Home />
      </div>
    </>
  );
}
