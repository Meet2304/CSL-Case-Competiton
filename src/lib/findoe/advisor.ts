/**
 * Findoe across the advisor's whole book — SIMULATED. On every advisor page
 * but a client's own (where Findoe is docked beside the client), it answers
 * questions about who needs attention, wills, reviews and any one client,
 * citing the client records and the legal library.
 */
import type { AdvisorCustomer } from "@/data/types";
import { lossContact, lossTag, needsAttention, openLoss } from "@/lib/advisor";
import { daysBetween, firstName, formatCompactMoney, formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Citations, lawEntry, searchLaw, type Reply, type ReplyAction } from "./answer";

export type AdvisorContext = {
  /** The book, most urgent first (see sortByAttention). */
  customers: AdvisorCustomer[];
  today: string;
};

const willLabel = (c: AdvisorCustomer) =>
  c.will.status === "on-file"
    ? `Will on file (${formatDate(c.will.updated!, "medium")})`
    : c.will.status === "in-progress"
      ? "Will in progress"
      : "No will on file";

function clientRow(cite: Citations, c: AdvisorCustomer): string {
  const loss = openLoss(c);
  return cite.bank({
    key: `client:${c.id}`,
    table: "Clients",
    title: c.name,
    detail: [
      c.segment,
      `${formatCompactMoney(c.relationshipValue)} · ${c.accountCount} accounts`,
      willLabel(c),
      loss ? lossTag(loss) : "",
    ]
      .filter(Boolean)
      .join(" · "),
  });
}

const openClient = (c: AdvisorCustomer, detail?: string): ReplyAction => ({
  label: `Open ${c.name}`,
  detail,
  href: routes.advisorClient(c.id),
  icon: "client",
});

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function attention(ctx: AdvisorContext): Reply {
  const cite = new Citations();
  const open = ctx.customers.filter(needsAttention);
  if (!open.length)
    return cite.reply(
      [
        `Nobody in your book has an open loss today.${ctx.customers
          .slice(0, 3)
          .map((c) => clientRow(cite, c))
          .join("")}`,
      ],
      [],
      ["Who's due for a review this month?"],
    );
  const lines = [
    `${plural(open.length, "client")} need${open.length === 1 ? "s" : ""} you today, most recent loss first:`,
  ];
  open.forEach((c, i) => {
    const loss = openLoss(c)!;
    const who = lossContact(c, loss);
    const what =
      loss.relationship === "Self"
        ? `${c.name} passed away`
        : `${firstName(c.name)}'s ${loss.relationship.toLowerCase()} ${loss.memberName} passed away`;
    lines.push(
      `${i + 1}. **${c.name}**: ${what} on ${formatDate(loss.date, "medium")} (${loss.reportedVia.toLowerCase()}).${clientRow(cite, c)}${who ? ` Call ${who.name} first, with condolences, not paperwork.` : ""}`,
    );
  });
  lines.push(
    "Before any account changes:",
    `- Accounts are secured once PNC is told; joint and POD/TOD accounts pass outside probate.${cite.law("pnc-death-claims")}`,
    `- Look for Social Security or other federal deposits after the date of death; the bank must return them.${cite.law("treas-210")}`,
    `- Deposits stay insured as before for six months, so there's no rush to retitle.${cite.law("fdic-330-3j")}`,
  );
  return cite.reply(
    lines,
    open.map((c) => openClient(c, lossTag(openLoss(c)!))),
    ["Which clients have no will on file?", "Who's due for a review this month?"],
  );
}

function wills(ctx: AdvisorContext): Reply {
  const cite = new Citations();
  const none = ctx.customers.filter((c) => c.will.status === "none");
  const started = ctx.customers.filter((c) => c.will.status === "in-progress");
  const lines = [
    `${plural(none.length, "client")} ${none.length === 1 ? "has" : "have"} no will on file, and ${started.length} ${started.length === 1 ? "has" : "have"} one in progress:`,
    ...[...none, ...started].map(
      (c) =>
        `- **${c.name}** (${c.segment}, ${formatCompactMoney(c.relationshipValue)}): ${c.will.status === "none" ? "no will" : "in progress"}.${clientRow(cite, c)}`,
    ),
    `Without a will, the court appoints an administrator to settle the estate${cite.law("pa-register-of-wills")}, and anything without a beneficiary goes through probate.${cite.law("pnc-death-claims")} Worth raising at each client's next review.`,
  ];
  return cite.reply(
    lines,
    [...none, ...started].slice(0, 4).map((c) => openClient(c, willLabel(c))),
    ["Who's due for a review this month?"],
  );
}

function reviews(ctx: AdvisorContext): Reply {
  const cite = new Citations();
  const due = ctx.customers
    .map((c) => ({ c, days: daysBetween(ctx.today, c.nextReview) }))
    .filter((x) => x.days >= 0 && x.days <= 30)
    .sort((a, b) => a.days - b.days);
  if (!due.length)
    return cite.reply(
      [
        `No reviews in the next 30 days.${ctx.customers
          .slice(0, 2)
          .map((c) => clientRow(cite, c))
          .join("")}`,
      ],
      [],
      ["Who needs my attention today?"],
    );
  return cite.reply(
    [
      `${plural(due.length, "review")} in the next 30 days:`,
      ...due.map(
        ({ c, days }) =>
          `- **${c.name}** on ${formatDate(c.nextReview, "medium")}, in ${plural(days, "day")}${c.will.status !== "on-file" ? "; bring up the will" : ""}${openLoss(c) ? "; the family has an open loss" : ""}.${clientRow(cite, c)}`,
      ),
      due.some(({ c }) => c.will.status !== "on-file")
        ? `For clients without a will, explain what happens without one: the court appoints an administrator.${cite.law("pa-register-of-wills")}`
        : "",
    ].filter(Boolean),
    due.slice(0, 4).map(({ c }) => openClient(c, `Review ${formatDate(c.nextReview, "medium")}`)),
    ["Which clients have no will on file?"],
  );
}

function client(ctx: AdvisorContext, c: AdvisorCustomer): Reply {
  const cite = new Citations();
  const loss = openLoss(c);
  const lines = [
    `**${c.name}** is a ${c.segment} client: ${formatCompactMoney(c.relationshipValue)} across ${plural(c.accountCount, "account")}.${clientRow(cite, c)}`,
    `Household: ${c.household.map((m) => `${m.name} (${m.relationship.toLowerCase()})`).join(", ") || "none on file"}.${cite.bank(
      {
        key: `household:${c.id}`,
        table: "People on file",
        title: `${c.name}'s household`,
        detail:
          c.household.map((m) => `${m.name}, ${m.relationship}`).join(" · ") || "No one on file",
      },
    )}`,
  ];
  if (loss)
    lines.push(
      `**Open loss:** ${loss.relationship === "Self" ? c.name : loss.memberName} passed away on ${formatDate(loss.date, "medium")}. Joint and beneficiary accounts pass outside probate; review them before any changes.${cite.law("pnc-death-claims")}`,
    );
  lines.push(
    c.will.status === "on-file"
      ? `Will on file since ${formatDate(c.will.updated!, "medium")}.`
      : `No finished will, a good topic for the review on ${formatDate(c.nextReview, "medium")}: without one the court appoints an administrator.${cite.law("pa-register-of-wills")}`,
    `Last contact ${formatDate(c.lastContact, "medium")}; next review ${formatDate(c.nextReview, "medium")}.`,
  );
  return cite.reply(
    lines,
    [openClient(c, "Next steps, family and the docked Findoe")],
    ["Who needs my attention today?"],
  );
}

function book(ctx: AdvisorContext): Reply {
  const cite = new Citations();
  const open = ctx.customers.filter(needsAttention).length;
  const noWill = ctx.customers.filter((c) => c.will.status !== "on-file").length;
  const value = ctx.customers.reduce((s, c) => s + c.relationshipValue, 0);
  return cite.reply(
    [
      `You look after ${plural(ctx.customers.length, "client")} worth ${formatCompactMoney(value)} together. ${open} ${open === 1 ? "has" : "have"} an open loss and ${noWill} ${noWill === 1 ? "has" : "have"} no finished will.`,
      ...ctx.customers
        .slice(0, 4)
        .map((c) => `- **${c.name}**: ${willLabel(c).toLowerCase()}.${clientRow(cite, c)}`),
    ],
    [],
    ["Who needs my attention today?", "Which clients have no will on file?"],
  );
}

function fallback(ctx: AdvisorContext, question: string): Reply {
  const cite = new Citations();
  const laws = searchLaw(question);
  if (!laws.length)
    return cite.reply(
      [
        `I can't answer that from the book yet.${ctx.customers
          .slice(0, 1)
          .map((c) => clientRow(cite, c))
          .join(
            "",
          )} Ask me who needs attention, who has no will, who's due for a review, or about any client by name.`,
      ],
      [],
      advisorSuggestions(ctx),
    );
  return cite.reply(
    [
      "Here's what the legal library says that relates to your question:",
      ...laws.map((id) => `- **${lawEntry(id).title}**: ${lawEntry(id).summary}${cite.law(id)}`),
      "For a client-specific answer, open the client: Findoe there works from their file and the settlement rulebook.",
    ],
    [],
    advisorSuggestions(ctx),
  );
}

/** Findoe's answer to an advisor's question about their book. */
export function advisorReply(ctx: AdvisorContext, question: string): Reply {
  const q = question.trim().toLowerCase();
  const named = ctx.customers.find((c) =>
    [c.name, ...c.name.split(" ").filter((w) => w.length > 3)].some((n) =>
      q.includes(n.toLowerCase()),
    ),
  );
  if (named) return client(ctx, named);
  if (/attention|urgent|today|priorit|first|loss|who should i call/.test(q)) return attention(ctx);
  if (/\bwills?\b|estate plan/.test(q)) return wills(ctx);
  if (/review|meeting|this month|30 days|upcoming/.test(q)) return reviews(ctx);
  if (/book|how many|clients|overview|summar/.test(q)) return book(ctx);
  return fallback(ctx, question);
}

export function advisorSuggestions(ctx: AdvisorContext): string[] {
  const first = ctx.customers.find(needsAttention) ?? ctx.customers[0];
  return [
    "Who needs my attention today?",
    "Which clients have no will on file?",
    "Who's due for a review this month?",
    ...(first ? [`Summarize ${first.name}`] : []),
  ];
}
