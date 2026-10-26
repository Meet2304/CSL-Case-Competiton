/**
 * What a death in the household means for one survivor: each of the
 * deceased's accounts, how it passes on, and what (if anything) the survivor
 * has to do. Built from the accounts as they stand, so a beneficiary added
 * before the death changes the plan. Pure functions.
 */
import { deathCertificateStep, type FlowStep, type TransferFlow } from "@/data/bereavement";
import type { BankAccount, HouseholdPerson } from "@/data/types";
import { accountLabel, ageOn, firstName, personById } from "@/lib/household";

/** How an account passes on, from the survivor's side. */
export type SurvivorRoute =
  /** Passes to the survivor: they complete a guided flow. */
  | "to-you"
  /** Passes to someone else by name (a beneficiary). */
  | "to-others"
  /** Has no beneficiary: the executor settles it through the estate. */
  | "estate"
  /** A debt: paid from the estate and closed. */
  | "close";

export type SurvivorItem = {
  id: string;
  title: string;
  accounts: BankAccount[];
  route: SurvivorRoute;
  /** Settle soon (the household relies on it) or within about six months. */
  soon: boolean;
  /** One plain sentence on what happens to it. */
  summary: string;
  /** A guided flow, when the survivor has something to do. */
  flow?: TransferFlow;
  /** What's usually needed, when there's no guided flow. */
  steps?: string[];
};

const names = (ids: string[]) =>
  ids.map((id) => firstName(personById(id)?.name ?? "someone")).join(" and ");

function idOnFile(p: HouseholdPerson) {
  return [
    { label: "Name", value: p.name },
    { label: "ID on file", value: "Driver's license ending 0000" },
    { label: "Last verified", value: "Mar 12, 2024" },
  ];
}

function jointFlow(accounts: BankAccount[], deceased: HouseholdPerson, you: HouseholdPerson) {
  return {
    id: `joint:${accounts.map((a) => a.id).join("+")}`,
    title: accounts.length > 1 ? "Joint accounts" : accounts[0].name,
    accounts,
    intro: `You and ${firstName(deceased.name)} owned ${accounts.length > 1 ? "these accounts" : "this account"} together, so it passes straight to you. You can keep using it — this just updates the bank's records.`,
    reviewTime: "1–3 business days",
    outcome: "The account is in your name only. Same card, same account number.",
    steps: [
      deathCertificateStep,
      {
        id: "survivor-id",
        title: "Your photo ID",
        kind: "autofill",
        description: "We already have your ID on file, so there's nothing to upload.",
        prefill: idOnFile(you),
        confirmLabel: "This is still my current ID",
      },
      {
        id: "survivorship-form",
        title: "Survivorship form",
        kind: "autofill",
        description: "We've filled in the bank's form for you. Please check it and sign.",
        prefill: [
          { label: "Deceased owner", value: deceased.name },
          { label: "Surviving owner", value: you.name },
          { label: "Accounts", value: accounts.map(accountLabel).join(", ") },
          { label: "New account title", value: you.name },
        ],
        confirmLabel: "The details are correct and I sign this form electronically",
      },
    ],
  } satisfies TransferFlow;
}

function retirementFlow(account: BankAccount, deceased: HouseholdPerson, you: HouseholdPerson) {
  const roth = account.kind === "roth";
  const spouse = you.relationship === "Spouse" || deceased.relationship === "Spouse";
  const steps: FlowStep[] = [
    deathCertificateStep,
    {
      id: "claim-form",
      title: "Beneficiary claim form",
      kind: "autofill",
      description: `We've filled in the claim form from ${firstName(deceased.name)}'s account records.`,
      prefill: [
        { label: "Account owner", value: deceased.name },
        { label: "Account", value: accountLabel(account) },
        { label: "Beneficiary", value: you.name },
        { label: "Share", value: `${Math.round(100 / (account.beneficiaries?.length || 1))}%` },
      ],
      confirmLabel: "The details are correct",
    },
    {
      id: "id-w9",
      title: "Your photo ID and taxpayer details (W-9)",
      kind: "autofill",
      description:
        "Taken from your profile. The W-9 lets the account be re-registered in your name.",
      prefill: [...idOnFile(you).slice(0, 2), { label: "SSN", value: "•••-••-0000" }],
      confirmLabel: "I certify my taxpayer information is correct",
    },
    {
      id: "election",
      title: "How you'd like to receive it",
      kind: "manual",
      description: "Your advisor can talk these through with you before you choose.",
      fields: [
        {
          id: "election",
          label: "Choose one",
          type: "choice",
          options: [
            ...(spouse
              ? [
                  {
                    value: "rollover",
                    label: "Spousal rollover — make it my own IRA",
                    help: "Most common for spouses. It becomes your account and you name new beneficiaries.",
                  },
                ]
              : []),
            {
              value: "inherited",
              label: "Keep it as an inherited IRA",
              help: "Stays separate, for your benefit. Can suit you if you may need the money sooner.",
            },
            {
              value: "lump-sum",
              label: "Take it as a lump sum",
              help: "Closes the account and pays it to you. Check the tax effect with your advisor first.",
            },
          ],
        },
      ],
    },
    {
      id: "withholding",
      title: "Tax withholding",
      kind: "manual",
      description: roth
        ? "Only matters if money is paid out to you. Qualified Roth withdrawals are usually tax-free."
        : "Only matters if money is paid out to you. Payouts from this IRA are taxed as income.",
      fields: [
        {
          id: "federal",
          label: "Federal withholding",
          type: "choice",
          options: [
            { value: "none", label: "No withholding" },
            { value: "10", label: "10%" },
            { value: "20", label: "20%" },
          ],
        },
      ],
    },
  ];
  return {
    id: `retirement:${account.id}`,
    title: account.name,
    accounts: [account],
    intro: `${firstName(deceased.name)} named you as the beneficiary, so this comes to you.${spouse ? " As a spouse you have the most flexible choices — there's no rush to decide." : ""}`,
    reviewTime: "2–3 weeks",
    outcome: "The account has been transferred to you as you chose.",
    steps,
  } satisfies TransferFlow;
}

function claimFlow(account: BankAccount, deceased: HouseholdPerson, you: HouseholdPerson) {
  return {
    id: `claim:${account.id}`,
    title: account.name,
    accounts: [account],
    intro: `${firstName(deceased.name)} named you as the beneficiary, so this is paid to you directly — it doesn't wait for the estate.`,
    reviewTime: "3–5 business days",
    outcome: "The money has been paid to you.",
    steps: [
      deathCertificateStep,
      {
        id: "claim-form",
        title: "Beneficiary claim form",
        kind: "autofill",
        description: "We've filled this in from the account records.",
        prefill: [
          { label: "Account owner", value: deceased.name },
          { label: "Account", value: accountLabel(account) },
          { label: "Beneficiary", value: you.name },
        ],
        confirmLabel: "The details are correct",
      },
      {
        id: "payout",
        title: "Where to send the money",
        kind: "manual",
        description:
          account.kind === "brokerage"
            ? "The investments can move across as they are, or be sold first."
            : "Choose one of your PNC accounts, or a check by mail.",
        fields: [
          {
            id: "payout",
            label: "Pay it to",
            type: "choice",
            options:
              account.kind === "brokerage"
                ? [
                    { value: "transfer", label: "Move the investments to an account in my name" },
                    { value: "sell", label: "Sell them and deposit the cash" },
                  ]
                : [
                    { value: "deposit", label: "Deposit to one of my PNC accounts" },
                    { value: "check", label: "Mail me a check" },
                  ],
          },
        ],
      },
    ],
  } satisfies TransferFlow;
}

function custodianFlow(account: BankAccount, deceased: HouseholdPerson, you: HouseholdPerson) {
  const child = personById(account.owners[0]);
  return {
    id: `custodian:${account.id}`,
    title: `${firstName(child?.name ?? "Child")}'s ${account.name}`,
    accounts: [account],
    intro: `${firstName(deceased.name)} looked after this account for ${firstName(child?.name ?? "your child")}. The money stays theirs — the bank just needs a new adult on the account.`,
    reviewTime: "1–3 business days",
    outcome: `You now look after this account for ${firstName(child?.name ?? "your child")}.`,
    steps: [
      deathCertificateStep,
      {
        id: "custodian-form",
        title: "Change of custodian",
        kind: "autofill",
        description: "We've filled in the form. Please check it and sign.",
        prefill: [
          { label: "Account", value: accountLabel(account) },
          { label: "Owner", value: child?.name ?? "" },
          { label: "Previous custodian", value: deceased.name },
          { label: "New custodian", value: you.name },
        ],
        confirmLabel: "The details are correct and I sign this form electronically",
      },
    ],
  } satisfies TransferFlow;
}

/**
 * Every account the deceased owned or looked after, as `you` will meet it.
 * Items `you` act on come first; the rest explain who handles them.
 */
export function survivorPlan(
  deceased: HouseholdPerson,
  you: HouseholdPerson,
  accounts: BankAccount[],
  today: string,
): SurvivorItem[] {
  const first = firstName(deceased.name);
  const items: SurvivorItem[] = [];
  const adult = ageOn(you.birthdate, today) >= 18;

  const joint = accounts.filter(
    (a) => a.owners.length > 1 && a.owners.includes(deceased.id) && a.owners.includes(you.id),
  );
  if (joint.length) {
    const flow = jointFlow(joint, deceased, you);
    items.push({
      id: flow.id,
      title: flow.title,
      accounts: joint,
      route: "to-you",
      soon: true,
      summary: "Owned together, so it's already yours. Update the bank's records.",
      flow,
    });
  }

  for (const a of accounts) {
    if (a.custodian === deceased.id && !a.owners.includes(deceased.id) && adult) {
      const flow = custodianFlow(a, deceased, you);
      items.push({
        id: flow.id,
        title: flow.title,
        accounts: [a],
        route: "to-you",
        soon: true,
        summary: `Become the adult on ${firstName(personById(a.owners[0])?.name ?? "")}'s account.`,
        flow,
      });
    }
    if (a.owners.length !== 1 || a.owners[0] !== deceased.id) continue;
    const named = a.beneficiaries ?? [];

    if (a.kind === "credit-card") {
      items.push({
        id: a.id,
        title: a.name,
        accounts: [a],
        route: "close",
        soon: false,
        summary: `Paid from ${first}'s estate and closed. You don't owe this personally.`,
        steps: [
          "We've stopped interest and late fees on the card",
          "The executor pays the balance from the estate",
          "The card is closed",
        ],
      });
    } else if (named.includes(you.id)) {
      const retirement = a.kind === "ira" || a.kind === "roth";
      const insurance = a.kind === "life-insurance";
      const flow = retirement
        ? retirementFlow(a, deceased, you)
        : insurance
          ? undefined
          : claimFlow(a, deceased, you);
      items.push({
        id: flow?.id ?? a.id,
        title: a.name,
        accounts: [a],
        route: "to-you",
        soon: insurance || retirement || a.kind === "savings" || a.kind === "checking",
        summary: insurance
          ? `You're the beneficiary. Claim it directly with ${a.external ? "the insurer" : "PNC"}.`
          : `${first} named you as the beneficiary.`,
        flow,
        steps: insurance
          ? [
              "Call the insurance company to start a claim",
              "Send them a certified death certificate",
              "Complete their claim form and choose how to be paid",
            ]
          : undefined,
      });
    } else if (named.length) {
      items.push({
        id: a.id,
        title: a.name,
        accounts: [a],
        route: "to-others",
        soon: false,
        summary: `Passes to ${names(named)}, who ${named.length > 1 ? "were" : "was"} named as beneficiary.`,
        steps: ["Each beneficiary claims their share with a death certificate"],
      });
    } else {
      items.push({
        id: a.id,
        title: a.name,
        accounts: [a],
        route: "estate",
        soon: false,
        summary: `No beneficiary was named, so it goes through ${first}'s estate.`,
        steps: [
          "The court appoints the executor named in the will (or an administrator)",
          "The executor opens an estate account and moves the money there",
          "The executor pays any debts, then shares out what's left",
        ],
      });
    }
  }

  // What you act on, soonest first; then what others handle.
  const rank = (i: SurvivorItem) => (i.route === "to-you" ? (i.soon ? 0 : 1) : 2);
  return items.sort((x, y) => rank(x) - rank(y));
}
