import { CalendarClock, HeartCrack, Landmark, Users, type LucideIcon } from "lucide-react";
import { Money } from "@/components/ui/Money";
import { cn } from "@/lib/format";
import type { advisorStats } from "@/lib/advisor";

type Stats = ReturnType<typeof advisorStats>;

/** Four headline tiles above the advisor's customer table. */
export function AdvisorStats({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "attention" }[] = [
    { label: "Customers", value: stats.customers, icon: Users },
    {
      label: "Need attention",
      value: stats.needAttention,
      icon: HeartCrack,
      tone: stats.needAttention > 0 ? "attention" : undefined,
    },
    {
      label: "Total relationship value",
      value: <Money value={stats.totalValue} compact />,
      icon: Landmark,
    },
    { label: "Reviews in next 30 days", value: stats.reviewsNext30Days, icon: CalendarClock },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, tone }) => (
        // Every tile shares one card and icon style; only the number carries the attention color.
        <div
          key={label}
          className="flex items-center gap-3 rounded-md bg-white px-4 py-3.5 shadow-card"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs text-pnc-muted">{label}</dt>
            <dd
              className={cn(
                "text-xl font-semibold tabular-nums",
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
