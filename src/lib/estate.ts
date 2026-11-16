/**
 * How a deceased customer's accounts pass on, for the advisor's wealth
 * transfer: joint accounts go to the surviving owners, accounts with a named
 * beneficiary go to them, then the will's specific gifts, then the rest
 * (residuary) by share once debts are paid from it. Debts are carried by the
 * residuary beneficiaries in the same shares. Pure; the will and certificate
 * are mock data in src/data/estate.ts.
 */
import type { WillOnFile } from "@/data/estate";
import type { BankAccount } from "@/data/types";

export type Route = "joint" | "beneficiary" | "gift" | "residuary";

export const routeLabels: Record<Route, string> = {
  joint: "Joint owner",
  beneficiary: "Named beneficiary",
  gift: "Gift in the will",
  residuary: "Rest of the estate",
};

export type Receipt = { account: BankAccount; route: Route; share: number; amount: number };
export type Burden = { account: BankAccount; share: number; amount: number };

export type BeneficiaryShare = {
  personId: string;
  receives: Receipt[];
  takesOn: Burden[];
  /** What they receive less the debts they carry. External policies count at face value. */
  net: number;
};

const cents = (x: number) => Math.round(x * 100) / 100;

/** Splits `amount` by `shares`, giving any rounding remainder to the last share. */
function split(amount: number, shares: { personId: string; share: number }[]) {
  let left = cents(amount);
  return shares.map((s, i) => {
    const part = i === shares.length - 1 ? left : cents(amount * s.share);
    left = cents(left - part);
    return { ...s, amount: part };
  });
}

export function transferPlan(
  accounts: BankAccount[],
  decedentId: string,
  will: WillOnFile,
  deceasedIds: string[] = [],
) {
  const alive = (id: string) => id !== decedentId && !deceasedIds.includes(id);
  const owned = accounts.filter((a) => a.owners.includes(decedentId));
  const people = new Map<string, BeneficiaryShare>();
  const person = (id: string) => {
    if (!people.has(id)) people.set(id, { personId: id, receives: [], takesOn: [], net: 0 });
    return people.get(id)!;
  };
  const give = (
    account: BankAccount,
    route: Route,
    shares: { personId: string; share: number }[],
    amount: number,
  ) =>
    split(amount, shares).forEach((s) =>
      person(s.personId).receives.push({ account, route, share: s.share, amount: s.amount }),
    );

  const debts = owned.filter((a) => a.balance < 0);
  const residue: BankAccount[] = [];
  for (const a of owned.filter((x) => x.balance >= 0)) {
    const others = a.owners.filter(alive);
    const named = (a.beneficiaries ?? []).filter(alive);
    if (others.length)
      give(
        a,
        "joint",
        others.map((id) => ({ personId: id, share: 1 / others.length })),
        a.balance,
      );
    else if (named.length)
      give(
        a,
        "beneficiary",
        named.map((id) => ({ personId: id, share: 1 / named.length })),
        a.balance,
      );
    else if (will.gifts[a.id]) give(a, "gift", will.gifts[a.id], a.balance);
    else residue.push(a);
  }
  for (const a of residue) give(a, "residuary", will.residuary, a.balance);
  for (const d of debts)
    split(-d.balance, will.residuary).forEach((s) =>
      person(s.personId).takesOn.push({ account: d, share: s.share, amount: s.amount }),
    );

  const shares = [...people.values()]
    .map((p) => ({
      ...p,
      net: cents(
        p.receives.reduce((s, r) => s + r.amount, 0) - p.takesOn.reduce((s, b) => s + b.amount, 0),
      ),
    }))
    .sort((a, b) => b.net - a.net);
  return {
    decedentId,
    shares,
    debts,
    /** Value passing at PNC (outside policies excluded), before debts. */
    totalAtPnc: cents(
      owned.filter((a) => !a.external && a.balance > 0).reduce((s, a) => s + a.balance, 0),
    ),
    totalDebts: cents(debts.reduce((s, a) => s - a.balance, 0)),
  };
}

export type TransferPlan = ReturnType<typeof transferPlan>;
