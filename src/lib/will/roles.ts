import type { FamilyAsset, FamilyMember, FamilyState } from "@/data/types";
import { giftTitle } from "./describe";
import { named, primaryRows, spouseName } from "./flow";
import type { WillDraft } from "./types";

/**
 * Who a will names and how it is carried out. Will answers are free text, so
 * people are matched to family members by name.
 */

export type WillRole =
  | "Executor"
  | "Digital executor"
  | "Beneficiary"
  | "Backup beneficiary"
  | "Gift recipient"
  | "Guardian"
  | "Pet guardian";

/** Roles that can begin executing the will (the executor and anyone who inherits). */
const canExecute: WillRole[] = ["Executor", "Beneficiary", "Backup beneficiary", "Gift recipient"];

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Every role `name` holds in the will, in order of importance. */
export function rolesFor(d: WillDraft, name: string): WillRole[] {
  const has = (rows: { name: string }[]) => named(rows).some((r) => same(r.name, name));
  const { residuary } = d;
  const roles: WillRole[] = [];
  if (has(d.provisions.executors)) roles.push("Executor");

  const primary =
    residuary.primary.plan === "spouse"
      ? same(spouseName(d), name)
      : primaryRows(d).some((b) => b.kind === "person" && same(b.name, name));
  if (primary) roles.push("Beneficiary");

  const children = d.nominees.hasChildren === "yes" ? named(d.nominees.children) : [];
  const backup =
    (residuary.secondary.plan === "children" && children.some((c) => same(c.name, name))) ||
    [residuary.secondary, residuary.tertiary, residuary.lastResort].some((dist) =>
      dist.beneficiaries.some((b) => b.kind === "person" && same(b.name, name)),
    );
  if (backup && !primary) roles.push("Backup beneficiary");

  if (d.gifts.some((g) => has(g.primary) || has(g.contingent))) roles.push("Gift recipient");
  if (d.provisions.digital === "yes" && has(d.provisions.digitalExecutors)) {
    roles.push("Digital executor");
  }
  if (has(d.nominees.guardians)) roles.push("Guardian");
  if (d.nominees.hasPets === "yes" && has(d.nominees.petGuardians)) roles.push("Pet guardian");
  return roles;
}

export const mayExecute = (roles: WillRole[]) => roles.some((r) => canExecute.includes(r));

/** Living family members named in the will, with their roles. */
export function namedMembers(d: WillDraft, family: FamilyState) {
  return family.members
    .filter((m) => m.id !== family.selfId && m.status !== "Deceased")
    .map((member) => ({ member, roles: rolesFor(d, member.name) }))
    .filter(({ roles }) => roles.length > 0);
}

export function isExecutor(d: WillDraft, member: FamilyMember) {
  return rolesFor(d, member.name).includes("Executor");
}

export type EstateStep = { id: string; label: string; detail: string };

/** What the executor does to settle the estate under this will (general guidance). */
export function estateSteps(d: WillDraft): EstateStep[] {
  const gifts = d.gifts.map(giftTitle).filter(Boolean);
  return [
    {
      id: "notify",
      label: "Tell PNC about the death",
      detail:
        "Done when execution begins. Accounts that pass under the will are held for the executor.",
    },
    {
      id: "certificate",
      label: "Provide a certified death certificate",
      detail: "An original certified copy from the county vital records office.",
    },
    {
      id: "probate",
      label: "File the will with the probate court",
      detail:
        d.provisions.affidavit === "yes"
          ? "The will has a self-proving affidavit, so the witnesses shouldn't need to testify."
          : "The court may contact the witnesses who signed the will.",
    },
    {
      id: "letters",
      label: "Receive letters testamentary",
      detail: "The court's authorization for the executor to act for the estate.",
    },
    {
      id: "estate-account",
      label: "Open an estate account at PNC",
      detail: "Get an estate tax ID (EIN) from the IRS; estate funds move into this account.",
    },
    {
      id: "debts",
      label: "Pay final bills and taxes",
      detail: "Debts, final income tax and any estate tax are paid before anything is distributed.",
    },
    ...(gifts.length
      ? [
          {
            id: "gifts",
            label: "Hand over the specific gifts",
            detail: gifts.join("; "),
          },
        ]
      : []),
    {
      id: "residuary",
      label: "Distribute the rest of the estate",
      detail:
        "Shared out as the will directs. The executor files a final accounting with the court.",
    },
  ];
}

/** Assets the testator owns, split by whether the will decides who gets them. */
export function assetsByRoute(family: FamilyState, testatorId: string) {
  const owned = family.assets.filter((a) => !a.closed && a.owners.includes(testatorId));
  const passesUnderWill = (a: FamilyAsset) =>
    a.method === "estate" || (!a.method && a.owners.length === 1);
  return {
    underWill: owned.filter(passesUnderWill),
    outsideWill: owned.filter((a) => !passesUnderWill(a)),
  };
}
