import type { InputHTMLAttributes, ReactNode } from "react";
import type { FamilyMember, FamilyMemberStatus } from "@/data/types";
import { initials } from "@/lib/family";
import { cn } from "@/lib/format";

// Small building blocks shared by the family dashboard panels.

const avatarTones = [
  "bg-pnc-blue-50 text-pnc-blue-800",
  "bg-pnc-orange/10 text-pnc-orange-600",
  "bg-pnc-chip text-pnc-ink",
  "bg-pnc-positive-bg text-pnc-positive",
];

export function Avatar({
  member,
  index = 0,
  size = "md",
}: {
  member: FamilyMember;
  index?: number;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={member.name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        size === "sm" ? "size-7 text-[11px] ring-2 ring-white" : "size-10 text-sm",
        member.status === "Deceased"
          ? "bg-pnc-chip text-pnc-muted"
          : avatarTones[index % avatarTones.length],
      )}
    >
      {initials(member.name)}
    </span>
  );
}

/** Overlapping avatars, e.g. "who can see this asset". */
export function AvatarStack({
  members,
  indexOf,
}: {
  members: FamilyMember[];
  indexOf: (m: FamilyMember) => number;
}) {
  if (members.length === 0) return <span className="text-xs text-pnc-muted">No one</span>;
  return (
    <span className="flex -space-x-1.5" aria-label={members.map((m) => m.name).join(", ")}>
      {members.map((m) => (
        <Avatar key={m.id} member={m} index={indexOf(m)} size="sm" />
      ))}
    </span>
  );
}

const statusStyles: Record<FamilyMemberStatus, string> = {
  Active: "bg-pnc-positive-bg text-pnc-positive",
  Invited: "bg-pnc-blue-50 text-pnc-blue-800",
  Deceased: "bg-pnc-chip text-pnc-muted",
};

export function StatusBadge({ status }: { status: FamilyMemberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {status === "Invited" ? "Invite sent" : status}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "attention";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-pnc-chip text-pnc-ink",
        tone === "blue" && "bg-pnc-blue-50 text-pnc-blue-800",
        tone === "attention" && "bg-attention-bg text-attention",
      )}
    >
      {children}
    </span>
  );
}

/** Native checkbox in PNC blue; keeps keyboard and screen-reader behavior. */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cn(
        "size-4 cursor-pointer accent-pnc-blue-700 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    />
  );
}

/**
 * The top of each Manage family tab: what the tab is for, with its main
 * action on the right (below it in narrow panels). Every tab uses it, so the
 * action is always in the same place.
 */
export function PanelIntro({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 @lg:flex-row @lg:items-center @lg:justify-between @lg:gap-6">
      <p className="max-w-xl text-sm text-pnc-muted">{children}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** The bordered list every Manage family tab uses for its rows. */
export const panelList = "mt-4 divide-y divide-pnc-line rounded-md border border-pnc-line";
/** One row of a `panelList`. */
export const panelRow = "px-4 py-3.5";

export const fieldLabel = "block text-sm font-semibold text-pnc-ink";
export const fieldInput =
  "mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15 aria-invalid:border-pnc-negative";
export const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 disabled:opacity-50";
export const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-pnc-line bg-white px-5 py-2.5 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link";
export const linkButton =
  "inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline disabled:text-pnc-muted disabled:no-underline";

/** A family's emblem: its initials on a faceted blue tile. */
export function FamilyEmblem({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-135 from-pnc-blue-700 to-pnc-blue-950 font-display font-semibold text-white",
        size === "lg" ? "size-14 text-lg" : "size-11 text-sm",
      )}
    >
      <span className="absolute -right-3 -top-3 size-8 rotate-45 bg-white/10" />
      <span className="absolute -bottom-4 -left-2 size-8 rotate-12 bg-pnc-orange/40" />
      <span className="relative">{initials(name.replace(/\s+family$/i, "") || name)}</span>
    </span>
  );
}

/** "an Admin", "a Trusted advisor". */
export const withArticle = (role: string) => `${/^[AEIOU]/i.test(role) ? "an" : "a"} ${role}`;
