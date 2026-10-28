/**
 * MOCK DATA — the bank's directory of who a customer can contact, read by
 * Findoe when it answers "who should I talk to?". Numbers are in the 555-01xx
 * range reserved for fiction. Outside offices (the Register of Wills, Social
 * Security) are cited from the legal library instead (src/data/settlement/sources.ts).
 */
import { people } from "./household";

export type BankContact = {
  id: string;
  name: string;
  /** What they help with, in one line. */
  detail: string;
  phone?: string;
  email?: string;
  hours?: string;
};

export const estateCare: BankContact = {
  id: "estate-care",
  name: "PNC Estate Care team",
  detail: "One team for every PNC account after a death, and for questions about planning ahead.",
  phone: "1-800-555-0142",
  hours: "Mon–Fri, 8am–8pm ET",
};

const dana = people.find((p) => p.id === "p-dana")!;

/** The household's estate attorney, as the bank has them on file. */
export const familyAttorney: BankContact = {
  id: "attorney",
  name: dana.name,
  detail: dana.note ?? "Estate attorney",
  email: dana.email,
};
