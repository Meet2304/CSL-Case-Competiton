"use client";

import { useViewer } from "@/components/customer/Viewer";
import { sectionsDone } from "@/components/will/WillPlanner";
import { MOCK_AS_OF } from "@/data/mock";
import { sections } from "@/lib/will/flow";
import { useSavedWill, useWillStatus } from "@/lib/will/storage";
import { useDpoaSent } from "@/lib/dpoa";
import { nudgesFor } from "@/lib/nudges";

/** The signed-in person's planning reminders. */
export function useNudges() {
  const { person, accounts, deceasedIds } = useViewer();
  const will = useWillStatus(person.id);
  const saved = useSavedWill(person.id);
  const dpoaSent = useDpoaSent(person.id);
  return nudgesFor({
    person,
    accounts,
    deceasedIds,
    will,
    willSectionsDone: sectionsDone(saved?.draft, saved?.progress),
    totalSections: sections.length,
    dpoaSent,
    today: MOCK_AS_OF,
  });
}
