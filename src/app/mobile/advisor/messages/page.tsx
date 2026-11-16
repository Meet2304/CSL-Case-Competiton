import type { Metadata } from "next";
import { Messages } from "@/components/advisor/messages/Messages";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Messages" };

export default function MobileAdvisorMessagesPage() {
  return (
    <>
      <MobileHeader title="Messages" backHref={routes.advisor} />
      <div className="px-3 pb-6 pt-4">
        <Messages />
      </div>
    </>
  );
}
