"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PncLogo } from "@/components/brand/PncLogo";
import { useCustomerNav } from "@/components/customer/useCustomerNav";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import type { Role } from "@/data/types";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

type NavItem = {
  label: string;
  href: string;
  /** A count shown beside the label (e.g. reminders). */
  badge?: number;
};

const advisorNav: NavItem[] = [{ label: "Home", href: routes.advisor }];

export function WebHeader({ variant = "customer" }: { variant?: Role }) {
  const nav = useCustomerNav();
  // Customers: Home, their assets (beneficiaries live there), their will, then people.
  const navItems: NavItem[] =
    variant === "advisor"
      ? advisorNav
      : [
          { label: "Home", href: routes.home },
          { label: "My Assets", href: routes.assets, badge: nav.assetReminders },
          ...(nav.showWill ? [{ label: "Will", href: routes.will, badge: nav.willReminders }] : []),
          ...(nav.nextSteps ? [{ label: "Next steps", href: routes.nextSteps }] : []),
          { label: "Family", href: routes.family },
          { label: "Help", href: routes.help },
        ];
  const home = navItems[0].href;
  const pathname = toPublicPath(usePathname());
  // The longest matching entry wins, so a nested path lights up its own entry, not Home.
  const activeHref = navItems
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <header className="bg-pnc-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-6 md:h-16 md:flex-nowrap">
        <Link href={home} className="flex h-14 shrink-0 items-center md:h-auto">
          <PncLogo tone="light" size="sm" />
        </Link>

        {/* Below md the nav drops to its own full-width row under the logo. */}
        <nav className="no-scrollbar order-last -mx-3 flex h-11 w-[calc(100%+1.5rem)] items-stretch overflow-x-auto md:order-none md:mx-0 md:ml-auto md:h-full md:w-auto">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[13px] font-semibold text-white/90 hover:text-white sm:px-4 sm:text-sm",
                  active &&
                    "text-white after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange sm:after:inset-x-4",
                )}
              >
                {item.label}
                {item.badge ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pnc-orange px-1.5 text-[11px] font-bold text-white">
                    {item.badge}
                    <span className="sr-only"> {item.badge === 1 ? "reminder" : "reminders"}</span>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <SignOffButton
          label={variant === "customer" ? `Sign off ${nav.first}` : "Sign off"}
          className="ml-auto flex shrink-0 items-center gap-2 text-sm font-semibold text-white/90 hover:text-white md:ml-0"
        >
          {variant === "customer" && <span className="hidden lg:inline">{nav.first}</span>}
          <PersonAvatar
            seed={variant === "customer" ? nav.personId : "advisor"}
            className="size-8"
          />
        </SignOffButton>
      </div>
    </header>
  );
}
