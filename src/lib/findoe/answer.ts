/**
 * The shape of a Findoe answer — SIMULATED. Every claim in the text carries a
 * numbered marker, "[1]", pointing at one of two kinds of source: a row from
 * the bank's own records (customers, accounts, wills, families) or an entry
 * in the legal library (the settlement rulebook's cited sources). The answer
 * ends with actions the reader can take straight away. Pure data, so the
 * replies can be tested and the UI only has to draw them.
 */
import { rulebook } from "@/data/settlement";

/** Which table of the bank's records a row comes from. */
export type BankTable =
  | "Customer profile"
  | "Accounts"
  | "Wills"
  | "Families"
  | "Bereavement"
  | "People on file"
  | "Contacts"
  | "Clients";

/** A row from the bank's own records. */
export type BankSource = {
  kind: "bank";
  /** Unique within an answer, e.g. "account:acct-jordan-savings". */
  key: string;
  table: BankTable;
  /** e.g. "Savings x0002". */
  title: string;
  /** The fields that matter, e.g. "Owner: Husband · No beneficiary · $18,250.00". */
  detail: string;
};

/** An entry in the legal library: an id in `rulebook.sources`. */
export type LawSource = { kind: "law"; key: string };

export type Source = BankSource | LawSource;

export type ActionIcon =
  | "beneficiary"
  | "will"
  | "next-steps"
  | "assets"
  | "family"
  | "phone"
  | "email"
  | "web"
  | "client";

/** Something the reader can do next: a page in the app, a call, or an outside site. */
export type ReplyAction = {
  label: string;
  detail?: string;
  href: string;
  icon: ActionIcon;
  /** Opens outside the app (a phone number, an email, a government site). */
  external?: boolean;
};

export type Reply = {
  /** Plain text with **bold**, "- " bullets and "[n]" source markers. */
  text: string;
  /** `sources[n - 1]` is what "[n]" points at. */
  sources: Source[];
  actions: ReplyAction[];
  followUps: string[];
};

/**
 * Builds the text of an answer while numbering its sources: citing the same
 * source twice reuses its number.
 */
export class Citations {
  readonly sources: Source[] = [];

  private mark(source: Source): string {
    let i = this.sources.findIndex((s) => s.kind === source.kind && s.key === source.key);
    if (i < 0) i = this.sources.push(source) - 1;
    return `[${i + 1}]`;
  }

  /** Cites a row from the bank's records. */
  bank(source: Omit<BankSource, "kind">): string {
    return this.mark({ kind: "bank", ...source });
  }

  /** Cites the legal library; unknown ids are a bug, so they throw. */
  law(id: string): string {
    if (!rulebook.sources[id]) throw new Error(`Unknown legal source: ${id}`);
    return this.mark({ kind: "law", key: id });
  }

  reply(lines: string[], actions: ReplyAction[] = [], followUps: string[] = []): Reply {
    return { text: lines.join("\n"), sources: this.sources, actions, followUps };
  }
}

/** The legal library's entry for a law source. */
export const lawEntry = (key: string) => rulebook.sources[key];

/** Words that carry meaning in a question, for matching it against sources. */
export function keywords(text: string): string[] {
  const stop = new Set(
    "a an and are as at be can do does for from have how i if in is it me my of on or our should so that the their them then there this to us was we what when where which who why will with would you your".split(
      " ",
    ),
  );
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2 && !stop.has(w)),
    ),
  ];
}

/** Legal library entries that share the most words with a question, best first. */
export function searchLaw(question: string, limit = 3): string[] {
  const words = keywords(question);
  if (!words.length) return [];
  return Object.values(rulebook.sources)
    .map((s) => {
      const hay = `${s.title} ${s.summary} ${s.citation}`.toLowerCase();
      return { id: s.id, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.id);
}
