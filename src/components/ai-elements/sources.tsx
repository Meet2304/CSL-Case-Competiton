"use client";

import { useId, useState } from "react";
import { BookOpenCheck, ChevronDown } from "lucide-react";
import { SourceChip } from "@/components/advisor/settlement/SourceChip";
import { cn } from "@/lib/format";

/** "Cited 3 sources", expanding to the citations themselves. */
export function Sources({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!ids.length) return null;
  return (
    <div className="text-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md py-0.5 text-xs font-semibold text-pnc-muted hover:text-pnc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
      >
        <BookOpenCheck className="size-3.5" aria-hidden="true" />
        Cited {ids.length} {ids.length === 1 ? "source" : "sources"}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <ul id={id} hidden={!open} className="mt-2 flex flex-wrap gap-1.5" aria-label="Sources">
        {ids.map((s) => (
          <li key={s} className="max-w-full">
            <SourceChip id={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
