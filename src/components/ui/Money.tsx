import { cn, formatCompactMoney, formatMoney } from "@/lib/format";

/** Currency amount; negative values render in the PNC negative red. */
export function Money({
  value,
  className,
  signed = false,
  compact = false,
}: {
  value: number;
  className?: string;
  /** Prefix positive values with "+" (useful for transaction lists). */
  signed?: boolean;
  /** "$8.42M" style; the exact amount is kept in the tooltip. */
  compact?: boolean;
}) {
  const formatted = compact ? formatCompactMoney(value) : formatMoney(value);
  const text = signed && value > 0 ? `+${formatted}` : formatted;
  return (
    <span
      title={compact ? formatMoney(value) : undefined}
      className={cn("tabular-nums", value < 0 && "text-pnc-negative", className)}
    >
      {text}
    </span>
  );
}
