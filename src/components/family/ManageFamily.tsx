"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Check, Eye, EyeOff, Pencil } from "lucide-react";
import { tabButton } from "@/components/advisor/assistant/parts";
import { Dialog } from "@/components/ui/Dialog";
import { firstName } from "@/lib/family";
import { useFamily } from "./FamilyProvider";
import { MemberFamilyView } from "./MemberFamilyView";
import { MembersPanel } from "./MembersPanel";
import {
  fieldInput,
  fieldLabel,
  linkButton,
  PanelIntro,
  primaryButton,
  secondaryButton,
} from "./parts";
import { RolesPanel } from "./RolesPanel";

export const manageTabs = [
  { id: "members", label: "Members" },
  { id: "roles", label: "Roles & access" },
  { id: "visibility", label: "Visibility" },
] as const;
export type ManageTab = (typeof manageTabs)[number]["id"];

/**
 * Everything an admin can change about a family, in one panel: its name, who's
 * in it and their role, what each role can see and do, and a preview of exactly
 * what any member sees. Only rendered for admins.
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
      <RenameFamily />
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
        {current === "visibility" && <VisibilityPanel />}
      </div>
    </Dialog>
  );
}

/** The family's name, with an inline form to rename it. */
function RenameFamily() {
  const { state, dispatch } = useFamily();
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.familyName);
  const [tried, setTried] = useState(false);
  const error = !name.trim() ? "Give your family a name." : null;

  function start() {
    setName(state.familyName);
    setTried(false);
    setEditing(true);
  }

  if (!editing)
    return (
      <div className="flex items-center justify-between gap-3 border-b border-pnc-line px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-xs text-pnc-muted">Family name</p>
          <p className="truncate font-semibold text-pnc-ink">{state.familyName}</p>
        </div>
        <button type="button" onClick={start} className={linkButton}>
          <Pencil className="size-3.5" aria-hidden="true" /> Rename
        </button>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (error) return;
        dispatch({ type: "renameFamily", name });
        setEditing(false);
      }}
      className="border-b border-pnc-line px-5 py-4"
    >
      <label htmlFor={`${id}-name`} className={fieldLabel}>
        Family name
      </label>
      <input
        id={`${id}-name`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        aria-invalid={tried && error ? true : undefined}
        aria-describedby={tried && error ? `${id}-error` : undefined}
        className={fieldInput}
        autoFocus
      />
      {tried && error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-pnc-negative">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="submit" className={primaryButton}>
          <Check className="size-4" aria-hidden="true" /> Save name
        </button>
        <button type="button" onClick={() => setEditing(false)} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** "Preview as": exactly what one member sees, with an admin-only note on why. */
function VisibilityPanel() {
  const { state } = useFamily();
  const others = state.members.filter((m) => m.status !== "Deceased" && m.id !== state.selfId);
  const [previewId, setPreviewId] = useState(others[0]?.id ?? "");
  const selectId = useId();
  const preview = others.find((m) => m.id === previewId);

  const intro = "Preview the family exactly as one member sees it, based on their role.";
  if (!others.length)
    return <PanelIntro>{intro} Add someone to the family to preview their view.</PanelIntro>;

  return (
    <div className="space-y-4">
      <PanelIntro
        action={
          <label htmlFor={selectId} className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-pnc-ink">
              <Eye className="size-4 text-pnc-blue-700" aria-hidden="true" /> Preview as
            </span>
            <select
              id={selectId}
              value={previewId}
              onChange={(e) => setPreviewId(e.target.value)}
              className="rounded-full border border-pnc-line bg-white px-4 py-2.5 text-sm font-semibold text-pnc-ink outline-none focus:border-pnc-link"
            >
              {others.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        }
      >
        {intro}
      </PanelIntro>
      {preview && (
        <>
          {/* Admin-only context. The member's own view below never mentions limits. */}
          <p className="flex gap-2 rounded-md bg-pnc-blue-50 px-3 py-2 text-sm text-pnc-ink">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-pnc-blue-700" aria-hidden="true" />
            <span>
              This is exactly what {firstName(preview.name)} sees. Members are never told which
              accounts or actions are hidden from them.
            </span>
          </p>
          <MemberFamilyView member={preview} />
        </>
      )}
    </div>
  );
}
