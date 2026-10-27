"use client";

import { CircleCheck, Gavel, ScrollText } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { Checkbox } from "@/components/family/parts";
import { MockBadge } from "@/components/mock/Mock";
import { IconChip } from "@/components/ui/IconChip";
import { Money } from "@/components/ui/Money";
import { buttonClass } from "@/components/will/ui";
import { methodLabels } from "@/data/family";
import { MOCK_AS_OF } from "@/data/mock";
import type { FamilyMember, FamilyState } from "@/data/types";
import { firstName, memberById } from "@/lib/family";
import { cn, formatDate } from "@/lib/format";
import { householdAsFamily } from "@/lib/household";
import { contingentLines, giftTitle, lastResortSummary, primarySummary } from "@/lib/will/describe";
import { named } from "@/lib/will/flow";
import { assetsByRoute, estateSteps, isExecutor, mayExecute, rolesFor } from "@/lib/will/roles";
import {
  setWillExecution,
  useSavedWill,
  useWillExecution,
  useWillStatus,
  type WillExecution,
} from "@/lib/will/storage";
import type { WillDraft } from "@/lib/will/types";

/**
 * Executing a will after the bank has recorded the testator's death. Anyone
 * the will names sees it; the executor begins execution and ticks off the
 * steps, and everyone else follows along. Before a death it shows nothing:
 * a will is only executed once the bank knows.
 */
export function WillExecutionCard({ testatorId }: { testatorId: string }) {
  const { person: viewer, accounts, deceasedIds, loss } = useViewer();
  const saved = useSavedWill(testatorId);
  const status = useWillStatus(testatorId);
  const execution = useWillExecution(testatorId);
  const family = householdAsFamily(testatorId, accounts, deceasedIds);
  const testator = memberById(family, testatorId);
  const me = memberById(family, viewer.id);

  const died = deceasedIds.includes(testatorId);
  if (!saved || status !== "on-file" || !testator || !me || !died) return null;
  const roles = rolesFor(saved.draft, viewer.name);
  if (!mayExecute(roles)) return null;
  const executor = isExecutor(saved.draft, me);

  if (execution) {
    return (
      <ExecutionTracker
        draft={saved.draft}
        family={family}
        execution={execution}
        testator={testator}
        canComplete={executor}
        showAccounts={executor}
      />
    );
  }

  return (
    <section className="flex flex-wrap items-start gap-4 rounded-lg border border-pnc-line bg-white p-4 @3xl:p-5">
      <IconChip icon={ScrollText} />
      <div className="min-w-0 flex-1 basis-64">
        <h3 className="font-display text-lg font-medium text-pnc-ink">
          {testator.name}&apos;s will names you
        </h3>
        <p className="mt-1 flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-full bg-pnc-blue-50 px-2 py-0.5 text-xs font-semibold text-pnc-blue-800"
            >
              {r}
            </span>
          ))}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-pnc-ink">
          {executor
            ? `When you're ready, begin executing the will. PNC holds the accounts it covers and walks you through settling the estate, one step at a time.`
            : `${
                named(saved.draft.provisions.executors)
                  .map((p) => firstName(p.name))
                  .join(" or ") || "The executor"
              } will begin executing the will. You'll be able to follow each step here.`}
        </p>
      </div>
      {executor && (
        <button
          type="button"
          onClick={() =>
            setWillExecution(testatorId, {
              startedBy: viewer.id,
              startedOn: MOCK_AS_OF,
              dateOfPassing: loss?.personName === testator.name ? loss.date : MOCK_AS_OF,
              completed: ["notify"],
            })
          }
          className={buttonClass.primary}
        >
          <Gavel className="size-4" aria-hidden="true" /> Begin executing the will
        </button>
      )}
    </section>
  );
}

/** The estate settlement checklist plus what the will directs. */
export function ExecutionTracker({
  draft,
  family,
  execution,
  testator,
  canComplete,
  showAccounts,
}: {
  draft: WillDraft;
  family: FamilyState;
  execution: WillExecution;
  testator: FamilyMember;
  /** Only the executor ticks off steps; everyone else follows along. */
  canComplete: boolean;
  /** The executor sees the testator's accounts; other people named in the will don't. */
  showAccounts: boolean;
}) {
  const steps = estateSteps(draft);
  const done = steps.filter((s) => execution.completed.includes(s.id)).length;
  const settled = done === steps.length;
  const startedBy = memberById(family, execution.startedBy);
  const executors = named(draft.provisions.executors).map((p) => p.name);
  const { underWill, outsideWill } = assetsByRoute(family, testator.id);

  const toggle = (id: string) =>
    setWillExecution(testator.id, {
      ...execution,
      completed: execution.completed.includes(id)
        ? execution.completed.filter((x) => x !== id)
        : [...execution.completed, id],
    });

  return (
    <section className="rounded-md border border-pnc-line bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-pnc-line px-4 py-4 @3xl:px-5">
        <div>
          <h3 className="font-display text-lg font-medium text-pnc-ink">
            {settled ? `${testator.name}'s estate is settled` : `Executing ${testator.name}'s will`}
          </h3>
          <p className="mt-0.5 text-sm text-pnc-muted">
            Passed away {formatDate(execution.dateOfPassing, "medium")}. Started{" "}
            {formatDate(execution.startedOn, "medium")}
            {startedBy ? ` by ${startedBy.name}` : ""}.
          </p>
        </div>
        <div className="w-48 max-w-full">
          <p className="text-right text-sm font-semibold text-pnc-ink">
            {done} of {steps.length} steps done
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-pnc-chip" aria-hidden="true">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
                settled ? "bg-pnc-positive" : "bg-pnc-blue-700",
              )}
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] @3xl:p-5">
        <div>
          <p className="mb-3 text-sm text-pnc-muted">
            {canComplete
              ? "You're the executor. Tick off each step as it's done; everyone named in the will sees the progress."
              : `${executors.join(" or ") || "The executor"} completes these steps. You'll see each one as it's done.`}
          </p>
          <ol className="space-y-1">
            {steps.map((step, i) => {
              const complete = execution.completed.includes(step.id);
              const body = (
                <>
                  <span className="text-sm font-semibold text-pnc-ink">{step.label}</span>
                  <span className="block text-sm leading-relaxed text-pnc-muted">
                    {step.detail}
                  </span>
                </>
              );
              return (
                <li
                  key={step.id}
                  className="flex gap-3 rounded-md px-2 py-2.5 hover:bg-pnc-surface/60"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      complete
                        ? "bg-pnc-positive text-white"
                        : "text-pnc-muted ring-1 ring-pnc-line",
                    )}
                    aria-hidden="true"
                  >
                    {complete ? <CircleCheck className="size-4" /> : i + 1}
                  </span>
                  {canComplete && step.id !== "notify" ? (
                    <label className="flex flex-1 cursor-pointer items-start justify-between gap-3">
                      <span>{body}</span>
                      <Checkbox
                        checked={complete}
                        onChange={() => toggle(step.id)}
                        aria-label={`${step.label} done`}
                        className="mt-1 size-5"
                      />
                    </label>
                  ) : (
                    <span className="flex-1">
                      {body}
                      <span className="sr-only">{complete ? "Done" : "Not done yet"}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <aside className="space-y-5 text-sm">
          <div>
            <h4 className="mb-1.5 font-semibold text-pnc-ink">What the will directs</h4>
            <dl className="space-y-2 leading-relaxed">
              <div>
                <dt className="text-pnc-muted">First in line</dt>
                <dd>{primarySummary(draft)}</dd>
              </div>
              {contingentLines(draft).map((line) => (
                <div key={line}>
                  <dt className="text-pnc-muted">Backup</dt>
                  <dd>{line}</dd>
                </div>
              ))}
              <div>
                <dt className="text-pnc-muted">If no one named survives</dt>
                <dd>{lastResortSummary(draft)}</dd>
              </div>
              {draft.gifts.length > 0 && (
                <div>
                  <dt className="text-pnc-muted">Specific gifts</dt>
                  {draft.gifts.map((g) => (
                    <dd key={g.id}>
                      {giftTitle(g)} to{" "}
                      {named(g.primary)
                        .map((p) => p.name)
                        .join(" and ")}
                    </dd>
                  ))}
                </div>
              )}
            </dl>
          </div>

          {showAccounts && (
            <div>
              <h4 className="mb-1.5 flex items-center gap-2 font-semibold text-pnc-ink">
                How {firstName(testator.name)}&apos;s PNC accounts pass <MockBadge />
              </h4>
              <AccountRoute title="Settled through the will" assets={underWill} />
              <AccountRoute
                title="Pass directly, outside the will"
                assets={outsideWill}
                note={(a) => (a.method ? methodLabels[a.method] : "Shared ownership")}
              />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function AccountRoute({
  title,
  assets,
  note,
}: {
  title: string;
  assets: FamilyState["assets"];
  note?: (a: FamilyState["assets"][number]) => string;
}) {
  if (assets.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-pnc-muted">{title}</p>
      <ul className="mt-1 divide-y divide-pnc-line rounded-md border border-pnc-line">
        {assets.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate font-semibold text-pnc-ink">{a.name}</span>
              {note && <span className="block text-xs text-pnc-muted">{note(a)}</span>}
            </span>
            <Money value={a.value} compact className="shrink-0 font-semibold" />
          </li>
        ))}
      </ul>
    </div>
  );
}
