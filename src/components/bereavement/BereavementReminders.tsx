"use client";

import Link from "next/link";
import { ClipboardList, HeartHandshake } from "lucide-react";
import { routes } from "@/lib/routes";
import { useHouseholdLoss } from "./useHouseholdLoss";

/** Top item in the laptop Reminders card while a loss is being settled. */
export function BereavementReminderItem() {
  const { loss, firstName } = useHouseholdLoss();
  if (!loss) return null;
  return (
    <li className="flex gap-3 bg-attention-bg px-5 py-3.5 text-sm leading-relaxed">
      <HeartHandshake className="mt-0.5 size-4 shrink-0 text-attention" aria-hidden="true" />
      <span>
        <span className="block font-semibold text-attention">Action needed</span>A few steps are
        needed to look after {firstName}&apos;s accounts — at your own pace.{" "}
        <Link href={routes.nextSteps} className="font-semibold text-pnc-link hover:underline">
          See next steps
        </Link>
      </span>
    </li>
  );
}

/** Mobile header "Reminders" pill; counts the bereavement reminder when there is one. */
export function RemindersPill({ count }: { count: number }) {
  const { loss } = useHouseholdLoss();
  const total = count + (loss ? 1 : 0);
  return (
    <Link
      href={loss ? routes.nextSteps : "#"}
      className="relative mb-1 flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm"
    >
      <ClipboardList className="size-4" aria-hidden="true" /> Reminders
      <span className="absolute -right-2 -top-2.5 grid size-5 place-items-center rounded-full bg-pnc-badge text-[11px] font-bold">
        {total}
        <span className="sr-only"> reminders</span>
      </span>
    </Link>
  );
}
