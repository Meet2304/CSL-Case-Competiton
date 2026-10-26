import { HeartCrack } from "lucide-react";
import { cn } from "@/lib/format";

/** Marks a customer who needs the advisor's attention after a family loss. */
export function AttentionIcon({
  className,
  label = "Needs attention",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-attention-bg text-attention ring-1 ring-attention-line",
        className,
      )}
    >
      <HeartCrack className="size-4" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
