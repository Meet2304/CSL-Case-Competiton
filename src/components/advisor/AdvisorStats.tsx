import { CalendarClock, HeartCrack, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";
import type { advisorStats } from "@/lib/advisor";

type Stats = ReturnType<typeof advisorStats>;

/** Headline tiles at the top of the advisor's home. */
export function AdvisorStats({ stats, className }: { stats: Stats; className?: string }) {
  const tiles: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "attention" }[] = [
    { label: "Customers", value: stats.customers, icon: Users },
    {
      label: "Need attention",
      value: stats.needAttention,
      icon: HeartCrack,
      tone: stats.needAttention > 0 ? "attention" : undefined,
    },
    { label: "Reviews in next 30 days", value: stats.reviewsNext30Days, icon: CalendarClock },
  ];

  return (
    <dl className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        // Every tile shares one card and icon style; only the number carries the attention color.
        <div
          key={label}
          className="flex items-center gap-3 rounded-lg bg-white px-4 py-4 shadow-raised"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs text-pnc-muted">{label}</dt>
            <dd
              className={cn(
                "text-2xl font-semibold tabular-nums",
                tone === "attention" && "text-attention",
              )}
            >
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
