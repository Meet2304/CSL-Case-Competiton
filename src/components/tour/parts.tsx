"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  CreditCard,
  Database,
  Landmark,
  LoaderCircle,
  PiggyBank,
  TrendingUp,
  Umbrella,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { Money } from "@/components/ui/Money";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { rulebook } from "@/data/settlement";
import {
  tourPeople,
  type TourAccount,
  type TourChat,
  type TourClaim,
  type TourPersonId,
} from "@/data/tour";
import type { AccountKind } from "@/data/types";
import { cn } from "@/lib/format";
import type { ChatState } from "@/lib/tour";

// ---------------------------------------------------------------------------
// People

export function Avatar({ person, className }: { person: TourPersonId; className?: string }) {
  const p = tourPeople[person];
  return <PersonAvatar seed={p.id} look={p.look} className={cn("size-8", className)} />;
}

/** Overlapping faces, e.g. an account's owners. */
export function Faces({ people, className }: { people: TourPersonId[]; className?: string }) {
  return (
    <span className={cn("flex items-center", className)}>
      {people.map((p) => (
        <Avatar key={p} person={p} className="-ml-1.5 size-6 ring-2 ring-white first:ml-0" />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// The app's chrome, as each screen shows it

const customerNav = ["Home", "Assets and Debts", "Family"];
const advisorNav = ["Home", "Messages"];

/**
 * The navy bar across the top of every signed-in screen. Narrow screens drop
 * the product name; the narrowest drop the navigation as well.
 */
export function AppHeader({
  person,
  active,
  size = "wide",
}: {
  /** Whose screen it is. Leave out for the shared family dashboard. */
  person?: TourPersonId;
  active?: string;
  size?: "wide" | "medium" | "narrow";
}) {
  const nav = person === "advisor" ? advisorNav : customerNav;
  return (
    <header className="flex h-13 shrink-0 items-center gap-4 bg-pnc-navy px-6 text-white">
      <PrivateBankLogo size="sm" product={size === "wide"} />
      {size !== "narrow" && (
        <nav className="ml-auto flex h-full items-stretch text-sm font-semibold">
          {nav.map((item) => (
            <span
              key={item}
              className={cn(
                "relative flex items-center whitespace-nowrap px-3 text-white/75",
                item === active &&
                  "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange",
              )}
            >
              {item}
            </span>
          ))}
        </nav>
      )}
      {person && (
        <span
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            size === "narrow" ? "ml-auto" : "ml-2",
          )}
        >
          {size !== "medium" && person !== "advisor" && tourPeople[person].first}
          <Avatar person={person} className="size-8 ring-2 ring-white/30" />
        </span>
      )}
    </header>
  );
}

/** The blue faceted band under the bar, with the page's title. */
export function Hero({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative isolate flex shrink-0 items-center gap-4 px-6 py-4 text-white">
      <FacetBackdrop className="-z-10" />
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-medium leading-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-white/85">{sub}</p>}
      </div>
      {children && <div className="ml-auto shrink-0">{children}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  tour,
}: {
  children: ReactNode;
  className?: string;
  /** `data-tour` id, so the camera or a pointer can find this card. */
  tour?: string;
}) {
  return (
    <section
      data-tour={tour}
      className={cn("rounded-lg bg-white shadow-card ring-1 ring-pnc-line/70", className)}
    >
      {children}
    </section>
  );
}

export function CardHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-pnc-line px-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "positive" | "attention" | "mock";
  className?: string;
}) {
  const tones = {
    neutral: "bg-pnc-chip text-pnc-muted",
    blue: "bg-pnc-blue-50 text-pnc-link",
    positive: "bg-pnc-positive-bg text-pnc-positive",
    attention: "bg-attention-bg text-attention ring-1 ring-attention-line",
    mock: "bg-mock-bg text-mock ring-1 ring-mock-line",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Accounts

const kindIcons: Record<AccountKind, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  ira: Wallet,
  roth: Wallet,
  brokerage: TrendingUp,
  "credit-card": CreditCard,
  "life-insurance": Umbrella,
};

export const kindLabels: Record<AccountKind, string> = {
  checking: "Checking",
  savings: "Savings",
  ira: "Retirement",
  roth: "Retirement",
  brokerage: "Investments",
  "credit-card": "Credit card",
  "life-insurance": "Life insurance",
};

export function KindIcon({ kind, className }: { kind: AccountKind; className?: string }) {
  const Icon = kindIcons[kind];
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

/** "Joint Checking x0001": the name, then the last four digits when it has them. */
export function AccountName({ account }: { account: TourAccount }) {
  return (
    <span className="font-semibold text-pnc-link">
      {account.name}
      {account.last4 && (
        <span className="ml-1 text-xs font-normal text-pnc-muted">x{account.last4}</span>
      )}
    </span>
  );
}

/** One account on a list: icon, name, a line about it, and its balance. */
export function AccountLine({
  account,
  sub,
  children,
  className,
}: {
  account: TourAccount;
  sub: ReactNode;
  /** Sits between the name and the balance, e.g. who can see it. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4", className)}>
      <KindIcon kind={account.kind} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm">
          <AccountName account={account} />
        </p>
        <p className="truncate text-xs text-pnc-muted">{sub}</p>
      </div>
      {children}
      <Money value={account.balance} className="text-sm font-semibold" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Motion

/** Opens and closes in height, so what is below slides rather than jumps. */
export function Reveal({
  show,
  children,
  className,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
        show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * Text that types itself in when `on` turns true. A screen opened part-way
 * through the tour shows text that was already typed in full.
 */
export function Typed({
  text,
  on,
  mask = false,
  cps = 30,
}: {
  text: string;
  on: boolean;
  /** Show dots instead of the characters, as a password field does. */
  mask?: boolean;
  /** Characters per second. */
  cps?: number;
}) {
  const [seenOff, setSeenOff] = useState(!on);
  if (!on && !seenOff) setSeenOff(true);
  if (!on) return null;
  return <TypedRun text={text} mask={mask} cps={cps} instant={!seenOff} />;
}

function TypedRun({
  text,
  mask,
  cps,
  instant,
}: {
  text: string;
  mask: boolean;
  cps: number;
  instant: boolean;
}) {
  const [count, setCount] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) return;
    const timer = setInterval(() => setCount((n) => Math.min(text.length, n + 1)), 1000 / cps);
    return () => clearInterval(timer);
  }, [instant, text, cps]);
  return (
    <span>
      {mask ? "•".repeat(count) : text.slice(0, count)}
      {count < text.length && (
        <span className="tour-caret ml-px inline-block h-[1.05em] w-px translate-y-[0.15em] bg-current" />
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Findoe

const sourceLabel = (claim: TourClaim) =>
  claim.law ? (rulebook.sources[claim.law]?.citation ?? claim.law) : claim.record;

function SourceChip({ claim, n }: { claim: TourClaim; n: number }) {
  const Icon = claim.law ? BookOpen : Database;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-semibold",
        claim.law
          ? "border-law-line bg-law-bg text-law"
          : "border-pnc-line bg-pnc-blue-50 text-pnc-link",
      )}
    >
      <span className="tabular-nums">{n}</span>
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{sourceLabel(claim)}</span>
    </span>
  );
}

/**
 * Findoe's side panel: the question, its working, and a cited answer. `state`
 * says how far the conversation has got; the panel only draws it.
 */
export function FindoePane({
  chat,
  state,
  subtitle,
  placeholder,
  tour,
  children,
}: {
  chat: TourChat;
  state: ChatState;
  subtitle: string;
  placeholder: string;
  /** Prefix for this panel's `data-tour` ids: `<tour>-findoe`, `<tour>-input` and `<tour>-send`. */
  tour: string;
  /** What follows the answer, e.g. a button that acts on it. */
  children?: ReactNode;
}) {
  const working = state.sent && !state.answered;
  const asking = state.typed && !state.sent;
  return (
    <aside className="flex h-full w-[22rem] shrink-0 flex-col border-l border-pnc-line bg-white text-[0.8125rem] leading-snug">
      <div className="flex h-13 shrink-0 items-center gap-2.5 border-b border-pnc-line px-4">
        <FindoeLogo className="size-7" thinking={working} />
        <div className="leading-tight">
          <p className="font-display font-semibold">Findoe</p>
          <p className="text-2xs text-pnc-muted">{subtitle}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        <div data-tour={`${tour}-findoe`} className="-mx-2 px-2 py-1">
          <Reveal show={state.sent}>
            <p className="mb-3 ml-8 rounded-2xl rounded-br-md bg-pnc-blue-700 px-3 py-2 text-white">
              {chat.question}
            </p>
          </Reveal>

          {/* While it works, each step shows; once it answers, they fold into one line. */}
          <Reveal show={working}>
            <ol className="mb-1 space-y-2.5">
              {chat.steps.map((step, i) => {
                const reached = state.thought > i;
                const done = state.thought > i + 1;
                const Icon = done ? Check : LoaderCircle;
                return (
                  <li
                    key={step.label}
                    className={cn(
                      "flex gap-2.5 transition-opacity duration-500",
                      reached ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-px grid size-5 shrink-0 place-items-center rounded-full ring-1",
                        done
                          ? "bg-pnc-positive-bg text-pnc-positive ring-pnc-positive/25"
                          : "bg-pnc-blue-50 text-pnc-blue-700 ring-pnc-blue-600/30",
                      )}
                    >
                      <Icon
                        className={cn("size-3", !done && reached && "animate-spin")}
                        aria-hidden="true"
                      />
                    </span>
                    <span>
                      <span className="block font-semibold">{step.label}</span>
                      <span className="flex items-center gap-1 text-xs text-pnc-muted">
                        {step.kind === "law" ? (
                          <BookOpen className="size-3 text-law" aria-hidden="true" />
                        ) : (
                          <Database className="size-3 text-pnc-link" aria-hidden="true" />
                        )}
                        {step.detail}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal show={state.answered}>
            <p className="mb-2 flex items-center gap-1 text-xs text-pnc-muted">
              <Check className="size-3.5 text-pnc-positive" aria-hidden="true" />
              Worked through {chat.steps.length} steps
              <ChevronDown className="size-3" aria-hidden="true" />
            </p>
            <div className="flex gap-2.5">
              <FindoeLogo className="mt-0.5 size-5" />
              <div className="min-w-0 flex-1">
                <p>{chat.intro}</p>
                <ul className="mt-2 space-y-1.5">
                  {chat.claims.map((claim, i) => (
                    <li key={claim.text} className="flex gap-2">
                      <span className="mt-[0.45em] size-1 shrink-0 rounded-full bg-pnc-muted" />
                      <span>
                        {claim.text}
                        <sup className="ml-0.5 font-semibold text-pnc-link">{i + 1}</sup>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2">{chat.close}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {chat.claims.map((claim, i) => (
                    <SourceChip key={claim.text} claim={claim} n={i + 1} />
                  ))}
                </div>
                {children}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="shrink-0 border-t border-pnc-line p-3">
        <div
          data-tour={`${tour}-input`}
          data-anchor="start"
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
            asking ? "border-pnc-link ring-2 ring-pnc-link/15" : "border-pnc-line",
          )}
        >
          <p className="min-w-0 flex-1">
            <Typed text={chat.question} on={asking} cps={34} />
            {!asking && <span className="text-pnc-muted">{placeholder}</span>}
          </p>
          <span
            data-tour={`${tour}-send`}
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full transition-colors",
              asking ? "bg-pnc-blue-700 text-white" : "bg-pnc-chip text-pnc-muted",
            )}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </aside>
  );
}
