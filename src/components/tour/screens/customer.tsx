"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck2,
  LoaderCircle,
  Lock,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { PrivateBankLogo } from "@/components/brand/PncLogo";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  claimable,
  claimDocs,
  familyIds,
  familyList,
  mayaChat,
  ownLists,
  policySteps,
  shareable,
  shareOrder,
  tourAccounts,
  tourPeople,
  type TourAccount,
  type TourPersonId,
} from "@/data/tour";
import { cn } from "@/lib/format";
import type { FrameId, TourState } from "@/lib/tour";
import {
  AccountLine,
  AccountName,
  AppHeader,
  Avatar,
  Card,
  CardHead,
  Faces,
  FindoePane,
  Hero,
  KindIcon,
  kindLabels,
  Pill,
  Reveal,
  Typed,
} from "../parts";

export type PageProps = { who: FrameId; s: TourState };

const first = (id: TourPersonId) => tourPeople[id].first;
const sum = (list: TourAccount[]) => list.reduce((total, a) => total + a.balance, 0);

/** A line about an account, written for the person looking at it. */
function about(account: TourAccount, viewer: TourPersonId): string {
  const kind = kindLabels[account.kind];
  if (account.external) return `${kind} · held outside PNC`;
  if (account.owners.length > 1) {
    const other = account.owners.find((o) => o !== viewer) ?? account.owners[0];
    return `${kind} · joint with ${first(other)}`;
  }
  if (!account.owners.includes(viewer)) return `${first(account.owners[0])}'s account`;
  return kind;
}

const ownersLine = (account: TourAccount) => `Owned by ${account.owners.map(first).join(" and ")}`;

// ---------------------------------------------------------------------------
// Sign-on: one person, one form

const passwords: Partial<Record<FrameId, string>> = { husband: "0123456789", wife: "012345678901" };

function Field({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-pnc-muted">{label}</p>
      <p
        className={cn(
          "mt-1 flex h-11 items-center rounded-md border px-3 transition-[border-color,box-shadow] duration-300",
          active ? "border-pnc-link ring-2 ring-pnc-link/15" : "border-pnc-line",
        )}
      >
        {children}
      </p>
    </div>
  );
}

export function SignInPage({ who, s }: PageProps) {
  const p = tourPeople[who];
  return (
    <div className="relative isolate flex size-full flex-col">
      <FacetBackdrop className="-z-10" />
      <header className="px-7 py-5">
        <PrivateBankLogo size="sm" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-12">
        <div className="w-full max-w-[23rem] rounded-xl bg-white p-7 shadow-raised">
          <div className="flex items-center gap-3">
            <Avatar person={who} className="size-12" />
            <div className="leading-tight">
              <p className="text-xl font-semibold">Sign On</p>
              <p className="text-sm text-pnc-muted">{p.name}</p>
            </div>
          </div>
          <Field label="User ID" active={s.typedUser && !s.typedPass}>
            <Typed text={p.userId} on={s.typedUser} cps={9} />
          </Field>
          <Field label="Password" active={s.typedPass && !s.signingOn}>
            <span className="tracking-[0.2em]">
              <Typed text={passwords[who] ?? ""} on={s.typedPass} mask cps={16} />
            </span>
          </Field>
          <p
            data-tour="signon"
            className={cn(
              "mt-6 flex h-12 items-center justify-center gap-2 rounded-full font-semibold text-white transition-colors duration-300",
              s.signingOn ? "bg-pnc-orange-600" : "bg-pnc-orange",
            )}
          >
            {s.signingOn && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {s.signingOn ? "Signing On…" : "Sign On"}
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-pnc-muted">
            <Lock className="size-3" aria-hidden="true" /> Concept demo · mock data only
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assets and Debts: each person's own view

const groups = [
  { label: "Cash", tone: "bg-chart-cash", kinds: ["checking", "savings"] },
  { label: "Retirement", tone: "bg-chart-retirement", kinds: ["ira", "roth"] },
  { label: "Investments", tone: "bg-chart-investments", kinds: ["brokerage"] },
];

export function AssetsPage({ who, s: _s }: PageProps) {
  void _s;
  const viewer = who as "husband" | "wife";
  const list = ownLists[viewer].map((id) => tourAccounts[id]);
  const owned = list.filter((a) => a.owners.includes(viewer) && !a.external);
  const assets = owned.filter((a) => a.balance > 0);
  const mix = groups
    .map((g) => ({ ...g, value: sum(assets.filter((a) => g.kinds.includes(a.kind))) }))
    .filter((g) => g.value > 0);
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person={who} active="Assets and Debts" size="medium" />
      <Hero title="Assets and Debts" sub="Everything you own and owe, in one place." />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <Card className="flex items-center gap-6 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-pnc-muted">
              What you own <MockBadge />
            </p>
            <Money
              value={sum(owned)}
              className="font-display text-[1.75rem] font-medium leading-tight"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex h-2 overflow-hidden rounded-full">
              {mix.map((g) => (
                <span key={g.label} className={g.tone} style={{ flexGrow: g.value }} />
              ))}
            </div>
            <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-pnc-muted">
              {mix.map((g) => (
                <span key={g.label} className="flex items-center gap-1">
                  <span className={cn("size-2 rounded-full", g.tone)} />
                  {g.label} <Money value={g.value} compact className="font-semibold text-pnc-ink" />
                </span>
              ))}
            </p>
          </div>
        </Card>
        <Card>
          <CardHead title={`${first(viewer)}'s accounts`}>
            <span className="text-xs text-pnc-muted">{list.length} accounts</span>
          </CardHead>
          <div className="divide-y divide-pnc-line">
            {list.map((a) => (
              <AccountLine key={a.id} account={a} sub={about(a, viewer)} className="h-[2.875rem]" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The family dashboard: both parents' money in one view, and who belongs

const memberRole: Record<string, string> = {
  husband: "Admin",
  wife: "Admin",
  child1: "Child · 17",
  child2: "Child · 14",
};

export function FamilyPage({ s: _s }: PageProps) {
  void _s;
  const list = familyList.map((id) => tourAccounts[id]);
  const assets = sum(list.filter((a) => a.balance > 0));
  const debts = sum(list.filter((a) => a.balance < 0));
  const totals = [
    { label: "Assets", value: assets },
    { label: "Debts", value: debts },
    { label: "Net", value: assets + debts },
  ];
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader active="Family" />
      <Hero title="Smith Family" sub="4 members · what the family owns and owes, together">
        <Faces people={familyIds} className="[&>*]:size-9" />
      </Hero>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_19rem] items-start gap-5 p-5">
        <Card tour="fam-shared">
          <CardHead title="Shared assets and debts">
            <MockBadge />
          </CardHead>
          <div className="grid grid-cols-3 divide-x divide-pnc-line border-b border-pnc-line">
            {totals.map((t) => (
              <div key={t.label} className="px-4 py-2.5">
                <p className="text-xs text-pnc-muted">{t.label}</p>
                <Money value={t.value} compact className="font-display text-xl font-medium" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-pnc-line">
            {list.map((a) => (
              <AccountLine key={a.id} account={a} sub={ownersLine(a)} className="h-[2.75rem]">
                {a.balance < 0 && <Pill tone="attention">Debt</Pill>}
                <Faces people={a.owners} className="mr-3" />
              </AccountLine>
            ))}
          </div>
        </Card>
        <Card tour="fam-people">
          <CardHead title="People" />
          <div className="divide-y divide-pnc-line">
            {familyIds.map((id) => (
              <div key={id} className="flex h-14 items-center gap-3 px-4">
                <Avatar person={id} className="size-9" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{tourPeople[id].name}</p>
                  <p className="text-xs text-pnc-muted">{memberRole[id]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The same family, as its admin sees it: with the way to manage it

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-300",
        on ? "bg-pnc-toggle" : "bg-black/20",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform duration-300",
          on ? "translate-x-[1.125rem]" : "translate-x-0.5",
        )}
      />
    </span>
  );
}

export function AdminPage({ s }: PageProps) {
  const list = shareable.map((id) => tourAccounts[id]);
  return (
    <div className="relative flex size-full flex-col overflow-hidden bg-pnc-surface">
      <AppHeader person="husband" active="Family" size="medium" />
      <Hero title="Smith Family" sub="You're an admin · 4 members">
        <span
          data-tour="manage-btn"
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pnc-ink shadow-card"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Manage family
        </span>
      </Hero>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <Card>
          <CardHead title="Shared assets and debts">
            <span className="text-xs text-pnc-muted">Visible to</span>
          </CardHead>
          <div className="divide-y divide-pnc-line">
            {list.map((a) => (
              <AccountLine key={a.id} account={a} sub={ownersLine(a)} className="h-[3.25rem]">
                <span className="mr-3 flex items-center">
                  <Faces people={["husband", "wife"]} />
                  <span
                    className={cn(
                      "-ml-1.5 transition-[opacity,transform] duration-500",
                      s.shared.includes(a.id) ? "scale-100 opacity-100" : "scale-50 opacity-0",
                    )}
                  >
                    <Avatar person="child1" className="size-6 ring-2 ring-white" />
                  </span>
                </span>
              </AccountLine>
            ))}
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <Faces people={familyIds} className="[&>*]:size-8" />
          <p className="text-sm text-pnc-muted">
            <span className="font-semibold text-pnc-ink">4 people.</span> John and Maya are admins.
          </p>
        </Card>
      </div>

      {/* Manage family: a panel over the page, as in the app. */}
      <div
        className={cn(
          "absolute inset-0 bg-pnc-navy/45 transition-opacity duration-500",
          s.manageOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-[25.5rem] flex-col bg-white shadow-raised transition-transform duration-700 ease-[cubic-bezier(0.22,0.8,0.3,1)]",
          s.manageOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-b border-pnc-line px-5 pb-3 pt-4">
          <p className="font-display text-lg font-medium">Manage Smith Family</p>
          <p className="text-xs text-pnc-muted">Only admins can see or change these settings.</p>
          <p className="mt-3 flex gap-5 text-sm font-semibold">
            <span className="pb-2 text-pnc-muted">Members</span>
            <span className="border-b-[3px] border-pnc-orange pb-2">Roles &amp; access</span>
          </p>
        </div>
        <div className="flex-1 px-5 py-4">
          <p className="text-sm font-semibold">Who is this for?</p>
          <p className="mt-2 flex gap-2">
            {(["child1", "child2"] as const).map((id) => (
              <span
                key={id}
                className={cn(
                  "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold ring-1",
                  id === "child1"
                    ? "bg-pnc-blue-50 text-pnc-link ring-pnc-link"
                    : "text-pnc-muted ring-pnc-line",
                )}
              >
                <Avatar person={id} className="size-7" /> {first(id)}
              </span>
            ))}
          </p>
          <p className="mt-5 text-sm font-semibold">What David can see</p>
          <div className="mt-2 divide-y divide-pnc-line rounded-lg ring-1 ring-pnc-line">
            {list.map((a) => (
              <div key={a.id} className="flex h-[3.25rem] items-center gap-3 px-3">
                <KindIcon kind={a.kind} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm">
                    <AccountName account={a} />
                  </p>
                  <p className="text-xs text-pnc-muted">
                    {a.balance < 0 ? "Debt" : kindLabels[a.kind]}
                  </p>
                </div>
                <span data-tour={`share-${a.id}`}>
                  <Switch on={s.shared.includes(a.id)} />
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-pnc-muted">
            A child can see an account and its balance. Only its owners can move money.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// David's own dashboard: his account, and whatever the family shares with him

export function KidPage({ s }: PageProps) {
  const own = tourAccounts.studentChecking;
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="child1" active="Assets and Debts" size="medium" />
      <Hero title="Assets and Debts" sub="Everything you can see, in one place." />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <Card>
          <CardHead title="Your account">
            <MockBadge />
          </CardHead>
          <AccountLine account={own} sub="Checking" className="h-[3.25rem]" />
        </Card>
        <Card>
          <CardHead title="Shared by the Smith Family">
            <Pill tone={s.shared.length ? "blue" : "neutral"}>
              {s.shared.length} {s.shared.length === 1 ? "account" : "accounts"}
            </Pill>
          </CardHead>
          <Reveal show={s.shared.length === 0}>
            <p className="px-4 py-5 text-sm text-pnc-muted">
              When your family shares an account with you, it shows up here.
            </p>
          </Reveal>
          {shareOrder.map((id) => {
            const a = tourAccounts[id];
            const show = s.shared.includes(id);
            return (
              <Reveal key={id} show={show}>
                <div
                  key={String(show)}
                  className={cn("border-t border-pnc-line first:border-t-0", show && "tour-arrive")}
                >
                  <AccountLine
                    account={a}
                    sub={`${a.owners.map(first).join(" and ")}'s · ${a.balance < 0 ? "debt" : kindLabels[a.kind].toLowerCase()}`}
                    className="h-[3.25rem]"
                  >
                    <Pill tone="blue" className="mr-2">
                      Shared with you
                    </Pill>
                  </AccountLine>
                </div>
              </Reveal>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maya, afterwards: what she can claim, and the two ways a claim goes

function Tabs() {
  return (
    <p className="flex gap-6 border-b border-pnc-line text-sm font-semibold">
      <span className="pb-2.5 text-pnc-muted">Assets and Debts</span>
      <span className="flex items-center gap-1.5 border-b-[3px] border-pnc-orange pb-2">
        Unclaimed assets
        <span className="grid size-5 place-items-center rounded-full bg-pnc-orange text-2xs text-white">
          {claimable.length}
        </span>
      </span>
    </p>
  );
}

const actionButton =
  "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold";

export function UnclaimedPage({ s }: PageProps) {
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="wife" active="Assets and Debts" />
      <Hero title="Assets and Debts" sub="Everything you own and owe, in one place." />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <Tabs />
        <Card>
          <div className="flex items-center gap-4 border-b border-pnc-line px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-medium">Assets you can claim</h2>
              <p className="mt-0.5 text-sm text-pnc-muted">
                We&rsquo;re so sorry for your loss. There is no rush, and we keep your place.
              </p>
            </div>
            <MockBadge className="ml-auto" />
            <span className={cn(actionButton, "bg-white text-pnc-ink ring-1 ring-pnc-line")}>
              <FindoeLogo className="size-5" /> Ask Findoe for help
            </span>
          </div>
          <div className="divide-y divide-pnc-line">
            {claimable.map(({ account, why, note }) => {
              const a = tourAccounts[account];
              const processing = account === "joint" && s.jointClaim === "processing";
              return (
                <div key={account} className="flex h-[4.5rem] items-center gap-4 px-5">
                  <KindIcon kind={a.kind} className="size-10" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="flex items-center gap-2">
                      <AccountName account={a} />
                      <Pill tone="blue">{why}</Pill>
                    </p>
                    <p className="mt-1 text-sm text-pnc-muted">{note}</p>
                  </div>
                  <Money value={a.balance} className="font-semibold" />
                  <div className="flex w-[11.5rem] justify-end">
                    {processing ? (
                      <span
                        className={cn(
                          actionButton,
                          "tour-arrive bg-pnc-blue-50 text-pnc-link ring-1 ring-pnc-link/30",
                        )}
                      >
                        <LoaderCircle
                          className="size-4 animate-[spin_2.4s_linear_infinite]"
                          aria-hidden="true"
                        />
                        Processing
                      </span>
                    ) : (
                      <span
                        data-tour={`claim-${account}`}
                        className={cn(actionButton, "bg-pnc-orange text-white")}
                      >
                        {a.external ? "See how to claim" : "Start claim"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-pnc-link">
      <ArrowLeft className="size-4" aria-hidden="true" /> All unclaimed assets
    </p>
  );
}

export function ClaimPage({ s }: PageProps) {
  const a = tourAccounts.joint;
  const ready = s.docs >= claimDocs.length;
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="wife" active="Assets and Debts" />
      <Hero title="Assets and Debts" sub="Everything you own and owe, in one place." />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <Card className="px-6 py-5">
          <BackLink />
          <div className="mt-3 flex items-end gap-4">
            <div>
              <h2 className="font-display text-2xl font-medium">
                {a.name} <span className="text-base text-pnc-muted">x{a.last4}</span>
              </h2>
              <p className="mt-0.5 text-sm text-pnc-muted">
                You and John owned this account together, so it passes straight to you.
              </p>
            </div>
            <Money value={a.balance} className="ml-auto font-display text-2xl font-medium" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pnc-chip">
              <div
                className="h-full rounded-full bg-pnc-positive transition-[width] duration-700 ease-out"
                style={{ width: `${(s.docs / claimDocs.length) * 100}%` }}
              />
            </div>
            <p className="text-sm tabular-nums text-pnc-muted">
              {s.docs} of {claimDocs.length} done
            </p>
          </div>

          <div data-tour="claim-docs" className="mt-4 grid grid-cols-3 gap-3">
            {claimDocs.map((doc, i) => {
              const done = s.docs > i;
              return (
                <div
                  key={doc.title}
                  className={cn(
                    "rounded-lg border px-4 py-3.5 transition-colors duration-500",
                    done ? "border-pnc-positive/40 bg-pnc-positive-bg/50" : "border-pnc-line",
                  )}
                >
                  <p className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-500",
                        done ? "bg-pnc-positive text-white" : "bg-pnc-chip text-pnc-muted",
                      )}
                    >
                      {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="font-semibold">{doc.title}</span>
                  </p>
                  <div className="relative mt-3 h-14 text-sm">
                    <p
                      className={cn(
                        "absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-dashed border-pnc-link/40 text-pnc-link transition-opacity duration-500",
                        done ? "opacity-0" : "opacity-100",
                      )}
                    >
                      <Upload className="size-4" aria-hidden="true" /> {doc.ask}
                    </p>
                    <p
                      className={cn(
                        "absolute inset-0 flex items-center gap-2 text-pnc-ink transition-opacity duration-500",
                        done ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <FileCheck2
                        className="size-5 shrink-0 text-pnc-positive"
                        aria-hidden="true"
                      />
                      {doc.filled}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <p className="text-sm text-pnc-muted">
              {ready
                ? "Everything is in place. Review takes 1 to 3 business days."
                : "Your progress is saved as you go."}
            </p>
            <span
              data-tour="claim-send"
              className={cn(
                actionButton,
                "ml-auto h-11 px-6 transition-colors duration-500",
                ready ? "bg-pnc-orange text-white" : "bg-pnc-chip text-pnc-muted",
              )}
            >
              {s.sending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {s.sending ? "Submitting…" : "Submit claim"}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function HowToPage({ s }: PageProps) {
  const a = tourAccounts.life;
  return (
    <div className="flex size-full flex-col bg-pnc-surface">
      <AppHeader person="wife" active="Assets and Debts" />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Hero title="Assets and Debts" sub="Everything you own and owe, in one place." />
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <Card className="px-6 py-5">
              <BackLink />
              <div className="mt-3 flex items-end gap-4">
                <div>
                  <h2 className="font-display text-2xl font-medium">{a.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-pnc-muted">
                    <Pill tone="blue">Held outside PNC</Pill> You&rsquo;re the beneficiary. The
                    insurer pays it.
                  </p>
                </div>
                <Money value={a.balance} className="ml-auto font-display text-2xl font-medium" />
              </div>
              <p className="mt-5 text-sm font-semibold">How to claim it</p>
              <ol className="mt-2 divide-y divide-pnc-line rounded-lg ring-1 ring-pnc-line">
                {policySteps.map((step, i) => (
                  <li key={step.title} className="flex h-[3.5rem] items-center gap-3 px-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-sm font-semibold text-pnc-link">
                      {i + 1}
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-xs text-pnc-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
        <FindoePane
          chat={mayaChat}
          state={s.mayaChat}
          subtitle="Your records and the legal library"
          placeholder="Ask about any step…"
          tour="maya"
        />
      </div>
    </div>
  );
}
