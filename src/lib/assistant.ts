/**
 * The advisor's assistant — SIMULATED. There is no language model here: every
 * recommendation, briefing and answer is assembled by rules from the mock
 * client profile (src/data/clients.ts), so each sentence can be traced to the
 * data it cites in `basedOn` / `sources`. Pure functions only; UI lives in
 * components/advisor/.
 *
 * Legal routes, deadlines and citations come from the settlement rules engine
 * (src/lib/settlement); this file only writes the words around them.
 *
 * Guidance is general US practice for a prototype, not tax or legal advice.
 */
import { rulebook } from "@/data/settlement";
import type { AdvisorCustomer, ClientMember, ClientProfile, Holding } from "@/data/types";
import { lossContact, openLoss } from "@/lib/advisor";
import { daysBetween, formatCompactMoney, formatDate } from "@/lib/format";
import { settlementInputFromFacts } from "@/lib/settlement/adapters";
import { addDays } from "@/lib/settlement/dates";
import { settlementPlan, type SettlementPlan } from "@/lib/settlement/engine";
import { readinessReport, type ReadinessReport } from "@/lib/settlement/simulate";

// ---------------------------------------------------------------------------
// Facts about a client, shared by every assistant feature.

const firstName = (name: string) => name.split(" ")[0];
/** Lowercases only the first letter, so names inside a phrase keep their capitals. */
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const money = formatCompactMoney;
const list = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
const label = (h: Holding) => `${h.name}${h.last4 ? ` x${h.last4}` : ""}`;

const CASH_TYPES = ["Checking", "Savings", "Money market", "CD"];
const isRetirement = (h: Holding) => h.type.includes("IRA");

export type ClientFacts = ReturnType<typeof factsFor>;

/** How the survivor was related to the person who died, given the customer's view. */
const inverse: Record<string, string> = {
  Spouse: "spouse",
  Child: "parent",
  Parent: "child",
  Sibling: "sibling",
};

export function factsFor(c: AdvisorCustomer, profile: ClientProfile, today: string) {
  const loss = openLoss(c);
  // Deaths the bank records at runtime aren't in the static profile, so mark them here.
  const members = profile.members.map<ClientMember>((m) =>
    loss && m.name === loss.memberName
      ? { ...m, status: "Deceased", died: m.died ?? loss.date }
      : m,
  );
  const p: ClientProfile = { ...profile, members };
  const deceased = loss ? members.find((m) => m.name === loss.memberName) : undefined;
  // Who the advisor works with: the customer, or their next of kin when the customer died.
  const survivorName =
    loss?.relationship === "Self" ? (lossContact(c, loss)?.name ?? c.name) : c.name;
  const survivor = members.find((m) => m.name === survivorName);
  const relToSurvivor = !loss
    ? undefined
    : loss.relationship === "Self"
      ? (inverse[survivor?.relationship ?? ""] ?? "family member")
      : loss.relationship.toLowerCase();
  const pnc = p.holdings.filter((h) => !h.external);
  const living = members.filter((m) => m.status === "Living" && m.name !== survivorName);
  const owns = (h: Holding, name: string) => h.owners.includes(name);
  const cash = pnc.filter(
    (h) =>
      CASH_TYPES.includes(h.type) && !(deceased && h.owners.length === 1 && owns(h, deceased.name)),
  );
  return {
    c,
    p,
    today,
    first: firstName(survivorName),
    /** Full name of the person the advisor is working with. */
    self: survivorName,
    selfAge: survivor?.age ?? p.age,
    loss,
    deceased,
    /** e.g. "spouse": what the deceased was to the survivor. */
    relToSurvivor,
    isSpouseLoss: relToSurvivor === "spouse",
    daysSinceLoss: loss ? daysBetween(loss.date, today) : undefined,
    pnc,
    living,
    family: living.filter(
      (m) => m.relationship !== "Attorney" && m.relationship !== "Sibling-in-law",
    ),
    minors: living.filter((m) => (m.age ?? 99) < 18),
    cash,
    cashTotal: cash.reduce((s, h) => s + h.value, 0),
    /** The deceased's accounts, split by how they pass. */
    deceasedHoldings: deceased ? p.holdings.filter((h) => owns(h, deceased.name)) : [],
    attorney: p.members.find((m) => m.relationship === "Attorney"),
    lastInteraction: [...p.interactions].sort((a, b) => b.date.localeCompare(a.date))[0],
  };
}

const plans = new WeakMap<ClientFacts, SettlementPlan | undefined>();

/** The settlement rulebook's plan for the client's open loss (cached per facts object). */
export function lossPlan(f: ClientFacts): SettlementPlan | undefined {
  if (!plans.has(f)) {
    const input = settlementInputFromFacts(f);
    plans.set(f, input ? settlementPlan(input) : undefined);
  }
  return plans.get(f);
}

/** Source ids behind the plan's outcomes for these holdings, deduped. */
function rulesFor(plan: SettlementPlan | undefined, holdingIds: string[]): string[] {
  if (!plan) return [];
  const ids = plan.accounts
    .filter((a) => holdingIds.includes(a.holding.id))
    .flatMap((a) => a.sources);
  return ids.filter((x, i) => ids.indexOf(x) === i);
}

const citation = (id: string) => rulebook.sources[id]?.citation ?? id;

/** "…if not, the beneficiary can take it by their tax-filing deadline or, at the latest, Dec 31, 2027." */
function yodRmdSentence(plan: SettlementPlan | undefined, d: string, year: string) {
  const due = plan?.deadlines.find((x) => x.action.id === "yod-rmd")?.due;
  return due
    ? `Confirm whether ${d}'s ${year} RMD was taken; if not, the beneficiary can take it by their tax-filing deadline or, at the latest, ${formatDate(due, "medium")}.`
    : "";
}

// ---------------------------------------------------------------------------
// Asset recommendations.

export type RecPriority = "Now" | "This month" | "This quarter";
export type RecCategory =
  | "Estate"
  | "Beneficiaries"
  | "Retirement"
  | "Cash"
  | "Tax"
  | "Portfolio"
  | "Protection"
  | "Education";

export type Recommendation = {
  id: string;
  title: string;
  priority: RecPriority;
  category: RecCategory;
  rationale: string;
  actions: string[];
  /** The facts the assistant used, shown as "Based on". */
  basedOn: string[];
  /** Settlement rulebook source ids behind the legal parts of this recommendation. */
  sources?: string[];
};

const priorityOrder: RecPriority[] = ["Now", "This month", "This quarter"];

export function assetRecommendations(f: ClientFacts): Recommendation[] {
  const { c, p, deceased, loss, first } = f;
  const recs: Recommendation[] = [];
  const { self } = f;
  const plan = lossPlan(f);

  if (loss && deceased) {
    const d = firstName(deceased.name);
    const isSpouse = f.isSpouseLoss;

    recs.push({
      id: "pause",
      title: "Hold off on big decisions; secure a cash runway",
      priority: "Now",
      category: "Cash",
      rationale: `${first} lost their ${f.relToSurvivor} ${f.daysSinceLoss} days ago. Grief makes irreversible moves riskier, so keep the current allocation and avoid selling property or changing strategy for 6–12 months. ${f.cash.length ? `${first} already has ${money(f.cashTotal)} in cash accounts they can use.` : ""}`,
      actions: [
        "Confirm which account pays the household bills and keep it funded",
        "Agree a simple monthly budget for the next 6 months",
        `Book a no-decisions review around ${formatDate(addDays(loss.date, 90), "medium")}`,
      ],
      basedOn: [
        `Loss reported ${formatDate(loss.date, "medium")}`,
        ...f.cash.map((h) => `${label(h)}: ${money(h.value)}`),
      ],
    });

    const joint = f.deceasedHoldings.filter(
      (h) => h.ownership === "Joint" && h.owners.includes(self),
    );
    if (joint.length) {
      recs.push({
        id: "retitle",
        title: `Retitle ${joint.length} joint account${joint.length > 1 ? "s" : ""} to ${first}`,
        priority: "Now",
        category: "Estate",
        rationale: `These were held jointly with ${d}, so they pass to ${first} directly, without probate. Retitling keeps bill pay and transfers working in ${first}'s name alone.`,
        actions: [
          "Collect a certified death certificate",
          `Verify ${first}'s ID and retitle each account`,
          "Keep account numbers the same where possible so autopays don't break",
        ],
        basedOn: joint.map((h) => `${label(h)} · joint with ${d} · ${money(h.value)}`),
        sources: rulesFor(
          plan,
          joint.map((h) => h.id),
        ),
      });
    }

    const tod = f.deceasedHoldings.filter(
      (h) =>
        h.ownership === "Individual" &&
        !isRetirement(h) &&
        h.type !== "Credit card" &&
        h.type !== "Life insurance" &&
        !h.external &&
        (h.beneficiaries?.length ?? 0) > 0,
    );
    for (const h of tod) {
      recs.push({
        id: `tod-${h.id}`,
        title: `Transfer ${label(h)} to ${list(h.beneficiaries!.map(firstName))}`,
        priority: "This month",
        category: "Tax",
        rationale: `It has a payable- or transfer-on-death designation, so it skips probate. ${h.type === "Brokerage" ? `Cost basis generally steps up to the value on ${formatDate(loss.date, "medium")}, so gains built up during ${d}'s life aren't taxed when sold — a reason not to rush trades before the new basis is recorded.` : ""}`,
        actions: [
          "Submit the beneficiary claim form with a death certificate",
          ...(h.type === "Brokerage" ? ["Record date-of-death values for the new cost basis"] : []),
        ],
        basedOn: [
          `${label(h)} · ${money(h.value)} · beneficiaries: ${h.beneficiaries!.join(", ")}`,
        ],
        sources: rulesFor(plan, [h.id]),
      });
    }

    for (const h of f.deceasedHoldings.filter(isRetirement)) {
      const bens = h.beneficiaries ?? [];
      const spouseIsBen = isSpouse && bens[0] === self;
      const selfIsBen = bens.includes(self);
      if (!selfIsBen && !spouseIsBen) continue;
      recs.push(
        spouseIsBen
          ? {
              id: `ira-${h.id}`,
              title: `Decide how ${first} takes over ${d}'s ${h.type}`,
              priority: "This month",
              category: "Retirement",
              rationale:
                f.selfAge < 60
                  ? `As the surviving spouse, ${first} can roll it into their own IRA or keep it as an inherited IRA. At ${f.selfAge}, an inherited IRA keeps penalty-free access before 59½.`
                  : `As the surviving spouse, ${first} can roll it into their own IRA (simplest, and required withdrawals follow ${first}'s age) or keep it as an inherited IRA. There's no deadline pressure for this decision.`,
              actions: [
                "Compare rollover vs inherited IRA with projected required withdrawals",
                ...(h.contingentBeneficiaries?.[0]
                  ? [
                      `Note ${firstName(h.contingentBeneficiaries[0])} is the contingent beneficiary`,
                    ]
                  : []),
              ],
              basedOn: [
                `${label(h)} · ${money(h.value)} · beneficiaries: ${bens.join(", ")}${h.contingentBeneficiaries?.length ? ` (contingent: ${h.contingentBeneficiaries.join(", ")})` : ""}`,
                `${first} is ${f.selfAge}`,
              ],
              sources: rulesFor(plan, [h.id]),
            }
          : {
              id: `ira-${h.id}`,
              title: `Set up inherited IRA${bens.length > 1 ? "s" : ""} from ${label(h)}`,
              priority: "This month",
              category: "Retirement",
              rationale: `${first} is a non-spouse beneficiary, so the account generally must be emptied within 10 years. ${plan?.accounts.find((a) => a.holding.id === h.id)?.overlays.some((o) => o.id === "ov.annual-rmds") ? `${d} was ${deceased.age} and had likely begun required withdrawals, so annual withdrawals probably continue.` : ""} ${h.type === "Roth IRA" ? "" : yodRmdSentence(plan, d, loss.date.slice(0, 4))} ${bens.length > 1 ? `With ${bens.length} beneficiaries, split it into separate inherited IRAs by ${formatDate(plan?.deadlines.find((x) => x.action.id === "separate-accounts")?.due ?? `${Number(loss.date.slice(0, 4)) + 1}-12-31`, "medium")}.` : ""}`,
              actions: [
                "Open an inherited IRA for each beneficiary",
                "Plan withdrawals across the 10 years to smooth the tax bill",
              ],
              basedOn: [
                `${label(h)} · ${money(h.value)} · beneficiaries: ${bens.join(", ")}`,
                `${d} was ${deceased.age}`,
              ],
              sources: rulesFor(plan, [h.id]),
            },
      );
    }

    const probate = f.deceasedHoldings.filter(
      (h) =>
        h.ownership === "Individual" &&
        !isRetirement(h) &&
        h.type !== "Credit card" &&
        !h.beneficiaries?.length &&
        h.type !== "529 plan" &&
        !h.external,
    );
    const executor = p.members.find((m) => m.roles.some((r) => r.startsWith("Executor")));
    if (probate.length) {
      recs.push({
        id: "probate",
        title: `Open an estate account for ${d}'s probate assets`,
        priority: "This month",
        category: "Estate",
        rationale: `${list(probate.map(label))} ${probate.length > 1 ? "have" : "has"} no beneficiary, so ${probate.length > 1 ? "they pass" : "it passes"} under ${d}'s will through probate. ${executor ? `${executor.name === self ? first : executor.name} is the executor and will need letters testamentary to act.` : ""}`,
        actions: [
          "Get the estate's tax ID (EIN)",
          "Open the estate account once letters testamentary are issued",
          ...(f.attorney ? [`Coordinate with ${f.attorney.name}`] : []),
        ],
        basedOn: probate.map((h) => `${label(h)} · ${money(h.value)} · no beneficiary`),
        sources: rulesFor(
          plan,
          probate.map((h) => h.id),
        ),
      });
    }

    const trust = f.deceasedHoldings.find((h) => h.type === "Trust");
    if (trust) {
      recs.push({
        id: "trust",
        title: `Confirm ${first} as sole trustee of ${trust.name}`,
        priority: "This month",
        category: "Estate",
        rationale: `${d} was a co-trustee. Check whether the trust splits into separate shares at the first death before moving anything.`,
        actions: [
          "Request a certification of trust",
          "Review the trust's first-death provisions with the attorney",
        ],
        basedOn: [`${label(trust)} · ${money(trust.value)} · trustees: ${trust.owners.join(", ")}`],
        sources: rulesFor(plan, [trust.id]),
      });
    }

    const plan529 = f.deceasedHoldings.find((h) => h.type === "529 plan");
    if (plan529) {
      recs.push({
        id: "529",
        title: `Name a new owner for the 529 plan`,
        priority: "This month",
        category: "Education",
        rationale: `${d} owned it for ${list(plan529.beneficiaries ?? [])}. Without a successor owner, the plan may need court approval to keep it in the family.`,
        actions: [`Make ${first} the owner`, "Name a successor owner this time"],
        basedOn: [`${label(plan529)} · ${money(plan529.value)}`],
        sources: rulesFor(plan, [plan529.id]),
      });
    }

    const life = f.deceasedHoldings.find((h) => h.type === "Life insurance");
    if (life) {
      recs.push({
        id: "life",
        title: `File the ${money(life.value)} life insurance claim`,
        priority: "Now",
        category: "Protection",
        rationale: `${d}'s policy names ${list(life.beneficiaries ?? [])}. Park the proceeds in an insured, liquid account until ${first} is ready to decide.`,
        actions: [
          "Request the claim form from the insurer",
          "Plan to hold proceeds in the money market for now",
        ],
        basedOn: [`${label(life)} · held outside PNC`],
        sources: rulesFor(plan, [life.id]),
      });
    }

    const card = f.deceasedHoldings.find((h) => h.type === "Credit card");
    if (card) {
      recs.push({
        id: "card",
        title: `Close ${d}'s ${card.name}`,
        priority: "Now",
        category: "Estate",
        rationale: `It's an individual card, so the balance is settled by the estate — ${first} isn't personally responsible. Stop autopays first.`,
        actions: ["Close the card to new charges", "Send the final statement to the executor"],
        basedOn: [`${label(card)} · balance ${money(card.value)}`],
        sources: rulesFor(plan, [card.id]),
      });
    }
  }

  // The client's own designations that name someone who has died, or no one.
  const stale = f.pnc.filter(
    (h) =>
      h.owners.includes(self) &&
      h.owners.length === 1 &&
      h.beneficiaries?.some((b) => p.members.find((m) => m.name === b)?.status === "Deceased"),
  );
  if (stale.length) {
    recs.push({
      id: "update-bens",
      title: `Update beneficiaries that still name ${list(
        stale
          .flatMap((h) => h.beneficiaries!)
          .filter((b) => p.members.find((m) => m.name === b)?.status === "Deceased")
          .map(firstName)
          .filter((v, i, a) => a.indexOf(v) === i),
      )}`,
      priority: loss ? "This month" : "Now",
      category: "Beneficiaries",
      rationale: `If nothing changes, ${list(stale.map(label))} would pass under ${first}'s estate instead of directly to family.`,
      actions: [
        "Send new beneficiary forms",
        ...(f.minors.length
          ? [
              `Name a trust or custodian for ${list(f.minors.map((m) => firstName(m.name)))} rather than a minor directly`,
            ]
          : []),
      ],
      basedOn: stale.map((h) => `${label(h)} · beneficiary: ${h.beneficiaries!.join(", ")}`),
      sources: rulesFor(
        plan,
        stale.map((h) => h.id),
      ),
    });
  }

  const missing = f.pnc.filter(
    (h) =>
      (isRetirement(h) || h.type === "Brokerage") &&
      h.beneficiaries &&
      h.beneficiaries.length === 0 &&
      h.owners.includes(self),
  );
  if (missing.length) {
    recs.push({
      id: "no-bens",
      title: `Add beneficiaries to ${missing.length} account${missing.length > 1 ? "s" : ""}`,
      priority: "This quarter",
      category: "Beneficiaries",
      rationale: `${list(missing.map(label))} ${missing.length > 1 ? "have" : "has"} no beneficiary, so ${missing.length > 1 ? "they'd" : "it'd"} go through probate.`,
      actions: [
        "Send beneficiary designation forms",
        "Add transfer-on-death to brokerage accounts",
      ],
      basedOn: missing.map((h) => `${label(h)} · ${money(h.value)} · no beneficiary`),
    });
  }

  if (f.minors.length && !loss) {
    const has529 = f.pnc.some((h) => h.type === "529 plan");
    if (!has529) {
      recs.push({
        id: "education",
        title: `Start a 529 for ${list(f.minors.map((m) => firstName(m.name)))}`,
        priority: "This quarter",
        category: "Education",
        rationale:
          "There's a minor child in the household and no education savings account on file.",
        actions: ["Show projected costs and a monthly contribution"],
        basedOn: f.minors.map((m) => `${m.name}, ${m.age}`),
      });
    }
  }

  const idle = f.cash.filter((h) => h.type !== "CD");
  const idleTotal = idle.reduce((s, h) => s + h.value, 0);
  if (!loss && idleTotal > 250_000 && idleTotal / c.relationshipValue > 0.18) {
    recs.push({
      id: "idle-cash",
      title: `Put ${money(idleTotal - 0.06 * c.relationshipValue)} of idle cash to work`,
      priority: "This month",
      category: "Portfolio",
      rationale: `${Math.round((idleTotal / c.relationshipValue) * 100)}% of the relationship is in checking and money market. For a ${p.riskProfile.toLowerCase()} profile, keep about 6% as a reserve and ladder or invest the rest against ${first}'s goals.`,
      actions: [
        "Propose a Treasury or CD ladder for near-term needs",
        `Invest the rest in line with the ${p.riskProfile.toLowerCase()} model`,
      ],
      basedOn: [
        ...idle.map((h) => `${label(h)}: ${money(h.value)}`),
        `Goals: ${p.goals.join("; ")}`,
      ],
    });
  }

  return recs.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
}

// ---------------------------------------------------------------------------
// Loss briefing: the guide for approaching a bereaved client and their heirs.

export type GuideStep = { label: string; detail: string };
export type GuidePhase = { title: string; window: string; steps: GuideStep[] };

export type Heir = {
  member: ClientMember;
  /** What they stand to receive or do. */
  stake: string[];
  approach: string[];
};

export type LossBriefing = {
  headline: string;
  summary: string;
  deceased: ClientMember;
  deceasedValue: number;
  /** Section title for approaching the client, e.g. "Approaching Morgan, the surviving spouse". */
  approachTitle: string;
  opening: string;
  doList: string[];
  avoidList: string[];
  heirs: Heir[];
  phases: GuidePhase[];
  personalized: string[];
};

export function lossBriefing(f: ClientFacts): LossBriefing | undefined {
  const { c, p, loss, deceased, first } = f;
  if (!loss || !deceased) return undefined;
  const d = firstName(deceased.name);
  const isSpouse = f.isSpouseLoss;
  const rel = f.relToSurvivor ?? "family member";
  const total = f.deceasedHoldings.filter((h) => !h.external).reduce((s, h) => s + h.value, 0);
  const pncCount = f.deceasedHoldings.filter((h) => !h.external).length;
  const selfMember = p.members.find((m) => m.name === f.self);
  const executorRole = selfMember?.roles.find((r) => r.startsWith("Executor"));

  // Everyone with a stake in the deceased's assets, other than the client.
  const heirNames = new Set<string>();
  for (const h of f.deceasedHoldings)
    for (const b of [...(h.beneficiaries ?? []), ...(h.contingentBeneficiaries ?? [])])
      heirNames.add(b);
  for (const m of p.members)
    if (m.roles.some((r) => /heir|beneficiar/i.test(r))) heirNames.add(m.name);
  if (isSpouse)
    for (const m of f.family.filter((m) => m.relationship === "Child")) heirNames.add(m.name);
  heirNames.delete(f.self);
  heirNames.delete(deceased.name);

  const heirs: Heir[] = [...heirNames]
    .map((name) => p.members.find((m) => m.name === name))
    .filter((m): m is ClientMember => !!m && m.status === "Living")
    .map((m) => {
      const stake = [
        ...f.deceasedHoldings
          .filter((h) => h.beneficiaries?.includes(m.name))
          .map((h) => `Beneficiary of ${label(h)}`),
        ...f.deceasedHoldings
          .filter((h) => h.contingentBeneficiaries?.includes(m.name))
          .map((h) => `Contingent beneficiary of ${label(h)}`),
        ...m.roles,
      ].filter((v, i, a) => a.indexOf(v) === i);
      const minor = (m.age ?? 99) < 18;
      const approach = minor
        ? [
            `${firstName(m.name)} is ${m.age}. Don't contact them directly — everything goes through ${first} as parent and guardian.`,
            "Minors can't take assets outright; make sure anything left to them goes to a custodian or the trust.",
            `If ${first} asks, offer to explain the accounts to ${firstName(m.name)} later, when they're ready.`,
          ]
        : !isSpouse && m.relationship === "Sibling"
          ? [
              `${firstName(m.name)} isn't a client. ${executorRole ? `${first} is the executor, so let ${first} decide what to share and when.` : ""}`,
              `Offer ${first} a joint call so both heirs hear the same thing at the same time — it prevents mistrust later.`,
              "Introduce yourself as a resource for the inherited accounts, not as a sales contact.",
            ]
          : [
              `Reach out with condolences once ${first} has been contacted.`,
              "Explain what they're due and the paperwork they'll sign, in writing.",
              "Ask how they'd like to receive their share before opening anything.",
            ];
      return { member: m, stake: stake.length ? stake : ["Heir under the will"], approach };
    });

  const personalized: string[] = [];
  if (isSpouse && /investment|invest/i.test(p.notes.join(" "))) {
    personalized.push(
      `${d} made the investment decisions. Expect ${first} to be unfamiliar with some accounts; walk through them one at a time and leave a one-page summary.`,
    );
  }
  if (p.contactPreference === "Email")
    personalized.push(`${first} prefers email. Send a short written checklist before any call.`);
  if (p.contactPreference === "Phone")
    personalized.push(
      `${first} prefers a phone call${/morning/i.test(p.notes.join(" ")) ? " in the morning" : ""}. Don't open with email.`,
    );
  const support = p.members.find((m) => m.relationship === "Sibling-in-law");
  if (support)
    personalized.push(
      `${support.name} is staying with ${first}. Offer to include them on calls as a second listener.`,
    );
  if (f.minors.length)
    personalized.push(
      `${list(f.minors.map((m) => `${m.name} (${m.age})`))} is a minor heir. Plan custodial or trust arrangements before any transfer.`,
    );
  if (executorRole)
    personalized.push(
      `${first} is the ${lcFirst(executorRole)} while grieving. Offer to coordinate directly with ${f.attorney?.name ?? "the estate attorney"} to lighten the load.`,
    );
  const deathMonth = Number(loss.date.slice(5, 7));
  if (deathMonth >= 10)
    personalized.push(
      `The first holidays come within weeks. Avoid scheduling paperwork the week of Thanksgiving and check in before December.`,
    );
  const rmd = yodRmdSentence(lossPlan(f), d, loss.date.slice(0, 4));
  if (rmd)
    personalized.push(`${deceased.age !== undefined ? `${d} was ${deceased.age}. ` : ""}${rmd}`);

  return {
    headline: `${deceased.name} died ${f.daysSinceLoss === 0 ? "today" : `${f.daysSinceLoss} days ago`}`,
    summary: `${first}'s ${rel}, ${deceased.name}${deceased.age ? ` (${deceased.age})` : ""}, died on ${formatDate(loss.date, "medium")}; reported by ${loss.reportedVia.toLowerCase()}. ${d} owned or co-owned ${f.deceasedHoldings.filter((h) => !h.external).length} PNC accounts worth ${money(total)}. ${isSpouse ? `${first} is now the sole decision-maker on a ${money(c.relationshipValue)} relationship.` : executorRole ? `${first} is the executor of ${d}'s estate.` : ""}`,
    deceased,
    deceasedValue: total,
    approachTitle: isSpouse
      ? `Approaching ${first}, the surviving spouse`
      : `Approaching ${first}${executorRole ? ", the grieving child and executor" : ""}`,
    opening: isSpouse
      ? `"${first}, I was so sorry to hear about ${d}. I'm not calling about accounts today. I wanted you to know I'm here, and that nothing needs to be decided right now. When you're ready, I'll walk you through everything, one step at a time."`
      : `"${first}, I'm very sorry about your ${rel}. I know you're carrying the estate as well as the loss. I'd like to make that part lighter — whenever you're ready, I can put together a simple checklist and handle the PNC side with ${f.attorney?.name ?? "your attorney"}."`,
    doList: [
      "Lead with condolences; let them set the pace",
      `Say ${d}'s name — it's usually welcome`,
      "Confirm what's urgent (bills, income) and what can wait",
      "Follow up in writing, briefly",
      "Check in at 30 days, 90 days and the first anniversary",
    ],
    avoidList: [
      "Talking about products, performance or new money",
      "Pushing decisions in the first weeks",
      'Clichés like "everything happens for a reason"',
      "Contacting other family members before the client agrees",
    ],
    heirs,
    phases: [
      {
        title: "First 72 hours",
        window: `By ${formatDate(addDays(loss.date, 3), "medium")}`,
        steps: [
          {
            label: "Call to offer condolences",
            detail: "No account talk unless they bring it up.",
          },
          {
            label: "Flag the death on the accounts",
            detail: `Stops fraud on ${d}'s accounts; keeps joint accounts working for ${first}.`,
          },
          {
            label: "Pause marketing and automated outreach",
            detail: "Including statements addressed to the deceased where possible.",
          },
        ],
      },
      {
        title: "Weeks 1–4",
        window: `By ${formatDate(addDays(loss.date, 30), "medium")}`,
        steps: [
          {
            label: "Request certified death certificates",
            detail: "Suggest ordering 10 or more; each institution keeps one.",
          },
          {
            label: "Make an inventory of the accounts",
            detail: `${pncCount} PNC account${pncCount === 1 ? " involves" : "s involve"} ${d}; share a one-page list.`,
          },
          {
            label: "Handle what passes directly",
            detail: "Retitle joint accounts and start beneficiary claims.",
          },
        ],
      },
      {
        title: "Months 1–3",
        window: `By ${formatDate(addDays(loss.date, 90), "medium")}`,
        steps: [
          {
            label: "Settle retirement accounts",
            detail: "Rollover or inherited IRA decisions, one beneficiary at a time.",
          },
          {
            label: "Support probate and the estate account",
            detail: executorRole
              ? `${first} is the executor; coordinate with the attorney.`
              : "Coordinate with the executor and attorney.",
          },
          {
            label: "Update the survivors' own plans",
            detail: "Beneficiaries, will and powers of attorney that named the deceased.",
          },
        ],
      },
      {
        title: "Months 3–12",
        window: `Through ${formatDate(addDays(loss.date, 365), "medium")}`,
        steps: [
          {
            label: "Revisit the financial plan",
            detail: "Income needs, allocation and goals, now that things have settled.",
          },
          {
            label: "File final and estate tax returns",
            detail: `${d}'s final income tax return and, if needed, the estate's return.`,
          },
          { label: "Mark the first anniversary", detail: "A short personal note goes a long way." },
        ],
      },
    ],
    personalized,
  };
}

// ---------------------------------------------------------------------------
// Ask the assistant about a client.

export type Answer = {
  paragraphs: string[];
  /** The client data the answer used. */
  sources: string[];
  followUps: string[];
  /** Settlement rulebook source ids (the law behind the answer), shown as citations. */
  rules?: string[];
  /** The answer came from the settlement rulebook. */
  usedRulebook?: boolean;
};

export function suggestedQuestions(f: ClientFacts): string[] {
  const qs = [`Summarize ${f.first} for me`];
  if (f.loss)
    qs.push(
      `How should I approach ${f.first} right now?`,
      "What are the key deadlines?",
      `Who inherits from ${firstName(f.deceased?.name ?? "")}?`,
    );
  qs.push("Which beneficiary designations need attention?");
  if (f.pnc.some(isRetirement)) qs.push("What should happen with the retirement accounts?");
  qs.push("How much cash do they have available?", "When did we last talk, and what's next?");
  // Always offer the what-if, replacing the lowest-priority questions if needed.
  return [...qs.slice(0, 5), `What if ${f.first} died today?`];
}

const uniqIds = (ids: string[]) => ids.filter((x, i) => ids.indexOf(x) === i);

/** Readiness reports for everyone worth simulating in this household. */
function readinessFor(f: ClientFacts): ReadinessReport[] {
  return f.p.members
    .filter(
      (m) =>
        m.status === "Living" &&
        m.relationship !== "Attorney" &&
        m.relationship !== "Sibling-in-law" &&
        f.pnc.some((h) => h.owners.includes(m.name)),
    )
    .map((m) => readinessReport(f.c, f.p, m.name, f.today));
}

/** Who can answer an open question the rulebook raised. */
function whoKnows(key: string, f: ClientFacts): string {
  if (key.includes("reclamation")) return "Operations, from the account's deposit history";
  if (key.includes("yod-rmd")) return `${f.first} or the prior year's IRA statements`;
  if (key.includes("disability")) return "the beneficiaries, through the attorney";
  if (key.includes("successor-trustee")) return "the trust document and the estate attorney";
  if (key.includes("successor-owner")) return "the 529 plan's records";
  return f.attorney?.name ?? "the estate attorney";
}

/** Answers that come from the settlement rulebook, or undefined to fall through. */
function rulebookAnswer(f: ClientFacts, question: string): Answer | undefined {
  const q = question.toLowerCase();
  const { first } = f;
  const plan = lossPlan(f);
  const self = () => readinessReport(f.c, f.p, f.self, f.today);
  const plans = () => [...(plan ? [plan] : []), ...readinessFor(f).map((r) => r.plan)];

  // An open question raised by the plan ("Ask" in the Transition plan).
  for (const p of plans()) {
    const open = p.openQuestions.find((x) => x.question.toLowerCase() === q.trim());
    if (open)
      return {
        paragraphs: [
          `I don't have that in ${first}'s records. Confirm it with ${whoKnows(open.key, f)}; until then the plan assumes the cautious option.`,
        ],
        sources: ["Settlement plan: open questions"],
        followUps: ["What are the key deadlines?", `What if ${first} died today?`],
        usedRulebook: true,
      };
  }

  // "Why: <finding title>?" from the what-if's "Ask about this".
  const why = question.match(/^why:\s*(.+?)\??$/i);
  if (why) {
    for (const r of readinessFor(f)) {
      const finding = r.findings.find((x) => x.title.toLowerCase() === why[1].trim().toLowerCase());
      if (finding)
        return {
          paragraphs: [
            `If ${firstName(r.person)} died today: ${finding.detail}`,
            `Fix: ${finding.fix}.`,
          ],
          sources: [`What-if for ${r.person}`],
          rules: finding.sources,
          followUps: [
            "Which beneficiary designations need attention?",
            "Draft an outreach message",
          ],
          usedRulebook: true,
        };
    }
  }

  if (/deadline|key date|due date|when (is|are).*(due|file)/.test(q)) {
    if (!plan)
      return {
        paragraphs: [
          `There's no loss on file for ${first}, so no settlement dates are running. Ask "What if ${first} died today?" to see the dates a death would start.`,
        ],
        sources: [],
        followUps: [`What if ${first} died today?`],
        usedRulebook: true,
      };
    const upcoming = plan.deadlines.filter((d) => d.due! >= f.today).slice(0, 8);
    return {
      paragraphs: [
        `Counted from ${firstName(plan.deceased.name)}'s date of death, ${formatDate(plan.deceased.dateOfDeath, "medium")}:`,
        ...upcoming.map(
          (d) =>
            `${formatDate(d.due!, "medium")} — ${d.action.deadline!.label} (${d.action.deadline!.kind === "statutory" ? "set by law" : d.action.deadline!.kind}).`,
        ),
      ],
      sources: [`Settlement rulebook v${plan.rulebookVersion}`],
      rules: uniqIds(upcoming.flatMap((d) => d.action.sources)),
      followUps: ["Why does anything go to probate?", "Which rules does this rely on?"],
      usedRulebook: true,
    };
  }

  if (/why.*probate|go(es)? (to|through) probate|what goes to probate/.test(q)) {
    const p = plan ?? self().plan;
    const probate = p.accounts.filter((a) => a.outcome.probate);
    return {
      paragraphs: probate.length
        ? [
            `${plan ? "" : `If ${first} died today: `}${money(p.totals.probate)} goes through probate.`,
            ...probate.map(
              (a) =>
                `${label(a.holding)}: ${a.trace.map((t) => t.answer.toLowerCase()).join(" → ")} → ${a.title.toLowerCase()}.`,
            ),
          ]
        : [
            `Nothing goes through probate at PNC${plan ? "" : ` if ${first} died today`}. ${money(p.totals.outsideProbate)} passes outside probate, ${money(p.totals.uninterrupted)} of it with no paperwork.`,
          ],
      sources: [`Settlement rulebook v${p.rulebookVersion}`],
      rules: uniqIds(probate.flatMap((a) => a.sources)),
      followUps: ["What are the key deadlines?", "Which rules does this rely on?"],
      usedRulebook: true,
    };
  }

  if (/(?<!-)\blaw\b|statute|regulation|legal basis|cite|which rule/.test(q)) {
    const p = plan ?? self().plan;
    const counts = new Map<string, number>();
    for (const a of p.accounts) for (const s of a.sources) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const h of p.household)
      for (const s of h.rule.sources) counts.set(s, (counts.get(s) ?? 0) + 1);
    const top = [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
    return {
      paragraphs: top.map((id) => `${citation(id)} — ${rulebook.sources[id].summary}`),
      sources: [`Settlement rulebook v${p.rulebookVersion}`],
      rules: top,
      followUps: ["What are the key deadlines?", "Why does anything go to probate?"],
      usedRulebook: true,
    };
  }

  if (/what if|if .* (died|passed)|simulat|readiness/.test(q)) {
    const reports = readinessFor(f);
    const named =
      reports.find((r) => q.includes(r.person.toLowerCase())) ??
      reports.find((r) => q.includes(firstName(r.person).toLowerCase()));
    const r = named ?? reports.find((x) => x.person === f.self) ?? reports[0];
    if (!r)
      return {
        paragraphs: ["Nobody in this household owns an account at PNC to simulate."],
        sources: [],
        followUps: [],
        usedRulebook: true,
      };
    const p = firstName(r.person);
    const status = { ready: "Ready", gaps: "Some gaps", exposed: "Exposed" }[r.status];
    return {
      paragraphs: [
        `${status}. If ${p} died today, ${money(r.plan.totals.probate)} would go through probate and ${money(r.plan.totals.outsideProbate)} would pass outside it.`,
        ...r.findings.slice(0, 3).map((x) => `${x.title}. Fix: ${x.fix}.`),
        ...(r.findings.length ? [] : ["Every account would pass the way it's set up."]),
      ],
      sources: [`What-if for ${r.person}`, `Settlement rulebook v${r.plan.rulebookVersion}`],
      rules: uniqIds(r.findings.slice(0, 3).flatMap((x) => x.sources)),
      followUps: [
        "Which beneficiary designations need attention?",
        "Which rules does this rely on?",
      ],
      usedRulebook: true,
    };
  }
  return undefined;
}

export function answerQuestion(f: ClientFacts, question: string): Answer {
  const q = question.toLowerCase();
  const { c, p, first } = f;
  const briefing = lossBriefing(f);
  const recs = assetRecommendations(f);

  // "Why: <recommendation title>?" from a recommendation's "Ask about this".
  const why = question.match(/^why:\s*(.+?)\??$/i);
  const rec = why && recs.find((r) => r.title.toLowerCase() === why[1].trim().toLowerCase());
  if (rec) {
    return {
      paragraphs: [rec.rationale, `What to do: ${rec.actions.join("; ")}.`],
      sources: rec.basedOn,
      rules: rec.sources,
      followUps: ["What's urgent in the first month?", "Draft an outreach message"],
      usedRulebook: !!rec.sources?.length,
    };
  }
  const fromRules = rulebookAnswer(f, question);
  if (fromRules) return fromRules;
  if (/heir/.test(q) && /approach|talk|contact|reach/.test(q) && briefing) {
    return {
      paragraphs: briefing.heirs.length
        ? briefing.heirs.map((h) => `${h.member.name}: ${h.approach.join(" ")}`)
        : ["No other heirs are named on the accounts."],
      sources: ["Family members", "Beneficiary designations"],
      followUps: [`How should I approach ${first} right now?`, "What's urgent in the first month?"],
    };
  }
  if (/approach|say|grie|condolen|talk to|reach out|sensitiv/.test(q) && briefing) {
    return {
      paragraphs: [
        `Lead with care, not accounts. Something like: ${briefing.opening}`,
        `Do: ${briefing.doList.slice(0, 3).join("; ")}. Avoid: ${briefing.avoidList.slice(0, 2).join("; ")}.`,
        ...briefing.personalized.slice(0, 2),
      ],
      sources: ["Loss event", "Contact preference", "Profile notes"],
      followUps: [
        `Who inherits from ${firstName(briefing.deceased.name)}?`,
        "What's urgent in the first month?",
      ],
    };
  }
  if (/inherit|heir|who gets|estate/.test(q) && briefing) {
    return {
      paragraphs: [
        briefing.summary,
        ...briefing.heirs.map(
          (h) =>
            `${h.member.name} (${h.member.relationship.toLowerCase()}${h.member.age ? `, ${h.member.age}` : ""}): ${h.stake.join("; ")}.`,
        ),
      ],
      sources: ["Holdings and beneficiary designations", "Family members"],
      followUps: [
        "How should I approach the heirs?",
        "Which beneficiary designations need attention?",
      ],
    };
  }
  if (/urgent|first month|next step|to.?do|priorit/.test(q)) {
    const now = recs.filter((r) => r.priority === "Now");
    return {
      paragraphs: now.length
        ? [
            `${now.length} thing${now.length > 1 ? "s" : ""} to do now:`,
            ...now.map((r) => `${r.title}. ${r.actions[0]}.`),
          ]
        : [
            `Nothing urgent for ${first}. The top item is: ${recs[0]?.title ?? "a routine check-in"}.`,
          ],
      sources: ["Asset recommendations"],
      followUps: ["Draft an outreach message", "Which beneficiary designations need attention?"],
    };
  }
  if (/beneficiar|designation|tod|pod/.test(q)) {
    const rows = f.pnc.filter((h) => h.beneficiaries !== undefined);
    const flagged = recs.filter((r) => r.category === "Beneficiaries");
    return {
      paragraphs: [
        ...rows.map(
          (h) =>
            `${label(h)}: ${h.beneficiaries!.length ? h.beneficiaries!.map((b) => (p.members.find((m) => m.name === b)?.status === "Deceased" ? `${b} (deceased)` : b)).join(", ") : "none on file"}.`,
        ),
        flagged.length
          ? `Needs attention: ${flagged.map((r) => lcFirst(r.title)).join("; ")}.`
          : "Every designation names a living person.",
      ],
      sources: rows.map(label),
      followUps: ["What should happen with the retirement accounts?", "Summarize the family"],
    };
  }
  if (/ira|retire|rmd|401|roth/.test(q)) {
    const accts = f.pnc.filter(isRetirement);
    const recsR = recs.filter((r) => r.category === "Retirement");
    return {
      paragraphs: [
        accts.length
          ? `${first}'s household has ${accts.length} retirement account${accts.length > 1 ? "s" : ""}: ${accts.map((h) => `${label(h)} (${money(h.value)}, owner ${h.owners[0]})`).join("; ")}.`
          : "No retirement accounts at PNC.",
        ...recsR.map((r) => `${r.title}: ${r.rationale}`),
      ],
      sources: accts.map(label),
      followUps: [
        "Which beneficiary designations need attention?",
        "How much cash do they have available?",
      ],
    };
  }
  if (/cash|liquid|runway|spend|money market|idle/.test(q)) {
    return {
      paragraphs: [
        `${first} has ${money(f.cashTotal)} in cash accounts they control: ${f.cash.map((h) => `${label(h)} ${money(h.value)}`).join("; ")}.`,
        f.loss
          ? "That's a comfortable runway while the estate settles; there's no need to sell investments for living costs."
          : `That's ${Math.round((f.cashTotal / c.relationshipValue) * 100)}% of the relationship.`,
        ...recs.filter((r) => r.id === "idle-cash").map((r) => r.rationale),
      ],
      sources: f.cash.map(label),
      followUps: ["What's urgent in the first month?", "Draft an outreach message"],
    };
  }
  if (/will|probate|executor|trust/.test(q)) {
    return {
      paragraphs: [
        `Will on file at PNC: ${c.will.status === "on-file" ? `yes${c.will.updated ? `, saved ${formatDate(c.will.updated, "medium")}` : ""}` : c.will.status === "in-progress" ? "started, not finished" : "no"}.`,
        ...p.members.filter((m) => m.roles.length).map((m) => `${m.name}: ${m.roles.join("; ")}.`),
        ...recs
          .filter((r) => r.category === "Estate")
          .slice(0, 2)
          .map((r) => `${r.title}. ${r.rationale}`),
      ],
      sources: ["Will status", "Family roles"],
      followUps: ["Who inherits?", "Summarize the family"],
    };
  }
  if (/family|child|kid|son|daughter|spouse|wife|husband|who/.test(q)) {
    return {
      paragraphs: p.members
        .filter((m) => m.relationship !== "Self")
        .map(
          (m) =>
            `${m.name} — ${m.relationship.toLowerCase()}${m.age ? `, ${m.age}` : ""}${m.status === "Deceased" ? `, died ${formatDate(m.died ?? "", "medium")}` : ""}.${m.note ? ` ${m.note}` : ""}`,
        ),
      sources: ["Family members"],
      followUps: f.loss
        ? ["How should I approach the heirs?"]
        : ["Which beneficiary designations need attention?"],
    };
  }
  if (/last|contact|spoke|talk|call|meet|review|next/.test(q)) {
    const li = f.lastInteraction;
    return {
      paragraphs: [
        li
          ? `Last contact ${formatDate(li.date, "medium")} by ${li.channel.toLowerCase()}: ${li.summary}`
          : "No interactions logged.",
        `Next review is ${formatDate(c.nextReview, "medium")}. ${first} prefers ${p.contactPreference.toLowerCase()}.`,
      ],
      sources: ["Interaction log", "Contact preference"],
      followUps: ["Draft an outreach message", "What's urgent?"],
    };
  }
  if (/risk|allocat|portfolio|invest|mix/.test(q)) {
    const byType = new Map<string, number>();
    for (const h of f.pnc) byType.set(h.type, (byType.get(h.type) ?? 0) + h.value);
    return {
      paragraphs: [
        `Risk profile: ${p.riskProfile}. Goals: ${p.goals.join("; ")}.`,
        `Mix: ${[...byType]
          .sort((a, b) => b[1] - a[1])
          .map(([t, v]) => `${t} ${Math.round((v / c.relationshipValue) * 100)}%`)
          .join(", ")}.`,
      ],
      sources: ["Holdings", "Risk profile"],
      followUps: ["How much cash do they have available?"],
    };
  }
  if (/draft|message|email|write/.test(q)) {
    const plan = engagementPlan(f);
    return {
      paragraphs: [`Here's a draft (${plan.draft.channel.toLowerCase()}):`, plan.draft.body],
      sources: ["Engagement plan"],
      followUps: ["How should I approach them?"],
    };
  }
  // Summary is the default for anything else that names the client, and for "summarize".
  if (/summar|overview|about|who is|tell me/.test(q) || q.includes(first.toLowerCase())) {
    return {
      paragraphs: [
        `${c.name}, ${p.age}, ${p.occupation.toLowerCase()} in ${p.city}. ${c.segment} client since ${p.clientSince}; ${money(c.relationshipValue)} across ${c.accountCount} accounts. ${p.riskProfile} risk profile.`,
        briefing
          ? briefing.summary
          : `Household: ${list(f.family.map((m) => `${m.name} (${m.relationship.toLowerCase()})`)) || "none on file"}.`,
        recs.length
          ? `Top priorities: ${recs
              .slice(0, 3)
              .map((r) => lcFirst(r.title))
              .join("; ")}.`
          : "No open recommendations.",
      ],
      sources: ["Profile", "Holdings", ...(briefing ? ["Loss event"] : [])],
      followUps: suggestedQuestions(f).slice(1, 3),
    };
  }
  return {
    paragraphs: [
      `I can only answer from ${first}'s profile, accounts, family and history. Try asking about beneficiaries, retirement accounts, cash, the will and estate, the family${f.loss ? ", or how to approach them after the loss" : ""}.`,
    ],
    sources: [],
    followUps: suggestedQuestions(f).slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Client engagement: the next best action and a draft message.

export type EngagementPlan = {
  next: { title: string; when: string; channel: string; why: string };
  cadence: { when: string; what: string }[];
  talkingPoints: string[];
  avoid: string[];
  draft: { channel: string; subject?: string; body: string };
};

export function engagementPlan(f: ClientFacts): EngagementPlan {
  const { c, p, first, today } = f;
  const recs = assetRecommendations(f);
  const channel = p.contactPreference === "In person" ? "Phone" : p.contactPreference;
  const sinceContact = daysBetween(c.lastContact, today);
  const untilReview = daysBetween(today, c.nextReview);

  if (f.loss && f.deceased) {
    const d = firstName(f.deceased.name);
    const rel = f.relToSurvivor ?? "family member";
    return {
      next: {
        title: `Condolence call to ${first}`,
        when: "Today",
        channel: "Phone",
        why: `${d} died ${f.daysSinceLoss} days ago and no follow-up is logged since.`,
      },
      cadence: [
        { when: "Today", what: "Condolence call; no account talk" },
        {
          when: formatDate(addDays(today, 2), "medium"),
          what: "Short written note with your direct line",
        },
        {
          when: formatDate(addDays(f.loss.date, 14), "medium"),
          what: "Offer a meeting to go through what passes directly",
        },
        { when: formatDate(addDays(f.loss.date, 30), "medium"), what: "30-day check-in" },
        {
          when: formatDate(addDays(f.loss.date, 90), "medium"),
          what: "First planning review, if they're ready",
        },
      ],
      talkingPoints: [
        "Condolences, in your own words",
        "Nothing needs to be decided now; bills will keep being paid",
        `You'll handle the PNC side${f.attorney ? ` and coordinate with ${f.attorney.name}` : ""}`,
        "Ask what would help most this week",
      ],
      avoid: ["Products or performance", "Deadlines unless one is truly near", "Long emails"],
      draft: {
        channel: "Email",
        subject: `Thinking of you, ${first}`,
        body: `Dear ${first},\n\nI was so sorry to hear about ${d}. ${f.isSpouseLoss ? `${d} was a joy to work with, and I know how much you meant to each other.` : `Please accept my deepest sympathy on the loss of your ${rel}.`}\n\nThere is nothing you need to decide right now. Your accounts will keep working, and when you're ready I'll walk you through everything at whatever pace suits you. ${f.attorney ? `I'm also happy to work directly with ${f.attorney.name} so you don't have to be in the middle.` : ""}\n\nYou can reach me directly at any time.\n\nWith sympathy,\nAlex`,
      },
    };
  }

  const top = recs[0];
  const reviewSoon = untilReview >= 0 && untilReview <= 30;
  const stale = sinceContact > 90;
  const title = reviewSoon
    ? `Prepare ${first}'s review on ${formatDate(c.nextReview, "medium")}`
    : stale
      ? `Check in with ${first} — ${sinceContact} days since last contact`
      : top
        ? `Raise: ${lcFirst(top.title)}`
        : `Quarterly check-in with ${first}`;

  return {
    next: {
      title,
      when: reviewSoon
        ? `Before ${formatDate(c.nextReview, "medium")}`
        : stale
          ? "This week"
          : "This month",
      channel,
      why: reviewSoon
        ? `Review in ${untilReview} days.`
        : stale
          ? `Last contact was ${formatDate(c.lastContact, "medium")}.`
          : (top?.rationale ?? "Keep the relationship warm."),
    },
    cadence: [
      { when: "This week", what: `${channel} touchpoint on the top priority` },
      { when: formatDate(c.nextReview, "medium"), what: "Scheduled review" },
      { when: "Quarterly", what: "Short check-in on goals and life changes" },
    ],
    talkingPoints: [
      ...recs.slice(0, 3).map((r) => r.title),
      ...p.goals.slice(0, 1).map((g) => `Progress on "${lcFirst(g)}"`),
    ],
    avoid: ["Leading with products", "Jargon; keep it to their goals"],
    draft: {
      channel,
      subject: reviewSoon
        ? `Your review on ${formatDate(c.nextReview, "medium")}`
        : `Checking in, ${first}`,
      body: `Hi ${first},\n\n${reviewSoon ? `Looking forward to our review on ${formatDate(c.nextReview, "medium")}.` : "I hope you're doing well."} ${top ? `One thing I'd like to cover: ${lcFirst(top.title)}. ${top.rationale.split(". ")[0]}.` : ""}\n\n${p.contactPreference === "Email" ? "Happy to handle it over email if that's easier." : "Would a quick call this week work?"}\n\nBest,\nAlex`,
    },
  };
}

// ---------------------------------------------------------------------------
// Dashboard context: today's briefing across the whole book.

export type BriefItem = {
  customerId: string;
  name: string;
  kind: "loss" | "review" | "cash" | "readiness";
  text: string;
  action: string;
};

export function dailyBrief(rows: { c: AdvisorCustomer; p: ClientProfile }[], today: string) {
  const items: BriefItem[] = [];
  for (const { c, p } of rows) {
    const f = factsFor(c, p, today);
    if (f.loss) {
      items.push({
        customerId: c.id,
        name: c.name,
        kind: "loss",
        text:
          f.loss.relationship === "Self"
            ? `${c.name} died ${f.daysSinceLoss} days ago. Reach out to ${f.self} (${f.relToSurvivor === "spouse" ? "spouse" : "next of kin"}).`
            : `${f.loss.memberName} (${f.relToSurvivor}) died ${f.daysSinceLoss} days ago. Reach out to ${f.first} today.`,
        action: "Open loss guide",
      });
    }
  }
  for (const { c, p } of rows) {
    const f = factsFor(c, p, today);
    if (f.loss) continue;
    const untilReview = daysBetween(today, c.nextReview);
    if (untilReview >= 0 && untilReview <= 14) {
      const top = assetRecommendations(f)[0];
      items.push({
        customerId: c.id,
        name: c.name,
        kind: "review",
        text: `Review in ${untilReview} days.${top ? ` Lead with: ${lcFirst(top.title)}.` : ""}`,
        action: "Prep the review",
      });
    }
  }
  for (const { c, p } of rows) {
    const f = factsFor(c, p, today);
    if (f.loss) continue;
    const idle = assetRecommendations(f).find((r) => r.id === "idle-cash");
    if (idle)
      items.push({
        customerId: c.id,
        name: c.name,
        kind: "cash",
        text: idle.title + ".",
        action: "See recommendation",
      });
  }
  // Households that would be exposed if the customer died today, largest probate first.
  const readiness: { item: BriefItem; probate: number }[] = [];
  for (const { c, p } of rows) {
    if (openLoss(c) || !p.members.some((m) => m.name === c.name)) continue;
    const r = readinessReport(c, p, c.name, today);
    if (r.status !== "exposed" || r.plan.totals.probate <= 0) continue;
    const stale = r.findings.find((x) => x.id === "f.names-deceased")?.holdingIds.length ?? 0;
    readiness.push({
      item: {
        customerId: c.id,
        name: c.name,
        kind: "readiness",
        text: `If ${firstName(c.name)} died today, ${money(r.plan.totals.probate)} would go through probate${stale ? ` — ${stale} designation${stale > 1 ? "s" : ""} need${stale > 1 ? "" : "s"} updating` : ""}.`,
        action: "See what if",
      },
      probate: r.plan.totals.probate,
    });
  }
  items.push(
    ...readiness
      .sort((a, b) => b.probate - a.probate)
      .slice(0, 3)
      .map((x) => x.item),
  );
  const counts = {
    losses: items.filter((i) => i.kind === "loss").length,
    reviews: items.filter((i) => i.kind === "review").length,
  };
  const headline =
    counts.losses > 0
      ? `${counts.losses} ${counts.losses === 1 ? "family has" : "families have"} lost someone. Start there.`
      : counts.reviews > 0
        ? `${counts.reviews} review${counts.reviews === 1 ? "" : "s"} in the next two weeks.`
        : "A quiet day. Good time for proactive check-ins.";
  return { headline, items };
}
