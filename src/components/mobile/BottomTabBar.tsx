"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  House,
  Menu,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useCustomerNav } from "@/components/customer/useCustomerNav";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

type Tab = { label: string; href: string; icon: LucideIcon; badge?: number; also?: string[] };

/** The customer app's tabs. Advisors have a single home screen, so no tab bar. */
export function BottomTabBar() {
  const pathname = toPublicPath(usePathname());
  const nav = useCustomerNav();
  const tabs: Tab[] = [
    { label: "Home", href: routes.home, icon: House },
    { label: "My Assets", href: routes.assets, icon: Wallet, badge: nav.assetReminders },
    ...(nav.showWill
      ? [{ label: "Will", href: routes.will, icon: ScrollText, badge: nav.willReminders }]
      : []),
    ...(nav.nextSteps
      ? [{ label: "Next steps", href: routes.nextSteps, icon: HeartHandshake }]
      : []),
    { label: "Family", href: routes.family, icon: Users },
    // Everyday banking (pay, cards, rewards, deposit) lives under More.
    {
      label: "More",
      href: routes.more,
      icon: Menu,
      also: [routes.payTransfer, routes.cards, routes.rewards, routes.deposit, routes.help],
    },
  ];
  const matches = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  // The tab with the longest matching path wins, so /cards lights up More, not Home.
  const activeHref = tabs
    .flatMap(({ href, also = [] }) => [href, ...also].filter(matches).map((p) => ({ href, p })))
    .sort((a, b) => b.p.length - a.p.length)[0]?.href;
  return (
    <nav className="relative z-20 shrink-0 bg-pnc-blue-800 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:pb-6">
      <ul className="flex justify-around">
        {tabs.map(({ label, href, icon: Icon, badge }) => {
          const active = href === activeHref;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 whitespace-nowrap pb-1 pt-2.5 text-[0.6875rem] tracking-tight text-white/80",
                  active && "font-bold text-white",
                )}
              >
                <span className="relative">
                  <Icon
                    className="size-6"
                    strokeWidth={active ? 2.25 : 1.5}
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.25 : 0}
                    aria-hidden="true"
                  />
                  {badge ? (
                    <span className="absolute -top-1 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-pnc-orange px-1 text-[0.625rem] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </span>
                {label}
                {badge ? (
                  <span className="sr-only">
                    , {badge === 1 ? "1 reminder" : `${badge} reminders`}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <span className="absolute bottom-2 left-1/2 hidden h-1.5 w-32 -translate-x-1/2 rounded-full bg-white md:block" />
    </nav>
  );
}
