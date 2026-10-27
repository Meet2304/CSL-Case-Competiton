"use client";

import { useId, useState } from "react";
import { ArrowLeft, Info, Trash2, UserPlus } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { people } from "@/data/household";
import type { FamilyMemberRelationship } from "@/data/types";
import { isAdminMember, livingAdmins, relationships, roleById } from "@/lib/family";
import { relationshipTo } from "@/lib/household";
import { cn } from "@/lib/format";
import { useFamily } from "./FamilyProvider";
import {
  Avatar,
  fieldInput,
  fieldLabel,
  linkButton,
  PanelIntro,
  panelList,
  panelRow,
  primaryButton,
  secondaryButton,
  StatusBadge,
} from "./parts";

/** Family members: add, assign roles, remove. */
export function MembersPanel() {
  const { state, dispatch } = useFamily();
  const [adding, setAdding] = useState(false);

  if (adding) return <AddMemberForm onDone={() => setAdding(false)} />;

  const adminCount = livingAdmins(state).length;

  return (
    <div>
      <PanelIntro
        action={
          <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
            <UserPlus className="size-4" aria-hidden="true" /> Add member
          </button>
        }
      >
        Admins add people to the family and choose their role. You can have more than one admin.
      </PanelIntro>

      <ul className={panelList}>
        {state.members.map((m, index) => {
          const isSelf = m.id === state.selfId;
          const deceased = m.status === "Deceased";
          const lastAdmin = isAdminMember(state, m) && adminCount <= 1;
          // You can't remove your own admin access, and the family always keeps one admin.
          const keepAdmin = lastAdmin || (isSelf && isAdminMember(state, m));
          return (
            <li key={m.id} className={cn(panelRow, deceased && "bg-pnc-surface/60")}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                  <Avatar member={m} index={index} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-semibold",
                          deceased ? "text-pnc-muted" : "text-pnc-ink",
                        )}
                      >
                        {m.name}
                      </span>
                      {isSelf && <span className="text-xs text-pnc-muted">(you)</span>}
                      <StatusBadge status={m.status} />
                    </span>
                    <span className="block truncate text-xs text-pnc-muted">
                      {m.relationship}
                      {m.note ? ` · ${m.note}` : ""} · {m.email}
                    </span>
                  </span>
                </span>

                <label className="flex items-center gap-2 text-sm">
                  <span className="sr-only">Role for {m.name}</span>
                  <select
                    value={m.roleId}
                    disabled={deceased}
                    onChange={(e) =>
                      dispatch({ type: "setMemberRole", memberId: m.id, roleId: e.target.value })
                    }
                    className="rounded-md border border-pnc-line bg-white px-2.5 py-1.5 text-sm text-pnc-ink outline-none focus:border-pnc-link disabled:bg-pnc-surface disabled:text-pnc-muted"
                  >
                    {state.roles.map((r) => (
                      <option key={r.id} value={r.id} disabled={keepAdmin && !r.isAdmin}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>

                {isSelf || deceased ? (
                  // Keeps every row's role picker lined up.
                  <span className="size-8" aria-hidden="true" />
                ) : (
                  <button
                    type="button"
                    disabled={lastAdmin}
                    onClick={() => dispatch({ type: "removeMember", memberId: m.id })}
                    title={lastAdmin ? "Add another admin first" : `Remove ${m.name}`}
                    aria-label={`Remove ${m.name}`}
                    className="grid size-8 place-items-center rounded-full text-pnc-muted hover:bg-pnc-surface hover:text-pnc-negative disabled:opacity-40"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddMemberForm({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useFamily();
  const { person } = useViewer();
  const id = useId();
  // People PNC already knows in the household, who aren't in this family yet.
  const known = people.filter((p) => !state.members.some((m) => m.id === p.id));
  const firstCustomRole = state.roles.find((r) => !r.isAdmin) ?? state.roles[0];
  const [form, setForm] = useState({
    name: "",
    email: "",
    relationship: "Child" as FamilyMemberRelationship,
    note: "",
    roleId: firstCustomRole.id,
  });
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: form.name.trim() ? null : "Enter their full name.",
    email: !form.email.trim()
      ? "Enter an email address for the invitation."
      : !/^\S+@\S+\.\S+$/.test(form.email.trim())
        ? "Enter a valid email address."
        : state.members.some((m) => m.email.toLowerCase() === form.email.trim().toLowerCase())
          ? "Someone in the family already uses this email."
          : null,
  };
  const role = roleById(state, form.roleId);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.email) return;
    // Someone who already banks with us is linked to their own login.
    const match = people.find((p) => p.email.toLowerCase() === form.email.trim().toLowerCase());
    dispatch({
      type: "addMember",
      member: {
        id: match?.id,
        status: match?.login ? "Active" : undefined,
        name: form.name.trim(),
        email: form.email.trim(),
        relationship: form.relationship,
        note: form.note.trim() || undefined,
        roleId: form.roleId,
      },
    });
    onDone();
  }

  function addKnown(p: (typeof people)[number]) {
    dispatch({
      type: "addMember",
      member: {
        id: p.id,
        status: p.login ? "Active" : undefined,
        name: p.name,
        email: p.email,
        relationship: relationshipTo(person, p) === "Self" ? "Other" : relationshipTo(person, p),
        note: p.note,
        roleId: form.roleId,
      },
    });
    onDone();
  }

  const error = (key: "name" | "email") =>
    submitted && errors[key] ? (
      <p id={`${id}-${key}-error`} className="mt-1 text-xs text-pnc-negative">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" onClick={onDone} className={linkButton}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All members
      </button>
      <h3 className="mt-3 text-xl font-semibold text-pnc-ink">Add family member</h3>

      <div className="mt-4 max-w-2xl">
        <label htmlFor={`${id}-role`} className={fieldLabel}>
          Their role
        </label>
        <select
          id={`${id}-role`}
          value={form.roleId}
          onChange={(e) => set("roleId", e.target.value)}
          className={fieldInput}
        >
          {state.roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {role && (
          <p className="mt-2 flex gap-2 rounded-md bg-pnc-surface px-3 py-2 text-xs text-pnc-muted">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {role.description || "No description for this role."} Change what each role can see and
            do in Roles &amp; access.
          </p>
        )}
      </div>

      {known.length > 0 && (
        <section aria-labelledby={`${id}-known`} className="mt-5 max-w-2xl">
          <h4 id={`${id}-known`} className="text-sm font-semibold text-pnc-ink">
            From your household
          </h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {known.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addKnown(p)}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm ring-1 ring-pnc-line hover:ring-pnc-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
                >
                  <UserPlus className="size-4 text-pnc-blue-700" aria-hidden="true" />
                  {p.name}
                  <span className="text-pnc-muted">{relationshipTo(person, p)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h4 className="mt-6 text-sm font-semibold text-pnc-ink">Or invite someone else</h4>
      <p className="mt-1 text-sm text-pnc-muted">
        They&apos;ll get an email invitation to set up their own sign-on.
      </p>

      <div className="mt-5 grid max-w-2xl gap-4 @xl:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={fieldLabel}>
            Full name <span className="text-pnc-negative">*</span>
          </label>
          <input
            id={`${id}-name`}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="off"
            aria-invalid={submitted && errors.name ? true : undefined}
            aria-describedby={submitted && errors.name ? `${id}-name-error` : undefined}
            className={fieldInput}
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={fieldLabel}>
            Email <span className="text-pnc-negative">*</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="off"
            aria-invalid={submitted && errors.email ? true : undefined}
            aria-describedby={submitted && errors.email ? `${id}-email-error` : undefined}
            className={fieldInput}
          />
          {error("email")}
        </div>
        <div>
          <label htmlFor={`${id}-relationship`} className={fieldLabel}>
            Relationship
          </label>
          <select
            id={`${id}-relationship`}
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value as FamilyMemberRelationship)}
            className={fieldInput}
          >
            {relationships.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-note`} className={fieldLabel}>
            Note <span className="font-normal text-pnc-muted">(optional)</span>
          </label>
          <input
            id={`${id}-note`}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="e.g. Age 17, Financial planner"
            maxLength={40}
            className={fieldInput}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-pnc-line pt-4">
        <button type="submit" className={primaryButton}>
          Send invitation
        </button>
        <button type="button" onClick={onDone} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
