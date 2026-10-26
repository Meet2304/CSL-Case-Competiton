"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, House, Medal, Menu, ReceiptText, type LucideIcon } from "lucide-react";
import type { Role } from "@/data/types";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

type Tab = { label: string; href: string; icon: LucideIcon; also?: string[] };

const tabsByRole: Record<Role, Tab[]> = {
  customer: [
    { label: "Accounts", href: routes.accounts, icon: House },
    { label: "Pay & Transfer", href: routes.payTransfer, icon: CircleDollarSign },
    { label: "Rewards", href: routes.rewards, icon: Medal },
    { label: "Deposit", href: routes.deposit, icon: ReceiptText },
    // Card Details lives under More in the native app.
    { label: "More", href: routes.more, icon: Menu, also: [routes.cards] },
  ],
  // Advisors only have the home dashboard for now; add tabs here.
  advisor: [{ label: "Home", href: routes.advisor, icon: House }],
};

export function BottomTabBar({ variant = "customer" }: { variant?: Role }) {
  const pathname = toPublicPath(usePathname());
  return (
    <nav className="relative z-20 shrink-0 bg-pnc-blue-800 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:pb-6">
      <ul className="flex justify-around">
        {tabsByRole[variant].map(({ label, href, icon: Icon, also = [] }) => {
          const active = [href, ...also].some((p) => pathname.startsWith(p));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 whitespace-nowrap pb-1 pt-2.5 text-[11px] tracking-tight text-white/80",
                  active && "font-bold text-white",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.25 : 0} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <span className="absolute bottom-2 left-1/2 hidden h-1.5 w-32 -translate-x-1/2 rounded-full bg-white md:block" />
    </nav>
  );
}
