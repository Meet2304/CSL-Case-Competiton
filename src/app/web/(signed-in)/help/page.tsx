import type { Metadata } from "next";
import { MessageCircle, Phone, Search } from "lucide-react";
import { IconChip } from "@/components/ui/IconChip";
import { WebCard } from "@/components/web/WebCard";
import { WebHero } from "@/components/web/WebHero";

export const metadata: Metadata = { title: "Help" };

const faqs = [
  {
    q: "How do I reset my password?",
    a: "Select “Forgot User ID or Password?” on the sign-on page and follow the steps.",
  },
  {
    q: "When will my transfer arrive?",
    a: "Transfers between PNC accounts are usually immediate. External transfers can take 1–3 business days.",
  },
  { q: "How do I lock my card?", a: "Go to Cards, choose a card, and turn on Lock card." },
];

export default function WebHelpPage() {
  return (
    <>
      <WebHero title="Help" showDate={false} />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <WebCard title="Frequently Asked Questions">
          <div className="px-5 pt-4">
            <label className="flex items-center gap-2 rounded-md border border-pnc-line px-3 py-2 text-sm text-pnc-muted">
              <Search className="size-4" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search help topics"
              />
            </label>
          </div>
          <div className="divide-y divide-pnc-line px-5 py-2">
            {faqs.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="cursor-pointer list-none font-semibold text-pnc-link">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-pnc-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </WebCard>

        <WebCard title="Contact Us" className="self-start">
          <ul className="divide-y divide-pnc-line text-sm">
            <li className="flex items-center gap-3 px-5 py-4">
              <IconChip icon={MessageCircle} size="sm" /> Chat with us (demo only)
            </li>
            <li className="flex items-center gap-3 px-5 py-4">
              <IconChip icon={Phone} size="sm" /> 1-800-000-0000 (placeholder)
            </li>
          </ul>
        </WebCard>
      </div>
    </>
  );
}
