import { WebHeader } from "@/components/web/WebHeader";

export default function SignedInWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-pnc-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-pnc-muted sm:px-6">
          CSL Case Competition concept prototype · Not affiliated with live PNC systems.
        </div>
      </footer>
    </>
  );
}
