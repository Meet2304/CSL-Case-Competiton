import type { Metadata } from "next";
import { Home } from "@/components/customer/Home";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { firstName, personById } from "@/lib/household";
import { viewerId } from "@/lib/viewer";

export const metadata: Metadata = { title: "Accounts" };

export default async function MobileAccountsPage() {
  const person = personById(await viewerId())!;
  return (
    <>
      <MobileHeader
        title={
          <h1 className="truncate text-[28px] font-bold leading-tight">
            Hello, {firstName(person.name)}
          </h1>
        }
      />
      <div className="px-3 pt-4">
        <Home />
      </div>
    </>
  );
}
