"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flower2,
  HeartHandshake,
  MessageCircleHeart,
  RotateCcw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import {
  familyAsset,
  keyAssetGroups,
  secondaryAssetGroups,
  supportPeople,
  supportResources,
  transferFlows,
  type AssetGroup,
} from "@/data/bereavement";
import { bereavementActions, type BereavementState, type FlowStatus } from "@/lib/bereavement";
import { cn, formatDate } from "@/lib/format";
import { initials } from "@/lib/family";
import { flowSummary, statusLabels } from "@/lib/transfer";
import { PlaceholderFlowView } from "./PlaceholderFlowView";
import { TransferFlowView } from "./TransferFlowView";
import { useHouseholdLoss } from "./useHouseholdLoss";

const resourceIcons: LucideIcon[] = [Flower2, MessageCircleHeart, Users];

const statusStyles: Record<FlowStatus, string> = {
  "not-started": "bg-pnc-chip text-pnc-muted",
  "in-progress": "bg-pnc-blue-50 text-pnc-blue-800",
  submitted: "bg-pnc-orange/10 text-pnc-orange-600",
  complete: "bg-pnc-positive-bg text-pnc-positive",
};

function groupStatus(group: AssetGroup, s: BereavementState): FlowStatus {
  return group.flowId ? flowSummary(transferFlows[group.flowId], s).status : "not-started";
}

/**
 * The surviving spouse's "Next steps" dashboard: a short timeline, key assets
 * to settle soon, secondary assets with no rush, and people and resources to
 * lean on. Adapts with container queries so it also works inside the phone.
 */
export function NextStepsDashboard() {
  const { state, loss, firstName } = useHouseholdLoss();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!loss) {
    return (
      <p className="rounded-md border border-dashed border-pnc-line bg-white px-4 py-10 text-center text-sm text-pnc-muted">
        There&apos;s nothing here right now.
      </p>
    );
  }

  const open = [...keyAssetGroups, ...secondaryAssetGroups].find((g) => g.id === openId);
  const back = () => setOpenId(null);

  return (
    <div className="@container">
      <div className="grid items-start gap-6 @4xl:grid-cols-[1fr_17rem]">
        <div className="min-w-0 rounded-md bg-white p-4 shadow-card @3xl:p-6">
          {open ? (
            open.flowId ? (
              <TransferFlowView flow={transferFlows[open.flowId]} onBack={back} />
            ) : (
              <PlaceholderFlowView group={open} onBack={back} />
            )
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-medium text-pnc-ink">
                    We&apos;re so sorry for your loss
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-pnc-muted">
                    {loss.personName} passed away on {formatDate(loss.date, "medium")}. Here&apos;s
                    everything needed to look after {firstName}&apos;s accounts, in the order we
                    suggest. Take it one step at a time — we&apos;ll keep your place.
                  </p>
                </div>
                <MockBadge />
              </div>

              <Timeline state={state} firstName={firstName ?? ""} onOpen={setOpenId} />

              <section className="mt-7">
                <h3 className="text-lg font-semibold text-pnc-ink">Key assets</h3>
                <p className="text-sm text-pnc-muted">
                  We advise you to transfer these as soon as you feel able — your household relies
                  on them.
                </p>
                <ul className="mt-3 grid gap-3 @2xl:grid-cols-3">
                  {keyAssetGroups.map((g) => (
                    <AssetCard key={g.id} group={g} state={state} size="lg" onOpen={setOpenId} />
                  ))}
                </ul>
              </section>

              <section className="mt-7">
                <h3 className="text-lg font-semibold text-pnc-ink">Secondary assets</h3>
                <p className="text-sm text-pnc-muted">
                  You can take your time with these — we recommend within about 6 months.
                </p>
                <ul className="mt-3 grid gap-3 @lg:grid-cols-2 @2xl:grid-cols-3">
                  {secondaryAssetGroups.map((g) => (
                    <AssetCard key={g.id} group={g} state={state} size="sm" onOpen={setOpenId} />
                  ))}
                </ul>
              </section>

              <button
                type="button"
                onClick={bereavementActions.resetProgress}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-pnc-muted hover:text-pnc-link"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" /> Reset demo progress
              </button>
            </>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}

function Timeline({
  state,
  firstName,
  onOpen,
}: {
  state: BereavementState;
  firstName: string;
  onOpen: (id: string) => void;
}) {
  const joint = flowSummary(transferFlows.joint, state);
  const ira = flowSummary(transferFlows.ira, state);

  // What to do today: the single most useful next action.
  const today = !state.deathCertificate
    ? {
        text: `Upload ${firstName}'s death certificate — it's used for every account.`,
        open: "joint",
      }
    : joint.status !== "submitted" && joint.status !== "complete"
      ? {
          text: `Finish the joint account steps (${joint.required - joint.doneCount} left).`,
          open: "joint",
        }
      : ira.status !== "submitted" && ira.status !== "complete"
        ? { text: "When you're ready, choose what to do with the IRA.", open: "ira" }
        : { text: "Nothing to do today — we're reviewing your documents.", open: null };

  const events: { title: string; detail: string; status: FlowStatus }[] = [
    {
      title: "Joint accounts in your name",
      detail: `Usually ${transferFlows.joint.reviewTime}`,
      status: joint.status,
    },
    {
      title: "Life insurance claim",
      detail: "Usually 2–4 weeks after filing",
      status: "not-started",
    },
    {
      title: "IRA transferred to you",
      detail: "No deadline pressure for a spouse",
      status: ira.status,
    },
  ];

  return (
    <section className="mt-6" aria-labelledby="next-steps-heading">
      <h3 id="next-steps-heading" className="text-lg font-semibold text-pnc-ink">
        Next steps
      </h3>
      <ol className="mt-3 grid gap-3 @3xl:grid-cols-[minmax(13rem,1.3fr)_auto_1fr_auto_1fr_auto_1fr] @3xl:items-center">
        <li className="rounded-md border-2 border-pnc-blue-700 bg-pnc-blue-50/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-pnc-blue-800">Today</p>
          <p className="mt-1 text-sm text-pnc-ink">{today.text}</p>
          {today.open && (
            <button
              type="button"
              onClick={() => onOpen(today.open!)}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
            >
              Start <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </li>
        {events.map((e) => (
          <EventItem key={e.title} {...e} />
        ))}
      </ol>
    </section>
  );
}

function EventItem({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: FlowStatus;
}) {
  const done = status === "complete";
  return (
    <>
      <li aria-hidden="true" className="hidden justify-center text-pnc-muted @3xl:flex">
        <ArrowRight className="size-5" />
      </li>
      <li className="flex items-start gap-2.5 rounded-md border border-pnc-line p-3 @3xl:border-0 @3xl:p-0">
        {done ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-pnc-positive" aria-hidden="true" />
        ) : (
          <Clock className="mt-0.5 size-5 shrink-0 text-pnc-muted" aria-hidden="true" />
        )}
        <span>
          <span className="block text-sm font-semibold text-pnc-ink">{title}</span>
          <span className="block text-xs text-pnc-muted">
            {status === "submitted" ? "In review" : done ? "Done" : detail}
          </span>
        </span>
      </li>
    </>
  );
}

function AssetCard({
  group,
  state,
  size,
  onOpen,
}: {
  group: AssetGroup;
  state: BereavementState;
  size: "lg" | "sm";
  onOpen: (id: string) => void;
}) {
  const status = groupStatus(group, state);
  const summary = group.flowId ? flowSummary(transferFlows[group.flowId], state) : null;
  const assets = group.assetIds.map(familyAsset);
  const total = assets.reduce((sum, a) => sum + a.value, 0);
  const cta = status === "not-started" ? "Start" : status === "in-progress" ? "Continue" : "View";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(group.id)}
        className={cn(
          "flex h-full w-full flex-col rounded-md border border-pnc-line bg-white text-left transition-colors hover:border-pnc-link focus-visible:outline-2 focus-visible:outline-pnc-link",
          size === "lg" ? "min-h-40 p-4" : "p-3",
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className={cn("font-semibold text-pnc-ink", size === "lg" && "text-lg")}>
            {group.title}
          </span>
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
              statusStyles[status],
            )}
          >
            {statusLabels[status]}
          </span>
        </span>
        <span className="mt-1 block text-xs text-pnc-muted">
          {assets.map((a) => `${a.name}${a.last4 ? ` x${a.last4}` : ""}`).join(" · ")}
        </span>
        <Money value={total} compact className="mt-2 block text-sm font-semibold text-pnc-ink" />
        {size === "lg" && (
          <span className="mt-auto flex items-center justify-between pt-3 text-sm">
            <span className="text-xs text-pnc-muted">
              {summary
                ? `${summary.doneCount} of ${summary.required} steps`
                : "Your advisor can help"}
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-pnc-link">
              {cta} <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </span>
        )}
      </button>
    </li>
  );
}

function Sidebar() {
  return (
    <aside className="divide-y divide-pnc-line rounded-md bg-white shadow-card">
      <section className="p-4">
        <h3 className="flex items-center gap-2 font-semibold text-pnc-ink">
          <HeartHandshake className="size-5 text-pnc-blue-700" aria-hidden="true" />
          More resources to help you
        </h3>
        <ul className="mt-3 space-y-3">
          {supportResources.map((r, i) => {
            const Icon = resourceIcons[i % resourceIcons.length];
            return (
              <li key={r.title}>
                <a href="#" className="group flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-pnc-link group-hover:underline">
                      {r.title}
                    </span>
                    <span className="block text-pnc-muted">{r.body}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="p-4">
        <h3 className="font-semibold text-pnc-ink">People</h3>
        <ul className="mt-3 space-y-3">
          {supportPeople.map((p) => (
            <li key={p.role} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-chip text-xs font-semibold text-pnc-ink">
                {initials(p.name)}
              </span>
              <span className="min-w-0 text-sm">
                <span className="block text-xs text-pnc-muted">{p.role}</span>
                <span className="block font-semibold text-pnc-ink">{p.name}</span>
                <span className="block text-xs text-pnc-muted">{p.detail}</span>
                <a
                  href="#"
                  className="mt-0.5 inline-block font-semibold text-pnc-link hover:underline"
                >
                  {p.action}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
