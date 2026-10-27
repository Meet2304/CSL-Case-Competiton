"use client";

import { useState } from "react";
import { ChevronRight, Plus, ShieldCheck, UserRound } from "lucide-react";
import { roleSummary } from "@/lib/family";
import { useFamily } from "./FamilyProvider";
import { PanelIntro, panelList, panelRow, Pill, primaryButton } from "./parts";
import { RoleEditor } from "./RoleEditor";

/** Lists family roles and opens the role editor. */
export function RolesPanel() {
  const { state } = useFamily();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  if (editing) {
    const role = editing === "new" ? null : (state.roles.find((r) => r.id === editing) ?? null);
    return <RoleEditor key={editing} role={role} onDone={() => setEditing(null)} />;
  }

  return (
    <div>
      <PanelIntro
        action={
          <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
            <Plus className="size-4" aria-hidden="true" /> Create role
          </button>
        }
      >
        Roles decide what each family member can{" "}
        <strong className="font-semibold text-pnc-ink">see</strong> and{" "}
        <strong className="font-semibold text-pnc-ink">control</strong>, asset by asset. Admins
        always have full access.
      </PanelIntro>

      <ul className={panelList}>
        {state.roles.map((role) => {
          const summary = roleSummary(state, role);
          const members = state.members.filter(
            (m) => m.roleId === role.id && m.status !== "Deceased",
          );
          return (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => setEditing(role.id)}
                className={`${panelRow} flex w-full items-center gap-3 text-left transition-colors hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
                  {role.isAdmin ? (
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  ) : (
                    <UserRound className="size-5" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-pnc-ink">{role.name}</span>
                    {role.builtIn && <Pill tone="blue">Built-in</Pill>}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-pnc-muted">
                    {role.description || "No description"}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-pnc-muted">
                    <span>
                      {members.length} {members.length === 1 ? "member" : "members"}
                    </span>
                    <span>
                      Sees {summary.sees} of {summary.total} assets
                    </span>
                    <span>Controls {summary.controls}</span>
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-pnc-link" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
