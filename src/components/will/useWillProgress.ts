"use client";

import { useViewer } from "@/components/customer/Viewer";
import { percentDone, sectionProgress } from "@/lib/will/flow";
import { useSavedWill, useWillStatus } from "@/lib/will/storage";

/** The signed-in person's will: whether it's started or on file, and how far along it is. */
export function useWillProgress() {
  const { person } = useViewer();
  const status = useWillStatus(person.id);
  const saved = useSavedWill(person.id);
  // Nothing saved means nothing done. (No empty draft here: it makes ids from the clock,
  // which a page rendered ahead of time must not do.)
  const percent = saved ? percentDone(sectionProgress(saved.draft, saved.progress)) : 0;
  return { status, percent };
}
