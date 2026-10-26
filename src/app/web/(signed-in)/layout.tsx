import { LossStrip } from "@/components/bereavement/LossStrip";
import { WebFooter } from "@/components/web/WebFooter";
import { WebHeader } from "@/components/web/WebHeader";

// Customer pages (signed in with the "customer" role).
export default function SignedInWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebHeader variant="customer" />
      {/* Appears only after the bank records a death in this household. */}
      <LossStrip variant="web" />
      <main className="flex-1">{children}</main>
      <WebFooter />
    </>
  );
}
