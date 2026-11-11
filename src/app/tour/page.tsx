import type { Metadata } from "next";
import { GuidedTour } from "@/components/tour/GuidedTour";

export const metadata: Metadata = {
  title: "Guided tour",
  description:
    "A step-by-step walk through Findoe: the family dashboard, advisor guidance, simple next steps after a loss, and cited AI answers. All data shown is mock data.",
};

// One layout for every device and open to everyone: src/proxy.ts lets /tour through untouched.
export default function TourPage() {
  return <GuidedTour />;
}
