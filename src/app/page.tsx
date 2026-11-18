import type { Metadata } from "next";
import { GuidedTour } from "@/components/tour/GuidedTour";

export const metadata: Metadata = {
  title: "Guided tour",
  description:
    "A presenter-led walk through Findoe: two people's dashboards, one family view, what changes after a loss, the advisor's next steps and guided, cited claims. All data shown is mock data.",
};

// The site's root: one layout for every device and open to everyone. src/proxy.ts lets "/"
// through untouched; the working app signs on at /dev.
export default function TourPage() {
  return <GuidedTour />;
}
