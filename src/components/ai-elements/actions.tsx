"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  FileSignature,
  Globe,
  HeartHandshake,
  Mail,
  Phone,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ActionIcon, ReplyAction } from "@/lib/findoe/answer";
import { cn } from "@/lib/format";

const icons: Record<ActionIcon, LucideIcon> = {
  beneficiary: UserRoundPlus,
  will: FileSignature,
  "next-steps": HeartHandshake,
  assets: Wallet,
  family: Users,
  phone: Phone,
  email: Mail,
  web: Globe,
  client: UserRound,
};

/**
 * What the reader can do about an answer, as a short list of buttons: pages
 * in the app first (the first one stands out), then calls and outside sites.
 * `onNavigate` lets a full-screen panel get out of the way.
 */
export function ActionList({
  actions,
  onNavigate,
}: {
  actions: ReplyAction[];
  onNavigate?: () => void;
}) {
  if (!actions.length) return null;

  // Next's router doesn't fire hashchange for a link to the page you're on, and the
  // pages open detail panels from the hash (e.g. /assets#manage-...), so do it here.
  function follow(e: MouseEvent<HTMLAnchorElement>, href: string) {
    const url = new URL(href, window.location.href);
    if (url.hash && url.pathname === window.location.pathname) {
      e.preventDefault();
      window.history.pushState(null, "", url.hash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    onNavigate?.();
  }

  return (
    <section aria-label="What you can do" className="motion-safe:animate-reveal">
      <p className="pb-1.5 text-xs font-semibold text-pnc-ink">What you can do</p>
      <ul className="space-y-1.5">
        {actions.map((a, i) => {
          const Icon = icons[a.icon];
          const body = (
            <>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  i === 0 && !a.external
                    ? "bg-pnc-orange text-white"
                    : "bg-pnc-blue-50 text-pnc-blue-700",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-pnc-ink">
                  {a.label}
                </span>
                {a.detail && (
                  <span className="block truncate text-xs text-pnc-muted">{a.detail}</span>
                )}
              </span>
              {a.external ? (
                <ArrowUpRight className="size-4 shrink-0 text-pnc-muted" aria-hidden="true" />
              ) : (
                <ChevronRight
                  className="size-4 shrink-0 text-pnc-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              )}
            </>
          );
          const className =
            "group flex items-center gap-3 rounded-xl border border-pnc-line bg-white px-3 py-2 hover:border-pnc-link hover:bg-pnc-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link";
          return (
            <li key={`${a.href}-${a.label}`}>
              {a.external ? (
                <a
                  href={a.href}
                  target={a.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={className}
                >
                  {body}
                  {a.href.startsWith("http") && (
                    <span className="sr-only"> (opens in a new tab)</span>
                  )}
                </a>
              ) : (
                <Link href={a.href} onClick={(e) => follow(e, a.href)} className={className}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
