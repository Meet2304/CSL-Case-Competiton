import { AdvisorFindoe } from "@/components/findoe/AdvisorFindoe";
import { WebFooter } from "@/components/web/WebFooter";
import { WebHeader } from "@/components/web/WebHeader";

// Advisor (bank representative) pages. Only reachable with the "advisor" role.
export default function AdvisorWebLayout({ children }: LayoutProps<"/web/advisor">) {
  return (
    <>
      <WebHeader variant="advisor" />
      <main className="flex-1">{children}</main>
      <WebFooter />
      {/* Findoe across the book; it steps aside on client pages, where it's docked. */}
      <AdvisorFindoe variant="web" />
    </>
  );
}
