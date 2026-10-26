"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { useHouseholdLoss } from "@/components/bereavement/useHouseholdLoss";
import { IconChip } from "@/components/ui/IconChip";
import { cn } from "@/lib/format";
import { routes } from "@/lib/routes";

type Notice = {
  id: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
  urgent?: boolean;
};

/** Swipeable notice cards with page dots, overlapping the header. */
export function NoticeCarousel({ notices: base }: { notices: Notice[] }) {
  const [index, setIndex] = useState(0);
  const { loss, firstName } = useHouseholdLoss();
  // After a loss in the family, the gentle "next steps" notice comes first.
  const notices: Notice[] = loss
    ? [
        {
          id: "bereavement",
          title: "A few steps need your attention",
          body: `We're so sorry about ${firstName}. We've gathered what's needed in one place.`,
          href: routes.nextSteps,
          cta: "See next steps",
          urgent: true,
        },
        ...base,
      ]
    : base;
  const track = useRef<HTMLDivElement>(null);

  function goTo(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {notices.map((n) => (
          <div key={n.id} className="w-full shrink-0 snap-center px-1">
            <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-raised">
              {n.urgent ? (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-attention-bg text-attention">
                  <HeartHandshake className="size-7" strokeWidth={1.75} aria-hidden="true" />
                </span>
              ) : (
                <IconChip icon={ShieldCheck} size="lg" />
              )}
              <p className="text-sm leading-snug">
                <span className={cn("block text-base font-semibold", n.urgent && "text-attention")}>
                  {n.title}
                </span>
                {n.body}{" "}
                <Link href={n.href ?? "#"} className="text-pnc-link">
                  {n.cta ?? "Learn More"}
                </Link>
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {notices.map((n, i) => (
          <button
            key={n.id}
            type="button"
            aria-label={`Show notice ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn("size-2 rounded-full", i === index ? "bg-pnc-orange" : "bg-black/20")}
          />
        ))}
      </div>
    </div>
  );
}
