"use client";

import { useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { IconChip } from "@/components/ui/IconChip";
import { cn } from "@/lib/format";

type Notice = { id: string; title: string; body: string };

/** Swipeable notice cards with page dots, overlapping the header. */
export function NoticeCarousel({ notices }: { notices: Notice[] }) {
  const [index, setIndex] = useState(0);
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
              <IconChip icon={ShieldCheck} size="lg" />
              <p className="text-sm leading-snug">
                <span className="block text-base font-semibold">{n.title}</span>
                {n.body}{" "}
                <a href="#" className="text-pnc-link">
                  Learn More
                </a>
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
