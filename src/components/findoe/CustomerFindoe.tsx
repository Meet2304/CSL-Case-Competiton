"use client";

import { usePathname } from "next/navigation";
import { useViewer } from "@/components/customer/Viewer";
import { useNudges } from "@/components/customer/useNudges";
import { MOCK_AS_OF } from "@/data/mock";
import { customerContext, customerReply, customerSuggestions } from "@/lib/findoe/customer";
import { firstName } from "@/lib/format";
import { toPublicPath } from "@/lib/routes";
import { useWillStatus } from "@/lib/will/storage";
import { FindoeAssistant } from "./FindoeAssistant";

/**
 * Findoe for the signed-in customer, on every customer page. Built from the
 * same household data the pages show (what this person owns, manages and is
 * shared), so it can't reveal anything the pages don't.
 */
export function CustomerFindoe({ variant }: { variant: "web" | "mobile" }) {
  const { person, first, household, accounts, deceasedIds, loss, isDeceased } = useViewer();
  const nudges = useNudges();
  const will = useWillStatus(person.id);
  const path = toPublicPath(usePathname());
  const ctx = customerContext({
    person,
    household,
    accounts,
    deceasedIds,
    will,
    nudges,
    loss,
    today: MOCK_AS_OF,
  });
  return (
    <FindoeAssistant
      key={person.id}
      variant={variant}
      hidden={isDeceased}
      greeting={`Hi ${first}, how can I help?`}
      intro={
        ctx.loss
          ? `We're so sorry about ${firstName(ctx.loss.deceased.name)}. I can show you what to do next, at your own pace, from your accounts and the law.`
          : "I can look at your accounts at PNC and check the legal library. Every answer shows where it came from."
      }
      bankLabel="Your PNC records"
      scope={`${person.name}'s records`}
      suggestions={customerSuggestions(ctx, path)}
      placeholder="Ask about your accounts, a will, next steps…"
      reply={(q) => customerReply(ctx, q)}
    />
  );
}
