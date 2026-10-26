"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleUserRound } from "lucide-react";
import { useHouseholdLoss } from "@/components/bereavement/useHouseholdLoss";
import { PncLogo } from "@/components/brand/PncLogo";
import { SignOffButton } from "@/components/shared/SignOffButton";
import type { Role } from "@/data/types";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

const payTransferLinks = [
  { label: "PNC Transfers", href: `${routes.payTransfer}#transfers` },
  { label: "External Transfers", href: `${routes.payTransfer}#transfers` },
  { label: "Send Money With Zelle®", href: `${routes.payTransfer}#zelle` },
  { label: "Bill Pay", href: `${routes.payTransfer}#bill-pay` },
  { label: "Wires", href: `${routes.payTransfer}#wires` },
];

type NavItem = { label: string; href: string; menu?: { label: string; href: string }[] };

const navByRole: Record<Role, NavItem[]> = {
  customer: [
    { label: "Accounts", href: routes.accounts },
    { label: "Pay & Transfer", href: routes.payTransfer, menu: payTransferLinks },
    { label: "Cards", href: routes.cards },
    { label: "Rewards", href: routes.rewards },
    { label: "Family", href: routes.family },
    { label: "Help", href: routes.help },
  ],
  // Advisors only have the home dashboard for now; add sections here.
  advisor: [{ label: "Home", href: routes.advisor }],
};

export function WebHeader({ variant = "customer" }: { variant?: Role }) {
  const { loss } = useHouseholdLoss();
  // While a loss in the household is being settled, customers get a "Next steps" entry.
  const navItems =
    variant === "customer" && loss
      ? [
          navByRole.customer[0],
          { label: "Next steps", href: routes.nextSteps },
          ...navByRole.customer.slice(1),
        ]
      : navByRole[variant];
  const home = navItems[0].href;
  const pathname = toPublicPath(usePathname());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="bg-pnc-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-6 md:h-16 md:flex-nowrap">
        <Link href={home} className="flex h-14 shrink-0 items-center md:h-auto">
          <PncLogo tone="light" size="sm" />
        </Link>

        {/* Below md the nav drops to its own full-width row under the logo. */}
        <nav
          ref={navRef}
          className="order-last -mx-3 flex h-11 w-full items-stretch md:order-none md:mx-0 md:ml-auto md:h-full md:w-auto"
        >
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const isOpen = openMenu === item.label;
            const itemClass = cn(
              "relative flex items-center gap-1 whitespace-nowrap px-2 text-[13px] font-semibold text-white/90 hover:text-white sm:px-4 sm:text-sm",
              active &&
                "text-white after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange sm:after:inset-x-4",
            );

            if (!item.menu) {
              return (
                <Link key={item.label} href={item.href} className={itemClass}>
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.label} className="relative flex">
                <button
                  type="button"
                  className={itemClass}
                  aria-expanded={isOpen}
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown className={cn("size-4 transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="absolute left-0 top-full z-20 w-60 overflow-hidden rounded-b-lg bg-white py-1 text-pnc-ink shadow-raised">
                    {item.menu.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpenMenu(null)}
                        className="block px-4 py-2.5 text-sm hover:bg-pnc-surface hover:text-pnc-link"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <SignOffButton className="ml-auto shrink-0 text-white/90 hover:text-white md:ml-0">
          <CircleUserRound className="size-7" strokeWidth={1.5} />
        </SignOffButton>
      </div>
    </header>
  );
}
