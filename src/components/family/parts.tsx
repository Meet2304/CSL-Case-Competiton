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

export function Avatar({ member, index = 0, size = "md" }: { member: FamilyMember; index?: number; size?: "sm" | "md" }) {
  return (
    <span
      title={member.name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        size === "sm" ? "size-7 text-[11px] ring-2 ring-white" : "size-10 text-sm",
        member.status === "Deceased" ? "bg-pnc-chip text-pnc-muted" : avatarTones[index % avatarTones.length],
      )}
    >
      {initials(member.name)}
    </span>
  );
}

/** Overlapping avatars, e.g. "who can see this asset". */
export function AvatarStack({ members, indexOf }: { members: FamilyMember[]; indexOf: (m: FamilyMember) => number }) {
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
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", statusStyles[status])}>
      {status === "Invited" ? "Invite sent" : status}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "attention" }) {
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

export const fieldLabel = "block text-sm font-semibold text-pnc-ink";
export const fieldInput =
  "mt-1 w-full rounded-md border border-pnc-line bg-white px-3 py-2.5 text-sm outline-none focus:border-pnc-link focus:ring-2 focus:ring-pnc-link/15 aria-invalid:border-pnc-negative";
export const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-pnc-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pnc-blue-800 disabled:opacity-50";
export const secondaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-pnc-line bg-white px-5 py-2.5 text-sm font-semibold text-pnc-ink hover:border-pnc-link hover:text-pnc-link";
export const linkButton = "inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline disabled:text-pnc-muted disabled:no-underline";
