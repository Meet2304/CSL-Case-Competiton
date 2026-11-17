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
    // Largest share first; equal shares (to the dollar) keep their order, e.g. David then Alexa.
    .sort((a, b) => Math.round(b.net) - Math.round(a.net));
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

/** What the advisor's next steps need to know about the people involved. */
export type StepContext = {
  name: (personId: string) => string;
  executor: string;
  /** The custodian who holds a minor's share, if the person is under 18. */
  custodianOf: (personId: string) => string | undefined;
  isSpouse: (personId: string) => boolean;
};

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * The advisor's next steps to pass one beneficiary's share on, in order: what
 * passes outside the will first (joint accounts, named beneficiaries), then
 * what the will gives once the executor has authority, then the debts paid
 * from it. Worded for the advisor; derived from how each account passes.
 */
export function beneficiarySteps(share: BeneficiaryShare, ctx: StepContext): string[] {
  const name = ctx.name(share.personId);
  const custodian = ctx.custodianOf(share.personId);
  const label = (a: BankAccount) => `${a.name}${a.last4 ? ` x${a.last4}` : ""}`;
  const outside = share.receives.filter((r) => r.route === "joint" || r.route === "beneficiary");
  const underWill = share.receives.filter((r) => r.route === "gift" || r.route === "residuary");
  const steps: string[] = [];
  for (const r of outside) {
    const a = r.account;
    if (r.route === "joint")
      steps.push(
        `Retitle ${label(a)} into ${name}'s name alone; it needs only the death certificate.`,
      );
    else if (a.kind === "ira" || a.kind === "roth")
      steps.push(
        ctx.isSpouse(share.personId)
          ? `Help ${name} claim ${label(a)}: roll it into her own IRA or keep it as an inherited IRA.`
          : `Open an inherited IRA for ${name} to receive ${label(a)}.`,
      );
    else if (a.external)
      steps.push(
        `Help ${name} file the claim for the ${a.name} (${money(r.amount)}) with the insurer.`,
      );
    else steps.push(`Pay ${label(a)} to ${name} on a beneficiary claim form.`);
  }
  if (underWill.length) {
    const parts = underWill
      .map((r) => `${r.share < 1 ? `${Math.round(r.share * 100)}% of ` : ""}${label(r.account)}`)
      .join(" and ");
    const total = money(underWill.reduce((s, r) => s + r.amount, 0));
    steps.push(
      custodian
        ? `Once ${ctx.executor} has letters testamentary, open a custodial account for ${name} that ${custodian} manages, and move ${parts} into it (${total}).`
        : `Once ${ctx.executor} has letters testamentary, transfer ${parts} to ${name} (${total}).`,
    );
  }
  if (share.takesOn.length)
    steps.push(
      `Before that, ${money(share.takesOn.reduce((s, b) => s + b.amount, 0))} of ${share.takesOn.map((b) => label(b.account)).join(" and ")} is paid from ${name}'s share of the estate.`,
    );
  return steps;
}
