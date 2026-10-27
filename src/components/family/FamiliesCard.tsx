"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, ChevronDown, Plus, ShieldCheck, Users } from "lucide-react";
import { useViewer } from "@/components/customer/Viewer";
import { Money } from "@/components/ui/Money";
import type { StoredFamily } from "@/data/household";
import { roleById } from "@/lib/family";
import { cn, formatDate } from "@/lib/format";
import { familiesOf, familySummary, firstName, personById } from "@/lib/household";
import { routes } from "@/lib/routes";
import { AvatarStack, FamilyEmblem, Pill, StatusBadge } from "./parts";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * "Your families" on the home page: one row per family with the viewer's
 * role and the essentials; a row expands to members, role and accounts.
 * Non-admins see only what their role shows them — never other members'
 * roles or anything hidden from them.
 */
export function FamiliesCard() {
  const { person, isMinor, household } = useViewer();
  const families = familiesOf(household, person.id);

  return (
    <section
      aria-labelledby="families-card-title"
      className="@container rounded-lg bg-white shadow-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-pnc-line px-5 py-4">
        <h2 id="families-card-title" className="flex items-center gap-2 font-semibold text-pnc-ink">
          <Users className="size-4.5 text-pnc-blue-700" aria-hidden="true" /> Your families
        </h2>
        <Link
          href={routes.family}
          className="inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline"
        >
          {families.length ? "All families" : "Learn more"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>

      {families.length === 0 ? (
        <div className="flex flex-wrap items-center gap-4 px-5 py-5">
          <p className="min-w-0 flex-1 basis-64 text-sm leading-relaxed text-pnc-muted">
            A family is a group of people you trust with access to your finances. You choose what
            each person can see and do.
            {isMinor && " You can create one when you turn 18."}
          </p>
          {!isMinor && (
            <Link
              href={routes.family}
              className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800"
            >
              <Plus className="size-4" aria-hidden="true" /> Create a family
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-pnc-line">
          {families.map((f) => (
            <FamilyRow key={f.id} family={f} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FamilyRow({ family: f }: { family: StoredFamily }) {
  const { person, accounts, deceasedIds } = useViewer();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const s = familySummary(f, person.id, accounts, deceasedIds);
  const indexOf = (id: string) => s.state.members.findIndex((m) => m.id === id);
  const creator =
    f.createdBy === person.id ? "you" : firstName(personById(f.createdBy)?.name ?? "family");

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 text-left hover:bg-pnc-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pnc-link"
      >
        <span className="flex min-w-0 flex-1 basis-64 items-center gap-3">
          <FamilyEmblem name={f.familyName} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-pnc-ink">{f.familyName}</span>
              {s.role && (
                <Pill tone={s.isAdmin ? "blue" : "neutral"}>
                  {s.isAdmin && <ShieldCheck className="size-3" aria-hidden="true" />}
                  {s.role.name}
                </Pill>
              )}
            </span>
            <span className="mt-0.5 block text-sm text-pnc-muted">
              {plural(s.living.length, "member")} ·{" "}
              {s.isAdmin
                ? `${plural(s.visible.length, "account")} shared`
                : `${plural(s.visible.length, "account")} you can see`}
            </span>
          </span>
        </span>

        <span className="flex items-center gap-4">
          <AvatarStack members={s.living} indexOf={(m) => indexOf(m.id)} />
          {s.visible.length > 0 && (
            <span className="hidden text-right @xl:block">
              <Money value={s.total} compact className="block font-semibold text-pnc-ink" />
              <span className="block text-xs text-pnc-muted">
                {s.isAdmin ? "shared in total" : "you can see"}
              </span>
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-pnc-link transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="sr-only">{open ? "Hide details" : "Show details"}</span>
        </span>
      </button>

      <div id={panelId} hidden={!open} className="border-t border-pnc-line bg-pnc-surface/50">
        <div className="grid gap-5 px-5 py-4 @3xl:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold text-pnc-muted">Your role</h3>
            <p className="mt-1 font-semibold text-pnc-ink">{s.role?.name}</p>
            {s.isAdmin && s.role && (
              <p className="mt-0.5 text-sm leading-relaxed text-pnc-muted">{s.role.description}</p>
            )}
            <p className="mt-2 text-xs text-pnc-muted">
              Created by {creator} on {formatDate(f.createdOn, "medium")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-pnc-muted">Members</h3>
            <ul className="mt-1.5 space-y-1.5">
              {s.state.members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium text-pnc-ink">
                    {m.id === person.id ? "You" : m.name}
                  </span>
                  {/* Other members' roles are confidential to admins. */}
                  {s.isAdmin && m.id !== person.id && (
                    <span className="text-pnc-muted">· {roleById(s.state, m.roleId)?.name}</span>
                  )}
                  {m.status !== "Active" && <StatusBadge status={m.status} />}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-pnc-muted">
              {s.isAdmin ? "Shared accounts" : "Shared with you"}
            </h3>
            {s.visible.length === 0 ? (
              <p className="mt-1 text-sm text-pnc-muted">
                {s.isAdmin
                  ? "Nothing shared yet."
                  : "Accounts your family shares will appear here."}
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {s.visible.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-pnc-ink">
                      {a.name}
                      {a.last4 && <span className="text-pnc-muted"> x{a.last4}</span>}
                    </span>
                    <Money value={a.value} compact className="shrink-0 font-semibold" />
                  </li>
                ))}
                {s.visible.length > 4 && (
                  <li className="text-sm text-pnc-muted">and {s.visible.length - 4} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-pnc-line px-5 py-3">
          <Link
            href={routes.familyDetail(f.id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-pnc-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pnc-blue-800"
          >
            Open {f.familyName} <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          {s.isAdmin && s.invited.length > 0 && (
            <span className="text-sm text-pnc-muted">
              {plural(s.invited.length, "invite")} waiting to be accepted
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
