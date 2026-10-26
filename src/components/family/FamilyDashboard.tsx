"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Landmark, MailOpen, RotateCcw, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import { isAdminMember, memberById } from "@/lib/family";
import { cn } from "@/lib/format";
import { useFamily } from "./FamilyProvider";
import { MemberFamilyView } from "./MemberFamilyView";
import { MembersPanel } from "./MembersPanel";
import { OverviewPanel } from "./OverviewPanel";
import { RolesPanel } from "./RolesPanel";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "roles", label: "Roles & access" },
] as const;
type TabId = (typeof tabs)[number]["id"];

/**
 * Customer-side family dashboard: role-based access (who can see and do what)
 * and role-based asset control. Admins get the full dashboard; any other
 * member only sees the assets shared with them (MemberFamilyView), with no
 * hint of what is hidden. Used by both the laptop and phone pages; it adapts
 * with container queries.
 */
export function FamilyDashboard() {
  const { state, reset } = useFamily();
  const [tab, setTab] = useState<TabId>("overview");
  const baseId = useId();

  const self = memberById(state, state.selfId);

  // Access settings are confidential to admins: everyone else gets the member view only.
  if (self && !isAdminMember(state, self)) {
    return (
      <div className="@container">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">{state.familyName}</h2>
          <MockBadge />
        </div>
        <section className="mt-4 rounded-md bg-white p-4 shadow-card @3xl:p-5">
          <MemberFamilyView member={self} />
        </section>
      </div>
    );
  }

  const living = state.members.filter((m) => m.status !== "Deceased");
  const admins = living.filter((m) => isAdminMember(state, m)).length;
  const netValue = state.assets.filter((a) => !a.closed).reduce((sum, a) => sum + a.value, 0);
  const invited = living.filter((m) => m.status === "Invited").length;

  const stats: { label: string; value: React.ReactNode; icon: LucideIcon }[] = [
    { label: "Family members", value: living.length, icon: Users },
    { label: "Admins", value: admins, icon: ShieldCheck },
    { label: "Net assets", value: <Money value={netValue} compact />, icon: Landmark },
    { label: "Invites pending", value: invited, icon: MailOpen },
  ];

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setTab(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div className="@container">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">{state.familyName}</h2>
          <MockBadge />
        </div>
        <button
          type="button"
          onClick={reset}
          title="Restore the original demo family"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-pnc-muted hover:text-pnc-link"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Reset demo
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-card"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
              <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="truncate text-xs text-pnc-muted">{label}</dt>
              <dd className="text-xl font-semibold tabular-nums text-pnc-ink">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <section className="mt-6 rounded-md bg-white shadow-card">
        <div
          role="tablist"
          aria-label="Family dashboard"
          className="no-scrollbar flex overflow-x-auto border-b border-pnc-line px-2"
        >
          {tabs.map((t, i) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                id={`${baseId}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors",
                  selected
                    ? "text-pnc-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:bg-pnc-orange"
                    : "text-pnc-muted hover:text-pnc-ink",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="p-4 @3xl:p-5"
        >
          {tab === "overview" && <OverviewPanel />}
          {tab === "members" && <MembersPanel />}
          {tab === "roles" && <RolesPanel />}
        </div>
      </section>
    </div>
  );
}
