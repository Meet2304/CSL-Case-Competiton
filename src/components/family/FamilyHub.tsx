"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Plus, Users } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { cn, formatDate } from "@/lib/format";
import { familiesOf, firstName, personById, roleName } from "@/lib/household";
import { householdActions } from "@/lib/householdStore";
import { FamilyDashboard } from "./FamilyDashboard";
import { FamilyProvider } from "./FamilyProvider";
import { fieldInput, fieldLabel, primaryButton, secondaryButton } from "./parts";

/**
 * Every family the signed-in person belongs to, and the way to create one.
 * A family is a group of people you trust with access to your finances; the
 * dashboard below decides who sees and controls what.
 */
export function FamilyHub() {
  const { person, isMinor, household } = useViewer();
  const families = familiesOf(household, person.id);
  const [picked, setPicked] = useState<string>();
  const [creating, setCreating] = useState(false);
  const baseId = useId();
  const current = families.find((f) => f.id === picked) ?? families[0];

  function onKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = families.length;
    const next = families[(index + (e.key === "ArrowRight" ? 1 : n - 1)) % n];
    setPicked(next.id);
    document.getElementById(`${baseId}-${next.id}`)?.focus();
  }

  return (
    <div className="@container space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">Your families</h2>
          <MockBadge />
        </div>
        {!isMinor && !creating && (
          <button type="button" onClick={() => setCreating(true)} className={secondaryButton}>
            <Plus className="size-4" aria-hidden="true" /> Create a family
          </button>
        )}
      </div>

      {creating && (
        <CreateFamily
          defaultName={families.length ? "" : `${person.name.split(" ").at(-1)} Family`}
          onCancel={() => setCreating(false)}
          onCreate={(name) => {
            setPicked(householdActions.createFamily(name, person.id));
            setCreating(false);
          }}
        />
      )}

      {families.length === 0 ? (
        !creating && (
          <section className="rounded-lg bg-white p-6 text-center shadow-card">
            <Users className="mx-auto size-8 text-pnc-blue-700" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-pnc-ink">You&apos;re not in a family yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-pnc-muted">
              A family is a group of people you trust with access to your finances. You decide what
              each person can see and do, and it keeps working if something happens to you.
            </p>
            {isMinor ? (
              <p className="mt-3 text-sm text-pnc-muted">
                You can create one when you turn 18. Until then, a parent can add you to theirs.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={cn(primaryButton, "mt-4")}
              >
                <Plus className="size-4" aria-hidden="true" /> Create a family
              </button>
            )}
          </section>
        )
      ) : (
        <>
          {families.length > 1 && (
            <div
              role="tablist"
              aria-label="Your families"
              className="no-scrollbar flex gap-2 overflow-x-auto"
            >
              {families.map((f, i) => {
                const selected = f.id === current.id;
                return (
                  <button
                    key={f.id}
                    id={`${baseId}-${f.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setPicked(f.id)}
                    onKeyDown={(e) => onKey(e, i)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link",
                      selected
                        ? "bg-pnc-ink text-white ring-pnc-ink"
                        : "bg-white text-pnc-ink ring-pnc-line hover:ring-pnc-muted",
                    )}
                  >
                    {f.familyName}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <h3 className="font-display text-xl font-medium text-pnc-ink">{current.familyName}</h3>
            <p className="mt-0.5 text-sm text-pnc-muted">
              Created by{" "}
              {current.createdBy === person.id
                ? "you"
                : firstName(personById(current.createdBy)?.name ?? "a family member")}{" "}
              on {formatDate(current.createdOn, "medium")} · You&apos;re{" "}
              {/^[AEIOU]/.test(roleName(current, person.id) ?? "") ? "an" : "a"}{" "}
              {roleName(current, person.id)}
            </p>
          </div>
          <FamilyProvider key={current.id} familyId={current.id}>
            <FamilyDashboard />
          </FamilyProvider>
        </>
      )}
    </div>
  );
}

function CreateFamily({
  defaultName,
  onCancel,
  onCreate,
}: {
  defaultName: string;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const id = useId();
  const [name, setName] = useState(defaultName);
  const [tried, setTried] = useState(false);
  const error = !name.trim() ? "Give your family a name." : null;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!error) onCreate(name);
      }}
      className="rounded-lg bg-white p-5 shadow-card"
      aria-labelledby={`${id}-title`}
    >
      <h3 id={`${id}-title`} className="font-semibold text-pnc-ink">
        Create a family
      </h3>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-pnc-muted">
        You&apos;ll be its admin. Next you can add people, share your accounts and choose what each
        role can see and do.
      </p>
      <div className="mt-4 max-w-sm">
        <label htmlFor={`${id}-name`} className={fieldLabel}>
          Family name
        </label>
        <input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="e.g. Sample Family"
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
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" className={primaryButton}>
          Create family
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
