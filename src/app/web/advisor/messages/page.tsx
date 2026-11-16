import type { Metadata } from "next";
import { Messages } from "@/components/advisor/messages/Messages";

export const metadata: Metadata = { title: "Messages" };

export default function WebAdvisorMessagesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Messages />
    </div>
  );
}
