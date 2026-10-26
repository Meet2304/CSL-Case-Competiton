"use client";

import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { AssistantPanel, Chip, priorityTone } from "@/components/advisor/assistant/parts";
import type { OpenTab } from "@/components/advisor/client/ClientWorkspace";
import { WillStatus } from "@/components/advisor/WillStatus";
import { Money } from "@/components/ui/Money";
import type { ClientMember, Holding } from "@/data/types";
import { assetRecommendations, type ClientFacts, type Recommendation } from "@/lib/assistant";
import { cn, formatDate, relativeDay } from "@/lib/format";

const sectionTitle = "font-display text-lg font-medium text-pnc-ink";
const askButton =
  "inline-flex items-center gap-1 text-sm font-semibold text-pnc-link hover:underline";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

// ---------------------------------------------------------------------------

export function OverviewPanel({
  facts,
  onAsk,
  onOpen,
}: {
  facts: ClientFacts;
  onAsk: (q: string) => void;
  onOpen: OpenTab;
}) {
  const { c, p } = facts;
  const recs = assetRecommendations(facts);
  const rows: [string, React.ReactNode][] = [
    ["Age", p.age],
    ["Occupation", p.occupation],
    ["Lives in", p.city],
    ["Client since", p.clientSince],
    ["Segment", c.segment],
    ["Relationship", <Money key="v" value={c.relationshipValue} className="font-semibold" />],
    ["Accounts", c.accountCount],
    ["Risk profile", p.riskProfile],
    ["Prefers", p.contactPreference],
    [
      "Last contact",
      `${formatDate(c.lastContact, "medium")} (${relativeDay(c.lastContact, facts.today)})`,
    ],
    ["Next review", formatDate(c.nextReview, "medium")],
    ["Will", <WillStatus key="w" customer={c} compact />],
  ];

  return (
    <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="space-y-6">
        <section>
          <h3 className={sectionTitle}>Profile</h3>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm @lg:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-pnc-line pb-2">
                <dt className="text-pnc-muted">{k}</dt>
                <dd className="text-right text-pnc-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className={sectionTitle}>Goals</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {p.goals.map((g) => (
              <li key={g} className="rounded-full bg-pnc-surface px-3 py-1 text-sm">
                {g}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className={sectionTitle}>Recent contact</h3>
          <ol className="mt-2 space-y-3">
            {[...p.interactions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((i) => (
                <li key={i.date + i.summary} className="text-sm leading-relaxed">
                  <p className="text-xs text-pnc-muted">
                    {formatDate(i.date, "medium")}, {i.channel.toLowerCase()}
                  </p>
                  <p className="text-pnc-ink">{i.summary}</p>
                </li>
              ))}
          </ol>
        </section>
      </div>

      <div className="space-y-5">
        <AssistantPanel title="What matters now">
          {recs.length === 0 ? (
            <p className="text-sm text-pnc-muted">No open recommendations.</p>
          ) : (
            <ol className="space-y-2.5">
              {recs.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-start gap-2.5 text-sm leading-snug">
                  <Chip className={cn("mt-px", priorityTone[r.priority])}>{r.priority}</Chip>
                  <span className="text-pnc-ink">{r.title}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <button type="button" onClick={() => onOpen("assets")} className={askButton}>
              All recommendations
            </button>
            <button
              type="button"
              onClick={() => onAsk(`Summarize ${facts.first} for me`)}
              className={askButton}
            >
              <MessageCircleQuestion className="size-4" aria-hidden="true" /> Ask for a summary
            </button>
          </div>
        </AssistantPanel>

        {p.notes.length > 0 && (
          <section className="rounded-md border border-pnc-line p-4">
            <h3 className="font-semibold text-pnc-ink">Your notes</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-pnc-ink">
              {p.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PersonName({ name, facts }: { name: string; facts: ClientFacts }) {
  const deceased = facts.p.members.find((m) => m.name === name)?.status === "Deceased";
  return (
    <span className={cn(deceased && "text-attention")}>
      {name}
      {deceased && <span className="text-xs font-semibold"> (deceased)</span>}
    </span>
  );
}

function names(list: string[] | undefined, facts: ClientFacts) {
  if (!list || list.length === 0) return <span className="text-pnc-muted">None</span>;
  return list.map((n, i) => (
    <span key={n}>
      {i > 0 && ", "}
      <PersonName name={n} facts={facts} />
    </span>
  ));
}

function HoldingRow({ h, facts }: { h: Holding; facts: ClientFacts }) {
  return (
    <tr className="border-b border-pnc-line align-top last:border-b-0">
      <td className="py-3 pr-4">
        <span className="block font-semibold text-pnc-ink">
          {h.name}
          {h.last4 && <span className="text-xs font-normal text-pnc-muted"> x{h.last4}</span>}
        </span>
        <span className="text-xs text-pnc-muted">{h.type}</span>
      </td>
      <td className="py-3 pr-4">
        <span className="block text-xs text-pnc-muted">{h.ownership}</span>
        {names(h.owners, facts)}
      </td>
      <td className="py-3 pr-4">
        {h.beneficiaries === undefined ? (
          <span className="text-pnc-muted">n/a</span>
        ) : (
          names(h.beneficiaries, facts)
        )}
      </td>
      <td className="py-3 text-right">
        <Money value={h.value} className="font-semibold" />
      </td>
    </tr>
  );
}

export function AssetsPanel({ facts, onAsk }: { facts: ClientFacts; onAsk: (q: string) => void }) {
  const recs = assetRecommendations(facts);
  const pnc = facts.p.holdings.filter((h) => !h.external);
  const outside = facts.p.holdings.filter((h) => h.external);
  const head = "pb-2 pr-4 text-xs font-semibold text-pnc-muted";

  return (
    <div className="space-y-7">
      <AssistantPanel
        title={`${recs.length} recommendation${recs.length === 1 ? "" : "s"} for ${facts.first}'s assets`}
        aside={
          <span className="text-xs text-pnc-muted">
            From {facts.p.holdings.length} accounts and {facts.p.members.length - 1} people
          </span>
        }
      >
        {recs.length === 0 ? (
          <p className="text-sm text-pnc-muted">Nothing to change right now.</p>
        ) : (
          <ol className="space-y-2.5">
            {recs.map((r) => (
              <RecommendationCard key={r.id} rec={r} onAsk={onAsk} />
            ))}
          </ol>
        )}
      </AssistantPanel>

      <section>
        <h3 className={sectionTitle}>Holdings at PNC</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pnc-line">
                <th className={head}>Account</th>
                <th className={head}>Owners</th>
                <th className={head}>Beneficiaries</th>
                <th className={cn(head, "pr-0 text-right")}>Value</th>
              </tr>
            </thead>
            <tbody>
              {pnc.map((h) => (
                <HoldingRow key={h.id} h={h} facts={facts} />
              ))}
            </tbody>
          </table>
        </div>
        {outside.length > 0 && (
          <>
            <h4 className="mt-6 font-semibold text-pnc-ink">Held outside PNC</h4>
            <table className="mt-2 w-full text-left text-sm">
              <tbody>
                {outside.map((h) => (
                  <HoldingRow key={h.id} h={h} facts={facts} />
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}

function RecommendationCard({ rec, onAsk }: { rec: Recommendation; onAsk: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-md bg-white ring-1 ring-pnc-blue-600/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <Chip className={cn("mt-0.5", priorityTone[rec.priority])}>{rec.priority}</Chip>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-pnc-ink">{rec.title}</span>
          <span className="block text-xs text-pnc-muted">{rec.category}</span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-pnc-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-pnc-line px-4 py-3 text-sm leading-relaxed">
          <p className="text-pnc-ink">{rec.rationale}</p>
          <div>
            <p className="font-semibold text-pnc-ink">Steps</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              {rec.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="font-semibold text-pnc-ink">Based on</p>
            <ul className="mt-1 space-y-0.5 text-pnc-muted">
              {rec.basedOn.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => onAsk(`Why: ${rec.title}?`)} className={askButton}>
            <MessageCircleQuestion className="size-4" aria-hidden="true" /> Ask about this
          </button>
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------

function MemberCard({ m, facts }: { m: ClientMember; facts: ClientFacts }) {
  const deceased = m.status === "Deceased";
  const on = facts.p.holdings.filter((h) => h.owners.includes(m.name));
  const named = facts.p.holdings.filter((h) => h.beneficiaries?.includes(m.name));
  return (
    <li className="flex gap-3 rounded-md border border-pnc-line p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
          deceased ? "bg-pnc-chip text-pnc-muted" : "bg-pnc-blue-50 text-pnc-blue-800",
        )}
      >
        {initials(m.name)}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        <p>
          <span className="font-semibold text-pnc-ink">{m.name}</span>{" "}
          <span className="text-pnc-muted">
            {m.relationship === "Self" ? "Client" : m.relationship}
            {m.age !== undefined && `, ${m.age}`}
          </span>
        </p>
        {deceased && (
          <Chip className="bg-attention-bg text-attention ring-attention-line">
            Died {formatDate(m.died ?? facts.loss?.date ?? "", "medium")}
          </Chip>
        )}
        {m.roles.length > 0 && (
          <p className="flex flex-wrap gap-1">
            {m.roles.map((r) => (
              <Chip key={r} className="bg-pnc-blue-50 text-pnc-blue-800 ring-transparent">
                {r}
              </Chip>
            ))}
          </p>
        )}
        {m.note && <p className="leading-relaxed text-pnc-ink">{m.note}</p>}
        {(on.length > 0 || named.length > 0) && (
          <p className="text-xs leading-relaxed text-pnc-muted">
            {on.length > 0 && `Owner of ${on.map((h) => h.name).join(", ")}. `}
            {named.length > 0 && `Beneficiary of ${named.map((h) => h.name).join(", ")}.`}
          </p>
        )}
        {m.contact && <p className="text-xs text-pnc-link">{m.contact}</p>}
      </div>
    </li>
  );
}

export function FamilyPanel({ facts }: { facts: ClientFacts }) {
  const people = [...facts.p.members].sort(
    (a, b) => Number(a.relationship !== "Self") - Number(b.relationship !== "Self"),
  );
  return (
    <section>
      <h3 className={sectionTitle}>Family and advisors</h3>
      <p className="mt-1 text-sm text-pnc-muted">
        Everyone connected to {facts.c.name}&apos;s accounts, with the roles they hold.
      </p>
      <ul className="mt-4 grid gap-3 @3xl:grid-cols-2">
        {people.map((m) => (
          <MemberCard key={m.name} m={m} facts={facts} />
        ))}
      </ul>
    </section>
  );
}
