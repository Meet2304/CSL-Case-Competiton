import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

/** Round light-gray disc holding a blue line icon, as used across PNC lists. */
export function IconChip({
  icon: Icon,
  tint,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tint?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "size-9", md: "size-12", lg: "size-14" }[size];
  const glyph = { sm: "size-4.5", md: "size-6", lg: "size-7" }[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-pnc-chip text-pnc-blue-700",
        box,
        className,
      )}
      style={tint ? { color: tint } : undefined}
    >
      <Icon className={glyph} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
