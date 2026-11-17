"use client";

import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  CircleCheck,
  FileText,
  Heart,
  HeartCrack,
  Lock,
  Minus,
  ShieldCheck,
} from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { routineNotifications } from "@/data/advisor";
import {
  advisorChat,
  advisorSteps,
  johnAsClient,
  otherClients,
  ownLists,
  readiness,
  tourAccounts,
  tourFacts,
} from "@/data/tour";
import { cn, formatDate } from "@/lib/format";
import { AppHeader, Avatar, Card, CardHead, FindoePane, Hero, Pill } from "../parts";
import type { PageProps } from "./customer";

const died = formatDate(tourFacts.died, "medium");
const diedShort = formatDate(tourFacts.died, "monthDay");
const routine = routineNotifications.slice(0, 2);

// ---------------------------------------------------------------------------
// The moment the bank records John's death, on three screens

/** John's own sign-on, closed. */
export function ClosedPage() {
  return (
    <div className="relative isolate flex size-full flex-col grayscale-[0.7]">
      <FacetBackdrop className="-z-10" />
      <header className="px-6 py-5">
        <PrivateBankLogo size="sm" product={false} />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="w-full rounded-xl bg-white p-6 text-center shadow-raised">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-pnc-chip text-pnc-muted">
            <Lock className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-xl font-medium">Account deactivated</p>
          <p className="mt-1.5 text-sm text-pnc-muted">
            John Smith&rsquo;s sign-in was closed on {died}.
          </p>
          <div className="mt-5 divide-y divide-pnc-line rounded-lg text-left text-sm ring-1 ring-pnc-line">
            {[
              ["Sign-in", "Closed"],
              ["Accounts", "Secured"],
              ["Cards", "No new charges"],
            ].map(([label, value]) => (
              <p key={label} className="flex h-10 items-center justify-between px-3.5">
                <span className="text-pnc-muted">{label}</span>
                <span className="font-semibold">{value}</span>
              </p>
            ))}
          </div>
          <p className="mt-4 text-xs text-pnc-muted">Now in the care of PNC Estate Services.</p>
        </div>
      </div>
    </div>
  );
}

/** Maya's dashboard: condolence first, then one quiet notification. */
export function CondolencePage() {
  const own = ownLists.wife.map((id) => tourAccounts[id]).filter((a) => a.owners.includes("wife"));
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="wife" size="narrow" />
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 p-4">
        <Card className="border-l-4 border-attention-line px-5 py-5">
          <span className="grid size-10 place-items-center rounded-full bg-attention-bg text-attention">
            <Heart className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 font-display text-xl font-medium leading-snug">
            We&rsquo;re so sorry for your loss, Maya.
          </p>
          <p className="mt-2 text-sm text-pnc-muted">
            When you feel ready, John&rsquo;s accounts that pass to you are in one place. There is
            nothing you need to do today.
          </p>
        </Card>
        <Card>
          <CardHead title="Notifications">
            <Pill tone="attention">1 new</Pill>
          </CardHead>
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-link">
              <Bell className="size-4" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-pnc-badge ring-2 ring-white" />
            </span>
            <div className="leading-snug">
              <p className="text-sm font-semibold">Looking after John&rsquo;s accounts</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-pnc-link">
                See what passes to you <ArrowRight className="size-3.5" aria-hidden="true" />
              </p>
            </div>
          </div>
        </Card>
        <Card className="flex items-center justify-between px-4 py-3 opacity-70">
          <p className="text-sm text-pnc-muted">Your accounts</p>
          <Money value={own.reduce((total, a) => total + a.balance, 0)} className="font-semibold" />
        </Card>
      </div>
    </div>
  );
}

/** The alert itself: a client has died, and what to do about it. */
function LossAlert({ compact = false }: { compact?: boolean }) {
  return (
    <div className="bg-attention-bg px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white text-attention ring-1 ring-attention-line">
          <HeartCrack className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 leading-snug">
          <p className="text-sm font-semibold text-attention">Client passed away</p>
          <p className="font-semibold">John Smith</p>
          <p className="mt-0.5 text-xs text-pnc-muted">
            {compact ? diedShort : `Recorded ${died}`} · death certificate verified
          </p>
        </div>
      </div>
      <p className="mt-3.5 flex h-10 items-center justify-center gap-2 rounded-full bg-pnc-blue-700 text-sm font-semibold text-white">
        Take next steps <ArrowRight className="size-4" aria-hidden="true" />
      </p>
    </div>
  );
}

function RoutineNotices() {
  const icons = [CalendarClock, FileText];
  return (
    <>
      {routine.map((n, i) => {
        const Icon = icons[i % icons.length];
        return (
          <div key={n.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-muted">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="mt-0.5 text-xs text-pnc-muted">{n.summary}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function AlertPage() {
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="advisor" size="narrow" />
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 p-4">
        <Card className="overflow-hidden">
          <CardHead title="Notifications">
            <Pill tone="attention">1 urgent</Pill>
          </CardHead>
          <LossAlert />
          <div className="divide-y divide-pnc-line border-t border-pnc-line">
            <RoutineNotices />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The advisor's home: John is at the top of the list

const willLabel = { "on-file": "Will on file", "in-progress": "Will in progress", none: "No will" };

export function AdvHomePage() {
  const columns = "grid grid-cols-[1fr_7.5rem_8.5rem_8rem] items-center gap-4 px-4";
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="advisor" active="Home" />
      <Hero title="Welcome back" sub={`${tourFacts.advisorTitle} · ${tourFacts.advisorTeam}`} />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_20rem] items-start gap-5 p-5">
        <Card>
          <CardHead title="Your clients">
            <MockBadge />
          </CardHead>
          <p
            className={cn(
              columns,
              "h-8 border-b border-pnc-line text-2xs font-semibold uppercase tracking-wide text-pnc-muted",
            )}
          >
            <span>Client</span>
            <span className="text-right">Relationship</span>
            <span>Next review</span>
            <span>Will</span>
          </p>
          <div className={cn(columns, "h-[4.5rem] border-b border-attention-line bg-attention-bg")}>
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-attention ring-1 ring-attention-line">
                <HeartCrack className="size-4" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <p>
                  <span data-tour="row-john" className="font-semibold text-pnc-link">
                    {johnAsClient.name}
                  </span>
                </p>
                <Pill tone="attention" className="mt-1">
                  Client passed away · {diedShort}
                </Pill>
              </div>
            </div>
            <Money
              value={johnAsClient.relationshipValue}
              compact
              className="text-right text-sm font-semibold"
            />
            <span className="text-sm">{formatDate(johnAsClient.nextReview, "medium")}</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-pnc-positive">
              <FileText className="size-3.5" aria-hidden="true" /> Will on file
            </span>
          </div>
          <div className="divide-y divide-pnc-line">
            {otherClients.map((c) => (
              <div key={c.id} className={cn(columns, "h-[3.25rem]")}>
                <div className="pl-11 leading-tight">
                  <p className="text-sm font-semibold text-pnc-link">{c.name}</p>
                  <p className="text-xs text-pnc-muted">{c.segment}</p>
                </div>
                <Money
                  value={c.relationshipValue}
                  compact
                  className="text-right text-sm font-semibold"
                />
                <span className="text-sm">{formatDate(c.nextReview, "medium")}</span>
                <span className="text-sm text-pnc-muted">{willLabel[c.will.status]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHead title="Notifications">
            <Pill tone="attention">1 urgent</Pill>
          </CardHead>
          <LossAlert compact />
          <div className="divide-y divide-pnc-line border-t border-pnc-line">
            <RoutineNotices />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// John's client page: how ready he was, what to do next, and Findoe alongside

function Ring({ score }: { score: number }) {
  const r = 34;
  const around = 2 * Math.PI * r;
  return (
    <span className="relative grid size-24 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-pnc-chip" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={around}
          strokeDashoffset={around * (1 - score / 100)}
          className="stroke-pnc-positive"
        />
      </svg>
      <span className="text-center leading-none">
        <span className="font-display text-3xl font-medium">{score}</span>
        <span className="block text-2xs text-pnc-muted">of 100</span>
      </span>
    </span>
  );
}

function ClientTab() {
  const certificate = [
    ["Certificate", `No. ${tourFacts.certificateNumber}`],
    ["Date of death", died],
    ["Sent by", tourFacts.certificateSender],
    ["Verified by", tourFacts.certificateVerifier],
  ];
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div data-tour="readiness" className="rounded-lg p-4 ring-1 ring-pnc-line">
        <p className="flex items-center gap-2 text-sm font-semibold">
          Estate readiness <MockBadge />
        </p>
        <div className="mt-3 flex items-center gap-4">
          <Ring score={readiness.score} />
          <div className="leading-tight">
            <p className="font-display text-xl font-medium text-pnc-positive">{readiness.label}</p>
            <p className="mt-1 text-xs text-pnc-muted">
              John had set things up for the people he would leave.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2.5">
          {readiness.checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full",
                  check.state === "done"
                    ? "bg-pnc-positive-bg text-pnc-positive"
                    : "bg-mock-bg text-mock",
                )}
              >
                {check.state === "done" ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : (
                  <Minus className="size-3" aria-hidden="true" />
                )}
              </span>
              <span className="whitespace-nowrap font-semibold">{check.label}</span>
              <span className="ml-auto whitespace-nowrap text-xs text-pnc-muted">
                {check.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div data-tour="certificate" className="rounded-lg p-4 ring-1 ring-pnc-line">
        <p className="text-sm font-semibold">Death certificate</p>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-pnc-positive-bg px-3.5 py-3">
          <ShieldCheck className="size-7 shrink-0 text-pnc-positive" aria-hidden="true" />
          <div className="leading-tight">
            <p className="font-display text-lg font-medium text-pnc-positive">Approved by PNC</p>
            <p className="text-xs text-pnc-muted">No further copy is needed for PNC accounts.</p>
          </div>
        </div>
        <dl className="mt-3 divide-y divide-pnc-line text-sm">
          {certificate.map(([label, value]) => (
            <div key={label} className="flex h-9 items-center justify-between gap-3">
              <dt className="text-pnc-muted">{label}</dt>
              <dd className="truncate font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function NextStepsTab() {
  return (
    <div className="p-4">
      <p className="font-display text-lg font-medium">To begin carrying out John&rsquo;s will</p>
      <p className="text-sm text-pnc-muted">
        Signed {formatDate(tourFacts.willSigned, "medium")} · executor {tourFacts.executor}
      </p>
      <ol className="mt-3 divide-y divide-pnc-line rounded-lg ring-1 ring-pnc-line">
        {advisorSteps.map((step, i) => (
          <li key={step.title} className="flex h-[3.5rem] items-center gap-3 px-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-sm font-semibold text-pnc-link">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-pnc-muted">{step.detail}</p>
            </div>
            <Pill tone={step.when === "Today" ? "attention" : "neutral"}>{step.when}</Pill>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AdvClientPage({ s }: PageProps) {
  const tabs = [
    { id: "client", label: "Client" },
    { id: "next", label: "Next steps", count: advisorSteps.length },
  ] as const;
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="advisor" active="Home" />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Hero
            title={johnAsClient.name}
            sub={`${johnAsClient.segment} client · passed away ${died}`}
          >
            <Avatar person="husband" className="size-11 ring-2 ring-white/40 grayscale" />
          </Hero>
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <Card>
              <p className="flex h-11 items-stretch gap-6 border-b border-pnc-line px-4 text-sm font-semibold">
                {tabs.map((tab) => (
                  <span
                    key={tab.id}
                    data-tour={`tab-${tab.id}`}
                    className={cn(
                      "flex items-center gap-1.5 border-b-[3px] transition-colors duration-300",
                      s.advTab === tab.id
                        ? "border-pnc-orange"
                        : "border-transparent text-pnc-muted",
                    )}
                  >
                    {tab.label}
                    {"count" in tab && <Pill>{tab.count}</Pill>}
                  </span>
                ))}
              </p>
              <div key={s.advTab} className="tour-page-in">
                {s.advTab === "client" ? <ClientTab /> : <NextStepsTab />}
              </div>
            </Card>
          </div>
        </div>
        <FindoePane
          chat={advisorChat}
          state={s.advChat}
          subtitle="Client records and the legal library"
          placeholder="Ask Findoe about John Smith…"
          tour="adv"
        >
          <p
            data-tour="initiate"
            className={cn(
              "mt-3 flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-500",
              s.claimStarted
                ? "bg-pnc-positive-bg text-pnc-positive ring-1 ring-pnc-positive/30"
                : "bg-pnc-orange text-white",
            )}
          >
            {s.claimStarted ? (
              <CircleCheck className="size-4" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" />
            )}
            {s.claimStarted ? advisorChat.done : advisorChat.action}
          </p>
        </FindoePane>
      </div>
    </div>
  );
}
