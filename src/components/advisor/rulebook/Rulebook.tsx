import { ArrowRight, CornerDownRight } from "lucide-react";
import { AssistantMark, Chip } from "@/components/advisor/assistant/parts";
import {
  reviewLabels,
  reviewTone,
  routeLabels,
  routeTone,
  sectionTitle,
} from "@/components/advisor/settlement/parts";
import { SourceChips } from "@/components/advisor/settlement/SourceChip";
import { DISCLAIMER, rulebook, UNVERIFIED_SOURCE_IDS } from "@/data/settlement";
import type { ActionOwner, Clause, HouseholdRule, Overlay, RuleNode } from "@/data/types";
import { cn, formatCompactMoney, formatDate } from "@/lib/format";

const factNames: Record<string, string> = {
  accountClass: "Account",
  decedentRole: "Role of the person who died",
  beneficiaryStatus: "Beneficiary",
  primaryBeneficiaryCategory: "Primary beneficiary",
  beneficiaryCount: "Living beneficiaries",
  anyBeneficiaryMinor: "A beneficiary is a minor",
  decedentPastRequiredBeginningDate: "Past the required beginning date",
  successorOwnerNamed: "Successor owner named",
  heldOutsidePnc: "Held outside PNC",
  value: "Balance",
  state: "State",
  survivorIsSpouse: "Survivor is the spouse",
  executorKnown: "Executor on file",
  hasProbateAssets: "Has probate assets",
  probateValueAtPnc: "Probate assets at PNC",
  estimatedGrossEstate: "Estimated gross estate",
  receivedFederalBenefits: "Received federal benefits",
};
const money = new Set(["value", "probateValueAtPnc", "estimatedGrossEstate"]);
const show = (fact: string, v: string | number | boolean) =>
  money.has(fact) && typeof v === "number"
    ? formatCompactMoney(v)
    : typeof v === "boolean"
      ? v
        ? "yes"
        : "no"
      : String(v).replaceAll("-", " ");

/** Rule text with its placeholders read generically, e.g. "{decedent}'s" → "the decedent's". */
function g(text: string): string {
  const t = text
    .replaceAll("{decedent}", "the decedent")
    .replaceAll("{survivor}", "the survivor")
    .replaceAll("{account}", "the account");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "accountClass ∈ {deposit, cd}" → "Account is deposit or cd". */
export function describeClause(c: Clause): string {
  const name = factNames[c.fact] ?? c.fact;
  const parts: string[] = [];
  if (c.eq !== undefined) parts.push(`is ${show(c.fact, c.eq)}`);
  if (c.in) parts.push(`is ${c.in.map((v) => show(c.fact, v)).join(" or ")}`);
  if (c.gt !== undefined) parts.push(`is more than ${show(c.fact, c.gt)}`);
  if (c.lte !== undefined) parts.push(`is at most ${show(c.fact, c.lte)}`);
  return `${name} ${parts.join(" and ")}`;
}

const ownerNames: Record<ActionOwner, string> = {
  advisor: "Advisor",
  client: "Client",
  executor: "Executor",
  "bank-operations": "Operations",
  "trust-officer": "Trust officer",
  attorney: "Attorney",
  "tax-advisor": "Tax advisor",
  insurer: "Insurer",
};

const card = "rounded-md bg-white p-4 ring-1 ring-pnc-line";
const nodeAnchor = "scroll-mt-24 target:ring-2 target:ring-pnc-orange";

function TreeNode({ id, seen }: { id: string; seen: Set<string> }) {
  const node: RuleNode = rulebook.nodes[id];
  if (seen.has(id)) {
    return (
      <a href={`#${id}`} className="text-sm font-semibold text-pnc-link hover:underline">
        → {g(node.kind === "decision" ? node.question : node.title)} (see above)
      </a>
    );
  }
  seen.add(id);

  if (node.kind === "outcome") {
    return (
      <article id={id} className={cn(card, nodeAnchor, "space-y-2 text-sm")}>
        <p className="flex flex-wrap items-center gap-2">
          <Chip className={routeTone[node.route]}>{routeLabels[node.route]}</Chip>
          <span className="font-semibold text-pnc-ink">{g(node.title)}</span>
          <span className="font-mono text-[11px] text-pnc-muted">{node.id}</span>
        </p>
        <p className="leading-relaxed text-pnc-ink">{g(node.summary)}</p>
        <p className="text-xs text-pnc-muted">
          {node.probate ? "Goes through probate" : "Outside probate"} · typical time{" "}
          {node.typicalTimeline}
        </p>
        {node.actions.length > 0 && (
          <ol className="list-decimal space-y-0.5 pl-5 text-pnc-ink">
            {node.actions.map((a) => (
              <li key={a}>
                {g(rulebook.actions[a].label)}{" "}
                <span className="text-xs text-pnc-muted">
                  · {ownerNames[rulebook.actions[a].owner]}
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {node.review.map((r) => (
            <Chip key={r} className={reviewTone}>
              {reviewLabels[r]} sign-off
            </Chip>
          ))}
          <SourceChips ids={node.sources} />
        </div>
      </article>
    );
  }

  return (
    <div id={id} className={cn(nodeAnchor, "rounded-md")}>
      <div className={cn(card, "space-y-1.5")}>
        <p className="font-semibold text-pnc-ink">{g(node.question)}</p>
        <p className="font-mono text-[11px] text-pnc-muted">
          {node.id} · asks about {node.fact}
        </p>
        <SourceChips ids={node.sources} />
      </div>
      <ul className="mt-2 space-y-2 border-l-2 border-pnc-line pl-3 @2xl:pl-5">
        {groupBranches(node.branches).map((g) => (
          <li key={g.next} className="space-y-2">
            <p className="flex items-start gap-1.5 text-sm text-pnc-muted">
              <CornerDownRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                When <span className="font-semibold text-pnc-ink">{g.labels.join(" / ")}</span>
              </span>
            </p>
            <div className="pl-5">
              <TreeNode id={g.next} seen={seen} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Branches that lead to the same node are shown once, with every label. */
function groupBranches(branches: { when: string; label: string; next: string }[]) {
  const out: { next: string; labels: string[] }[] = [];
  for (const b of branches) {
    const group = out.find((x) => x.next === b.next);
    if (group) group.labels.push(g(b.label));
    else out.push({ next: b.next, labels: [g(b.label)] });
  }
  return out;
}

function RuleCard({ rule }: { rule: Overlay | HouseholdRule }) {
  const routes = "routes" in rule ? rule.routes : undefined;
  return (
    <article id={rule.id} className={cn(card, nodeAnchor, "space-y-2 text-sm")}>
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold text-pnc-ink">{rule.title}</span>
        <span className="font-mono text-[11px] text-pnc-muted">{rule.id}</span>
      </p>
      <p className="text-xs text-pnc-muted">
        <span className="font-semibold">Applies when: </span>
        {[
          ...(routes
            ? [`route is ${routes.map((r) => routeLabels[r].toLowerCase()).join(" or ")}`]
            : []),
          ...rule.when.map(describeClause),
        ].join("; ") || "always"}
      </p>
      <p className="leading-relaxed text-pnc-ink">{g(rule.detail)}</p>
      {rule.actions.length > 0 && (
        <ul className="space-y-0.5 text-pnc-ink">
          {rule.actions.map((a) => {
            const action = rulebook.actions[a];
            return (
              <li key={a} className="flex gap-1.5">
                <ArrowRight className="mt-1 size-3 shrink-0 text-pnc-muted" aria-hidden="true" />
                <span>
                  {g(action.label)}{" "}
                  <span className="text-xs text-pnc-muted">
                    · {ownerNames[action.owner]}
                    {action.deadline && ` · ${action.deadline.label}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {rule.review?.map((r) => (
          <Chip key={r} className={reviewTone}>
            {reviewLabels[r]} sign-off
          </Chip>
        ))}
        <SourceChips ids={rule.sources} />
      </div>
    </article>
  );
}

/**
 * The whole settlement rulebook, readable by people: the decision tree,
 * overlays, household rules and every source with its verification status.
 */
export function Rulebook() {
  const nodes = Object.values(rulebook.nodes);
  const sources = Object.values(rulebook.sources).sort(
    (a, b) =>
      (a.jurisdiction === "US" ? 0 : 1) - (b.jurisdiction === "US" ? 0 : 1) ||
      a.citation.localeCompare(b.citation),
  );
  const federal = rulebook.household.filter((h) => h.jurisdiction === "US");
  const pa = rulebook.household.filter((h) => h.jurisdiction === "PA");
  const counts: [string, number][] = [
    ["Decisions", nodes.filter((n) => n.kind === "decision").length],
    ["Outcomes", nodes.filter((n) => n.kind === "outcome").length],
    ["Overlays", rulebook.overlays.length],
    ["Household rules", rulebook.household.length],
    ["Sources", sources.length],
    ["Not yet verified", UNVERIFIED_SOURCE_IDS.length],
  ];

  return (
    <div className="@container space-y-8">
      <section className="space-y-3 rounded-md bg-pnc-blue-50 p-4 @3xl:p-5">
        <AssistantMark label="Settlement rulebook" />
        <p className="max-w-3xl text-[15px] leading-relaxed text-pnc-ink">
          What legally happens to an account when its owner dies, as data a person can read and
          check. The transition plan on every client page walks this tree; no language model decides
          who inherits. Every rule cites its source, and sources nobody has checked yet are marked
          with an orange dot.
        </p>
        <p className="text-xs text-pnc-muted">
          {DISCLAIMER} Version {rulebook.version}, reviewed {formatDate(rulebook.asOf, "medium")}.
        </p>
        <dl className="grid grid-cols-2 gap-2 @xl:grid-cols-3 @4xl:grid-cols-6">
          {counts.map(([k, v]) => (
            <div key={k} className="rounded-md bg-white px-3 py-2">
              <dt className="text-xs text-pnc-muted">{k}</dt>
              <dd className="font-display text-xl font-medium text-pnc-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <nav aria-label="Rulebook sections" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[
            ["#tree", "Decision tree"],
            ["#overlays", "Overlays"],
            ["#household", "Household rules"],
            ["#sources", "Sources"],
          ].map(([href, text]) => (
            <a key={href} href={href} className="font-semibold text-pnc-link hover:underline">
              {text}
            </a>
          ))}
        </nav>
      </section>

      <section aria-labelledby="tree" className="space-y-3">
        <h2 id="tree" className={cn(sectionTitle, "scroll-mt-24")}>
          Decision tree
        </h2>
        <p className="max-w-3xl text-sm text-pnc-muted">
          Each account starts at the top and follows one branch per question until it reaches an
          outcome. Every question has a branch for every possible answer.
        </p>
        <TreeNode id={rulebook.rootNodeId} seen={new Set()} />
      </section>

      <section aria-labelledby="overlays" className="space-y-3">
        <h2 id="overlays" className={cn(sectionTitle, "scroll-mt-24")}>
          Overlays
        </h2>
        <p className="max-w-3xl text-sm text-pnc-muted">
          Extra rules added on top of an account&apos;s outcome when their conditions match.
        </p>
        <div className="grid gap-3 @3xl:grid-cols-2">
          {rulebook.overlays.map((o) => (
            <RuleCard key={o.id} rule={o} />
          ))}
        </div>
      </section>

      <section aria-labelledby="household" className="space-y-3">
        <h2 id="household" className={cn(sectionTitle, "scroll-mt-24")}>
          Household rules
        </h2>
        <h3 className="text-sm font-bold text-pnc-ink">Federal</h3>
        <div className="grid gap-3 @3xl:grid-cols-2">
          {federal.map((h) => (
            <RuleCard key={h.id} rule={h} />
          ))}
        </div>
        <h3 className="pt-2 text-sm font-bold text-pnc-ink">Pennsylvania</h3>
        <div className="grid gap-3 @3xl:grid-cols-2">
          {pa.map((h) => (
            <RuleCard key={h.id} rule={h} />
          ))}
        </div>
      </section>

      <section aria-labelledby="sources" className="space-y-3">
        <h2 id="sources" className={cn(sectionTitle, "scroll-mt-24")}>
          Sources
        </h2>
        <div className="overflow-x-auto rounded-md bg-white ring-1 ring-pnc-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Every source the rulebook cites</caption>
            <thead>
              <tr className="border-b border-pnc-line text-xs text-pnc-muted">
                <th scope="col" className="px-3 py-2 font-semibold">
                  Citation
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Authority
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Kind
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Verified
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr
                  key={s.id}
                  id={`source-${s.id}`}
                  className="border-b border-pnc-line align-top last:border-0"
                >
                  <th scope="row" className="px-3 py-2.5 font-normal">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-pnc-link hover:underline"
                    >
                      {s.citation}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <span className="mt-0.5 block text-xs leading-snug text-pnc-muted">
                      {s.summary}
                    </span>
                  </th>
                  <td className="px-3 py-2.5 text-pnc-ink">
                    {s.authority}
                    <span className="block text-xs text-pnc-muted">{s.jurisdiction}</span>
                  </td>
                  <td className="px-3 py-2.5 text-pnc-ink">{s.kind.replaceAll("-", " ")}</td>
                  <td className="px-3 py-2.5">
                    {s.verifiedOn ? (
                      <span className="text-pnc-positive">
                        {formatDate(s.verifiedOn, "medium")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-pnc-orange-600">
                        <span className="size-1.5 rounded-full bg-pnc-orange" aria-hidden="true" />
                        Not yet verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
