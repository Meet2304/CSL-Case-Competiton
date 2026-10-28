"use client";

import {
  ArrowRight,
  HeartHandshake,
  Landmark,
  PiggyBank,
  Umbrella,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PlaceholderFlowView } from "@/components/bereavement/PlaceholderFlowView";
import { TransferFlowView } from "@/components/bereavement/TransferFlowView";
import { FindoeLogo } from "@/components/brand/FindoeLogo";
import { useViewer } from "@/components/customer/Viewer";
import { askFindoe } from "@/components/findoe/askFindoe";
import { WillExecutionCard } from "@/components/will/WillExecution";
import { MockBadge } from "@/components/mock/Mock";
import { IconChip } from "@/components/ui/IconChip";
import { Money } from "@/components/ui/Money";
import { MOCK_AS_OF } from "@/data/mock";
import { useBereavement, type BereavementState, type FlowStatus } from "@/lib/bereavement";
import { cn } from "@/lib/format";
import { accountLabel, firstName, personByName } from "@/lib/household";
import { survivorPlan, type SurvivorItem } from "@/lib/survivor";
import { flowSummary, statusLabels } from "@/lib/transfer";

const total = (item: SurvivorItem) => item.accounts.reduce((s, a) => s + a.balance, 0);

function iconFor(item: SurvivorItem): LucideIcon {
  const [a] = item.accounts;
  if (item.id.startsWith("custodian:")) return Users;
  if (a.kind === "life-insurance") return Umbrella;
  if (a.kind === "ira" || a.kind === "roth") return Landmark;
  return PiggyBank;
}

/** "Joint owner", "Named beneficiary"...: why the account can pass to this person. */
function basis(item: SurvivorItem): string {
  if (item.id.startsWith("joint:")) return "Joint owner";
  if (item.id.startsWith("custodian:")) return "New custodian";
  if (item.accounts[0].external) return "Beneficiary · outside PNC";
  return "Named beneficiary";
}

const status = (item: SurvivorItem, s: BereavementState) =>
  item.flow ? flowSummary(item.flow, s) : null;

const statusStyles: Record<FlowStatus, string> = {
  "not-started": "bg-pnc-chip text-pnc-muted",
  "in-progress": "bg-pnc-blue-50 text-pnc-blue-800",
  submitted: "bg-pnc-orange/10 text-pnc-orange-600",
  complete: "bg-pnc-positive-bg text-pnc-positive",
};

/** The single most useful thing to do next: the death certificate first, then each claim in turn. */
function Today({
  items,
  state,
  them1,
  onOpen,
}: {
  items: SurvivorItem[];
  state: BereavementState;
  them1: string;
  onOpen: (itemId: string) => void;
}) {
  const withFlow = items.filter((i) => i.flow);
  const pending = withFlow.find((i) => {
    const s = status(i, state)?.status;
    return s === "not-started" || s === "in-progress";
  });
  const next =
    !state.deathCertificate && withFlow[0]
      ? {
          text: `Upload ${them1}'s death certificate. We use it for every account.`,
          id: withFlow[0].id,
          cta: "Start",
        }
      : pending
        ? {
            text: `${status(pending, state)?.status === "in-progress" ? "Finish" : "Start"} claiming ${pending.title}.`,
            id: pending.id,
            cta: status(pending, state)?.status === "in-progress" ? "Continue" : "Start",
          }
        : {
            text: withFlow.length
              ? "Nothing to do today. We're reviewing what you sent and will let you know."
              : "Nothing to do today.",
            id: null,
            cta: "",
          };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-pnc-blue-50 p-4">
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-xs font-semibold uppercase tracking-wide text-pnc-blue-800">Today</p>
        <p className="mt-0.5 text-sm text-pnc-ink">{next.text}</p>
      </div>
      {next.id && (
        <button
          type="button"
          onClick={() => onOpen(next.id!)}
          className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
        >
          {next.cta} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * My Assets › Unclaimed assets, after the bank records a death in the
 * household: the deceased's accounts that can pass to the signed-in person,
 * each with a guided claim (opened in place from `#claim-<item id>`) and a way
 * to ask Findoe about it. Built from the survivor plan, so every claim shares
 * one death-certificate upload. The executor of a will also follows it here.
 */
export function UnclaimedAssets({
  claimId,
  onOpen,
  onBack,
}: {
  /** The claim open in place, if any. */
  claimId?: string;
  onOpen: (itemId: string) => void;
  onBack: () => void;
}) {
  const { person, accounts, isMinor, loss } = useViewer();
  const state = useBereavement();
  const deceased = loss && personByName(loss.personName);
  if (!loss || !deceased) return null;
  const them1 = firstName(deceased.name);

  // A child sees nothing of the deceased's accounts: the adults and PNC handle them.
  if (isMinor)
    return (
      <section className="rounded-lg bg-white p-6 text-center shadow-card">
        <HeartHandshake className="mx-auto size-9 text-attention" aria-hidden="true" />
        <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">
          Nothing here needs you
        </h2>
        <p className="mx-auto mt-2 max-w-md text-md leading-relaxed text-pnc-muted">
          We&apos;re so sorry about {them1}. The adults in your family and PNC are looking after{" "}
          {them1}&apos;s accounts. Your own accounts keep working just as before.
        </p>
      </section>
    );

  const plan = survivorPlan(deceased, person, accounts, MOCK_AS_OF);
  const yours = plan.filter((i) => i.route === "to-you");
  const estate = plan.filter((i) => i.route !== "to-you");
  const open = yours.find((i) => i.id === claimId);

  if (open)
    return (
      <div className="rounded-lg bg-white p-4 shadow-card @3xl:p-6">
        {open.flow ? (
          <TransferFlowView flow={open.flow} onBack={onBack} backLabel="All unclaimed assets" />
        ) : (
          <PlaceholderFlowView item={open} onBack={onBack} backLabel="All unclaimed assets" />
        )}
      </div>
    );

  const waiting = yours.filter((i) => {
    const s = status(i, state)?.status;
    return s !== "submitted" && s !== "complete";
  });

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white p-5 shadow-card @2xl:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">
            {them1}&apos;s accounts that can pass to you
          </h2>
          <MockBadge />
        </div>
        <p className="mt-1 text-sm leading-relaxed text-pnc-muted">
          We&apos;re so sorry for your loss.{" "}
          {waiting.length > 0
            ? `${waiting.length === 1 ? "One account is" : `${waiting.length} accounts are`} waiting to move into your name, each with a short guided claim. There's no rush, and we keep your place.`
            : "Everything that passes to you has been claimed. We'll let you know when each claim is done."}
        </p>
        <Today items={yours} state={state} them1={them1} onOpen={onOpen} />
      </section>

      {yours.length === 0 ? (
        <p className="rounded-lg bg-white px-5 py-8 text-center text-sm text-pnc-muted shadow-card">
          None of {them1}&apos;s accounts pass to you directly. The executor settles them through
          the estate.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Accounts you can claim">
          {yours.map((item) => (
            <ClaimRow key={item.id} item={item} state={state} onOpen={onOpen} />
          ))}
        </ul>
      )}

      {estate.length > 0 && (
        <section aria-labelledby="unclaimed-estate" className="rounded-lg bg-white shadow-card">
          <header className="border-b border-pnc-line px-5 py-3.5">
            <h3 id="unclaimed-estate" className="font-semibold text-pnc-ink">
              Handled through the estate
            </h3>
            <p className="text-sm text-pnc-muted">
              Not yours to claim: the executor settles these.
            </p>
          </header>
          <ul className="divide-y divide-pnc-line">
            {estate.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block font-semibold text-pnc-ink">
                    {item.accounts.map(accountLabel).join(", ")}
                  </span>
                  <span className="block text-sm text-pnc-muted">{item.summary}</span>
                </span>
                <Money value={total(item)} className="text-sm font-semibold" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The deceased's will, for whoever it names to carry it out (renders nothing otherwise). */}
      <WillExecutionCard testatorId={deceased.id} />
    </div>
  );
}

function ClaimRow({
  item,
  state,
  onOpen,
}: {
  item: SurvivorItem;
  state: BereavementState;
  onOpen: (itemId: string) => void;
}) {
  const summary = status(item, state);
  const s = summary?.status;
  const cta = !summary
    ? "See how to claim"
    : s === "not-started"
      ? "Start claim"
      : s === "in-progress"
        ? "Continue claim"
        : "View claim";
  const [a] = item.accounts;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-white p-4 shadow-card @2xl:px-5">
      <IconChip icon={iconFor(item)} size="sm" />
      <div className="min-w-0 flex-1 basis-64">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-pnc-ink">
            {item.title}
            {item.accounts.length === 1 && a.last4 && (
              <span className="ml-1 text-xs font-normal text-pnc-muted">x{a.last4}</span>
            )}
          </span>
          <span className="rounded-full bg-pnc-blue-50 px-2 py-0.5 text-2xs font-semibold text-pnc-blue-800">
            {basis(item)}
          </span>
          {s && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-2xs font-semibold whitespace-nowrap",
                statusStyles[s],
              )}
            >
              {statusLabels[s]}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-sm text-pnc-muted">{item.summary}</p>
        <p className="mt-0.5 text-xs text-pnc-muted">
          {summary
            ? `${summary.doneCount} of ${summary.required} steps · review takes ${item.flow!.reviewTime}`
            : "The insurer handles this claim"}
        </p>
      </div>
      <Money value={total(item)} className="text-lg font-semibold text-pnc-ink" />
      <div className="flex w-full flex-wrap gap-2 @2xl:w-auto">
        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-pnc-orange px-4 py-2 text-sm font-semibold text-white hover:bg-pnc-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
        >
          {cta}
          <span className="sr-only"> for {item.title}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => askFindoe(`How do I claim the ${item.title}?`)}
          className="inline-flex items-center gap-2 rounded-full border border-pnc-line bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-pnc-ink hover:border-pnc-muted hover:bg-pnc-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
        >
          <FindoeLogo className="size-6" />
          Ask Findoe
          <span className="sr-only"> about {item.title}</span>
        </button>
      </div>
    </li>
  );
}

/** How many of the deceased's accounts are still waiting for this person to claim (0 for children). */
export function useWaitingClaims(): number {
  const { person, accounts, isMinor, loss } = useViewer();
  const state = useBereavement();
  const deceased = loss && personByName(loss.personName);
  if (!deceased || isMinor) return 0;
  return survivorPlan(deceased, person, accounts, MOCK_AS_OF).filter((i) => {
    if (i.route !== "to-you") return false;
    const s = status(i, state)?.status;
    return s !== "submitted" && s !== "complete";
  }).length;
}
