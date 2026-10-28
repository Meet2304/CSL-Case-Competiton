"use client";

import { useViewer } from "@/components/customer/Viewer";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useHash } from "@/components/shared/useHashTab";
import { WebHero } from "@/components/web/WebHero";
import { familiesOf, familySummary } from "@/lib/household";
import { withArticle } from "./parts";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The families the signed-in person belongs to, and the one open in the URL hash, if any. */
export function useOpenFamily() {
  const { person, household } = useViewer();
  const families = familiesOf(household, person.id);
  const [hash, setHash] = useHash();
  return { families, current: families.find((f) => f.id === hash), setHash };
}

/** "You're an Admin · 4 members" for the open family. */
function useFamilyLine(): { title: string; line?: string } {
  const { person, accounts, deceasedIds } = useViewer();
  const { current } = useOpenFamily();
  if (!current) return { title: "Family" };
  const s = familySummary(current, person.id, accounts, deceasedIds);
  const role = s.role ? `You're ${withArticle(s.role.name)} · ` : "";
  return { title: current.familyName, line: `${role}${plural(s.living.length, "member")}` };
}

/** The web header band: "Family" on the list, the family's own name once one is open. */
export function FamilyWebHero() {
  const { title, line } = useFamilyLine();
  return (
    <WebHero
      title={title}
      subtitle={
        line ??
        "Choose the people you trust, and decide what each of them can see and do with your accounts."
      }
    />
  );
}

/** The phone header, titled the same way as the web band. */
export function FamilyMobileHeader() {
  const { title, line } = useFamilyLine();
  return (
    <MobileHeader
      title={
        <div>
          <h1 className="text-[1.75rem] font-bold leading-tight">{title}</h1>
          {line && <p className="mt-0.5 text-sm text-white/85">{line}</p>}
        </div>
      }
    />
  );
}
