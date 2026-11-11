import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PncLogo } from "@/components/brand/PncLogo";
import { WebSignOnForm } from "@/components/web/WebSignOnForm";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Sign On" };

const demoLink =
  "inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
            Customers sign on to view accounts, pay bills, and move money. Advisors sign on to see
            the customers assigned to them. Demo prototype — any password works.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={routes.tour} className={demoLink}>
              New here? Take the guided tour <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={routes.film} className={demoLink}>
              Watch the product film <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <WebSignOnForm />
      </div>
    </main>
  );
}
