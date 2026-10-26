"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Flower2,
  HeartHandshake,
  MessageCircleHeart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { WillExecutionCard } from "@/components/will/WillExecution";
import { supportPeople, supportResources } from "@/data/bereavement";
import { MOCK_AS_OF } from "@/data/mock";
import type { BereavementState, FlowStatus } from "@/lib/bereavement";
import { cn, formatDate } from "@/lib/format";
import { initials } from "@/lib/family";
import { accountLabel, firstName, personByName } from "@/lib/household";
import { survivorPlan, type SurvivorItem } from "@/lib/survivor";
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

const itemStatus = (item: SurvivorItem, s: BereavementState): FlowStatus | null =>
  item.flow ? flowSummary(item.flow, s).status : null;

const total = (item: SurvivorItem) => item.accounts.reduce((sum, a) => sum + a.balance, 0);

/**
 * A survivor's "Next steps" after the bank records a death: the one thing to
 * do today, the accounts that pass to them (each a guided flow), and the
 * accounts someone else settles. Built from the household's accounts, so it
 * reflects the beneficiaries that were on file. Adapts with container queries.
 */
export function NextStepsDashboard() {
  const { state, loss } = useHouseholdLoss();
  const { person, isMinor, accounts } = useViewer();
  const [openId, setOpenId] = useState<string | null>(null);
  const deceased = loss && personByName(loss.personName);

  if (!loss || !deceased) {
    return (
      <p className="rounded-md border border-dashed border-pnc-line bg-white px-4 py-10 text-center text-sm text-pnc-muted">
        There&apos;s nothing here right now.
      </p>
    );
  }

  const first = firstName(deceased.name);

  if (isMinor) {
    return (
      <section className="mx-auto max-w-xl rounded-lg bg-white p-6 text-center shadow-card">
        <HeartHandshake className="mx-auto size-9 text-attention" aria-hidden="true" />
        <h2 className="mt-3 font-display text-2xl font-medium text-pnc-ink">
          We&apos;re so sorry about {first}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-pnc-muted">
          There&apos;s nothing you need to do. The adults in your family and PNC are looking after{" "}
          {first}&apos;s accounts, and your own accounts keep working just as before.
        </p>
      </section>
    );
  }

  const plan = survivorPlan(deceased, person, accounts, MOCK_AS_OF);
  const yours = plan.filter((i) => i.route === "to-you");
  const others = plan.filter((i) => i.route !== "to-you");
  const open = plan.find((i) => i.id === openId);
  const back = () => setOpenId(null);

  return (
    <div className="@container">
      <div className="grid items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-6">
          {open ? (
            <div className="rounded-md bg-white p-4 shadow-card @3xl:p-6">
              {open.flow ? (
                <TransferFlowView flow={open.flow} onBack={back} />
              ) : (
                <PlaceholderFlowView item={open} onBack={back} />
              )}
            </div>
          ) : (
            <>
              <section className="rounded-md bg-white p-4 shadow-card @3xl:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-display text-2xl font-medium text-pnc-ink">
                    We&apos;re so sorry for your loss
                  </h2>
                  <MockBadge />
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-pnc-muted">
                  {deceased.name} passed away on {formatDate(loss.date, "medium")}. Here&apos;s what
                  happens to each of {first}&apos;s accounts and the few things that need you. Take
                  it one step at a time — we keep your place.
                </p>
                <Today items={yours} state={state} first={first} onOpen={setOpenId} />
              </section>

              <WillExecutionCard testatorId={deceased.id} />

              {yours.length > 0 && (
                <section aria-labelledby="ns-yours">
                  <h3 id="ns-yours" className="text-lg font-semibold text-pnc-ink">
                    Coming to you
                  </h3>
                  <p className="text-sm text-pnc-muted">
                    These pass to you. Each one is a short guided form.
                  </p>
                  <ul className="mt-3 grid gap-3 @2xl:grid-cols-2">
                    {yours.map((i) => (
                      <ItemCard key={i.id} item={i} state={state} onOpen={setOpenId} />
                    ))}
                  </ul>
                </section>
              )}

              {others.length > 0 && (
                <section aria-labelledby="ns-others">
                  <h3 id="ns-others" className="text-lg font-semibold text-pnc-ink">
                    Handled through the estate
                  </h3>
                  <p className="text-sm text-pnc-muted">
                    Nothing for you to do here unless you&apos;re the executor.
                  </p>
                  <ul className="mt-3 divide-y divide-pnc-line rounded-md bg-white shadow-card">
                    {others.map((i) => (
                      <li key={i.id}>
                        <button
                          type="button"
                          onClick={() => setOpenId(i.id)}
                          className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
                        >
                          <span className="min-w-0 flex-1 basis-56">
                            <span className="block font-semibold text-pnc-ink">
                              {i.accounts.map(accountLabel).join(", ")}
                            </span>
                            <span className="block text-sm text-pnc-muted">{i.summary}</span>
                          </span>
                          <Money value={total(i)} className="text-sm font-semibold" />
                          <ChevronRight
                            className="size-4 shrink-0 text-pnc-muted"
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <Sidebar />
      </div>
    </div>
  );
}

/** The single most useful thing to do next. */
function Today({
  items,
  state,
  first,
  onOpen,
}: {
  items: SurvivorItem[];
  state: BereavementState;
  first: string;
  onOpen: (id: string) => void;
}) {
  const withFlow = items.filter((i) => i.flow);
  const pending = withFlow.find((i) => {
    const s = itemStatus(i, state);
    return s === "not-started" || s === "in-progress";
  });
  const next =
    !state.deathCertificate && withFlow[0]
      ? {
          text: `Upload ${first}'s death certificate. We use it for every account.`,
          id: withFlow[0].id,
          cta: "Start",
        }
      : pending
        ? {
            text: `${itemStatus(pending, state) === "in-progress" ? "Finish" : "Start"} ${pending.title}.`,
            id: pending.id,
            cta: itemStatus(pending, state) === "in-progress" ? "Continue" : "Start",
          }
        : {
            text: withFlow.length
              ? "Nothing to do today. We're reviewing what you sent and will let you know."
              : "Nothing to do today. Your advisor will be in touch.",
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
          className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800"
        >
          {next.cta} <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function ItemCard({
  item,
  state,
  onOpen,
}: {
  item: SurvivorItem;
  state: BereavementState;
  onOpen: (id: string) => void;
}) {
  const status = itemStatus(item, state);
  const summary = item.flow ? flowSummary(item.flow, state) : null;
  const cta =
    !status || status === "not-started" ? "Start" : status === "in-progress" ? "Continue" : "View";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className="flex h-full w-full flex-col rounded-md bg-white p-4 text-left shadow-card ring-1 ring-transparent transition hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-pnc-link"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-semibold text-pnc-ink">{item.title}</span>
          {status && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                statusStyles[status],
              )}
            >
              {statusLabels[status]}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-pnc-muted">{item.summary}</span>
        <Money value={total(item)} compact className="mt-2 block text-sm font-semibold" />
        <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
          <span className="text-xs text-pnc-muted">
            {summary ? `${summary.doneCount} of ${summary.required} steps` : "Outside PNC"}
          </span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-pnc-link">
            {cta}
            <span className="sr-only"> {item.title}</span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </span>
        </span>
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
          Support for you
        </h3>
        <ul className="mt-3 space-y-3">
          {supportResources.map((r, i) => {
            const Icon = resourceIcons[i % resourceIcons.length];
            return (
              <li key={r.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-pnc-ink">{r.title}</span>
                  <span className="block text-pnc-muted">{r.body}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="p-4">
        <h3 className="font-semibold text-pnc-ink">People who can help</h3>
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
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
