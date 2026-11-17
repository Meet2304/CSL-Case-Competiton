/**
 * MOCK DATA for the estate of a customer who has died, as the advisor sees it:
 * the death certificate the bank received and verified, the will on file, and
 * the advisors who look after each beneficiary. Every name, number and date
 * is invented. People outside the family are named by role.
 */

/** A death certificate as received and verified by the bank. */
export type DeathCertificate = {
  certificateNumber: string;
  decedent: string;
  placeOfDeath: string;
  mannerOfDeath: string;
  certifiedBy: string;
  issuedBy: string;
  /** Who sent it to the bank, and how. */
  receivedFrom: { personId: string; via: string };
  verifiedBy: string;
};

/** John's certificate. Dates come from the recorded death (src/lib/bereavement.ts). */
export const deathCertificates: Record<string, DeathCertificate> = {
  "p-jordan": {
    certificateNumber: "SC-2026-004417",
    decedent: "John Smith",
    placeOfDeath: "Sample General Hospital, Pittsburgh, PA",
    mannerOfDeath: "Natural",
    certifiedBy: "Attending physician, Sample General Hospital",
    issuedBy: "Sample County Office of Vital Records",
    receivedFrom: { personId: "p-casey", via: "Uploaded in the PortfolioView app" },
    verifiedBy: "PNC Estate Services",
  },
};

/** A will on file: specific gifts of accounts, then the rest of the estate by share. */
export type WillOnFile = {
  signedOn: string;
  executor: string; // person id
  attorney: string;
  /** Accounts left to named people, with each one's share (shares add up to 1). */
  gifts: Record<string, { personId: string; share: number }[]>;
  /** Everything else, after debts are paid, with each one's share. */
  residuary: { personId: string; share: number }[];
};

export const willsOnFile: Record<string, WillOnFile> = {
  "p-jordan": {
    signedOn: "2024-03-12",
    executor: "p-casey",
    attorney: "Dana Example, estate attorney",
    gifts: {
      "acct-jordan-savings": [
        { personId: "p-avery", share: 0.5 },
        { personId: "p-riley", share: 0.5 },
      ],
    },
    residuary: [
      { personId: "p-casey", share: 0.5 },
      { personId: "p-avery", share: 0.25 },
      { personId: "p-riley", share: 0.25 },
    ],
  },
};

/** Another advisor at the bank, who looks after one of the beneficiaries. */
export type PeerAdvisor = { id: string; name: string; team: string };

/**
 * Each adult beneficiary's own advisor. A minor's share is held in a custodial
 * account run by their custodian, so the custodian's advisor is told instead.
 */
export const beneficiaryAdvisors: Record<string, PeerAdvisor> = {
  "p-casey": {
    id: "adv-private-banker",
    name: "Private Banker",
    team: "PNC Private Bank · Pittsburgh",
  },
};

/**
 * Who acts for a beneficiary under 18: David is 17 (18 on Nov 30) and Alexa
 * is 14, so Maya holds both shares and hears about them.
 */
export const custodianFor: Record<string, string> = { "p-avery": "p-casey", "p-riley": "p-casey" };
