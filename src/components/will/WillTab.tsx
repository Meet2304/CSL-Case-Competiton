"use client";

import { useState } from "react";
import { Download, PencilLine, ScrollText } from "lucide-react";
import { useFamily } from "@/components/family/FamilyProvider";
import { Avatar, Pill } from "@/components/family/parts";
import { IconChip } from "@/components/ui/IconChip";
import { buttonClass } from "@/components/will/ui";
import { ExecutionTracker } from "@/components/will/WillExecution";
import { WillDocument, WillTakingShape } from "@/components/will/WillDocument";
import { sectionsDone, WillPlanner } from "@/components/will/WillPlanner";
import type { FamilyMember, FamilyState } from "@/data/types";
import { firstName, memberById } from "@/lib/family";
import { formatDate } from "@/lib/format";
import { sections } from "@/lib/will/flow";
import { generateWill } from "@/lib/will/generate";
import { namedMembers } from "@/lib/will/roles";
import {
  readWillUpdated,
  setWillExecution,
  useHydrated,
  useMyWillStatus,
  useSavedWill,
  useWillExecution,
} from "@/lib/will/storage";
import { newId, type WillDraft } from "@/lib/will/types";

/** Living family members other than the customer, as the planner names them. */
function familyPeople(state: FamilyState) {
  return state.members
    .filter((m) => m.id !== state.selfId && m.status !== "Deceased")
    .map((m) => ({ name: m.name, relationship: m.relationship }));
}

/** A new will starts from the family the bank already knows about. */
function prefillFromFamily(state: FamilyState) {
  return (draft: WillDraft): WillDraft => {
    const living = state.members.filter((m) => m.id !== state.selfId && m.status !== "Deceased");
    const spouse = living.find((m) => m.relationship === "Spouse");
    const children = living.filter((m) => m.relationship === "Child");
    const [first = "", ...rest] = spouse?.name.split(" ") ?? [];
    return {
      ...draft,
      basics: spouse
        ? {
            ...draft.basics,
            marital: "married",
            spouse: { first, middle: "", last: rest.join(" ") },
          }
        : draft.basics,
      nominees: children.length
        ? {
            ...draft.nominees,
            hasChildren: "yes",
            children: children.map((c) => ({ id: newId("c"), name: c.name, birthdate: "" })),
          }
        : draft.nominees,
    };
  };
}

/**
 * The Will tab of the family dashboard: an overview of the customer's will
 * (not started, in progress or on file) that opens the step-by-step planner.
 */
export function WillTab() {
  const { state } = useFamily();
  const hydrated = useHydrated();
  const saved = useSavedWill();
  const status = useMyWillStatus();
  const execution = useWillExecution();
  const [planning, setPlanning] = useState(false);
  const self = memberById(state, state.selfId);

  if (!self) return null;
  if (!hydrated)
    return <p className="py-10 text-center text-sm text-pnc-muted">Loading your will…</p>;

  if (planning) {
    return (
      <WillPlanner
        accountHolder={self.name}
        onExit={() => setPlanning(false)}
        people={familyPeople(state)}
        prefill={prefillFromFamily(state)}
      />
    );
  }

  if (status === "on-file" && saved) {
    return (
      <WillOnFile
        draft={saved.draft}
        self={self}
        onEdit={() => setPlanning(true)}
        execution={execution}
      />
    );
  }

  const done = sectionsDone(saved?.progress);
  const started = status === "in-progress" && done > 0;
  const living = state.members.filter((m) => m.id !== self.id && m.status !== "Deceased");
  const people = living.filter((m) => m.relationship === "Spouse" || m.relationship === "Child");
  const others = living.filter((m) => !people.includes(m));

  return (
    <div className="@container">
      <div className="grid items-start gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
        <div className="max-w-xl pt-2">
          <h3 className="font-display text-2xl font-medium text-pnc-ink @3xl:text-3xl">
            {started ? "Finish your will" : "Write your will"}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-pnc-ink">
            {started
              ? `You've finished ${done} of ${sections.length} sections. Everything you've entered is saved, so pick up right where you left off.`
              : "Decide who inherits what you own, who would raise your children, and who carries out your wishes. It takes about 20 minutes, it's free, and it saves as you go."}
          </p>

          {!started && people.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-pnc-ink">Your family is already filled in</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {people.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-pnc-surface py-1 pl-1 pr-3 text-sm"
                  >
                    <Avatar member={m} index={state.members.indexOf(m)} size="sm" />
                    {m.name}
                    <span className="text-pnc-muted">{m.relationship}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-pnc-muted">
                From your Family page, and you can change anything as you go.
                {others.length > 0 &&
                  ` ${others.map((m) => m.name).join(" and ")} will be suggested when you name an executor or guardian.`}
              </p>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setPlanning(true)} className={buttonClass.primary}>
              <PencilLine className="size-4" aria-hidden="true" />
              {started ? "Continue your will" : "Start your will"}
            </button>
            <span className="text-xs text-pnc-muted">
              Legally valid once printed, signed and witnessed.
            </span>
          </div>
        </div>

        <div className="rounded-md bg-pnc-surface px-3 py-6 @3xl:px-6">
          <WillTakingShape name={self.name} done={done} />
        </div>
      </div>
    </div>
  );
}

function WillOnFile({
  draft,
  self,
  onEdit,
  execution,
}: {
  draft: WillDraft;
  self: FamilyMember;
  onEdit: () => void;
  execution: ReturnType<typeof useWillExecution>;
}) {
  const { state } = useFamily();
  const text = generateWill(draft, self.name);
  const updated = readWillUpdated();
  const people = namedMembers(draft, state);

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    Object.assign(document.createElement("a"), { href: url, download: "my-will.txt" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-center gap-2 font-display text-2xl font-medium text-pnc-ink">
            Your will
            <span className="rounded-full bg-pnc-positive-bg px-2.5 py-0.5 font-sans text-xs font-semibold text-pnc-positive">
              On file
            </span>
          </h3>
          {updated && (
            <p className="mt-1 text-sm text-pnc-muted">
              Last saved {formatDate(updated, "medium")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} className={buttonClass.secondary}>
            <Download className="size-4" aria-hidden="true" /> Download
          </button>
          <button type="button" onClick={onEdit} className={buttonClass.secondary}>
            <PencilLine className="size-4" aria-hidden="true" /> Edit will
          </button>
        </div>
      </div>

      {execution && (
        <ExecutionTracker
          draft={draft}
          family={state}
          execution={execution}
          testator={self}
          canComplete={false}
          showAccounts
          onCancel={() => setWillExecution(null)}
        />
      )}

      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-md bg-pnc-surface px-3 py-6 @3xl:px-6">
          <WillDocument text={text} collapsible />
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-pnc-line p-4">
            <h4 className="font-semibold text-pnc-ink">People your will names</h4>
            {people.length ? (
              <ul className="mt-3 space-y-3">
                {people.map(({ member, roles }) => (
                  <li key={member.id} className="flex items-start gap-3">
                    <Avatar member={member} index={state.members.indexOf(member)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-pnc-ink">{member.name}</p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        {roles.map((r) => (
                          <Pill key={r} tone={r === "Executor" ? "blue" : "neutral"}>
                            {r}
                          </Pill>
                        ))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pnc-muted">
                No one from your Family page is named yet.
              </p>
            )}
          </section>

          {!execution && (
            <section className="flex gap-3 rounded-md bg-pnc-blue-50 p-4 text-sm leading-relaxed">
              <IconChip icon={ScrollText} size="sm" />
              <p>
                When the time comes, your executor and beneficiaries can begin executing this will
                from their own Family page. Use <strong>Preview as</strong> on the Overview tab to
                see what {people[0] ? firstName(people[0].member.name) : "they"} would see.
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Compact will status for the top of the family Overview tab. */
export function WillOverviewStrip() {
  const { state } = useFamily();
  const hydrated = useHydrated();
  const saved = useSavedWill();
  const status = useMyWillStatus();
  const execution = useWillExecution();
  if (!hydrated) return null;

  const onFile = status === "on-file" && saved;
  const done = sectionsDone(saved?.progress);
  const named = onFile ? namedMembers(saved.draft, state) : [];

  const [title, body, cta] = execution
    ? [
        "Your will is being executed",
        `${memberById(state, execution.startedBy)?.name ?? "A family member"} began settling the estate on ${formatDate(execution.startedOn, "medium")}.`,
        "View progress",
      ]
    : onFile
      ? [
          "Your will is on file",
          `It names ${named.length} ${named.length === 1 ? "person" : "people"} from your family. They can begin executing it from their Family page when the time comes.`,
          "View will",
        ]
      : status === "in-progress"
        ? [
            "Finish your will",
            `${done} of ${sections.length} sections done. Your answers are saved.`,
            "Continue your will",
          ]
        : [
            "Your family doesn't have your will yet",
            "Name an executor, a guardian for your children and who inherits. About 20 minutes.",
            "Start your will",
          ];

  return (
    <section className="mb-5 flex flex-wrap items-center gap-4 rounded-md bg-pnc-blue-50 px-4 py-3.5">
      <IconChip icon={ScrollText} size="sm" />
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-semibold text-pnc-ink">{title}</p>
        <p className="text-sm text-pnc-muted">{body}</p>
      </div>
      {onFile && !execution && named.length > 0 && (
        <span className="flex -space-x-1.5" aria-label={named.map((n) => n.member.name).join(", ")}>
          {named.map(({ member }) => (
            <Avatar
              key={member.id}
              member={member}
              index={state.members.indexOf(member)}
              size="sm"
            />
          ))}
        </span>
      )}
      <a href="#will" className={onFile ? buttonClass.secondary : buttonClass.primary}>
        {cta}
      </a>
    </section>
  );
}
