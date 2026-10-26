import type { Metadata } from "next";
import { WebAdvisorHome } from "@/components/advisor/AdvisorHome";

export const metadata: Metadata = { title: "Advisor Home" };

export default function WebAdvisorHomePage() {
  return <WebAdvisorHome />;
}
