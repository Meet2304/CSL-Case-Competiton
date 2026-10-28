"use client";

import { usePathname } from "next/navigation";
import { useAdvisorBook } from "@/components/advisor/useAdvisorBook";
import { advisor } from "@/data/advisor";
import { MOCK_AS_OF } from "@/data/mock";
import { advisorReply, advisorSuggestions } from "@/lib/findoe/advisor";
import { routes, toPublicPath } from "@/lib/routes";
import { FindoeAssistant } from "./FindoeAssistant";

/**
 * Findoe across the advisor's book, on every advisor page. On a client's own
 * page it steps aside: Findoe is docked there, working from that client's file.
 */
export function AdvisorFindoe({ variant }: { variant: "web" | "mobile" }) {
  const { customers } = useAdvisorBook();
  const path = toPublicPath(usePathname());
  const ctx = { customers, today: MOCK_AS_OF };
  return (
    <FindoeAssistant
      variant={variant}
      hidden={path.startsWith(routes.advisorClient(""))}
      greeting={`Hi ${advisor.firstName}, what do you need?`}
      intro="I can search your client book and the legal library. Open a client for help with their plan."
      bankLabel="Client records"
      scope="Your client book"
      suggestions={advisorSuggestions(ctx)}
      placeholder="Ask about your clients…"
      reply={(q) => advisorReply(ctx, q)}
    />
  );
}
