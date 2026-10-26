import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { depositAccounts } from "@/data/mock";

export const metadata: Metadata = { title: "Deposit" };

export default function MobileDepositPage() {
  return (
    <>
      <MobileHeader title="Mobile Deposit">
        <MobileCard className="p-4">
          <label htmlFor="deposit-to" className="text-sm text-pnc-muted">
            Deposit To
          </label>
          <select id="deposit-to" className="mt-1 w-full border-b border-pnc-line bg-transparent py-2 text-[17px] outline-none">
            {depositAccounts.map((a) => (
              <option key={a.id}>
                {a.name} x{a.last4}
              </option>
            ))}
          </select>

          <label htmlFor="deposit-amount" className="mt-5 block text-sm text-pnc-muted">
            Amount
          </label>
          <input
            id="deposit-amount"
            inputMode="decimal"
            placeholder="$0.00"
            className="mt-1 w-full border-b border-pnc-line py-2 text-[17px] outline-none focus:border-pnc-link"
          />
        </MobileCard>
      </MobileHeader>

      <div className="space-y-4 px-3 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {["Front of Check", "Back of Check"].map((side) => (
            <button
              key={side}
              type="button"
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pnc-link/40 bg-white text-sm text-pnc-link"
            >
              <Camera className="size-7" strokeWidth={1.5} />
              {side}
            </button>
          ))}
        </div>
        <button type="button" disabled className="w-full rounded-full bg-pnc-blue-700 py-3.5 font-semibold text-white disabled:opacity-40">
          Continue
        </button>
        <p className="text-center text-xs text-pnc-muted">Demo only — no images are captured or uploaded.</p>
      </div>
    </>
  );
}
