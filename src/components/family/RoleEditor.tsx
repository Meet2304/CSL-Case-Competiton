"use client";

import { useId, useState } from "react";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import { NO_ACCESS } from "@/data/family";
import type { AssetAccess, FamilyRole } from "@/data/types";
import { isLocked } from "@/lib/family";
import { cn } from "@/lib/format";
import { AccessMatrix } from "./AccessMatrix";
import { useFamily } from "./FamilyProvider";
import { fieldInput, fieldLabel, linkButton, primaryButton, secondaryButton } from "./parts";

const DESCRIPTION_MAX = 500;

/**
 * Create or edit a family role: name, description and per-asset visibility
 * and control. The built-in Admin role is shown read-only.
 */
export function RoleEditor({ role, onDone }: { role: FamilyRole | null; onDone: () => void }) {
  const { state, dispatch } = useFamily();
  const id = useId();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [access, setAccess] = useState<Record<string, AssetAccess>>(role?.access ?? {});
  const [submitted, setSubmitted] = useState(false);

  const readOnly = role?.isAdmin === true;
  const membersWithRole = role ? state.members.filter((m) => m.roleId === role.id) : [];
  const trimmed = name.trim();
  const nameError = !trimmed
    ? "Enter a role name."
    : state.roles.some((r) => r.id !== role?.id && r.name.toLowerCase() === trimmed.toLowerCase())
      ? "A role with this name already exists."
      : null;
  const lockedIds = new Set(state.assets.filter((a) => isLocked(state, a.id)).map((a) => a.id));

  function save() {
    setSubmitted(true);
    if (nameError) return;
    dispatch({
      type: "saveRole",
      role: {
        id: role?.id ?? "",
        name: trimmed,
        description: description.trim(),
        isAdmin: false,
        builtIn: false,
        access,
      },
    });
    onDone();
  }

  return (
    <div>
      <button type="button" onClick={onDone} className={linkButton}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All roles
      </button>
      <h3 className="mt-3 text-xl font-semibold text-pnc-ink">
        {readOnly ? "Admin role" : role ? `Edit role · ${role.name}` : "New role"}
      </h3>
      <ol className="mt-1 flex items-center gap-2 text-sm text-pnc-muted" aria-label="Steps">
        <li className="font-semibold text-pnc-ink">General</li>
        <li aria-hidden="true">›</li>
        <li className="font-semibold text-pnc-ink">Segmented access control</li>
      </ol>

      {readOnly ? (
        <div className="mt-5 flex gap-3 rounded-md bg-pnc-blue-50 p-4 text-sm text-pnc-ink">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-pnc-blue-700" aria-hidden="true" />
          <div>
            <p className="font-semibold">Admins have full access to every asset.</p>
            <p className="mt-1 text-pnc-muted">
              They can add family members and assets, and decide what every other role can see and
              control. More than one admin is allowed. Assign this role from the Members tab.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid max-w-2xl gap-4">
          <div>
            <label htmlFor={`${id}-name`} className={fieldLabel}>
              Role name <span className="text-pnc-negative">*</span>
            </label>
            <input
              id={`${id}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College student"
              maxLength={60}
              aria-invalid={submitted && nameError ? true : undefined}
              aria-describedby={submitted && nameError ? `${id}-name-error` : undefined}
              className={fieldInput}
            />
            {submitted && nameError && (
              <p id={`${id}-name-error`} className="mt-1 text-xs text-pnc-negative">
                {nameError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-description`} className={fieldLabel}>
              Description
            </label>
            <textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
              rows={3}
              placeholder="What is this role for?"
              className={cn(fieldInput, "resize-y")}
            />
            <p className="mt-1 text-right text-xs text-pnc-muted">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </div>
        </div>
      )}

      <h4 className="mt-6 text-base font-semibold text-pnc-ink">Segmented access control</h4>
      <p className="mb-3 mt-0.5 text-sm text-pnc-muted">
        <strong className="font-semibold text-pnc-ink">Visibility</strong> decides what this role
        can see. <strong className="font-semibold text-pnc-ink">Control</strong> decides what it can
        do. Any permission includes viewing the balance.
      </p>
      <AccessMatrix
        assets={state.assets}
        value={(assetId) =>
          readOnly
            ? { view: true, activity: true, transact: true, manage: true }
            : (access[assetId] ?? NO_ACCESS)
        }
        onChange={(assetId, next) => setAccess((prev) => ({ ...prev, [assetId]: next }))}
        readOnly={readOnly}
        lockedIds={lockedIds}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-pnc-line pt-4">
        {!readOnly && (
          <button type="button" onClick={save} className={primaryButton}>
            {role ? "Save changes" : "Create role"}
          </button>
        )}
        <button type="button" onClick={onDone} className={secondaryButton}>
          {readOnly ? "Back" : "Cancel"}
        </button>
        {role && !role.builtIn && (
          <button
            type="button"
            disabled={membersWithRole.length > 0}
            onClick={() => {
              dispatch({ type: "deleteRole", roleId: role.id });
              onDone();
            }}
            title={membersWithRole.length > 0 ? "Move members to another role first" : undefined}
            className={cn(linkButton, "ml-auto text-pnc-negative")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {membersWithRole.length > 0 ? `In use by ${membersWithRole.length}` : "Delete role"}
          </button>
        )}
      </div>
    </div>
  );
}
