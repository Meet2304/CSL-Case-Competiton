import { Suspense } from "react";
import { LossStrip } from "@/components/bereavement/LossStrip";
import { ViewerGate, ViewerProvider } from "@/components/customer/Viewer";
import { CustomerFindoe } from "@/components/findoe/CustomerFindoe";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { viewerId } from "@/lib/viewer";

// Who is signed in comes from the session cookie, so the tabs stream in after the shell.
export default function MobileTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy="true" />}>
      <SignedIn>{children}</SignedIn>
    </Suspense>
  );
}

async function SignedIn({ children }: { children: React.ReactNode }) {
  return (
    <ViewerProvider personId={await viewerId()}>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-6">
        <ViewerGate>{children}</ViewerGate>
      </main>
      {/* Findoe's button floats just above whatever comes next; its sheet covers the app. */}
      <CustomerFindoe variant="mobile" />
      {/* Appears only after the bank records a death in this household. */}
      <LossStrip variant="mobile" />
      <BottomTabBar />
    </ViewerProvider>
  );
}
