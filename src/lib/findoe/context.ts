/**
 * What Findoe knows about one client: everything the settlement rulebook
 * decided (routes, steps, dates, questions, citations) plus the client record
 * the advisor works from. Findoe writes advice around these facts; it never
 * decides a legal route or a date itself. Pure, so the browser can build it —
 * including deaths recorded at runtime — and send it with each question.
 */
import { rulebook } from "@/data/settlement";
import { engagementPlan, lossBriefing, type ClientFacts } from "@/lib/assistant";
import { formatCompactMoney, formatDate } from "@/lib/format";
import { decisionPath, type Guidance, type NextStep } from "@/lib/nextSteps";
import { label } from "@/lib/settlement/facts";

const cite = (ids: string[]) =>
  ids.length ? ` [rules: ${ids.map((id) => rulebook.sources[id]?.citation ?? id).join("; ")}]` : "";

function stepLine(s: NextStep, i: number): string {
  return [
    `${i + 1}. ${s.title} — when: ${s.when.label}; owner: ${s.owner}${s.question ? "; this is a question for the advisor to confirm" : ""}`,
    `   why: ${s.why}`,
    ...s.tasks.map((t) => `   task: ${t}`),
    ...s.path.map((p) => `   decided by: ${p}`),
    s.rules.length ? `  ${cite(s.rules)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function findoeContext(f: ClientFacts, g: Guidance): string {
  const { c, p } = f;
  const out: string[] = [];
  out.push(
    `# Client: ${c.name}`,
    `${p.age}, ${p.occupation}, ${p.city}. ${c.segment} client since ${p.clientSince}; relationship ${formatCompactMoney(c.relationshipValue)} across ${c.accountCount} accounts. Risk profile ${p.riskProfile}. Prefers ${p.contactPreference.toLowerCase()}. Last contact ${formatDate(c.lastContact, "medium")}; next review ${formatDate(c.nextReview, "medium")}. Will: ${c.will.status}. Today is ${formatDate(f.today, "medium")}.`,
    `Goals: ${p.goals.join("; ")}.`,
  );
  if (p.notes.length) out.push(`Advisor's notes:\n${p.notes.map((n) => `- ${n}`).join("\n")}`);
  out.push(
    `Family and advisors:\n${p.members
      .map(
        (m) =>
          `- ${m.name}: ${m.relationship === "Self" ? "the client" : m.relationship.toLowerCase()}${m.age !== undefined ? `, ${m.age}` : ""}${m.status === "Deceased" ? `, died ${formatDate(m.died ?? f.loss?.date ?? f.today, "medium")}` : ""}${m.roles.length ? `; ${m.roles.join("; ")}` : ""}${m.note ? `. ${m.note}` : ""}`,
      )
      .join("\n")}`,
    `Recent contact:\n${[...p.interactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((i) => `- ${formatDate(i.date, "medium")} (${i.channel.toLowerCase()}): ${i.summary}`)
      .join("\n")}`,
  );

  out.push(`# Where things stand\n${g.situation.headline}. ${g.situation.summary}`);

  const briefing = lossBriefing(f);
  if (briefing)
    out.push(
      `# Approaching ${f.first}\nSuggested opening: ${briefing.opening}\nDo: ${briefing.doList.join("; ")}.\nAvoid: ${briefing.avoidList.join("; ")}.\nPersonal notes: ${briefing.personalized.join(" ")}\nHeirs: ${briefing.heirs.map((h) => `${h.member.name} (${h.stake.join("; ")})`).join("; ") || "none besides the client"}.`,
    );
  else {
    const e = engagementPlan(f);
    out.push(`# Engagement\nNext best action: ${e.next.title} (${e.next.when}). ${e.next.why}`);
  }

  out.push(
    `# Next steps, decided by the settlement rulebook (in priority order)\n${g.steps.map(stepLine).join("\n") || "None open."}`,
  );
  if (g.done.length) out.push(`Already done: ${g.done.map((s) => s.title).join("; ")}.`);

  const plan = g.plan ?? g.readiness?.plan;
  if (plan) {
    out.push(
      `# ${g.plan ? `Settlement plan for ${plan.deceased.name}'s death on ${formatDate(plan.deceased.dateOfDeath, "medium")}` : `What-if: if ${f.first} died today`}\nTotals: ${formatCompactMoney(plan.totals.outsideProbate)} outside probate (${formatCompactMoney(plan.totals.uninterrupted)} with no paperwork); ${formatCompactMoney(plan.totals.probate)} through probate.\n${plan.accounts
        .map(
          (a) =>
            `- ${label(a.holding)} (${formatCompactMoney(a.holding.value)}): ${a.title}; passes to ${a.passesToNames.join(", ") || "n/a"}. ${decisionPath(a)}${cite(a.sources)}`,
        )
        .join("\n")}`,
    );
    if (plan.deadlines.length)
      out.push(
        `# Key dates\n${plan.deadlines
          .map(
            (d) =>
              `- ${formatDate(d.due!, "medium")}: ${d.action.deadline!.label} (${d.action.deadline!.kind})${cite(d.action.sources)}`,
          )
          .join("\n")}`,
      );
    if (plan.assumptions.length)
      out.push(`# Assumptions the plan makes\n${plan.assumptions.map((a) => `- ${a}`).join("\n")}`);
  }
  if (g.readiness?.findings.length)
    out.push(
      `# What-if gaps\n${g.readiness.findings.map((x) => `- ${x.severity}: ${x.title}. ${x.detail} Fix: ${x.fix}.${cite(x.sources)}`).join("\n")}`,
    );
  if (g.questions.length)
    out.push(
      `# Facts the rulebook still needs the advisor to confirm\n${g.questions.map((q) => `- ${q.question} (options: ${q.options.map((o) => o.label).join(" / ")})`).join("\n")}`,
    );
  if (g.answered.length)
    out.push(
      `# Facts the advisor confirmed\n${g.answered.map((a) => `- ${a.question} → ${a.answerLabel}`).join("\n")}`,
    );
  return out.join("\n\n");
}
