import Image from "next/image";
import { cn } from "@/lib/format";

type PncLogoProps = {
  /** "light" = white wordmark for blue backgrounds, "dark" = the official blue wordmark. */
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

// The official logo is 512 × 141 (public/brand). Heights in px; width follows the aspect ratio.
const heights = { sm: 26, md: 38, lg: 64 };
const ASPECT = 512 / 141;

/** The PNC emblem on its own: orange disc with the white split triangle. */
export function PncMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/pnc-mark.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}

/** The PNC logo. The light version swaps the blue wordmark for white on dark headers. */
export function PncLogo({ tone = "dark", size = "md", className }: PncLogoProps) {
  const h = heights[size];
  return (
    <Image
      src={tone === "light" ? "/brand/pnc-logo-light.png" : "/brand/pnc-logo.png"}
      alt="PNC"
      width={Math.round(h * ASPECT)}
      height={h}
      priority
      className={cn("h-auto shrink-0", className)}
      style={{ width: Math.round(h * ASPECT), height: h }}
    />
  );
}

const lockup = {
  sm: {
    mark: 22,
    name: "text-[0.8125rem]",
    product: "text-[0.8125rem]",
    rule: "h-4",
    gap: "gap-2.5",
  },
  md: { mark: 30, name: "text-base", product: "text-base", rule: "h-5", gap: "gap-3" },
  lg: { mark: 40, name: "text-xl", product: "text-xl", rule: "h-6", gap: "gap-3.5" },
};

/**
 * The PNC Private Bank lockup, after the PortfolioView header: the mark, "PNC
 * PRIVATE BANK" in serif capitals, a thin rule and "PORTFOLIOVIEW". The light
 * tone (navy headers) uses the white mark with the triangle cut out.
 */
export function PrivateBankLogo({
  tone = "light",
  size = "sm",
  product = true,
  className,
}: {
  tone?: "light" | "dark";
  size?: keyof typeof lockup;
  /** Show "| PORTFOLIOVIEW" after the bank's name. */
  product?: boolean;
  className?: string;
}) {
  const s = lockup[size];
  const light = tone === "light";
  return (
    <span
      role="img"
      aria-label={product ? "PNC Private Bank PortfolioView" : "PNC Private Bank"}
      className={cn("inline-flex shrink-0 items-center", s.gap, className)}
    >
      <Image
        src={light ? "/brand/pnc-mark-white.png" : "/brand/pnc-mark.png"}
        alt=""
        width={s.mark}
        height={s.mark}
        priority
        className="shrink-0"
        style={{ width: s.mark, height: s.mark }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "whitespace-nowrap font-[Georgia,'Times_New_Roman',serif] tracking-[0.06em]",
          s.name,
          light ? "text-white" : "text-pnc-navy",
        )}
      >
        PNC PRIVATE BANK
      </span>
      {product && (
        <>
          <span
            aria-hidden="true"
            className={cn("w-px shrink-0", s.rule, light ? "bg-white/45" : "bg-pnc-line")}
          />
          <span
            aria-hidden="true"
            className={cn(
              "whitespace-nowrap font-display tracking-[0.14em]",
              s.product,
              light ? "text-white" : "text-pnc-navy",
            )}
          >
            <span className="font-semibold">PORTFOLIO</span>
            <span className="font-light">VIEW</span>
          </span>
        </>
      )}
    </span>
  );
}
