import type { Metadata } from "next";
import { MobileAdvisorHome } from "@/components/advisor/AdvisorHome";

export const metadata: Metadata = { title: "Advisor Home" };

export default function MobileAdvisorHomePage() {
  return <MobileAdvisorHome />;
}
