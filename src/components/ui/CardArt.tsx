import { PncMark } from "@/components/brand/PncLogo";
import type { CreditCardAccount } from "@/data/types";
import { cn } from "@/lib/format";

const styles: Record<CreditCardAccount["cardStyle"], { bg: string; label: string }> = {
  "cash-rewards": { bg: "from-[#1d6b3a] via-[#2f8a4c] to-[#0f4a26]", label: "PNC CASH REWARDS" },
  travel: { bg: "from-[#1b2c4f] via-[#2d4677] to-[#0f1a33]", label: "PNC TRAVEL REWARDS" },
  core: { bg: "from-[#0b59b8] via-[#1a6fd0] to-[#083b80]", label: "PNC CORE" },
};

/** Illustrated card face (not a real card image). */
export function CardArt({
  style,
  last4,
  compact = false,
  className,
}: {
  style: CreditCardAccount["cardStyle"];
  last4: string;
  /** Thumbnail size: drops the text, keeps the brand marks. */
  compact?: boolean;
  className?: string;
}) {
  const s = styles[style];
  return (
    <div
      className={cn(
        "relative aspect-[1.586] overflow-hidden rounded-lg bg-gradient-to-br text-white shadow-card",
        compact ? "p-1.5" : "p-3",
        s.bg,
        className,
      )}
      aria-label={`${s.label} card ending ${last4}`}
    >
      <svg
        aria-hidden="true"
        className="absolute -left-6 top-0 h-full w-3/4 opacity-25"
        viewBox="0 0 100 100"
      >
        <path d="M0 0 L100 50 L0 100 Z" fill="#fff" />
      </svg>
      {compact ? (
        <div className="relative flex h-full flex-col justify-between">
          <PncMark size={8} className="self-end" />
          <span className="self-end text-[0.5rem] font-black italic">VISA</span>
        </div>
      ) : (
        <div className="relative flex h-full flex-col justify-between">
          <span className="flex items-center gap-1 self-end text-[0.5625rem] font-semibold tracking-wide">
            <PncMark size={10} /> PNC BANK
          </span>
          <span className="font-serif text-3xs tracking-wide text-white/90">{s.label}</span>
          <span className="flex items-end justify-between">
            <span className="text-3xs tabular-nums text-white/80">•••• {last4}</span>
            <span className="font-sans text-sm font-black italic tracking-tight">VISA</span>
          </span>
        </div>
      )}
    </div>
  );
}
