import { Suspense } from "react";
import { LossStrip } from "@/components/bereavement/LossStrip";
import { ViewerGate, ViewerProvider } from "@/components/customer/Viewer";
import { WebFooter } from "@/components/web/WebFooter";
import { WebHeader } from "@/components/web/WebHeader";
import { viewerId } from "@/lib/viewer";

// Customer pages, for whichever household member signed in. Who that is comes
// from the session cookie, so everything below streams in after the shell.
export default function SignedInWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <>
          <div className="h-[6.25rem] bg-pnc-navy md:h-16" aria-hidden="true" />
          <main className="flex-1" aria-busy="true" />
        </>
      }
    >
      <SignedIn>{children}</SignedIn>
    </Suspense>
  );
}

async function SignedIn({ children }: { children: React.ReactNode }) {
  return (
    <ViewerProvider personId={await viewerId()}>
      <WebHeader variant="customer" />
      {/* Appears only after the bank records a death in this household. */}
      <LossStrip variant="web" />
      <main className="flex-1">
        <ViewerGate>{children}</ViewerGate>
      </main>
      <WebFooter />
    </ViewerProvider>
  );
}
