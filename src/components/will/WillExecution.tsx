"use client";

import { useState } from "react";
import { CircleCheck, Gavel, ScrollText } from "lucide-react";
import { useFamily } from "@/components/family/FamilyProvider";
import { Checkbox } from "@/components/family/parts";
import { MockBadge } from "@/components/mock/Mock";
import { IconChip } from "@/components/ui/IconChip";
import { Money } from "@/components/ui/Money";
import { buttonClass, DateInput, Field, Modal } from "@/components/will/ui";
import { methodLabels } from "@/data/family";
import { MOCK_AS_OF } from "@/data/mock";
import type { FamilyMember, FamilyState } from "@/data/types";
import { firstName, memberById } from "@/lib/family";
import { cn, formatDate } from "@/lib/format";
import { contingentLines, giftTitle, lastResortSummary, primarySummary } from "@/lib/will/describe";
import { named } from "@/lib/will/flow";
import { assetsByRoute, estateSteps, isExecutor, mayExecute, rolesFor } from "@/lib/will/roles";
import {
  setWillExecution,
  useSavedWill,
  useWillExecution,
  useMyWillStatus,
  type WillExecution,
} from "@/lib/will/storage";
import type { WillDraft } from "@/lib/will/types";

/**
 * Executing a will that is on file. A family member the will names (executor
 * or beneficiary) sees an invitation to begin execution once the testator has
 * passed; after that, everyone named follows the same tracker and the executor
 * ticks off the steps. Rendered in a member's Family view, so per the family
 * rules it shows only what this member can act on, never what they can't.
 */
export function WillExecutionCard({ viewer }: { viewer: FamilyMember }) {
  const { state } = useFamily();
  const saved = useSavedWill();
  const status = useMyWillStatus();
  const execution = useWillExecution();
  const [beginning, setBeginning] = useState(false);
  const testator = memberById(state, state.selfId);

  if (!saved || status !== "on-file" || !testator || viewer.id === testator.id) return null;
  const roles = rolesFor(saved.draft, viewer.name);
  if (!mayExecute(roles)) return null;

  if (execution) {
    return (
      <ExecutionTracker
        draft={saved.draft}
        family={state}
        execution={execution}
        testator={testator}
        canComplete={isExecutor(saved.draft, viewer)}
        showAccounts={isExecutor(saved.draft, viewer)}
      />
    );
  }

  return (
    <section className="flex flex-wrap items-start gap-4 rounded-md bg-pnc-blue-50 p-4 @3xl:p-5">
      <IconChip icon={ScrollText} />
      <div className="min-w-0 flex-1 basis-64">
        <h3 className="font-display text-lg font-medium text-pnc-ink">
          {testator.name} named you in their will
        </h3>
        <p className="mt-1 flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-pnc-blue-800 ring-1 ring-pnc-blue-600/20"
            >
              {r}
            </span>
          ))}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-pnc-ink">
          When {firstName(testator.name)} passes away, start here. PNC holds the accounts the will
          covers and walks the executor through settling the estate, one step at a time.
        </p>
      </div>
      <button type="button" onClick={() => setBeginning(true)} className={buttonClass.primary}>
        <Gavel className="size-4" aria-hidden="true" /> Begin will execution
      </button>
      {beginning && (
        <BeginExecutionDialog
          testator={testator}
          onClose={() => setBeginning(false)}
          onBegin={(dateOfPassing) => {
            setWillExecution({
              startedBy: viewer.id,
              startedOn: MOCK_AS_OF,
              dateOfPassing,
              completed: ["notify"],
            });
            setBeginning(false);
          }}
        />
      )}
    </section>
  );
}

function BeginExecutionDialog({
  testator,
  onClose,
  onBegin,
}: {
  testator: FamilyMember;
  onClose: () => void;
  onBegin: (dateOfPassing: string) => void;
}) {
  const [date, setDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Modal
      title={`Begin executing ${testator.name}'s will`}
      submitLabel="Begin execution"
      onClose={onClose}
      onSubmit={() => onBegin(date)}
    >
      <p className="text-sm leading-relaxed">
        We&apos;re sorry for your loss. Starting execution tells PNC that {firstName(testator.name)}{" "}
        has passed away. We&apos;ll hold the accounts the will covers so nothing moves until the
        executor is authorized, and give everyone named in the will the same checklist.
      </p>
      <Field label="Date of passing" required>
        <DateInput aria-label="Date of passing" value={date} required onChange={setDate} />
      </Field>
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <Checkbox
          required
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        I confirm {testator.name} has passed away, and I can provide a certified death certificate.
      </label>
    </Modal>
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
  onCancel,
}: {
  draft: WillDraft;
  family: FamilyState;
  execution: WillExecution;
  testator: FamilyMember;
  /** Only the executor ticks off steps; everyone else follows along. */
  canComplete: boolean;
  /**
   * The executor (and the admin) see the testator's accounts; other members
   * only see what the family already shares with them, so the list is hidden.
   */
  showAccounts: boolean;
  /** Demo control to undo a started execution. */
  onCancel?: () => void;
}) {
  const steps = estateSteps(draft);
  const done = steps.filter((s) => execution.completed.includes(s.id)).length;
  const settled = done === steps.length;
  const startedBy = memberById(family, execution.startedBy);
  const executors = named(draft.provisions.executors).map((p) => p.name);
  const { underWill, outsideWill } = assetsByRoute(family, testator.id);

  const toggle = (id: string) =>
    setWillExecution({
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

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-pnc-muted hover:text-pnc-link"
            >
              Undo execution (demo)
            </button>
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
