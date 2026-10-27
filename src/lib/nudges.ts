/**
 * Planning reminders for one person, from what they own and what's on file:
 * a will, and a beneficiary on every account that can name one. Pure — Home
 * shows these and My Assets resolves them (the will from its ⋮ menu, each
 * beneficiary from that account's Manage panel).
 */
import type { StoredFamily } from "@/data/household";
import type { BankAccount, HouseholdPerson, WillStatus } from "@/data/types";
import { daysBetween, formatCompactMoney, formatDate } from "@/lib/format";
import {
  accountLabel,
  accountsOf,
  ageOn,
  designationTerm,
  firstName,
  personById,
  takesBeneficiary,
} from "@/lib/household";
import { routes } from "@/lib/routes";

export type Nudge = {
  id: string;
  title: string;
  body: string;
  action: { label: string; href: string };
  /** "important" when something would go wrong today; "info" for a heads-up. */
  tone: "important" | "suggested" | "info";
  /** What it's about, so lists can pick an icon. */
  kind: "will" | "beneficiary" | "family" | "birthday";
};

/** ISO date someone born on `birthdate` turns 18. */
function eighteenthBirthday(birthdate: string): string {
  const [y, rest] = [birthdate.slice(0, 4), birthdate.slice(4)];
  return `${Number(y) + 18}${rest}`;
}

export function nudgesFor({
  person,
  accounts,
  deceasedIds,
  will,
  willSectionsDone,
  totalSections,
  today,
}: {
  person: HouseholdPerson;
  accounts: BankAccount[];
  deceasedIds: string[];
  will: WillStatus;
  willSectionsDone: number;
  totalSections: number;
  today: string;
}): Nudge[] {
  if (deceasedIds.includes(person.id)) return [];
  const age = ageOn(person.birthdate, today);
  const out: Nudge[] = [];

  if (age < 18) {
    const birthday = eighteenthBirthday(person.birthdate);
    const own = accountsOf(accounts, person.id).owned.filter((a) => a.custodian);
    const daysAway = daysBetween(today, birthday);
    if (daysAway <= 60 && own.length)
      out.push({
        id: "turning-18",
        title: `You turn 18 on ${formatDate(birthday, "medium")}`,
        body: `${own.map((a) => a.name).join(" and ")} becomes yours alone, and you'll be able to write your own will and choose beneficiaries.`,
        action: { label: "See your accounts", href: routes.assets },
        tone: "info",
        kind: "birthday",
      });
    return out;
  }

  const owned = accountsOf(accounts, person.id).owned.filter(takesBeneficiary);
  for (const a of owned) {
    const gone = (a.beneficiaries ?? []).filter((id) => deceasedIds.includes(id));
    if (gone.length)
      out.push({
        id: `update-${a.id}`,
        title: `Update the beneficiary on ${accountLabel(a)}`,
        body: `It still names ${gone.map((id) => firstName(personById(id)?.name ?? "someone")).join(" and ")}, who has died. Until you change it, ${formatCompactMoney(a.balance)} could go through probate.`,
        action: { label: "Update beneficiary", href: routes.manageAsset(a.id) },
        tone: "important",
        kind: "beneficiary",
      });
  }

  if (will !== "on-file")
    out.push({
      id: "will",
      title: will === "in-progress" ? "Finish your will" : "Write your will",
      body:
        will === "in-progress"
          ? `${willSectionsDone} of ${totalSections} sections done. Your answers are saved.`
          : "Name who inherits, who would raise your children and who carries out your wishes. Free, about 20 minutes.",
      action: {
        label: will === "in-progress" ? "Continue your will" : "Start your will",
        href: routes.will,
      },
      tone: "suggested",
      kind: "will",
    });

  for (const a of owned)
    if ((a.beneficiaries ?? []).length === 0)
      out.push({
        id: `add-${a.id}`,
        title: `Add a beneficiary to ${accountLabel(a)}`,
        body: `Without a ${designationTerm(a)}, ${formatCompactMoney(a.balance)} would go through probate. Naming someone passes it to them directly.`,
        action: { label: "Add beneficiary", href: routes.manageAsset(a.id) },
        tone: "suggested",
        kind: "beneficiary",
      });

  return out;
}

/**
 * Heads-ups for the families a person is an admin of: invites nobody has
 * accepted yet, and a child about to turn 18 whose access may need a review.
 * Only admins get these — they're about other members' access.
 */
export function familyNudges({
  person,
  families,
  deceasedIds,
  today,
}: {
  person: HouseholdPerson;
  families: StoredFamily[];
  deceasedIds: string[];
  today: string;
}): Nudge[] {
  const out: Nudge[] = [];
  for (const f of families) {
    const me = f.members.find((m) => m.id === person.id);
    if (!me || !f.roles.find((r) => r.id === me.roleId)?.isAdmin) continue;
    const href = routes.familyDetail(f.id);
    for (const m of f.members) {
      if (m.id === person.id || deceasedIds.includes(m.id)) continue;
      if (m.status === "Invited")
        out.push({
          id: `invite-${f.id}-${m.id}`,
          title: `${firstName(m.name)} hasn't joined ${f.familyName} yet`,
          body: `The invite went to ${m.email}. Once accepted, ${firstName(m.name)} sees only what their role allows.`,
          action: { label: "Manage family", href },
          tone: "info",
          kind: "family",
        });
      const born = personById(m.id)?.birthdate;
      const birthday = born && eighteenthBirthday(born);
      const days = birthday ? daysBetween(today, birthday) : -1;
      if (birthday && days >= 0 && days <= 60)
        out.push({
          id: `adult-${f.id}-${m.id}`,
          title: `${firstName(m.name)} turns 18 on ${formatDate(birthday, "medium")}`,
          body: `A good moment to review what ${firstName(m.name)} can see and do in ${f.familyName}.`,
          action: { label: "Review access", href },
          tone: "info",
          kind: "birthday",
        });
    }
  }
  return out;
}
