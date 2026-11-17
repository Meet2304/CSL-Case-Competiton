"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { useCustomerNav } from "@/components/customer/useCustomerNav";
import { SignOffButton } from "@/components/shared/SignOffButton";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { useWillProgress } from "@/components/will/useWillProgress";
import { unreadCount, useMessages } from "@/lib/messages";
import type { Role } from "@/data/types";
import { cn } from "@/lib/format";
import { routes, toPublicPath } from "@/lib/routes";

type NavItem = {
  label: string;
  href: string;
  /** A count shown beside the label (e.g. reminders). */
  badge?: number;
  /** What the count is of, for screen readers (default "reminder"). */
  badgeNoun?: string;
  /** Pages under this entry: it opens a menu of them instead of linking. */
  menu?: MenuItem[];
};

type MenuItem = { label: string; href: string; detail: string; badge?: number };

const linkClass = (active: boolean) =>
  cn(
    "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-[0.8125rem] font-semibold text-white/90 hover:text-white sm:px-4 sm:text-sm",
    active &&
      "text-white after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange sm:after:inset-x-4",
  );

function Badge({ count, noun = "reminder" }: { count?: number; noun?: string }) {
  if (!count) return null;
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pnc-orange px-1.5 text-2xs font-bold text-white">
      {count}
      <span className="sr-only"> {count === 1 ? noun : `${noun}s`}</span>
    </span>
  );
}

export function WebHeader({ variant = "customer" }: { variant?: Role }) {
  const nav = useCustomerNav();
  const will = useWillProgress();
  const unread = unreadCount(useMessages());
  // Advisors: their book, and their conversations with clients and the people around them.
  const advisorNav: NavItem[] = [
    { label: "Home", href: routes.advisor },
    {
      label: "Messages",
      href: routes.advisorMessages,
      badge: unread,
      badgeNoun: "unread conversation",
    },
  ];
  // Customers: Home, their assets (with the will under them), then people.
  const navItems: NavItem[] =
    variant === "advisor"
      ? advisorNav
      : [
          { label: "Home", href: routes.home },
          {
            label: "Assets and Debts",
            href: routes.assets,
            badge: nav.assetReminders,
            // Adults' will is the plan for what they own, so it opens from the same entry.
            menu: nav.showWill
              ? [
                  {
                    label: "Assets and Debts",
                    href: routes.assets,
                    detail: "Everything you own and owe",
                    badge: nav.beneficiaryReminders,
                  },
                  {
                    label: "Your will",
                    href: routes.will,
                    detail:
                      will.status === "on-file"
                        ? "On file"
                        : will.status === "in-progress"
                          ? `${will.percent}% done`
                          : "Not started yet",
                    badge: nav.willReminders,
                  },
                ]
              : undefined,
          },
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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 px-4 sm:px-6 md:h-16 md:flex-nowrap">
        <Link href={home} className="flex h-14 shrink-0 items-center md:h-auto">
          {/* The product name drops on narrow screens so the lockup fits beside sign-off. */}
          <PrivateBankLogo product={false} className="sm:hidden" />
          <PrivateBankLogo className="hidden sm:inline-flex" />
        </Link>

        {/* Below md the nav drops to its own full-width row under the logo. */}
        <nav className="no-scrollbar order-last -mx-3 flex h-11 w-[calc(100%+1.5rem)] items-stretch overflow-x-auto md:order-none md:mx-0 md:ml-auto md:h-full md:w-auto">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            if (item.menu)
              return <NavMenu key={item.label} item={item} active={active} pathname={pathname} />;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {item.label}
                <Badge count={item.badge} noun={item.badgeNoun} />
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
            look={variant === "customer" ? nav.avatar : undefined}
            className="size-8"
          />
        </SignOffButton>
      </div>
    </header>
  );
}

const MENU_W = 288; // w-72

/**
 * A nav entry that opens a small menu of the pages under it. The nav row
 * scrolls sideways on narrow screens, so the menu is fixed to the window
 * (placed under the button) rather than clipped inside the row.
 */
function NavMenu({ item, active, pathname }: { item: NavItem; active: boolean; pathname: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = pos !== null;

  const place = () => {
    const r = button.current!.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8)),
    });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !menu.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      button.current?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? setPos(null) : place())}
        className={linkClass(active)}
      >
        {item.label}
        <Badge count={item.badge} />
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {pos && (
        <div
          ref={menu}
          id={id}
          style={{ top: pos.top, left: pos.left, width: MENU_W }}
          className="fixed z-50 rounded-lg bg-white py-1.5 text-pnc-ink shadow-raised motion-safe:animate-reveal"
        >
          <ul>
            {item.menu!.map((m) => {
              const current = pathname === m.href;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setPos(null)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 hover:bg-pnc-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link",
                      current && "bg-pnc-blue-50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          current ? "text-pnc-link" : "text-pnc-ink",
                        )}
                      >
                        {m.label}
                      </span>
                      <span className="block text-xs text-pnc-muted">{m.detail}</span>
                    </span>
                    <Badge count={m.badge} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
