import { cn } from "@/lib/format";

/**
 * Small inline pill placed next to any section that shows figures, so no
 * figure in this prototype is mistaken for real customer information.
 */
export function MockBadge({ className }: { className?: string }) {
  return (
    <span
      title="Mock data for demonstration only"
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-mock-line bg-mock-bg px-2 py-0.5 text-3xs font-bold uppercase tracking-wide text-mock",
        className,
      )}
    >
      Mock data
    </span>
  );
}
