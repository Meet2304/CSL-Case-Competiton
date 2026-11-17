import type { Metadata } from "next";
import { ProductStory } from "@/components/story/ProductStory";

export const metadata: Metadata = {
  title: "Findoe",
  description:
    "A key-driven walk through Findoe, told around one family: preparing together, the loss, the advisor, and what comes after. All data shown is mock data.",
};

// Open to everyone: src/proxy.ts lets /story through untouched. One layout for every device.
export default function StoryPage() {
  return <ProductStory />;
}
