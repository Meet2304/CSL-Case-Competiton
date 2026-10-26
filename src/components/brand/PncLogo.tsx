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
