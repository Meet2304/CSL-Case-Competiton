"use client";

import { useId, type KeyboardEvent } from "react";
import { tabButton } from "@/components/advisor/assistant/parts";
import { Dialog } from "@/components/ui/Dialog";
import { useFamily } from "./FamilyProvider";
import { MembersPanel } from "./MembersPanel";
import { RolesPanel } from "./RolesPanel";

export const manageTabs = [
  { id: "members", label: "Members" },
  { id: "roles", label: "Roles & access" },
] as const;
export type ManageTab = (typeof manageTabs)[number]["id"];

/**
 * Everything an admin can change about a family, in one panel: who's in it
 * and their role, and what each role can see. Only rendered for admins.
 */
export function ManageFamily({
  tab,
  onTab,
  onClose,
}: {
  /** The open tab, or null when the panel is closed. */
  tab: ManageTab | null;
  onTab: (tab: ManageTab) => void;
  onClose: () => void;
}) {
  const { state } = useFamily();
  const baseId = useId();
  const current = tab ?? "members";

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = manageTabs.length;
    const next = manageTabs[(index + (e.key === "ArrowRight" ? 1 : n - 1)) % n];
    onTab(next.id);
    document.getElementById(`${baseId}-${next.id}`)?.focus();
  }

  return (
    <Dialog
      open={tab !== null}
      onClose={onClose}
      side="right"
      title={`Manage ${state.familyName}`}
      description="Only admins can see or change these settings."
    >
      <div
        role="tablist"
        aria-label="Manage family"
        className="no-scrollbar sticky top-0 z-10 flex overflow-x-auto border-b border-pnc-line bg-white px-3"
      >
        {manageTabs.map((t, i) => (
          <button
            key={t.id}
            id={`${baseId}-${t.id}`}
            type="button"
            role="tab"
            aria-selected={current === t.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={current === t.id ? 0 : -1}
            onClick={() => onTab(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={tabButton(current === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${current}`}
        className="@container p-5"
      >
        {current === "members" && <MembersPanel />}
        {current === "roles" && <RolesPanel />}
      </div>
    </Dialog>
  );
}
