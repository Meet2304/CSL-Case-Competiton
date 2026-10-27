/**
 * Every authority the settlement rulebook cites. Summaries are our own words,
 * not quotations. `verifiedOn` is set only once someone on the team has checked
 * the source itself; unverified sources are flagged in the UI and pinned by a
 * test (src/lib/settlement/__tests__/rulebook.test.ts).
 */
import type { RuleSource } from "@/data/types";

const VERIFIED = "2026-10-26";

const list: RuleSource[] = [
  {
    id: "pa-6304",
    title: "Right of survivorship",
    citation: "20 Pa.C.S. § 6304",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://law.justia.com/codes/pennsylvania/title-20/chapter-63/section-6304/",
    summary:
      "Money left in a joint (multiple-party) account when one party dies belongs to the surviving party or parties.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-ch64",
    title: "Transfer-on-death securities",
    citation: "20 Pa.C.S. §§ 6401–6413",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://law.justia.com/codes/pennsylvania/title-20/chapter-64/",
    summary:
      "Securities registered transfer-on-death belong to the surviving TOD beneficiaries when the owner dies.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-7790-3",
    title: "Certification of trust",
    citation: "20 Pa.C.S. § 7790.3",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://law.onecle.com/pennsylvania/title-20/7790.3.html",
    summary:
      "A trustee may hand a bank a short certification of trust instead of the whole trust document.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-3101",
    title: "Payments to family without letters",
    citation: "20 Pa.C.S. § 3101(b), as amended by Act 50 of 2025",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://www.lccpa.org/forms/RegOfWills/General/20PaCSA3101-publicweb.pdf",
    summary:
      "Without letters, a bank may pay a decedent's deposits of $20,000 or less in total to the spouse (then child, parent or sibling) against a receipted funeral bill or funeral director's affidavit. The limit was $10,000 until about Jan 23, 2026.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-act50-2025",
    title: "Act 50 of 2025",
    citation: "Act 50 of 2025 (HB 1176)",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://www.monroecountypa.gov/getmedia/27edf25f-4dcb-4bee-a7f2-5f026c6d8bb4/A_20250718_HouseBill513.pdf",
    summary:
      "Raised the § 3101(b) deposit limit from $10,000 to $20,000, effective 60 days after Nov 24, 2025.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-3102",
    title: "Small-estate petition",
    citation: "20 Pa.C.S. § 3102",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    // Secondary source; replace with the official statute page when found.
    url: "https://settledestate.com/pennsylvania/small-estate-affidavit/",
    summary:
      "A small-estate petition is available when the decedent's personal property (leaving out real estate and § 3101 payments) is $50,000 or less.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-inheritance-tax",
    title: "Pennsylvania inheritance tax",
    citation: "PA inheritance tax (72 P.S. § 9116 et seq.)",
    authority: "PA Department of Revenue",
    jurisdiction: "PA",
    kind: "agency-guidance",
    url: "https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/inheritance-tax.html",
    summary:
      "Rates are 0% to a spouse, 0% to a parent from a child 21 or younger, 4.5% to lineal heirs, 12% to siblings and 15% to others. Tax is due at death and delinquent after 9 months; paying within 3 months earns a 5% discount.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pa-register-of-wills",
    title: "Register of Wills and letters",
    citation: "20 Pa.C.S. Ch. 31 (Register of Wills; letters)",
    authority: "PA General Assembly",
    jurisdiction: "PA",
    kind: "statute",
    url: "https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/20.HTM",
    summary:
      "An executor or administrator obtains letters from the county Register of Wills before acting for the estate.",
  },
  {
    id: "irs-706-instr",
    title: "Estate tax return and portability",
    citation: "Instructions for Form 706 (07/2026); Rev. Proc. 2022-32",
    authority: "IRS",
    jurisdiction: "US",
    kind: "form-instructions",
    url: "https://www.irs.gov/instructions/i706",
    summary:
      "For 2026 deaths the basic exclusion is $15,000,000. The return is due 9 months after death (6-month extension on Form 4768). The executor may file to pass the unused exclusion to the surviving spouse (portability); estates not otherwise required to file may elect late, up to the 5th anniversary of death.",
    verifiedOn: VERIFIED,
  },
  {
    id: "irs-estate-whats-new",
    title: "Estate and gift tax: what's new",
    citation: "IRS — What's new, estate and gift tax",
    authority: "IRS",
    jurisdiction: "US",
    kind: "agency-guidance",
    url: "https://www.irs.gov/businesses/small-businesses-self-employed/whats-new-estate-and-gift-tax",
    summary:
      "The basic exclusion amount for 2026 deaths is $15,000,000, and portability lets a surviving spouse use the unused amount.",
    verifiedOn: VERIFIED,
  },
  {
    id: "irs-1041",
    title: "Estate income tax return",
    citation: "IRS — File an estate income tax return",
    authority: "IRS",
    jurisdiction: "US",
    kind: "agency-guidance",
    url: "https://www.irs.gov/individuals/file-an-estate-tax-income-tax-return",
    summary:
      "An estate with more than $600 of gross income in a year files Form 1041 and needs its own EIN; the decedent's final individual return is separate.",
    verifiedOn: VERIFIED,
  },
  {
    id: "irs-pub-559",
    title: "Survivors, executors and administrators",
    citation: "IRS Publication 559",
    authority: "IRS",
    jurisdiction: "US",
    kind: "agency-guidance",
    url: "https://www.irs.gov/publications/p559",
    summary:
      "Covers the decedent's final return (due April 15 of the year after death), fiduciary duties and the Form 56 notice.",
  },
  {
    id: "irs-pub-590b",
    title: "Distributions from IRAs",
    citation: "IRS Publication 590-B",
    authority: "IRS",
    jurisdiction: "US",
    kind: "agency-guidance",
    url: "https://www.irs.gov/publications/p590b",
    summary:
      "A surviving spouse may treat an inherited IRA as their own or keep it as inherited; other beneficiaries follow the non-spouse rules; multiple beneficiaries can split into separate accounts by Dec 31 of the year after death.",
  },
  {
    id: "rmd-final-regs-2024",
    title: "Required minimum distributions (final rules)",
    citation: "Treas. Reg. §§ 1.401(a)(9)-2, -5 (final, July 2024)",
    authority: "IRS",
    jurisdiction: "US",
    kind: "regulation",
    // Law-firm summary; replace with the Federal Register link when convenient.
    url: "https://taxnews.ey.com/news/2024-1945-irs-issues-final-required-minimum-distribution-regulations",
    summary:
      "Sets the 10-year rule, with annual RMDs in years 1–9 when the owner died on or after the required beginning date; treats a surviving spouse as an eligible designated beneficiary; applicable age 73 for those born 1951–1958. A missed year-of-death RMD may be taken by the beneficiary's tax-filing deadline (with extensions) or, if later, Dec 31 of the year after death.",
    verifiedOn: VERIFIED,
  },
  {
    id: "rmd-minor-child",
    title: "Minor child beneficiaries",
    citation: "Treas. Reg. § 1.401(a)(9)-4 (age of majority)",
    authority: "IRS",
    jurisdiction: "US",
    kind: "regulation",
    // Secondary source.
    url: "https://irahelp.com/slottreport/new-rmd-regs-have-a-surprising-result-for-minor-child-beneficiaries",
    summary:
      "The owner's minor child is an eligible designated beneficiary until 21; after that the 10-year rule applies and annual RMDs continue.",
    verifiedOn: VERIFIED,
  },
  {
    id: "irc-1014",
    title: "Basis of inherited property",
    citation: "26 U.S.C. § 1014",
    authority: "IRS",
    jurisdiction: "US",
    kind: "statute",
    url: "https://www.law.cornell.edu/uscode/text/26/1014",
    summary:
      "Property acquired from a decedent generally takes a basis equal to its fair market value at the date of death.",
  },
  {
    id: "fdic-330-3j",
    title: "Deposit insurance after an owner dies",
    citation: "12 C.F.R. § 330.3(j)",
    authority: "FDIC",
    jurisdiction: "US",
    kind: "regulation",
    url: "https://www.fdic.gov/financial-institution-employees-guide-deposit-insurance/death-account-owner",
    summary:
      "For six months after an owner dies, their deposits are insured as if they were still alive, unless the accounts are restructured (and only if that doesn't reduce coverage).",
    verifiedOn: VERIFIED,
  },
  {
    id: "treas-210",
    title: "Reclamation of federal benefit payments",
    citation: "31 C.F.R. § 210.10",
    authority: "US Treasury",
    jurisdiction: "US",
    kind: "regulation",
    url: "https://www.law.cornell.edu/cfr/text/31/210.10",
    summary:
      "A bank must return federal benefit payments it receives after learning the recipient has died, and the agency can reclaim post-death payments.",
    verifiedOn: VERIFIED,
  },
  {
    id: "ssa-lump-sum",
    title: "Social Security lump-sum death payment",
    citation: "SSA — Lump-sum death payment",
    authority: "SSA",
    jurisdiction: "US",
    kind: "agency-guidance",
    url: "https://www.ssa.gov/personal-record/when-someone-dies/lump-sum-death-payment",
    summary:
      "A surviving spouse may receive a one-time $255 payment; the application must be made within 2 years of the death.",
    verifiedOn: VERIFIED,
  },
  {
    id: "cfpb-1026-11c",
    title: "Card balances of deceased consumers",
    citation: "12 C.F.R. § 1026.11(c)",
    authority: "CFPB",
    jurisdiction: "US",
    kind: "regulation",
    url: "https://www.consumerfinance.gov/rules-policy/regulations/1026/11/",
    summary:
      "Card issuers must let the estate's administrator find out and pay the balance, disclose it within 30 days of a request, and add no new fees or rate increases after the request. Doesn't apply while a joint accountholder remains.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pnc-death-claims",
    title: "PNC death-claim practice",
    citation: "PNC — What happens to a bank account when someone dies",
    authority: "PNC",
    jurisdiction: "US",
    kind: "bank-policy",
    url: "https://www.pnc.com/insights/personal-finance/spend/what-happens-to-a-bank-account-when-someone-dies.html",
    summary:
      "PNC secures accounts when notified of a death; joint-with-survivorship and POD/TOD accounts pass outside probate; executors may open an estate account.",
    verifiedOn: VERIFIED,
  },
  {
    id: "pnc-cd-agreement",
    title: "CD early-withdrawal waiver on death",
    citation: "PNC CD/IRA account agreement (as summarized by a third party)",
    authority: "PNC",
    jurisdiction: "US",
    kind: "bank-policy",
    // Confirm against the actual PNC agreement.
    url: "https://simplytrust.com/financial-institutions/pnc-bank/death-claim/",
    summary: "The early-withdrawal penalty on a CD is waived when the depositor dies.",
  },
  {
    id: "plan-529",
    title: "529 plan program description",
    citation: "The 529 plan's program description",
    authority: "Plan documents",
    jurisdiction: "US",
    kind: "plan-document",
    url: "https://www.pa529.com/",
    summary:
      "Who controls a 529 plan after the owner dies is set by the plan documents and any successor-owner designation.",
  },
];

export const sources: Record<string, RuleSource> = Object.fromEntries(list.map((s) => [s.id, s]));

export const UNVERIFIED_SOURCE_IDS = Object.values(sources)
  .filter((s) => !s.verifiedOn)
  .map((s) => s.id);
