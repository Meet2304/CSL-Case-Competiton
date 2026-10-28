"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  CloudCheck,
  Download,
  PencilLine,
  ScrollText,
} from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { Avatar, Pill } from "@/components/family/parts";
import { IconChip } from "@/components/ui/IconChip";
import { buttonClass } from "@/components/will/ui";
import { WillDocument } from "@/components/will/WillDocument";
import { ProgressBar, StepDot, statusText } from "@/components/will/progress";
import { sectionMeta } from "@/components/will/sections";
import { WillPlanner } from "@/components/will/WillPlanner";
import type { FamilyMember, FamilyState } from "@/data/types";
import { firstName } from "@/lib/family";
import { formatDate } from "@/lib/format";
import { householdAsFamily } from "@/lib/household";
import { percentDone, sectionProgress, sections, type SectionProgress } from "@/lib/will/flow";
import { generateWill } from "@/lib/will/generate";
import { namedMembers } from "@/lib/will/roles";
import { readWillUpdated, useHydrated, useSavedWill, useWillStatus } from "@/lib/will/storage";
import { emptyDraft, newId, type WillDraft } from "@/lib/will/types";

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
 * The signed-in person's will (the Will page, `routes.will`): a short start
 * page, the step-by-step planner, or the will on file. While editing, one
 * breadcrumb leads back to the start page, so there's never a second "back"
 * link.
 */
export function WillSection() {
  const { person, accounts, deceasedIds } = useViewer();
  const hydrated = useHydrated();
  const saved = useSavedWill(person.id);
  const status = useWillStatus(person.id);
  // A section number opens the planner there; "resume" opens it where they left off.
  const [planning, setPlanning] = useState<number | "resume" | null>(null);
  const household = householdAsFamily(person.id, accounts, deceasedIds);

  const crumbs = [{ label: "Your will", onClick: () => setPlanning(null) }, { label: "Edit" }];
  const savedNote = (
    <span className="inline-flex items-center gap-1.5 text-xs text-pnc-muted">
      <CloudCheck className="size-4 text-pnc-positive" aria-hidden="true" />
      Saved as you go
    </span>
  );

  let body: ReactNode;
  if (!hydrated) {
    body = (
      <div className={panel}>
        <p className="py-10 text-center text-sm text-pnc-muted">Loading your will…</p>
      </div>
    );
  } else if (planning !== null) {
    body = (
      <div className={panel}>
        <WillPlanner
          accountHolder={person.name}
          owner={person.id}
          openAt={planning === "resume" ? undefined : planning}
          onExit={() => setPlanning(null)}
          people={householdPeople(household)}
          prefill={prefillFromHousehold(household)}
        />
      </div>
    );
  } else if (status === "on-file" && saved) {
    body = (
      <div className={panel}>
        <WillOnFile
          draft={saved.draft}
          household={household}
          onEdit={() => setPlanning("resume")}
        />
      </div>
    );
  } else {
    const living = household.members.filter((m) => m.id !== person.id && m.status !== "Deceased");
    const parts = sectionProgress(saved?.draft ?? emptyDraft(), saved?.progress);
    body = (
      <WillStart
        parts={parts}
        started={status === "in-progress" && parts.some((p) => p.status !== "todo")}
        family={living.filter((m) => m.relationship === "Spouse" || m.relationship === "Child")}
        indexOf={(m) => household.members.indexOf(m)}
        onStart={() => setPlanning("resume")}
        onOpen={(section) => setPlanning(section)}
      />
    );
  }

  return (
    <div className="@container space-y-4">
      {planning !== null && <Breadcrumb trail={crumbs} aside={savedNote} />}
      {body}
    </div>
  );
}

const panel = "rounded-lg bg-white p-5 shadow-card @2xl:p-6";

/** Where you are, with every earlier level one click away. */
function Breadcrumb({
  trail,
  aside,
}: {
  trail: { label: string; onClick?: () => void }[];
  aside?: ReactNode;
}) {
  return (
    <div className="flex min-h-6 flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm">
          {trail.map((c, i) => (
            <li key={c.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 text-pnc-muted" aria-hidden="true" />}
              {c.onClick ? (
                <button
                  type="button"
                  onClick={c.onClick}
                  className="font-semibold text-pnc-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  {c.label}
                </button>
              ) : (
                <span aria-current="page" className="font-semibold text-pnc-ink">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {aside}
    </div>
  );
}

const facts = [
  { icon: Clock, text: "About 20 minutes" },
  { icon: BadgeCheck, text: "Free" },
  { icon: CloudCheck, text: "Saves as you go" },
];

/**
 * Before the planner: what a will does, one button to begin (or carry on),
 * and the eight sections as numbered steps, any of which opens directly.
 */
function WillStart({
  parts,
  started,
  family,
  indexOf,
  onStart,
  onOpen,
}: {
  parts: SectionProgress[];
  started: boolean;
  family: FamilyMember[];
  indexOf: (m: FamilyMember) => number;
  onStart: () => void;
  onOpen: (section: number) => void;
}) {
  const done = parts.filter((p) => p.status === "complete").length;
  const percent = percentDone(parts);
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-card">
      <div className="relative bg-linear-to-br from-pnc-blue-50 via-white to-white px-6 py-8 @2xl:px-10 @2xl:py-10">
        <ScrollText
          aria-hidden="true"
          strokeWidth={0.75}
          className="pointer-events-none absolute -right-8 -top-6 hidden size-56 rotate-12 text-pnc-blue-700/[0.07] @2xl:block"
        />
        <div className="relative max-w-xl">
          <span className="grid size-11 place-items-center rounded-full bg-white text-pnc-blue-700 shadow-card">
            <ScrollText className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-pnc-ink">
            {started ? "Finish your will" : "Write your will"}
          </h2>
          <p className="mt-2 text-md leading-relaxed text-pnc-muted">
            {started
              ? `${done} of ${sections.length} sections done. Everything you've entered is saved, so pick up right where you left off.`
              : "Decide who inherits what you own, who would raise your children and who carries out your wishes."}
          </p>

          {started ? (
            <div className="mt-5 flex max-w-sm items-center gap-3">
              <ProgressBar percent={percent} className="flex-1" />
              <span
                aria-hidden="true"
                className="text-xs font-semibold tabular-nums text-pnc-muted"
              >
                {percent}%
              </span>
            </div>
          ) : (
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-pnc-ink">
              {facts.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-1.5">
                  <Icon className="size-4 text-pnc-blue-700" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={onStart} className={buttonClass.primary}>
              {started ? "Continue your will" : "Start your will"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            {!started && family.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-pnc-muted">
                <span className="flex -space-x-1.5">
                  {family.map((m) => (
                    <Avatar key={m.id} member={m} index={indexOf(m)} size="sm" />
                  ))}
                </span>
                Your family is already filled in
              </p>
            )}
          </div>
        </div>
      </div>

      <nav
        aria-labelledby="will-covers-title"
        className="border-t border-pnc-line px-4 py-5 @2xl:px-8"
      >
        <div className="flex items-baseline justify-between gap-3 px-2">
          <h3
            id="will-covers-title"
            className="text-xs font-semibold uppercase tracking-wider text-pnc-muted"
          >
            What your will covers
          </h3>
          <p className="text-xs text-pnc-muted">Open any section</p>
        </div>
        <ol className="mt-4 grid grid-cols-4 gap-y-3 @2xl:grid-cols-8">
          {parts.map((p) => {
            const meta = sectionMeta[sections[p.section]];
            return (
              <li key={p.section} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpen(p.section)}
                  className="group flex flex-col items-center gap-2 rounded-md px-1.5 py-1.5 text-xs hover:bg-pnc-surface focus-visible:outline-2 focus-visible:outline-pnc-link"
                >
                  <StepDot part={p} />
                  <span
                    aria-hidden="true"
                    className="text-center text-pnc-ink group-hover:text-pnc-link"
                  >
                    {meta.short}
                  </span>
                  <span className="sr-only">
                    Section {p.section + 1}: {meta.label}, {statusText(p).toLowerCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="border-t border-pnc-line bg-pnc-surface/60 px-6 py-3 text-xs text-pnc-muted @2xl:px-10">
        Legally valid once printed, signed and witnessed. A draft for you to review, not legal
        advice.
      </p>
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
              will see your will on My Assets, under Unclaimed assets, and can begin settling your
              estate with PNC.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
