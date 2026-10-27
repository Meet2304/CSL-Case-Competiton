"use client";

import type { ReactNode } from "react";
import { Chip } from "@/components/advisor/assistant/parts";
import { WillStatus } from "@/components/advisor/WillStatus";
import { MockBadge } from "@/components/mock/Mock";
import { Money } from "@/components/ui/Money";
import type { ClientMember, Holding } from "@/data/types";
import type { ClientFacts } from "@/lib/assistant";
import { cn, formatDate, relativeDay } from "@/lib/format";

const sectionTitle = "font-display text-lg font-medium text-pnc-ink";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

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
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <span className="block font-semibold text-pnc-ink">
          {h.name}
          {h.last4 && <span className="text-xs font-normal text-pnc-muted"> x{h.last4}</span>}
        </span>
        <span className="text-xs text-pnc-muted">{h.type}</span>
      </th>
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
        {h.contingentBeneficiaries?.length ? (
          <span className="block text-xs text-pnc-muted">
            (contingent: {h.contingentBeneficiaries.join(", ")})
          </span>
        ) : null}
      </td>
      <td className="py-3 text-right">
        <Money value={h.value} className="font-semibold" />
      </td>
    </tr>
  );
}

function HoldingsTable({
  holdings,
  facts,
  caption,
}: {
  holdings: Holding[];
  facts: ClientFacts;
  caption: string;
}) {
  const head = "pb-2 pr-4 text-xs font-semibold text-pnc-muted";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-pnc-line">
            <th scope="col" className={head}>
              Account
            </th>
            <th scope="col" className={head}>
              Owners
            </th>
            <th scope="col" className={head}>
              Beneficiaries
            </th>
            <th scope="col" className={cn(head, "pr-0 text-right")}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <HoldingRow key={h.id} h={h} facts={facts} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
        aria-hidden="true"
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

/**
 * Reference facts about the client, in the order an advisor looks them up:
 * who they are, who's around them, and what they hold. No advice here — that
 * lives in Next steps.
 */
export function ClientPanel({ facts }: { facts: ClientFacts }) {
  const { c, p } = facts;
  const pnc = p.holdings.filter((h) => !h.external);
  const outside = p.holdings.filter((h) => h.external);
  const people = [...p.members].sort(
    (a, b) => Number(a.relationship !== "Self") - Number(b.relationship !== "Self"),
  );
  const rows: [string, ReactNode][] = [
    ["Age", p.age],
    ["Occupation", p.occupation],
    ["Lives in", p.city],
    ["Client since", p.clientSince],
    ["Segment", c.segment],
    ["Relationship", <Money key="v" value={c.relationshipValue} className="font-semibold" />],
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
    <div className="space-y-8">
      <section aria-labelledby="client-profile" className="grid gap-6 @3xl:grid-cols-2">
        <div>
          <h3 id="client-profile" className={sectionTitle}>
            Profile
          </h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-pnc-line pb-2">
                <dt className="text-pnc-muted">{k}</dt>
                <dd className="text-right text-pnc-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className={sectionTitle}>Goals</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {p.goals.map((g) => (
                <li key={g} className="rounded-full bg-pnc-surface px-3 py-1 text-sm">
                  {g}
                </li>
              ))}
            </ul>
          </div>
          {p.notes.length > 0 && (
            <div>
              <h3 className={sectionTitle}>Your notes</h3>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-pnc-ink">
                {p.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
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
          </div>
        </div>
      </section>

      <section aria-labelledby="client-family">
        <h3 id="client-family" className={sectionTitle}>
          Family and advisors
        </h3>
        <ul className="mt-3 grid gap-3 @3xl:grid-cols-2">
          {people.map((m) => (
            <MemberCard key={m.name} m={m} facts={facts} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="client-holdings">
        <div className="flex items-center justify-between gap-2">
          <h3 id="client-holdings" className={sectionTitle}>
            Accounts at PNC
          </h3>
          <MockBadge />
        </div>
        <div className="mt-3">
          <HoldingsTable holdings={pnc} facts={facts} caption={`${c.name}'s accounts at PNC`} />
        </div>
        {outside.length > 0 && (
          <>
            <h4 className="mt-6 font-semibold text-pnc-ink">Held outside PNC</h4>
            <div className="mt-2">
              <HoldingsTable
                holdings={outside}
                facts={facts}
                caption={`${c.name}'s accounts held outside PNC`}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
