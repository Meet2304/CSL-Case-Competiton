/**
 * MOCK client profiles behind the advisor's Client Summary page and the
 * (simulated) assistant. Every person, account and figure is invented.
 *
 * The households that matter most for the demo are written by hand — Morgan
 * Placeholder (lost a spouse), Avery Example (lost a parent and is the
 * executor), and a few planning cases. Every other household's profile is
 * generated deterministically from its row in ./advisor, so PNC holdings
 * always add up to the relationship value and match the account count shown
 * in the advisor's table.
 */
import { advisorCustomers } from "./advisor";
import type {
  AdvisorCustomer,
  ClientMember,
  ClientProfile,
  Holding,
  HoldingType,
  Interaction,
} from "./types";

const handWritten: ClientProfile[] = [
  {
    customerId: "c-placeholder",
    age: 63,
    occupation: "Retired school principal",
    city: "Sewickley, PA",
    clientSince: 2009,
    contactPreference: "Phone",
    riskProfile: "Moderate",
    goals: ["Fund Sam's college", "Keep the Sewickley house", "Leave a legacy to the family trust"],
    notes: [
      "Riley ran the investment side of the relationship; Morgan handles day-to-day banking and has rarely joined portfolio calls on her own.",
      "Prefers a morning phone call to email. Riley's sister Jamie has been staying with the family since the death.",
      "Sam plays travel soccer and is a junior next year; college visits were planned for the spring.",
    ],
    members: [
      {
        name: "Morgan Placeholder",
        relationship: "Self",
        age: 63,
        status: "Living",
        roles: ["Executor of Riley's will", "Successor trustee, Placeholder Family Trust"],
      },
      {
        name: "Riley Placeholder",
        relationship: "Spouse",
        age: 61,
        status: "Deceased",
        died: "2026-10-23",
        roles: ["Co-trustee, Placeholder Family Trust", "Owner of Sam's 529 plan"],
        note: "Retired orthopedic surgeon. Made most investment decisions for the household.",
      },
      {
        name: "Sam Placeholder",
        relationship: "Child",
        age: 16,
        status: "Living",
        roles: ["Remainder beneficiary of the trust"],
        note: "Minor. Morgan is the parent and guardian; contact through Morgan only.",
      },
      {
        name: "Jamie Placeholder",
        relationship: "Sibling-in-law",
        age: 58,
        status: "Living",
        roles: [],
        note: "Riley's sister. Staying with Morgan and Sam; not on any account.",
      },
      {
        name: "Dana Example",
        relationship: "Attorney",
        status: "Living",
        roles: ["Estate attorney (Example & Partners LLP)"],
        contact: "dana@example-law.com",
      },
    ],
    holdings: [
      {
        id: "h-pl-chk",
        name: "Private Bank Checking",
        last4: "0011",
        type: "Checking",
        value: 186_400,
        ownership: "Joint",
        owners: ["Morgan Placeholder", "Riley Placeholder"],
      },
      {
        id: "h-pl-mm",
        name: "Private Bank Money Market",
        last4: "0012",
        type: "Money market",
        value: 1_240_000,
        ownership: "Joint",
        owners: ["Morgan Placeholder", "Riley Placeholder"],
      },
      {
        id: "h-pl-cd",
        name: "12-month CD",
        last4: "0013",
        type: "CD",
        value: 200_400,
        ownership: "Joint",
        owners: ["Morgan Placeholder", "Riley Placeholder"],
      },
      {
        id: "h-pl-brk",
        name: "Brokerage Account",
        last4: "0014",
        type: "Brokerage",
        value: 2_910_000,
        ownership: "Individual",
        owners: ["Riley Placeholder"],
        beneficiaries: ["Morgan Placeholder"],
      },
      {
        id: "h-pl-ira",
        name: "Traditional IRA",
        last4: "0015",
        type: "Traditional IRA",
        value: 1_385_000,
        ownership: "Individual",
        owners: ["Riley Placeholder"],
        beneficiaries: ["Morgan Placeholder", "Sam Placeholder"],
      },
      {
        id: "h-pl-roth",
        name: "Roth IRA",
        last4: "0016",
        type: "Roth IRA",
        value: 642_000,
        ownership: "Individual",
        owners: ["Morgan Placeholder"],
        beneficiaries: ["Riley Placeholder"],
      },
      {
        id: "h-pl-trust",
        name: "Placeholder Family Trust",
        last4: "0017",
        type: "Trust",
        value: 1_650_000,
        ownership: "Trust",
        owners: ["Morgan Placeholder", "Riley Placeholder"],
      },
      {
        id: "h-pl-529",
        name: "529 College Savings",
        last4: "0018",
        type: "529 plan",
        value: 214_600,
        ownership: "Custodial",
        owners: ["Riley Placeholder"],
        beneficiaries: ["Sam Placeholder"],
      },
      {
        id: "h-pl-visa",
        name: "Private Bank Visa",
        last4: "0019",
        type: "Credit card",
        value: -8_400,
        ownership: "Individual",
        owners: ["Riley Placeholder"],
      },
      {
        id: "h-pl-life",
        name: "Term life policy (outside PNC)",
        type: "Life insurance",
        value: 1_000_000,
        ownership: "Individual",
        owners: ["Riley Placeholder"],
        beneficiaries: ["Morgan Placeholder"],
        external: true,
      },
    ],
    interactions: [
      {
        date: "2026-10-23",
        channel: "Phone",
        summary:
          "Morgan called to tell us Riley died suddenly that morning. Jamie was with her. Asked what she needs to do about the accounts.",
      },
      {
        date: "2026-08-30",
        channel: "In person",
        summary:
          "Annual review. Riley led; Morgan asked about Sam's college costs. Agreed to revisit the 529 contribution in January.",
      },
      {
        date: "2026-06-12",
        channel: "Email",
        summary: "Sent the trust funding confirmation for the Money Market transfer.",
      },
    ],
  },
  {
    customerId: "c-example",
    age: 44,
    occupation: "Engineering manager",
    city: "Pittsburgh, PA",
    clientSince: 2016,
    contactPreference: "Email",
    riskProfile: "Growth",
    goals: ["Retire by 60", "Settle Dad's estate fairly with Quinn"],
    notes: [
      "Avery is organized and data-driven; prefers a written summary before any call.",
      "Drew had been in memory care since 2024. Avery held power of attorney and managed Drew's bills.",
    ],
    members: [
      {
        name: "Avery Example",
        relationship: "Self",
        age: 44,
        status: "Living",
        roles: ["Executor of Drew's will", "Former power of attorney for Drew"],
      },
      {
        name: "Drew Example",
        relationship: "Parent",
        age: 78,
        status: "Deceased",
        died: "2026-10-19",
        roles: [],
        note: "Widowed since 2019. Estate passes 50/50 to Avery and Quinn under the will.",
      },
      {
        name: "Quinn Example",
        relationship: "Sibling",
        age: 47,
        status: "Living",
        roles: ["Co-heir of Drew's estate"],
        note: "Lives in Denver; not a PNC client. Close with Avery but hasn't seen the estate details yet.",
        contact: "quinn@example.com",
      },
    ],
    holdings: [
      {
        id: "h-ex-chk",
        name: "Performance Checking",
        last4: "0021",
        type: "Checking",
        value: 48_200,
        ownership: "Individual",
        owners: ["Avery Example"],
      },
      {
        id: "h-ex-brk",
        name: "Brokerage Account",
        last4: "0022",
        type: "Brokerage",
        value: 1_120_000,
        ownership: "Individual",
        owners: ["Avery Example"],
      },
      {
        id: "h-ex-ira",
        name: "401(k) Rollover IRA",
        last4: "0023",
        type: "401(k) rollover IRA",
        value: 512_000,
        ownership: "Individual",
        owners: ["Avery Example"],
        beneficiaries: ["Drew Example"],
      },
      {
        id: "h-ex-dira",
        name: "Drew's Traditional IRA",
        last4: "0024",
        type: "Traditional IRA",
        value: 418_200,
        ownership: "Individual",
        owners: ["Drew Example"],
        beneficiaries: ["Avery Example", "Quinn Example"],
      },
      {
        id: "h-ex-dchk",
        name: "Drew's Checking",
        last4: "0025",
        type: "Checking",
        value: 36_000,
        ownership: "Individual",
        owners: ["Drew Example"],
        beneficiaries: ["Avery Example"],
      },
      {
        id: "h-ex-dbrk",
        name: "Drew's Brokerage Account",
        last4: "0026",
        type: "Brokerage",
        value: 181_000,
        ownership: "Individual",
        owners: ["Drew Example"],
      },
    ],
    interactions: [
      {
        date: "2026-10-19",
        channel: "Email",
        summary:
          "Dana Example (estate attorney) notified us of Drew's death and that Avery is the named executor.",
      },
      {
        date: "2026-10-02",
        channel: "Video",
        summary: "Quarterly check-in. Avery mentioned Drew was moving to hospice care.",
      },
    ],
  },
  {
    customerId: "c-fictional",
    age: 52,
    occupation: "Owner, Fictional Architecture",
    city: "Fox Chapel, PA",
    clientSince: 2012,
    contactPreference: "In person",
    riskProfile: "Growth",
    goals: ["Sell the firm in 5 years", "Ellis's graduate school"],
    notes: ["Started a will in the PNC planner in October but stopped at the beneficiaries step."],
    members: [
      { name: "Harper Fictional", relationship: "Self", age: 52, status: "Living", roles: [] },
      { name: "Rowan Fictional", relationship: "Spouse", age: 50, status: "Living", roles: [] },
      {
        name: "Ellis Fictional",
        relationship: "Child",
        age: 23,
        status: "Living",
        roles: [],
        note: "Starting a master's program in the fall.",
      },
    ],
    holdings: [
      {
        id: "h-fi-chk",
        name: "Private Bank Checking",
        last4: "0031",
        type: "Checking",
        value: 412_000,
        ownership: "Joint",
        owners: ["Harper Fictional", "Rowan Fictional"],
      },
      {
        id: "h-fi-mm",
        name: "Money Market",
        last4: "0032",
        type: "Money market",
        value: 1_980_000,
        ownership: "Joint",
        owners: ["Harper Fictional", "Rowan Fictional"],
      },
      {
        id: "h-fi-brk",
        name: "Brokerage Account",
        last4: "0033",
        type: "Brokerage",
        value: 2_640_000,
        ownership: "Joint",
        owners: ["Harper Fictional", "Rowan Fictional"],
        beneficiaries: [],
      },
      {
        id: "h-fi-ira",
        name: "Traditional IRA",
        last4: "0034",
        type: "Traditional IRA",
        value: 1_215_000,
        ownership: "Individual",
        owners: ["Harper Fictional"],
        beneficiaries: ["Rowan Fictional"],
      },
      {
        id: "h-fi-ira2",
        name: "Roth IRA",
        last4: "0035",
        type: "Roth IRA",
        value: 388_000,
        ownership: "Individual",
        owners: ["Rowan Fictional"],
      },
      {
        id: "h-fi-529",
        name: "529 College Savings",
        last4: "0036",
        type: "529 plan",
        value: 96_000,
        ownership: "Custodial",
        owners: ["Harper Fictional"],
        beneficiaries: ["Ellis Fictional"],
      },
      {
        id: "h-fi-cd",
        name: "CD Ladder",
        last4: "0037",
        type: "CD",
        value: 174_000,
        ownership: "Joint",
        owners: ["Harper Fictional", "Rowan Fictional"],
      },
      {
        id: "h-fi-visa",
        name: "Private Bank Visa",
        last4: "0038",
        type: "Credit card",
        value: 0,
        ownership: "Individual",
        owners: ["Harper Fictional"],
      },
    ],
    interactions: [
      {
        date: "2026-10-20",
        channel: "In person",
        summary: "Signed the updated trust account agreement. Mentioned the will is 'half done'.",
      },
      {
        date: "2026-07-14",
        channel: "Phone",
        summary: "Discussed liquidity ahead of a possible firm sale.",
      },
    ],
  },
  {
    customerId: "c-exampleton",
    age: 58,
    occupation: "Physician",
    city: "Mt. Lebanon, PA",
    clientSince: 2005,
    contactPreference: "Phone",
    riskProfile: "Moderate",
    goals: ["Retire at 62", "Gift to the Exampleton scholarship fund"],
    notes: [
      "Deposited $1.2M from a practice sale on Oct 22; said the money is 'parked' until they decide.",
    ],
    members: [
      { name: "Sage Exampleton", relationship: "Self", age: 58, status: "Living", roles: [] },
      { name: "Lane Exampleton", relationship: "Spouse", age: 60, status: "Living", roles: [] },
    ],
    holdings: [
      {
        id: "h-sx-chk",
        name: "Private Bank Checking",
        last4: "0041",
        type: "Checking",
        value: 1_286_000,
        ownership: "Joint",
        owners: ["Sage Exampleton", "Lane Exampleton"],
      },
      {
        id: "h-sx-mm",
        name: "Money Market",
        last4: "0042",
        type: "Money market",
        value: 2_050_000,
        ownership: "Joint",
        owners: ["Sage Exampleton", "Lane Exampleton"],
      },
      {
        id: "h-sx-brk",
        name: "Brokerage Account",
        last4: "0043",
        type: "Brokerage",
        value: 6_820_000,
        ownership: "Joint",
        owners: ["Sage Exampleton", "Lane Exampleton"],
        beneficiaries: [],
      },
      {
        id: "h-sx-trust",
        name: "Exampleton Family Trust",
        last4: "0044",
        type: "Trust",
        value: 2_900_000,
        ownership: "Trust",
        owners: ["Sage Exampleton", "Lane Exampleton"],
      },
      {
        id: "h-sx-ira",
        name: "Traditional IRA",
        last4: "0045",
        type: "Traditional IRA",
        value: 1_310_000,
        ownership: "Individual",
        owners: ["Sage Exampleton"],
        beneficiaries: ["Lane Exampleton"],
      },
      {
        id: "h-sx-ira2",
        name: "Traditional IRA",
        last4: "0046",
        type: "Traditional IRA",
        value: 584_000,
        ownership: "Individual",
        owners: ["Lane Exampleton"],
        beneficiaries: ["Sage Exampleton"],
      },
      {
        id: "h-sx-cd",
        name: "CD Ladder",
        last4: "0047",
        type: "CD",
        value: 100_000,
        ownership: "Joint",
        owners: ["Sage Exampleton", "Lane Exampleton"],
      },
      ...[
        ["0048", "Reserve Savings"],
        ["0049", "Tax Reserve Savings"],
        ["0050", "Travel Savings"],
        ["0051", "Scholarship Gift Savings"],
        ["0052", "Emergency Savings"],
      ].map<Holding>(([last4, name], i) => ({
        id: `h-sx-sav${i}`,
        name,
        last4,
        type: "Savings",
        value: 40_000,
        ownership: "Joint",
        owners: ["Sage Exampleton", "Lane Exampleton"],
      })),
    ],
    interactions: [
      {
        date: "2026-10-21",
        channel: "Phone",
        summary:
          "Called about the incoming practice-sale wire. Wants to talk options after the holidays.",
      },
      {
        date: "2026-05-02",
        channel: "In person",
        summary: "Annual review; trust restated in March.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generated profiles for every other household.

/** Small deterministic PRNG so generated profiles are stable between renders. */
function seeded(id: string) {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const occupations = [
  "Small-business owner",
  "Attorney",
  "Retired engineer",
  "Nurse practitioner",
  "Sales director",
  "University professor",
  "Pharmacist",
  "Retired teacher",
  "Real estate developer",
  "Consultant",
];
const cities = [
  "Pittsburgh, PA",
  "Upper St. Clair, PA",
  "Wexford, PA",
  "Cranberry, PA",
  "Shadyside, PA",
];

// Account mix by segment: [type, share of the relationship].
const mixes: Record<AdvisorCustomer["segment"], [HoldingType, number][]> = {
  "Private Bank": [
    ["Brokerage", 0.42],
    ["Trust", 0.2],
    ["Traditional IRA", 0.15],
    ["Money market", 0.12],
    ["Checking", 0.04],
    ["CD", 0.05],
    ["Roth IRA", 0.02],
  ],
  "Wealth Management": [
    ["Brokerage", 0.48],
    ["401(k) rollover IRA", 0.3],
    ["Savings", 0.1],
    ["Checking", 0.05],
    ["CD", 0.07],
  ],
  "Preferred Banking": [
    ["Savings", 0.38],
    ["Traditional IRA", 0.3],
    ["Checking", 0.2],
    ["CD", 0.12],
  ],
};

const retirement = (t: HoldingType) => t.includes("IRA");

function generate(c: AdvisorCustomer): ClientProfile {
  const rand = seeded(c.id);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const age = 38 + Math.floor(rand() * 40);
  const spouse = c.household.find((m) => m.relationship === "Spouse");

  const members: ClientMember[] = [
    { name: c.name, relationship: "Self", age, status: "Living", roles: [] },
    ...c.household.map<ClientMember>((m) => ({
      name: m.name,
      relationship: m.relationship,
      age:
        m.relationship === "Spouse"
          ? age - 4 + Math.floor(rand() * 8)
          : m.relationship === "Child"
            ? Math.max(6, age - 26 - Math.floor(rand() * 8))
            : m.relationship === "Parent"
              ? age + 25 + Math.floor(rand() * 6)
              : age - 5 + Math.floor(rand() * 10),
      status: c.lossEvents.some((e) => e.memberName === m.name) ? "Deceased" : "Living",
      died: c.lossEvents.find((e) => e.memberName === m.name)?.date,
      roles: [],
    })),
  ];

  // Use the segment mix, cycled to the account count, then make the PNC total exact.
  const mix = mixes[c.segment];
  const slots = Array.from({ length: c.accountCount }, (_, i) => mix[i % mix.length]);
  const weight = slots.reduce((s, [, w]) => s + w, 0);
  let remaining = c.relationshipValue;
  const heir = c.household.find((m) => m.relationship === "Child")?.name;
  const holdings: Holding[] = slots.map(([type, w], i) => {
    const last = i === slots.length - 1;
    const value = last
      ? Math.round(remaining * 100) / 100
      : Math.round((c.relationshipValue * w) / weight / 10) * 10;
    remaining -= value;
    const joint = !!spouse && !retirement(type) && type !== "Trust" && rand() > 0.3;
    const owners = joint ? [c.name, spouse.name] : [c.name];
    // Roughly a third of retirement accounts have no beneficiary on file.
    const beneficiaries = retirement(type)
      ? rand() < 0.35
        ? []
        : [spouse?.name ?? heir ?? "Estate of " + c.name].filter(Boolean)
      : undefined;
    return {
      id: `h-${c.id}-${i}`,
      name: slots.slice(0, i).some(([t]) => t === type) ? `${type} ${i + 1}` : type,
      last4: String(60 + ((i * 7 + c.id.length) % 39)).padStart(4, "0"),
      type,
      value,
      ownership: type === "Trust" ? "Trust" : joint ? "Joint" : "Individual",
      owners,
      beneficiaries,
    };
  });

  const interactions: Interaction[] = [
    {
      date: c.lastContact,
      channel: pick(["Phone", "Email", "In person", "Video"] as const),
      summary: pick([
        "Routine check-in; no changes requested.",
        "Reviewed cash needs for the next quarter.",
        "Discussed market volatility and stayed the course.",
        "Confirmed updated contact details.",
      ]),
    },
  ];

  return {
    customerId: c.id,
    age,
    occupation: pick(occupations),
    city: pick(cities),
    clientSince: 2000 + Math.floor(rand() * 24),
    contactPreference: pick(["Phone", "Email", "In person", "Text"] as const),
    riskProfile: pick(["Conservative", "Moderate", "Growth"] as const),
    goals: [
      pick(["Retirement income", "Grow the portfolio", "Preserve capital"]),
      ...(heir ? ["Education funding"] : []),
    ],
    notes: [],
    members,
    holdings,
    interactions,
  };
}

export const clientProfiles: ClientProfile[] = advisorCustomers.map(
  (c) => handWritten.find((p) => p.customerId === c.id) ?? generate(c),
);

export function profileFor(customerId: string): ClientProfile | undefined {
  return clientProfiles.find((p) => p.customerId === customerId);
}
