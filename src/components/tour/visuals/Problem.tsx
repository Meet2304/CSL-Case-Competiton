"use client";

import {
  EyeOff,
  FileQuestion,
  HeartHandshake,
  ListChecks,
  Scale,
  Unlink,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Money } from "@/components/ui/Money";
import { familyIds, tourPeople, type TourChapterId } from "@/data/tour";
import { cn, formatCompactMoney } from "@/lib/format";
import { chapterStart, husbandMoney, settlementSplit } from "@/lib/tour";
import { Avatar, Visual, useTour } from "../parts";

/** The four family members side by side. `lost` fades Husband. */
function FamilyRow({ lost = false }: { lost?: boolean }) {
  return (
    <>
      {familyIds.map((id) => (
        <div key={id} className="flex flex-col items-center gap-2 text-center">
          <Avatar
            person={id}
            className={cn(
              "size-16 @[600px]:size-24",
              lost && id === "husband" && "opacity-30 grayscale",
            )}
          />
          <span className="text-md font-semibold @[600px]:text-lg">
            {tourPeople[id].name}
            {lost && id === "husband" && <span className="sr-only"> (passed away)</span>}
          </span>
        </div>
      ))}
    </>
  );
}

const Link = () => <span className="my-2 h-8 w-0.5 rounded bg-pnc-blue-700" aria-hidden="true" />;

// ---------------------------------------------------------------------------
// Everything hangs off Husband: the accounts above him, the Bank Advisor below.

export function FamilyVisual() {
  return (
    <Visual>
      <div className="grid grid-cols-4 gap-x-2">
        <div className="flex flex-col items-center text-center">
          <Wallet className="size-10 text-pnc-blue-700" aria-hidden="true" />
          <p className="mt-1 text-md font-semibold @[600px]:text-lg">Every account</p>
          <Money value={husbandMoney().net} compact className="text-sm text-pnc-muted" />
          <Link />
        </div>
        <p className="col-span-3 flex items-center justify-center gap-2 pb-10 text-md text-pnc-muted">
          <EyeOff className="size-5 shrink-0" aria-hidden="true" />
          No view of the money
        </p>

        <FamilyRow />

        <div className="flex flex-col items-center text-center">
          <Link />
          <Avatar person="advisor" className="size-16 @[600px]:size-20" />
          <p className="mt-2 text-md font-semibold @[600px]:text-lg">{tourPeople.advisor.name}</p>
        </div>
        <p className="col-span-3 flex items-center justify-center gap-2 pt-10 text-md text-pnc-muted">
          <Unlink className="size-5 shrink-0" aria-hidden="true" />
          Have never met the Bank Advisor
        </p>
      </div>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The same family without Husband, and the three things that break.

export function TodayVisual() {
  const { state } = useTour();
  const breaks: { icon: LucideIcon; text: string }[] = [
    { icon: FileQuestion, text: "Wife does not know what exists" },
    {
      icon: Scale,
      text: `${formatCompactMoney(settlementSplit(state).estate)} goes through probate`,
    },
    { icon: Unlink, text: "The Bank Advisor has never met her" },
  ];
  return (
    <Visual>
      <div className="grid grid-cols-4 gap-x-2">
        <FamilyRow lost />
      </div>
      <ul className="mt-10 grid gap-8 border-t border-pnc-line pt-10 @[600px]:grid-cols-3">
        {breaks.map((b) => (
          <li
            key={b.text}
            className="flex items-center gap-4 @[600px]:flex-col @[600px]:text-center"
          >
            <b.icon className="size-9 shrink-0 text-attention" aria-hidden="true" />
            <p className="text-lg font-semibold">{b.text}</p>
          </li>
        ))}
      </ul>
    </Visual>
  );
}

// ---------------------------------------------------------------------------
// The four things to remember, each opening its chapter.

const points: { icon: LucideIcon; chapter: TourChapterId; text: string }[] = [
  { icon: Users, chapter: "before", text: "The family is connected before the loss" },
  { icon: HeartHandshake, chapter: "advisor", text: "The Bank Advisor is guided from day one" },
  { icon: ListChecks, chapter: "widow", text: "The next steps are simple for the family" },
  { icon: Scale, chapter: "findoe", text: "Every AI answer shows its source" },
];

export function CloseVisual() {
  const { dispatch } = useTour();
  return (
    <Visual figures={false}>
      <ul className="grid gap-x-10 gap-y-2 @[600px]:grid-cols-2">
        {points.map((p) => (
          <li key={p.text}>
            <button
              type="button"
              onClick={() => dispatch({ type: "go", step: chapterStart(p.chapter) })}
              className="flex w-full items-center gap-5 rounded-lg py-5 text-left hover:text-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
            >
              <p.icon className="size-10 shrink-0 text-pnc-blue-700" aria-hidden="true" />
              <span className="font-display text-xl font-medium">{p.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-10 border-t border-pnc-line pt-6 text-md text-pnc-muted">
        Team Findoe: Anjali, Khushi, Max and Meet
      </p>
    </Visual>
  );
}
