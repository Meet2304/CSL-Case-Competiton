"use client";

import { useState } from "react";
import { Check, Download, PencilLine, ScrollText } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { Avatar, Pill } from "@/components/family/parts";
import { IconChip } from "@/components/ui/IconChip";
import { buttonClass } from "@/components/will/ui";
import { WillDocument, willParts } from "@/components/will/WillDocument";
import { sectionsDone, WillPlanner } from "@/components/will/WillPlanner";
import type { FamilyState } from "@/data/types";
import { firstName } from "@/lib/family";
import { cn, formatDate } from "@/lib/format";
import { householdAsFamily } from "@/lib/household";
import { sections } from "@/lib/will/flow";
import { generateWill } from "@/lib/will/generate";
import { namedMembers } from "@/lib/will/roles";
import { readWillUpdated, useHydrated, useSavedWill, useWillStatus } from "@/lib/will/storage";
import { newId, type WillDraft } from "@/lib/will/types";

/** Living household members other than the testator, as the planner names them. */
function householdPeople(state: FamilyState) {
  return state.members
    .filter((m) => m.id !== state.selfId && m.status !== "Deceased")
    .map((m) => ({ name: m.name, relationship: m.relationship }));
}

/** A new will starts from the household the bank already knows about. */
function prefillFromHousehold(state: FamilyState) {
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
 * The signed-in person's will: not started, in progress or on file, opening
 * the step-by-step planner. Lives on the Planning page.
 */
export function WillSection() {
  const { person, accounts, deceasedIds } = useViewer();
  const hydrated = useHydrated();
  const saved = useSavedWill(person.id);
  const status = useWillStatus(person.id);
  const [planning, setPlanning] = useState(false);
  const household = householdAsFamily(person.id, accounts, deceasedIds);

  if (!hydrated)
    return <p className="py-10 text-center text-sm text-pnc-muted">Loading your will…</p>;

  if (planning) {
    return (
      <WillPlanner
        accountHolder={person.name}
        owner={person.id}
        onExit={() => setPlanning(false)}
        people={householdPeople(household)}
        prefill={prefillFromHousehold(household)}
      />
    );
  }

  if (status === "on-file" && saved) {
    return (
      <WillOnFile draft={saved.draft} household={household} onEdit={() => setPlanning(true)} />
    );
  }

  const done = sectionsDone(saved?.progress);
  const started = status === "in-progress" && done > 0;
  const living = household.members.filter((m) => m.id !== person.id && m.status !== "Deceased");
  const close = living.filter((m) => m.relationship === "Spouse" || m.relationship === "Child");

  return (
    <div className="@container">
      <div className="grid items-start gap-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">
            {started ? "Finish your will" : "Write your will"}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-pnc-ink">
            {started
              ? `You've finished ${done} of ${sections.length} sections. Everything you've entered is saved, so pick up right where you left off.`
              : "Decide who inherits what you own, who would raise your children, and who carries out your wishes. It takes about 20 minutes, it's free, and it saves as you go."}
          </p>

          {!started && close.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-pnc-ink">Your family is already filled in</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {close.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-pnc-surface py-1 pl-1 pr-3 text-sm"
                  >
                    <Avatar member={m} index={household.members.indexOf(m)} size="sm" />
                    {m.name}
                    <span className="text-pnc-muted">{m.relationship}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setPlanning(true)} className={buttonClass.primary}>
              <PencilLine className="size-4" aria-hidden="true" />
              {started ? "Continue your will" : "Start your will"}
            </button>
            <span className="text-xs text-pnc-muted">
              Legally valid once printed, signed and witnessed.
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-pnc-surface p-4 @3xl:p-5">
          <p className="text-sm font-semibold text-pnc-ink">What your will covers</p>
          <ol className="mt-3 space-y-2">
            {sections.map((s, i) => (
              <li key={s} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    i < done
                      ? "bg-pnc-positive text-white"
                      : "bg-white text-pnc-muted ring-1 ring-pnc-line",
                  )}
                >
                  {i < done ? <Check className="size-3" aria-hidden="true" /> : i + 1}
                  {i < done && <span className="sr-only">Done:</span>}
                </span>
                <span className={i < done ? "text-pnc-muted" : "text-pnc-ink"}>{willParts[s]}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function WillOnFile({
  draft,
  household,
  onEdit,
}: {
  draft: WillDraft;
  household: FamilyState;
  onEdit: () => void;
}) {
  const self = household.members.find((m) => m.id === household.selfId)!;
  const text = generateWill(draft, self.name);
  const updated = readWillUpdated(self.id);
  const named = namedMembers(draft, household);
  const executor = named.find((n) => n.roles.includes("Executor"));

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    Object.assign(document.createElement("a"), { href: url, download: "my-will.txt" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="@container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 font-display text-2xl font-medium text-pnc-ink">
            Your will
            <span className="rounded-full bg-pnc-positive-bg px-2.5 py-0.5 font-sans text-xs font-semibold text-pnc-positive">
              On file
            </span>
          </h2>
          {updated && (
            <p className="mt-1 text-sm text-pnc-muted">Saved {formatDate(updated, "medium")}</p>
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

      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 rounded-lg bg-pnc-surface px-3 py-6 @3xl:px-6">
          <WillDocument text={text} collapsible />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-pnc-line p-4">
            <h3 className="font-semibold text-pnc-ink">People your will names</h3>
            {named.length ? (
              <ul className="mt-3 space-y-3">
                {named.map(({ member, roles }) => (
                  <li key={member.id} className="flex items-start gap-3">
                    <Avatar member={member} index={household.members.indexOf(member)} />
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
              <p className="mt-2 text-sm text-pnc-muted">No one in your household is named yet.</p>
            )}
          </section>

          <section className="flex gap-3 rounded-lg bg-pnc-blue-50 p-4 text-sm leading-relaxed">
            <IconChip icon={ScrollText} size="sm" />
            <p>
              When the time comes, {executor ? firstName(executor.member.name) : "your executor"}{" "}
              will see your will on their own Planning page and can begin settling your estate with
              PNC.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
