import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/** Text with a light sweeping across it — "working on it". Still under reduced motion. */
export function Shimmer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(90deg,var(--color-pnc-muted)_0%,var(--color-pnc-muted)_40%,var(--color-pnc-ink)_50%,var(--color-pnc-muted)_60%,var(--color-pnc-muted)_100%)] bg-[length:250%_100%] bg-clip-text text-transparent motion-safe:animate-shimmer motion-reduce:text-pnc-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
