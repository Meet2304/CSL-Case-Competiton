import type { Metadata } from "next";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PncLogo } from "@/components/brand/PncLogo";
import { WebSignOnForm } from "@/components/web/WebSignOnForm";

export const metadata: Metadata = { title: "Sign On" };

export default function WebLoginPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col">
      <FacetBackdrop className="-z-10" />
      <header className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <PncLogo tone="light" size="md" />
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pb-16 sm:px-6 md:grid-cols-2">
        <div className="text-white">
          <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
            Online Banking
          </h1>
          <p className="mt-4 max-w-md text-white/85">
            Sign on to view your accounts, pay bills, and move money. This prototype accepts any
            credentials — no data is sent anywhere.
          </p>
        </div>
        <WebSignOnForm />
      </div>
    </main>
  );
}
