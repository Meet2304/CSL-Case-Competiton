"use client";

import { useId, useState } from "react";
import { ArrowRight, Plus, ShieldCheck, Users } from "lucide-react";
import { FacetBackdrop } from "@/components/brand/FacetBackdrop";
import { useViewer } from "@/components/customer/Viewer";
import { MockBadge } from "@/components/mock/Mock";
import { useHash } from "@/components/shared/useHashTab";
import { Money } from "@/components/ui/Money";
import type { StoredFamily } from "@/data/household";
import { cn, formatDate } from "@/lib/format";
import { familiesOf, familySummary, firstName, personById } from "@/lib/household";
import { householdActions } from "@/lib/householdStore";
import { FamilyDetail } from "./FamilyDetail";
import { FamilyProvider } from "./FamilyProvider";
import {
  AvatarStack,
  FamilyEmblem,
  fieldInput,
  fieldLabel,
  primaryButton,
  secondaryButton,
  withArticle,
} from "./parts";

/**
 * Every family the signed-in person belongs to, as cards with what matters at
 * a glance. Opening one shows its assets in the person's role (the hash holds
 * which, e.g. /family#fam-sample, so Back returns to the cards).
 */
export function FamilyHub() {
  const { person, isMinor, household } = useViewer();
  const families = familiesOf(household, person.id);
  const [hash, setHash] = useHash();
  const [creating, setCreating] = useState(false);
  const current = families.find((f) => f.id === hash);

  if (current)
    return (
      <div className="@container">
        <FamilyProvider key={current.id} familyId={current.id}>
          <FamilyDetail onBack={() => setHash(null)} />
        </FamilyProvider>
      </div>
    );

  return (
    <div className="@container space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-pnc-ink">Your families</h2>
          <MockBadge />
        </div>
      </div>

      {creating && (
        <CreateFamily
          defaultName={families.length ? "" : `${person.name.split(" ").at(-1)} Family`}
          onCancel={() => setCreating(false)}
          onCreate={(name) => {
            const id = householdActions.createFamily(name, person.id);
            setCreating(false);
            setHash(id);
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
        <ul className="grid gap-5 @3xl:grid-cols-2">
          {families.map((f) => (
            <li key={f.id}>
              <FamilyCard family={f} />
            </li>
          ))}
          {!isMinor && !creating && (
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pnc-line p-6 text-center hover:border-pnc-link hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link"
              >
                <span className="grid size-11 place-items-center rounded-full bg-pnc-blue-50 text-pnc-blue-700">
                  <Plus className="size-5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-pnc-ink">Create another family</span>
                <span className="max-w-xs text-sm text-pnc-muted">
                  For example, with your parents or siblings. You&apos;ll be its admin.
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** One family as a card: who's in it, your role, and what's shared, at a glance. */
function FamilyCard({ family: f }: { family: StoredFamily }) {
  const { person, accounts, deceasedIds } = useViewer();
  const s = familySummary(f, person.id, accounts, deceasedIds);
  const indexOf = (id: string) => s.state.members.findIndex((m) => m.id === id);
  const creator =
    f.createdBy === person.id ? "you" : firstName(personById(f.createdBy)?.name ?? "family");
  // One line on what deserves a look; admins also hear about pending invites.
  const note = s.deceased.length
    ? `Remembering ${s.deceased.map((m) => firstName(m.name)).join(" and ")}`
    : s.isAdmin && s.invited.length
      ? `${s.invited.map((m) => firstName(m.name)).join(" and ")} ${s.invited.length === 1 ? "hasn't" : "haven't"} accepted the invite yet`
      : undefined;

  return (
    // A plain hash link: the browser records it in history, so Back returns here.
    <a
      href={`#${f.id}`}
      className="group block h-full overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-transparent transition hover:-translate-y-0.5 hover:shadow-raised hover:ring-pnc-link/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pnc-link motion-reduce:hover:translate-y-0"
    >
      <div className="relative isolate px-5 pb-5 pt-5 text-white">
        <FacetBackdrop className="-z-10" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FamilyEmblem name={f.familyName} size="lg" />
            <div className="min-w-0">
              <h3 className="truncate font-display text-xl font-medium">{f.familyName}</h3>
              <p className="text-sm text-white/80">
                Created by {creator} · {formatDate(f.createdOn, "medium")}
              </p>
            </div>
          </div>
          {s.role && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/30">
              {s.isAdmin && <ShieldCheck className="size-3.5" aria-hidden="true" />}
              {s.role.name}
            </span>
          )}
        </div>
        {/* On white, so every avatar tone stays legible over the blue. */}
        <div className="mt-4 inline-flex rounded-full bg-white p-1">
          <AvatarStack members={s.living} indexOf={(m) => indexOf(m.id)} />
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-pnc-line border-b border-pnc-line">
        <div className="px-4 py-3.5">
          <dt className="text-xs text-pnc-muted">Members</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-pnc-ink">
            {s.living.length}
          </dd>
        </div>
        <div className="px-4 py-3.5">
          <dt className="text-xs text-pnc-muted">
            {s.isAdmin ? "Accounts shared" : "Shared with you"}
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-pnc-ink">
            {s.visible.length}
          </dd>
        </div>
        <div className="px-4 py-3.5">
          <dt className="text-xs text-pnc-muted">{s.isAdmin ? "Total value" : "Their value"}</dt>
          <dd className="mt-0.5 text-lg font-semibold text-pnc-ink">
            <Money value={s.total} compact />
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
        <span className="min-w-0 truncate text-pnc-muted">
          {note ??
            (s.isAdmin
              ? `${plural(s.yours, "account")} of yours shared`
              : `You're ${withArticle(s.role?.name ?? "member")}`)}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-pnc-link group-hover:underline">
          Open <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </a>
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
