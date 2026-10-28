/**
 * Findoe for customers — SIMULATED. Answers a small set of questions about
 * the signed-in person's own situation (what happens to their accounts, what
 * to do after a loss, who to contact, taxes, their will and family), citing
 * the bank's records and the legal library for every claim, and ending with
 * the actions that resolve it. Anything else falls back to a keyword search
 * of both. Pure: the panel builds the context from the same data the pages
 * show, so Findoe never sees what the viewer can't.
 */
import { estateCare, familyAttorney, type BankContact } from "@/data/contacts";
import { people, type StoredFamily } from "@/data/household";
import type { BankAccount, HouseholdPerson, WillStatus } from "@/data/types";
import type { RecordedLoss } from "@/lib/bereavement";
import { daysBetween, formatDate, formatMoney } from "@/lib/format";
import {
  accountLabel,
  ageOn,
  assetsFor,
  familiesOf,
  familySummary,
  firstName,
  personById,
  personByName,
  relationshipTo,
  roleName,
  takesBeneficiary,
  type HouseholdState,
  type PersonAsset,
} from "@/lib/household";
import type { Nudge } from "@/lib/nudges";
import { routes } from "@/lib/routes";
import { survivorPlan, type SurvivorItem } from "@/lib/survivor";
import { Citations, keywords, lawEntry, searchLaw, type Reply, type ReplyAction } from "./answer";

export type CustomerContext = {
  person: HouseholdPerson;
  first: string;
  age: number;
  isMinor: boolean;
  today: string;
  /** Everything the person can see: theirs, managed for a child, shared through a family. */
  assets: PersonAsset[];
  deceasedIds: string[];
  will: WillStatus;
  nudges: Nudge[];
  families: FamilyLine[];
  /** A death in the household the bank has recorded, from this person's side. */
  loss?: {
    deceased: HouseholdPerson;
    date: string;
    plan: SurvivorItem[];
    /** Accounts the deceased owned, alone or jointly. */
    theirs: BankAccount[];
  };
};

type FamilyLine = {
  family: StoredFamily;
  role?: string;
  isAdmin: boolean;
  members: number;
  /** Labels of the accounts this person can see in the family. */
  sees: string[];
  /** Admins only: what each other living member sees. */
  others?: { name: string; role?: string; sees: string[] }[];
};

const assetLabel = (a: { name: string; last4?: string }) =>
  `${a.name}${a.last4 ? ` x${a.last4}` : ""}`;

/** Builds the context from the household as the pages see it. */
export function customerContext({
  person,
  household,
  accounts,
  deceasedIds,
  will,
  nudges,
  loss,
  today,
}: {
  person: HouseholdPerson;
  household: HouseholdState;
  accounts: BankAccount[];
  deceasedIds: string[];
  will: WillStatus;
  nudges: Nudge[];
  loss?: RecordedLoss;
  today: string;
}): CustomerContext {
  const age = ageOn(person.birthdate, today);
  const families = familiesOf(household, person.id).map((f): FamilyLine => {
    const s = familySummary(f, person.id, accounts, deceasedIds);
    return {
      family: f,
      role: s.role?.name,
      isAdmin: s.isAdmin,
      members: s.living.length,
      sees: s.visible.map(assetLabel),
      others: s.isAdmin
        ? s.living
            .filter((m) => m.id !== person.id)
            .map((m) => ({
              name: m.name,
              role: roleName(f, m.id),
              sees: familySummary(f, m.id, accounts, deceasedIds).visible.map(assetLabel),
            }))
        : undefined,
    };
  });
  const deceased = loss && personByName(loss.personName);
  return {
    person,
    first: firstName(person.name),
    age,
    isMinor: age < 18,
    today,
    assets: assetsFor(household, person.id, accounts, deceasedIds),
    deceasedIds,
    will,
    nudges,
    families,
    loss:
      deceased && deceased.id !== person.id
        ? {
            deceased,
            date: loss.date,
            plan: survivorPlan(deceased, person, accounts, today),
            theirs: accounts.filter((a) => a.owners.includes(deceased.id)),
          }
        : undefined,
  };
}

// ---------------------------------------------------------------------------
// Rows from the bank's records

const nameOf = (id: string) => personById(id)?.name ?? "someone";
const namesOf = (ids: string[], youId?: string) =>
  ids.map((id) => (id === youId ? "you" : nameOf(id))).join(" and ");

function amount(a: BankAccount): string {
  if (a.kind === "life-insurance") return `Face value ${formatMoney(a.balance)}`;
  if (a.kind === "credit-card") return `Balance owed ${formatMoney(-a.balance)}`;
  return formatMoney(a.balance);
}

function accountRow(c: Citations, a: BankAccount): string {
  const fields = [
    a.owners.length > 1 ? `Joint: ${namesOf(a.owners)}` : `Owner: ${nameOf(a.owners[0])}`,
    a.custodian ? `Custodian: ${nameOf(a.custodian)}` : "",
    a.beneficiaries === undefined
      ? ""
      : a.beneficiaries.length
        ? `Beneficiary: ${namesOf(a.beneficiaries)}`
        : "No beneficiary",
    a.external ? "Held outside PNC" : "",
    amount(a),
  ];
  return c.bank({
    key: `account:${a.id}`,
    table: "Accounts",
    title: accountLabel(a),
    detail: fields.filter(Boolean).join(" · "),
  });
}

const rows = (c: Citations, accounts: BankAccount[]) =>
  accounts.map((a) => accountRow(c, a)).join("");

function profileRow(c: Citations, ctx: CustomerContext): string {
  return c.bank({
    key: "profile",
    table: "Customer profile",
    title: ctx.person.name,
    detail: `Age ${ctx.age} · ${ctx.assets.length} accounts visible`,
  });
}

const willLabels: Record<WillStatus, string> = {
  none: "No will on file",
  "in-progress": "Started, not finished",
  "on-file": "On file",
};

function willRow(c: Citations, ctx: CustomerContext): string {
  return c.bank({
    key: "will",
    table: "Wills",
    title: `${ctx.first}'s will`,
    detail: willLabels[ctx.will],
  });
}

function lossRow(c: Citations, loss: NonNullable<CustomerContext["loss"]>): string {
  return c.bank({
    key: "loss",
    table: "Bereavement",
    title: loss.deceased.name,
    detail: `Passed away ${formatDate(loss.date, "medium")} · Recorded by PNC`,
  });
}

function contactRow(c: Citations, contact: BankContact): string {
  return c.bank({
    key: `contact:${contact.id}`,
    table: contact.id === familyAttorney.id ? "People on file" : "Contacts",
    title: contact.name,
    detail: [contact.detail, contact.phone, contact.hours, contact.email]
      .filter(Boolean)
      .join(" · "),
  });
}

function familyRow(c: Citations, f: FamilyLine): string {
  return c.bank({
    key: `family:${f.family.id}`,
    table: "Families",
    title: f.family.familyName,
    detail: [
      f.role ? `You: ${f.role}` : "",
      `${f.members} members`,
      f.isAdmin ? `${f.family.accountIds.length} accounts shared` : "",
    ]
      .filter(Boolean)
      .join(" · "),
  });
}

// ---------------------------------------------------------------------------
// Actions

const callEstateCare = (detail = estateCare.hours): ReplyAction => ({
  label: `Call the ${estateCare.name}`,
  detail: `${estateCare.phone} · ${detail}`,
  href: `tel:${estateCare.phone!.replace(/\D/g, "")}`,
  icon: "phone",
  external: true,
});

const nameBeneficiary = (a: BankAccount): ReplyAction => ({
  label: `Name a beneficiary on ${accountLabel(a)}`,
  detail: `${formatMoney(a.balance)} · passes directly, outside probate`,
  href: routes.manageAsset(a.id),
  icon: "beneficiary",
});

const willAction = (will: WillStatus): ReplyAction => ({
  label: will === "in-progress" ? "Finish your will" : "Start your will",
  detail: "Free, and your answers save as you go",
  href: routes.will,
  icon: "will",
});

const sourceLink = (id: string, label: string, detail: string): ReplyAction => ({
  label,
  detail,
  href: lawEntry(id).url,
  icon: "web",
  external: true,
});

// ---------------------------------------------------------------------------
// Helpers over the context

const owned = (ctx: CustomerContext) =>
  ctx.assets.filter((i) => i.relation === "owned").map((i) => i.account);

/** Beneficiaries still living. */
const living = (ctx: CustomerContext, a: BankAccount) =>
  (a.beneficiaries ?? []).filter((id) => !ctx.deceasedIds.includes(id));

/** Accounts that can name a beneficiary but have nobody living named. */
const gapsOf = (ctx: CustomerContext) =>
  owned(ctx).filter((a) => takesBeneficiary(a) && living(ctx, a).length === 0);

const total = (accounts: BankAccount[]) => accounts.reduce((s, a) => s + a.balance, 0);
const list = (labels: string[]) =>
  labels.length < 3
    ? labels.join(" and ")
    : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
const them = (n: number) => (n === 1 ? "it" : "them");

/** The person's own children under 18, from the household records. */
function minorChildren(ctx: CustomerContext): HouseholdPerson[] {
  return people.filter(
    (p) =>
      relationshipTo(ctx.person, p) === "Child" &&
      !ctx.deceasedIds.includes(p.id) &&
      ageOn(p.birthdate, ctx.today) < 18,
  );
}

// ---------------------------------------------------------------------------
// Answers

function whatHappens(ctx: CustomerContext): Reply {
  const c = new Citations();
  const me = ctx.person.id;
  const lines = [
    "Here's what would happen to each of your accounts, based on what PNC has on file:",
  ];
  for (const a of owned(ctx)) {
    const row = accountRow(c, a);
    const others = a.owners.filter((id) => id !== me && !ctx.deceasedIds.includes(id));
    const named = living(ctx, a);
    const label = `**${accountLabel(a)}**`;
    if (others.length)
      lines.push(
        `- ${label} passes straight to ${namesOf(others)}, because you own it together.${row}${c.law("pa-6304")}`,
      );
    else if (a.owners.length > 1)
      lines.push(
        `- ${label} became yours alone when ${namesOf(a.owners.filter((id) => id !== me))} died; once the records are updated you can choose who it passes to.${row}${c.law("pa-6304")}`,
      );
    else if (a.kind === "credit-card")
      lines.push(
        `- ${label} is paid from your estate by your executor before anything is shared out.${row}${c.law("cfpb-1026-11c")}`,
      );
    else if (named.length && a.kind === "life-insurance")
      lines.push(`- ${label} is paid by the insurer straight to ${namesOf(named)}.${row}`);
    else if (named.length)
      lines.push(
        `- ${label} goes to ${namesOf(named)}, your named beneficiary.${row}${c.law(
          a.kind === "ira" || a.kind === "roth"
            ? "irs-pub-590b"
            : a.kind === "brokerage"
              ? "pa-ch64"
              : "pnc-death-claims",
        )}`,
      );
    else if (a.beneficiaries !== undefined)
      lines.push(
        `- ${label} ${
          (a.beneficiaries ?? []).length
            ? "names only someone who has died, so it"
            : "has no beneficiary, so it"
        } would go through probate, the court process your executor runs.${row}${c.law("pa-register-of-wills")}`,
      );
    else lines.push(`- ${label}: ${amount(a)}.${row}`);
  }
  const gaps = gapsOf(ctx);
  if (gaps.length)
    lines.push(
      `**${gaps.length === 1 ? "One account" : `${gaps.length} accounts`} (${formatMoney(total(gaps))}) would go through probate.** Naming a beneficiary passes ${them(gaps.length)} directly to that person instead.${c.law("pnc-death-claims")}`,
    );
  if (ctx.will !== "on-file")
    lines.push(
      `You also ${ctx.will === "none" ? "don't have a will on file" : "haven't finished your will"}${willRow(c, ctx)}, so you haven't yet chosen who settles your estate. Without one, the court appoints an administrator.${c.law("pa-register-of-wills")}`,
    );
  return c.reply(
    lines,
    [...gaps.map(nameBeneficiary), ...(ctx.will !== "on-file" ? [willAction(ctx.will)] : [])],
    ["Do I need a will?", "Who should I contact for help?", "Will my family owe taxes?"],
  );
}

function missingBeneficiaries(ctx: CustomerContext): Reply {
  const c = new Citations();
  const gaps = gapsOf(ctx);
  if (!gaps.length) {
    const named = owned(ctx).filter(takesBeneficiary);
    return c.reply(
      [
        `Every account of yours that can name a beneficiary has one.${rows(c, named)} They'll pass directly to the people you named, outside probate.${c.law("pnc-death-claims")}`,
      ],
      [{ label: "Review your beneficiaries", href: routes.assets, icon: "assets" }],
      ["What happens to my accounts if I die?", "Do I need a will?"],
    );
  }
  const lines = [
    `${gaps.length === 1 ? "One account doesn't" : `${gaps.length} accounts don't`} have a living beneficiary:`,
    ...gaps.map(
      (a) =>
        `- **${accountLabel(a)}** (${formatMoney(a.balance)})${
          (a.beneficiaries ?? []).length
            ? `: still names ${namesOf(a.beneficiaries!)}, who has died`
            : ""
        }.${accountRow(c, a)}`,
    ),
    `Naming one means the account passes straight to that person when you die, outside probate${c.law("pnc-death-claims")}${
      gaps.some((a) => a.kind === "brokerage")
        ? `. For the brokerage account it's called a transfer-on-death beneficiary${c.law("pa-ch64")}`
        : ""
    }. It takes a couple of minutes on My Assets.`,
  ];
  return c.reply(lines, gaps.map(nameBeneficiary), [
    "What happens to my accounts if I die?",
    "Do I need a will?",
  ]);
}

function needWill(ctx: CustomerContext): Reply {
  const c = new Citations();
  const row = willRow(c, ctx);
  const gaps = gapsOf(ctx);
  const kids = minorChildren(ctx);
  if (ctx.will === "on-file")
    return c.reply(
      [
        `Your will is on file with us.${row} It's worth reviewing after big changes: a marriage, a new child, a move, or a death in the family.`,
        `When the time comes, your executor takes it to the county Register of Wills to be given authority to act.${c.law("pa-register-of-wills")}`,
      ],
      [{ label: "See your will", href: routes.will, icon: "will" }],
      ["What happens to my accounts if I die?"],
    );
  const lines = [
    ctx.will === "none"
      ? `Yes, I'd recommend one. You don't have a will on file with us yet.${row}`
      : `You've started your will but haven't finished it.${row}`,
  ];
  if (gaps.length)
    lines.push(
      `It matters most for what has no beneficiary: ${list(gaps.map((a) => `**${accountLabel(a)}**`))} (${formatMoney(total(gaps))}).${rows(c, gaps)} Without a will you don't choose who inherits ${them(gaps.length)} or who settles your estate; the court appoints an administrator instead.${c.law("pa-register-of-wills")}`,
    );
  else
    lines.push(
      `Without a will you don't choose who settles your estate; the court appoints an administrator.${c.law("pa-register-of-wills")}`,
    );
  if (kids.length)
    lines.push(
      `A will is also where you name who would raise ${list(kids.map((k) => firstName(k.name)))}.${c.bank(
        {
          key: "children",
          table: "People on file",
          title: "Your children",
          detail: kids.map((k) => `${k.name}, ${ageOn(k.birthdate, ctx.today)}`).join(" · "),
        },
      )}`,
    );
  lines.push("PNC's will planner is free, and your answers save as you go.");
  return c.reply(
    lines,
    [willAction(ctx.will), ...gaps.map(nameBeneficiary)],
    ["What happens to my accounts if I die?", "Who should I contact for help?"],
  );
}

/** "What should I do first?" with nothing in particular going on: the person's reminders. */
function planFirst(ctx: CustomerContext): Reply {
  const c = new Citations();
  const due = ctx.nudges.filter((n) => n.kind === "will" || n.kind === "beneficiary");
  if (!due.length)
    return c.reply(
      [
        `You're in good shape.${willRow(c, ctx)}${rows(c, owned(ctx).filter(takesBeneficiary))} Your will is on file and every account that can name a beneficiary has one. Review both after any big change in the family.`,
      ],
      [{ label: "Review My Assets", href: routes.assets, icon: "assets" }],
      ["What happens to my accounts if I die?"],
    );
  const byId = new Map(owned(ctx).map((a) => [a.id, a]));
  const lines = ["Here's what I'd do first, most important at the top:"];
  due.forEach((n, i) => {
    const account = byId.get(n.id.replace(/^(add|update)-/, ""));
    const cite =
      n.kind === "will"
        ? `${willRow(c, ctx)}${c.law("pa-register-of-wills")}`
        : `${account ? accountRow(c, account) : ""}${c.law("pnc-death-claims")}`;
    lines.push(`${i + 1}. **${n.title}.** ${n.body}${cite}`);
  });
  return c.reply(
    lines,
    due.map((n) => ({
      label: n.action.label === "Add beneficiary" ? n.title : n.action.label,
      href: n.action.href,
      icon: n.kind === "will" ? "will" : "beneficiary",
    })),
    ["What happens to my accounts if I die?", "Who should I contact for help?"],
  );
}

function lossFirst(ctx: CustomerContext, loss: NonNullable<CustomerContext["loss"]>): Reply {
  const c = new Citations();
  const them1 = firstName(loss.deceased.name);
  const spouse = relationshipTo(ctx.person, loss.deceased) === "Spouse";
  const lines = [
    `I'm so sorry about ${them1}.${lossRow(c, loss)} There's nothing you have to do today. When you're ready, this is the order that usually works best:`,
  ];
  let n = 0;
  const step = (s: string) => lines.push(`${++n}. ${s}`);
  for (const item of loss.plan.filter((i) => i.route === "to-you")) {
    const [a] = item.accounts;
    const cited = rows(c, item.accounts);
    if (item.id.startsWith("joint:"))
      step(
        `**${item.title} ${item.accounts.length > 1 ? "are" : "is"} already yours.** You owned ${item.accounts.length > 1 ? "them" : "it"} together, so you can keep using ${item.accounts.length > 1 ? "them" : "it"}; we just update the records.${cited}${c.law("pa-6304")}`,
      );
    else if (item.id.startsWith("custodian:"))
      step(
        `**Become the adult on ${firstName(nameOf(a.owners[0]))}'s ${a.name}.** ${them1} looked after it until now.${cited}`,
      );
    else if (item.id.startsWith("retirement:"))
      step(
        `**Claim the ${a.name}.** ${them1} named you as the beneficiary.${cited} ${spouse ? "As a spouse, you can treat it as your own or keep it as an inherited account." : "You'll keep it as an inherited account."}${c.law("irs-pub-590b")}`,
      );
    else if (a.kind === "life-insurance")
      step(
        `**Start a claim for the ${a.name} with the insurer.** You're the beneficiary, and the insurer pays it directly, not PNC.${cited}`,
      );
    else
      step(
        `**Claim the ${accountLabel(a)}.** ${them1} named you as the beneficiary, so it passes to you outside probate.${cited}${c.law("pnc-death-claims")}`,
      );
  }
  const estate = loss.plan.filter((i) => i.route === "estate").flatMap((i) => i.accounts);
  if (estate.length)
    step(
      `**Leave ${list(estate.map(accountLabel))} to the executor.** No beneficiary was named, so ${estate.length > 1 ? "they go" : "it goes"} through ${them1}'s estate once the court gives the executor authority.${rows(c, estate)}${c.law("pa-register-of-wills")}`,
    );
  for (const item of loss.plan.filter((i) => i.route === "close"))
    step(
      `**The ${item.title} is paid from the estate.** You don't owe it personally, and no new fees or rate increases are added once the estate asks for the balance.${rows(c, item.accounts)}${c.law("cfpb-1026-11c")}`,
    );
  lines.push(
    `Meanwhile, ${them1}'s deposits stay insured just as before for six months.${c.law("fdic-330-3j")}`,
  );
  return c.reply(
    lines,
    [
      {
        label: "See what passes to you",
        detail: "My Assets › Unclaimed assets · guided, and saved as you go",
        href: routes.unclaimedAssets,
        icon: "next-steps",
      },
      callEstateCare(),
    ],
    [
      "Can I pay for the funeral from our accounts?",
      "Will I owe taxes on what I inherit?",
      "Who should I contact?",
    ],
  );
}

function minorLoss(ctx: CustomerContext, loss: NonNullable<CustomerContext["loss"]>): Reply {
  const c = new Citations();
  const them1 = firstName(loss.deceased.name);
  const mine = ctx.assets.filter((i) => i.relation === "owned").map((i) => i.account);
  const looked = mine.filter((a) => a.custodian === loss.deceased.id);
  return c.reply(
    [
      `I'm so sorry about ${them1}.${lossRow(c, loss)} You don't need to do anything with the accounts. The adults in your family and PNC will take care of them.`,
      ...looked.map(
        (a) =>
          `Your **${a.name}** stays yours. ${them1} was the adult on it, so another adult in the family will be added.${accountRow(c, a)}`,
      ),
      "If you'd like to talk to someone, you can always call us.",
    ],
    [callEstateCare()],
    ["What do I have at PNC?"],
  );
}

function funeral(ctx: CustomerContext): Reply {
  const c = new Citations();
  const loss = ctx.loss;
  if (!loss)
    return c.reply(
      [
        `If someone in your family dies, there are two ways to pay for the funeral before the court appoints an executor:`,
        `- **From an account you own together**, which is already yours to use.${c.law("pa-6304")}`,
        `- **From their own bank deposits**: Pennsylvania lets the bank pay the funeral bill from them, up to $20,000 in total, against the receipted bill.${c.law("pa-3101")}${c.law("pa-act50-2025")}`,
      ],
      [callEstateCare()],
      ["What happens to my accounts if I die?"],
    );
  const them1 = firstName(loss.deceased.name);
  const joint = loss.plan.filter((i) => i.id.startsWith("joint:")).flatMap((i) => i.accounts);
  const own = loss.theirs.filter(
    (a) =>
      a.owners.length === 1 &&
      (a.kind === "checking" || a.kind === "savings") &&
      living(ctx, a).length === 0,
  );
  const lines = ["Yes. There are two ways, depending on whose account the money is in:"];
  if (joint.length)
    lines.push(
      `- **From ${list(joint.map(accountLabel))}, which is yours now.** Pay the funeral home like any other bill.${rows(c, joint)}${c.law("pa-6304")}`,
    );
  if (own.length)
    lines.push(
      `- **From ${them1}'s own ${list(own.map(accountLabel))}, without waiting for the court.** Pennsylvania lets the bank pay a funeral bill from ${them1}'s deposits, up to $20,000 in total. Bring the receipted bill or the funeral director's affidavit to a branch, or call us.${rows(c, own)}${c.law("pa-3101")}${c.law("pa-act50-2025")}`,
    );
  lines.push("Either way, keep every receipt for the executor.");
  return c.reply(
    lines,
    [
      callEstateCare("Ask us to pay a funeral bill"),
      {
        label: "See what passes to you",
        href: routes.unclaimedAssets,
        icon: "next-steps",
      },
    ],
    ["Will I owe taxes on what I inherit?", "Who should I contact?"],
  );
}

function taxes(ctx: CustomerContext): Reply {
  const c = new Citations();
  const loss = ctx.loss;
  const whose = loss ? loss.theirs : owned(ctx);
  const atPnc = whose.filter((a) => !a.external && a.balance > 0);
  const name = loss ? `${firstName(loss.deceased.name)}'s` : "Your";
  const spouse = loss && relationshipTo(ctx.person, loss.deceased) === "Spouse";
  const sum = c.bank({
    key: "accounts-total",
    table: "Accounts",
    title: `${name} accounts at PNC`,
    detail: `${atPnc.length} accounts · ${formatMoney(total(atPnc))}`,
  });
  const lines = [
    loss
      ? `Most likely very little. Here's how each tax applies to what ${firstName(loss.deceased.name)} left:`
      : "Here's how the taxes would work on what you'd leave your family:",
    loss
      ? `- **Pennsylvania inheritance tax:** ${spouse ? "what passes to you as a spouse is taxed at 0%" : "what passes to a child is taxed at 4.5%"}. Paying within 3 months earns a 5% discount.${c.law("pa-inheritance-tax")}`
      : `- **Pennsylvania inheritance tax:** whatever passes to your spouse is taxed at 0%, and to your children at 4.5%.${c.law("pa-inheritance-tax")}`,
    `- **Federal estate tax:** only estates over $15 million pay it (for 2026 deaths). ${name} accounts at PNC total ${formatMoney(total(atPnc))}${sum}, far below that.${c.law("irs-estate-whats-new")}`,
  ];
  const brokerage = whose.find((a) => a.kind === "brokerage");
  if (brokerage)
    lines.push(
      `- **Investments:** the ${accountLabel(brokerage)} gets a new cost basis equal to its value on the date of death, which can lower capital-gains tax when it's sold.${accountRow(c, brokerage)}${c.law("irc-1014")}`,
    );
  const retirement = whose.find(
    (a) =>
      (a.kind === "ira" || a.kind === "roth") && (!loss || living(ctx, a).includes(ctx.person.id)),
  );
  if (retirement && loss)
    lines.push(
      `- **Retirement:** you choose how to take the ${retirement.name}${spouse ? ": as your own, or as an inherited account" : ""}, and each is taxed differently when you withdraw, so ask before you choose.${accountRow(c, retirement)}${c.law("irs-pub-590b")}`,
    );
  if (loss)
    lines.push(
      `- **${firstName(loss.deceased.name)}'s final income tax return** is due April 15 next year.${c.law("irs-pub-559")}`,
    );
  lines.push("This is general information, not tax advice.");
  return c.reply(
    lines,
    [callEstateCare("Talk it through with us")],
    [
      "Who should I contact?",
      loss ? "What should I do first?" : "What happens to my accounts if I die?",
    ],
  );
}

function contacts(ctx: CustomerContext): Reply {
  const c = new Citations();
  const loss = ctx.loss;
  const spouse = loss && relationshipTo(ctx.person, loss.deceased) === "Spouse";
  const lines = [
    loss
      ? "Here's who can help, and what each one is for:"
      : "For planning ahead, these are the people to talk to:",
    `- **The ${estateCare.name}** handles every PNC account in one place${loss ? ", so you only have to tell us once" : ""}.${contactRow(c, estateCare)}`,
  ];
  const actions: ReplyAction[] = [callEstateCare()];
  const policy = loss?.theirs.find(
    (a) => a.kind === "life-insurance" && living(ctx, a).includes(ctx.person.id),
  );
  if (policy)
    lines.push(
      `- **The insurer on the ${policy.name}** pays the claim directly; PNC can't start it for you.${accountRow(c, policy)}`,
    );
  if (loss) {
    lines.push(
      `- **The county Register of Wills** is where the executor gets letters, the court papers that let them act for the estate.${c.law("pa-register-of-wills")}`,
    );
    actions.push(
      sourceLink(
        "pa-register-of-wills",
        "Read about the Register of Wills",
        "Pennsylvania statute",
      ),
    );
  }
  if (spouse) {
    lines.push(
      `- **Social Security** should be told about the death. As a surviving spouse you may get a one-time $255 payment if you apply within 2 years.${c.law("ssa-lump-sum")}`,
    );
    actions.push(sourceLink("ssa-lump-sum", "Social Security death payment", "ssa.gov"));
  }
  if (!ctx.isMinor) {
    lines.push(
      `- **${familyAttorney.name}**, your family's estate attorney, ${loss ? "can guide the executor through probate" : "can review your will and beneficiaries"}.${contactRow(c, familyAttorney)}`,
    );
    actions.push({
      label: `Email ${familyAttorney.name}`,
      detail: familyAttorney.email,
      href: `mailto:${familyAttorney.email}`,
      icon: "email",
      external: true,
    });
  }
  return c.reply(lines, actions, [
    loss ? "What should I do first?" : "What happens to my accounts if I die?",
  ]);
}

function family(ctx: CustomerContext): Reply {
  const c = new Citations();
  if (!ctx.families.length)
    return c.reply(
      [
        `You're not part of a family on PNC yet.${profileRow(c, ctx)} A family lets you choose who can see or help with each account.`,
      ],
      [{ label: "Set up a family", href: routes.family, icon: "family" }],
    );
  const lines: string[] = [];
  for (const f of ctx.families) {
    const row = familyRow(c, f);
    if (f.isAdmin) {
      lines.push(
        `In **${f.family.familyName}** you're an Admin, so you decide what everyone sees.${row}`,
      );
      for (const o of f.others ?? [])
        lines.push(
          `- **${o.name}**${o.role ? ` (${o.role})` : ""}: ${o.sees.length ? `sees ${list(o.sees)}` : "nothing shared yet"}`,
        );
    } else
      lines.push(
        `In **${f.family.familyName}** you can see ${f.sees.length ? list(f.sees) : "nothing yet"}.${row}`,
      );
  }
  return c.reply(
    lines,
    ctx.families.map((f) => ({
      label: `Open ${f.family.familyName}`,
      detail: f.isAdmin ? "Change who sees what" : undefined,
      href: routes.familyDetail(f.family.id),
      icon: "family" as const,
    })),
    ["What do I have at PNC?"],
  );
}

function overview(ctx: CustomerContext): Reply {
  const c = new Citations();
  const shared = ctx.assets.filter((i) => i.relation === "shared").length;
  const relation = (i: PersonAsset) =>
    i.relation === "managed"
      ? `, which you manage for ${firstName(nameOf(i.account.owners[0]))}`
      : i.relation === "shared"
        ? `, shared with you through ${i.family?.familyName}`
        : "";
  const atPnc = ctx.assets.map((i) => i.account).filter((a) => !a.external);
  return c.reply(
    [
      `You can see ${ctx.assets.length} accounts at PNC${shared ? `, including ${shared} shared with you through your family` : ""}:`,
      ...ctx.assets.map(
        (i) =>
          `- **${accountLabel(i.account)}**: ${amount(i.account)}${relation(i)}.${accountRow(c, i.account)}`,
      ),
      `Together that's ${formatMoney(total(atPnc))} held at PNC.`,
    ],
    [{ label: "Open My Assets", href: routes.assets, icon: "assets" }],
    ctx.isMinor ? ["What changes when I turn 18?"] : ["What happens to my accounts if I die?"],
  );
}

function turning18(ctx: CustomerContext): Reply {
  const c = new Citations();
  const birthday = `${Number(ctx.person.birthdate.slice(0, 4)) + 18}${ctx.person.birthdate.slice(4)}`;
  const days = daysBetween(ctx.today, birthday);
  const custodial = owned(ctx).filter((a) => a.custodian);
  return c.reply(
    [
      `You turn 18 on ${formatDate(birthday, "medium")}, ${days} days from now.${profileRow(c, ctx)} Here's what changes:`,
      ...custodial.map(
        (a) =>
          `- **${accountLabel(a)}** becomes yours alone; ${nameOf(a.custodian!)} stops being the adult on it.${accountRow(c, a)}`,
      ),
      "- You'll be able to name beneficiaries on your own accounts and write your own will.",
      "- What your family shares with you stays the same unless an Admin changes it.",
    ],
    [{ label: "See your accounts", href: routes.assets, icon: "assets" }],
    ["What do I have at PNC?", "What can I see in my family?"],
  );
}

function greet(ctx: CustomerContext): Reply {
  const c = new Citations();
  return c.reply(
    [
      `Hi ${ctx.first}. I look things up in two places, and every answer shows which one it came from:`,
      `- **Your PNC records**: your accounts, beneficiaries, will and family.${profileRow(c, ctx)}`,
      `- **The legal library**: Pennsylvania and federal rules on estates, beneficiaries and taxes, each with its citation.${c.law("pnc-death-claims")}`,
      ctx.loss
        ? "I can walk you through what to do after a loss, who to contact, and what you might owe."
        : "Ask me what would happen to your accounts, whether you need a will, or who to contact.",
    ],
    [],
    customerSuggestions(ctx, "").slice(0, 3),
  );
}

function fallback(ctx: CustomerContext, question: string): Reply {
  const c = new Citations();
  const words = keywords(question);
  const accounts = ctx.assets
    .map((i) => i.account)
    .filter((a) => words.some((w) => `${a.name} ${a.kind}`.toLowerCase().includes(w)));
  const laws = searchLaw(question);
  if (!accounts.length && !laws.length)
    return c.reply(
      [
        `I can't answer that one yet.${profileRow(c, ctx)} I can help with your accounts and beneficiaries, your will, what to do after a loss, taxes on an inheritance, and who to contact.`,
      ],
      [callEstateCare()],
      customerSuggestions(ctx, "").slice(0, 3),
    );
  return c.reply(
    [
      "I don't have a ready answer for that, but here's what I found in your records and the legal library:",
      ...accounts.map((a) => `- **${accountLabel(a)}**: ${amount(a)}.${accountRow(c, a)}`),
      ...laws.map((id) => `- **${lawEntry(id).title}**: ${lawEntry(id).summary}${c.law(id)}`),
      `For anything specific to your situation, the ${estateCare.name} can help.${contactRow(c, estateCare)}`,
    ],
    [callEstateCare()],
    customerSuggestions(ctx, "").slice(0, 3),
  );
}

// ---------------------------------------------------------------------------
// Claiming what passes to you (My Assets › Unclaimed assets)

/** How an item passes to the viewer, in a few words, and the law behind it. */
function howItPasses(item: SurvivorItem, them1: string): { how: string; law?: string } {
  const [a] = item.accounts;
  if (item.id.startsWith("joint:")) return { how: "you owned it together", law: "pa-6304" };
  if (item.id.startsWith("custodian:"))
    return { how: `you can become the adult on ${firstName(nameOf(a.owners[0]))}'s account` };
  if (item.id.startsWith("retirement:"))
    return { how: `${them1} named you as the beneficiary`, law: "irs-pub-590b" };
  if (a.kind === "life-insurance")
    return { how: "you're the beneficiary; the insurer pays it directly" };
  return { how: `${them1} named you as the beneficiary`, law: "pnc-death-claims" };
}

const claimable = (loss: NonNullable<CustomerContext["loss"]>) =>
  loss.plan.filter((i) => i.route === "to-you");

function claimAll(ctx: CustomerContext, loss: NonNullable<CustomerContext["loss"]>): Reply {
  const c = new Citations();
  const them1 = firstName(loss.deceased.name);
  const items = claimable(loss);
  const estate = loss.plan.filter((i) => i.route !== "to-you").flatMap((i) => i.accounts);
  const lines = [
    `${items.length === 1 ? "One" : items.length} of ${them1}'s accounts can pass to you:${lossRow(c, loss)}`,
    ...items.map((i) => {
      const { how, law } = howItPasses(i, them1);
      return `- **${i.title}** (${formatMoney(total(i.accounts))}): ${how}.${rows(c, i.accounts)}${law ? c.law(law) : ""}`;
    }),
  ];
  if (estate.length)
    lines.push(
      `The rest (${list(estate.map(accountLabel))}) go through ${them1}'s estate; the executor handles those.${c.law("pa-register-of-wills")}`,
    );
  lines.push("Each claim is a short guided form, and the death certificate is uploaded only once.");
  return c.reply(
    lines,
    [
      {
        label: "Open your unclaimed assets",
        detail: `${items.length} waiting · on My Assets`,
        href: routes.unclaimedAssets,
        icon: "assets",
      },
      ...items.slice(0, 2).map((i): ReplyAction => ({
        label: `Start claiming ${i.title}`,
        href: routes.claimAsset(i.id),
        icon: "next-steps",
      })),
    ],
    ["What should I do first?", "Who should I contact?"],
  );
}

function claimOne(
  ctx: CustomerContext,
  loss: NonNullable<CustomerContext["loss"]>,
  item: SurvivorItem,
): Reply {
  const c = new Citations();
  const them1 = firstName(loss.deceased.name);
  const spouse = relationshipTo(ctx.person, loss.deceased) === "Spouse";
  const { how, law } = howItPasses(item, them1);
  const lines = [
    `**${item.title}** can pass to you because ${how}.${rows(c, item.accounts)}${law ? c.law(law) : ""}${
      item.id.startsWith("retirement:") && spouse
        ? " As a spouse, you can treat it as your own or keep it as an inherited account; the claim asks which."
        : ""
    }`,
  ];
  if (item.flow) {
    lines.push(
      "What the claim asks for:",
      ...item.flow.steps
        .filter((s) => !s.showIf)
        .map(
          (s) =>
            `- ${s.title}${s.kind === "autofill" ? " (we fill this in)" : s.kind === "upload" ? " (a photo or scan)" : ""}`,
        ),
      `Once you send it, our review usually takes ${item.flow.reviewTime}. ${item.flow.outcome}`,
    );
  } else if (item.steps) lines.push("How it works:", ...item.steps.map((s) => `- ${s}`));
  return c.reply(
    lines,
    [
      {
        label: item.flow ? `Start claiming ${item.title}` : `See how to claim ${item.title}`,
        detail: item.flow ? "Saved as you go" : "With the insurer",
        href: routes.claimAsset(item.id),
        icon: "next-steps",
      },
      callEstateCare(),
    ],
    ["What else can I claim?", "Who should I contact?"],
  );
}

/** The claimable item a question names, by its title or an account's name and number. */
function itemNamed(loss: NonNullable<CustomerContext["loss"]>, q: string) {
  return claimable(loss).find(
    (i) =>
      q.includes(i.title.toLowerCase()) ||
      i.accounts.some((a) => (a.last4 && q.includes(a.last4)) || q.includes(a.name.toLowerCase())),
  );
}

// ---------------------------------------------------------------------------

const is = {
  claim: /\bclaim|unclaimed|pass(es)? to me|coming to me|come to me/,
  greet: /^(hi|hello|hey)\b|what can you (do|help)|how does (this|findoe) work|who are you/,
  funeral: /funeral|burial|cremat/,
  taxes: /\btax|\birs\b|\bowe\b/,
  contacts:
    /\b(contact|call|phone|lawyer|attorney)\b|talk to|speak (to|with)|who (should|can|do) i (ask|call|talk|speak|contact)/,
  first: /\b(first|next|start|begin)\b|to.?do|now what|happens now|what (should|do) i do/,
  family: /\bfamil|who can see|shared? with|\broles?\b|\baccess\b/,
  beneficiary: /beneficiar|missing|payable.on.death|transfer.on.death|\bpod\b|\btod\b/,
  will: /\b(a|my|your|the) will\b|\bwills\b|probate|executor|intesta/,
  death: /\b(die|dies|died|death|pass away|passed|gone|inherit|who gets|protect|happens?)\b/,
  overview: /what do i have|how much|balance|net worth|overview|\btotal\b|summar/,
  birthday: /\b18\b|eighteen|\bturn\b|grow up|adult/,
};

/** Findoe's answer to a customer's question. */
export function customerReply(ctx: CustomerContext, question: string): Reply {
  const q = question.trim().toLowerCase();
  const loss = ctx.loss;
  if (is.greet.test(q)) return greet(ctx);
  if (ctx.isMinor) {
    // Like the pages, nothing about the deceased's accounts for a child.
    if (loss && [is.first, is.death, is.funeral, is.taxes, is.claim].some((r) => r.test(q)))
      return minorLoss(ctx, loss);
    if (is.birthday.test(q)) return turning18(ctx);
  }
  if (loss && is.claim.test(q)) {
    const item = itemNamed(loss, q);
    return item ? claimOne(ctx, loss, item) : claimAll(ctx, loss);
  }
  if (is.funeral.test(q)) return funeral(ctx);
  if (is.taxes.test(q)) return taxes(ctx);
  if (is.contacts.test(q)) return contacts(ctx);
  if (is.first.test(q)) {
    if (loss) return lossFirst(ctx, loss);
    return ctx.isMinor ? turning18(ctx) : planFirst(ctx);
  }
  if (is.family.test(q)) return family(ctx);
  if (is.beneficiary.test(q) && !ctx.isMinor) return missingBeneficiaries(ctx);
  if (is.will.test(q) && !ctx.isMinor) return needWill(ctx);
  if (is.death.test(q)) {
    const aboutThem = loss && q.includes(firstName(loss.deceased.name).toLowerCase());
    if (loss && aboutThem) return lossFirst(ctx, loss);
    return ctx.isMinor ? turning18(ctx) : whatHappens(ctx);
  }
  if (is.overview.test(q) || /\baccounts?\b/.test(q)) return overview(ctx);
  return fallback(ctx, question);
}

/** Starter questions for the page the customer is on. */
export function customerSuggestions(ctx: CustomerContext, path: string): string[] {
  if (ctx.isMinor)
    return ctx.loss
      ? ["What happens now?", "What do I have at PNC?", "Who should I contact?"]
      : ["What changes when I turn 18?", "What do I have at PNC?", "What can I see in my family?"];
  if (ctx.loss && path !== routes.will && path !== routes.family)
    return [
      "What should I do first?",
      "What can I claim?",
      "Can I pay for the funeral from our accounts?",
      "Who should I contact?",
    ];
  if (path === routes.assets)
    return [
      "Which accounts are missing a beneficiary?",
      "What happens to my accounts if I die?",
      "What do I have at PNC?",
      "Who should I contact for help?",
    ];
  if (path === routes.will)
    return [
      "Do I need a will?",
      "What happens to my accounts if I die?",
      "Will my family owe taxes?",
      "Who should I contact for help?",
    ];
  if (path === routes.family)
    return [
      "Who can see my accounts?",
      "What happens to my accounts if I die?",
      "Who should I contact for help?",
    ];
  return [
    "What should I do first?",
    "What happens to my accounts if I die?",
    "Which accounts are missing a beneficiary?",
    "Who should I contact for help?",
  ];
}
