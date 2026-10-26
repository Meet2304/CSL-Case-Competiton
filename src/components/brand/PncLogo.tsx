import { cn } from "@/lib/format";

type PncLogoProps = {
  /** "light" = white wordmark for blue backgrounds, "dark" = blue wordmark. */
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { mark: 22, text: "text-xl" },
  md: { mark: 32, text: "text-3xl" },
  lg: { mark: 64, text: "text-6xl" },
};

/** Simplified PNC-style mark: orange disc with a split white triangle. */
export function PncMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="var(--color-pnc-orange)" />
      <path d="M10 7.5 L25 16 L10 24.5 Z" fill="#fff" />
      <path d="M10 13.2 L16.6 16 L10 18.8 Z" fill="var(--color-pnc-orange)" />
    </svg>
  );
}

export function PncLogo({ tone = "dark", size = "md", className }: PncLogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label="PNC">
      <PncMark size={s.mark} />
      <span
        className={cn(
          "font-serif font-semibold leading-none tracking-tight",
          s.text,
          tone === "light" ? "text-white" : "text-pnc-blue-800",
        )}
      >
        PNC
      </span>
    </span>
  );
}
