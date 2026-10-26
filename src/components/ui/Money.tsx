import { cn, formatMoney } from "@/lib/format";

/** Currency amount; negative values render in the PNC negative red. */
export function Money({
  value,
  className,
  signed = false,
}: {
  value: number;
  className?: string;
  /** Prefix positive values with "+" (useful for transaction lists). */
  signed?: boolean;
}) {
  const text = signed && value > 0 ? `+${formatMoney(value)}` : formatMoney(value);
  return (
    <span className={cn("tabular-nums", value < 0 && "text-pnc-negative", className)}>{text}</span>
  );
}
