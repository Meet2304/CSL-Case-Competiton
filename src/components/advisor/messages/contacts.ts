"use client";

import { useMemo } from "react";
import { useAdvisorBook } from "@/components/advisor/useAdvisorBook";
import { beneficiaryAdvisors, custodianFor } from "@/data/estate";
import { HOUSEHOLD_ID, people } from "@/data/household";
import type { AvatarLook } from "@/data/types";
import { openLoss } from "@/lib/advisor";
import { formatMoney } from "@/lib/format";
import type { TransferPlan } from "@/lib/estate";
import { personById } from "@/lib/household";

/** Someone the advisor can message. */
export type Contact = {
  id: string;
  name: string;
  kind: "client" | "beneficiary" | "advisor";
  /** One line under the name, e.g. "Private Bank client" or "John's spouse · beneficiary". */
  detail: string;
  avatarSeed: string;
  look?: AvatarLook;
  /** For clients: their page in the advisor's book. */
  customerId?: string;
  deceased?: boolean;
};

/** The person behind the Sample household's client record (John). */
export const estateClient = { customerId: HOUSEHOLD_ID, personId: people[0].id };

const relationWord: Record<string, string> = { Spouse: "spouse", Child: "child" };

/** "John's spouse · beneficiary" for a person in John's family. */
export function beneficiaryDetail(personId: string, decedentId = estateClient.personId) {
  const p = personById(personId);
  const of = personById(decedentId)?.name ?? "";
  const rel = relationWord[p?.relationship === "Self" ? "" : (p?.relationship ?? "")] ?? "family";
  return `${of}'s ${rel} · beneficiary`;
}

/**
 * Everyone the advisor can message: the clients in their book (John marked
 * deceased once recorded) and, once John has died, his beneficiaries (for
 * condolences and the transfer) and their own advisors. A minor is reached
 * through their custodian.
 */
export function useContacts(): Contact[] {
  const { customers } = useAdvisorBook();
  const client = customers.find((c) => c.id === estateClient.customerId);
  const started = client ? openLoss(client)?.relationship === "Self" : false;
  return useMemo(() => {
    const clients: Contact[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      kind: "client",
      detail: `${c.segment} client`,
      avatarSeed: c.id,
      look:
        c.id === estateClient.customerId ? personById(estateClient.personId)?.avatar : undefined,
      customerId: c.id,
      deceased: openLoss(c)?.relationship === "Self",
    }));
    if (!started) return clients;
    const beneficiaryIds = Object.keys(beneficiaryAdvisors);
    const beneficiaries: Contact[] = beneficiaryIds.map((id) => {
      const p = personById(id)!;
      return {
        id,
        name: p.name,
        kind: "beneficiary",
        detail: beneficiaryDetail(id),
        avatarSeed: id,
        look: p.avatar,
      };
    });
    const advisors: Contact[] = beneficiaryIds.map((id) => {
      const a = beneficiaryAdvisors[id];
      return {
        id: a.id,
        name: a.name,
        kind: "advisor",
        detail: `${personById(id)?.name}'s advisor · ${a.team}`,
        avatarSeed: a.id,
      };
    });
    return [...clients, ...beneficiaries, ...advisors];
  }, [customers, started]);
}

const money = (n: number) => formatMoney(n);

/**
 * The notices sent when the advisor starts the transfer: one to each adult
 * beneficiary (a minor's goes to their custodian, in the same message) and
 * one to each beneficiary's own advisor. By contact id.
 */
export function transferNotices(plan: TransferPlan): { contactId: string; text: string }[] {
  const decedent = personById(plan.decedentId)?.name ?? "your family member";
  const line = (personId: string) => {
    const s = plan.shares.find((x) => x.personId === personId);
    if (!s) return "";
    const gets = s.receives.map((r) => `${r.account.name} (${money(r.amount)})`).join(", ");
    const owes = s.takesOn.length
      ? ` Your share of ${decedent}'s debts, ${money(s.takesOn.reduce((t, b) => t + b.amount, 0))}, is paid from the estate before this reaches you.`
      : "";
    return `${gets}.${owes}`;
  };
  const out: { contactId: string; text: string }[] = [];
  for (const id of Object.keys(beneficiaryAdvisors)) {
    const name = personById(id)?.name;
    const wards = Object.entries(custodianFor).filter(([, c]) => c === id);
    const forWards = wards
      .map(
        ([ward]) =>
          ` As ${personById(ward)?.name}'s custodian, you'll also hold their share until they turn 18: ${line(ward)}`,
      )
      .join("");
    out.push({
      contactId: id,
      text: `${name}, I'm so sorry about ${decedent}. As his advisor, I've started passing his estate on as his will directs. You'll receive ${line(id)}${forWards} There's nothing you need to do today. I'm here whenever you'd like to talk it through.`,
    });
    const adv = beneficiaryAdvisors[id];
    const total = plan.shares
      .filter((s) => s.personId === id || custodianFor[s.personId] === id)
      .reduce((t, s) => t + s.net, 0);
    out.push({
      contactId: adv.id,
      text: `For your awareness: I've started the wealth transfer for ${decedent} Sample's estate. Your client ${name} is a beneficiary${wards.length ? ` and custodian for ${wards.map(([w]) => personById(w)?.name).join(" and ")}` : ""}, with ${money(total)} passing to them net of debts. Notices have gone to ${name} directly.`,
    });
  }
  return out;
}
