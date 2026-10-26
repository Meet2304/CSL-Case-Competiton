"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, House, Medal, Menu, ReceiptText } from "lucide-react";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

const tabs = [
  { label: "Accounts", href: routes.accounts, icon: House, also: [] },
  { label: "Pay & Transfer", href: routes.payTransfer, icon: CircleDollarSign, also: [] },
  { label: "Rewards", href: routes.rewards, icon: Medal, also: [] },
  { label: "Deposit", href: routes.deposit, icon: ReceiptText, also: [] },
  // Card Details lives under More in the native app.
  { label: "More", href: routes.more, icon: Menu, also: [routes.cards] },
];

export function BottomTabBar() {
  const pathname = toPublicPath(usePathname());
  return (
    <nav className="relative z-20 shrink-0 bg-pnc-blue-800 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:pb-6">
      <ul className="grid grid-cols-5">
        {tabs.map(({ label, href, icon: Icon, also }) => {
          const active = [href, ...also].some((p) => pathname.startsWith(p));
          return (
            <li key={href}>
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
