import type { Metadata } from "next";
import { MobileSignOn } from "@/components/mobile/MobileSignOn";

export const metadata: Metadata = { title: "Mobile Sign On" };

export default function MobileSignOnPage() {
  return <MobileSignOn />;
}
