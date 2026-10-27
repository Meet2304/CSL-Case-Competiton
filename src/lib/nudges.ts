/**
 * Planning reminders for one person, from what they own and what's on file:
 * a will, and a beneficiary on every account that can name one. Pure — the
 * dashboard shows these and the Planning page resolves them.
 */
import type { BankAccount, HouseholdPerson, WillStatus } from "@/data/types";
import { formatCompactMoney, formatDate } from "@/lib/format";
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
};

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
    const [y, m, d] = person.birthdate.split("-").map(Number);
    const birthday = `${y + 18}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const own = accountsOf(accounts, person.id).owned.filter((a) => a.custodian);
    const daysAway = Math.round(
      (Date.parse(`${birthday}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000,
    );
    if (daysAway <= 60 && own.length)
      out.push({
        id: "turning-18",
        title: `You turn 18 on ${formatDate(birthday, "medium")}`,
        body: `${own.map((a) => a.name).join(" and ")} becomes yours alone, and you'll be able to write your own will and choose beneficiaries.`,
        action: { label: "See what changes", href: routes.plan },
        tone: "info",
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
        action: { label: "Update beneficiary", href: `${routes.plan}#beneficiaries` },
        tone: "important",
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
        href: `${routes.plan}#will`,
      },
      tone: "suggested",
    });

  for (const a of owned)
    if ((a.beneficiaries ?? []).length === 0)
      out.push({
        id: `add-${a.id}`,
        title: `Add a beneficiary to ${accountLabel(a)}`,
        body: `Without a ${designationTerm(a)}, ${formatCompactMoney(a.balance)} would go through probate. Naming someone passes it to them directly.`,
        action: { label: "Add beneficiary", href: `${routes.plan}#beneficiaries` },
        tone: "suggested",
      });

  return out;
}
