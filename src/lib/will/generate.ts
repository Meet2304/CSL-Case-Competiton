import { MOCK_AS_OF } from "@/data/mock";
import { stateName } from "@/data/will";
import { formatDate } from "@/lib/format";
import {
  assetCategories,
  assetTitle,
  contingentLines,
  describeRows,
  giftTitle,
  lastResortSummary,
  money,
  ownedByLabels,
} from "./describe";
import { minorChildren, named, primaryRows, round2, spouseName, totalPercent } from "./flow";
import type { Person, WillDraft } from "./types";

/**
 * Renders a plain-text DRAFT of the will from the planner's answers. This is
 * a preview for the prototype, not legal language reviewed by an attorney.
 * With `mirror`, the spouse becomes the testator and vice versa.
 */
export function generateWill(
  draft: WillDraft,
  accountHolder: string,
  { mirror = false } = {},
): string {
  const spouse = spouseName(draft);
  const d = mirror ? swapNames(draft, spouse, accountHolder) : draft;
  const testator = mirror ? spouse : accountHolder;
  const partner = mirror ? accountHolder : spouse;
  const married = d.basics.marital === "married";
  const children = d.nominees.hasChildren === "yes" ? named(d.nominees.children) : [];
  const place = [d.basics.address.city, d.basics.address.state && stateName(d.basics.address.state)]
    .filter(Boolean)
    .join(", ");
  const out: string[] = [];
  let article = 0;
  const heading = (title: string) => {
    article += 1;
    out.push("", `ARTICLE ${roman(article)} — ${title.toUpperCase()}`, "");
  };
  const list = (people: Person[]) =>
    named(people).map(
      (p, i) =>
        `  ${i + 1}. ${p.name}${p.relationship ? ` (${p.relationship.toLowerCase()})` : ""}`,
    );

  out.push(
    "DRAFT PREVIEW — NOT A LEGAL DOCUMENT. Review with an attorney before signing.",
    "",
    `LAST WILL AND TESTAMENT OF ${testator.toUpperCase()}`,
    "",
    `I, ${testator}, a resident of ${place || "[city, state]"}, being of sound mind and memory, declare this to be my Last Will and Testament. I revoke all wills and codicils I have previously made.`,
  );

  heading("Family");
  const family: string[] = [];
  if (married) family.push(`I am married to ${partner}, referred to in this will as "my spouse."`);
  else if (d.basics.marital === "partnership") family.push("I am in a domestic partnership.");
  else family.push("I am not married.");
  if (children.length) {
    family.push(
      `I have ${children.length === 1 ? "one child" : `${children.length} children`}: ${children
        .map((c) => `${c.name}${c.birthdate ? ` (born ${formatDate(c.birthdate, "medium")})` : ""}`)
        .join(
          "; ",
        )}. References to "my children" include them and any child born to or adopted by me after I sign this will.`,
    );
  } else {
    family.push("I have no children.");
  }
  out.push(family.join(" "));

  const minors = minorChildren(d);
  if (minors.length && named(d.nominees.guardians).length) {
    heading("Guardian of minor children");
    out.push(
      "If any child of mine is a minor at my death and no parent of that child survives me, I nominate the following people, in order of preference, as guardian of the person and property of that child:",
      ...list(d.nominees.guardians),
    );
  }

  if (d.nominees.hasPets === "yes" && named(d.nominees.petGuardians).length) {
    heading("Care of pets");
    out.push(
      `I ask that the following people, in order of preference, take custody of and care for my pets${d.nominees.petNames ? ` (${d.nominees.petNames})` : ""}:`,
      ...list(d.nominees.petGuardians),
    );
  }

  if (d.gifts.length) {
    heading("Specific gifts");
    d.gifts.forEach((g, i) => {
      const primary = named(g.primary).map((p) => p.name);
      const contingent = named(g.contingent).map((p) => p.name);
      out.push(
        `${i + 1}. I give ${giftTitle(g)} to ${joinAnd(primary)}${primary.length > 1 ? " in equal shares" : ""}.` +
          (contingent.length
            ? ` If ${primary.length > 1 ? "none of them survives" : "they do not survive"} me, I give it to ${joinAnd(contingent)}.`
            : " If this gift fails, it becomes part of my residuary estate."),
      );
    });
  }

  heading("Residuary estate");
  out.push(
    'I give the rest of my property, including lapsed gifts (my "residuary estate"), as follows:',
    "",
    `Primary beneficiaries: ${residuaryPrimary(d, partner)}.`,
  );
  // Contingent wording names no one but charities, so it reads the same in a mirror will.
  for (const line of contingentLines(d)) out.push(`→ ${line}.`);
  out.push(
    `Takers of last resort: if none of the beneficiaries above survive me, ${
      d.residuary.lastResort.plan === "heirs"
        ? "my residuary estate passes to my heirs at law under the laws of the state of my residence"
        : `my residuary estate passes ${lastResortSummary(d)}`
    }.`,
    "A beneficiary must survive me by 30 days to inherit under this will.",
  );
  if (d.residuary.consent === "yes") {
    out.push(
      "I consent to the charitable beneficiaries named in this will being told of my intended gift.",
    );
  }

  heading("Executor");
  const executors = named(d.provisions.executors);
  out.push(
    "I nominate the following people, in order of preference, to serve as executor of this will. If my first choice cannot or will not serve, the next named person shall serve:",
    ...list(d.provisions.executors),
    `No bond shall be required of ${executors.length > 1 ? "any executor" : "my executor"}.`,
  );

  heading("Digital assets");
  out.push(
    d.provisions.digital === "yes"
      ? "I nominate the following people, in order of preference, as my digital executor, with power to access, download, back up, convert, manage and delete my digital assets and devices:"
      : "My executor shall also serve as my digital executor, with power to access, download, back up, convert, manage and delete my digital assets and devices.",
    ...(d.provisions.digital === "yes" ? list(d.provisions.digitalExecutors) : []),
    d.provisions.digitalComms === "yes"
      ? "My digital executor may access the content of my electronic communications."
      : "My digital executor may not access the content of my electronic communications, only the records of them.",
  );

  const general: string[] = [];
  if (d.provisions.noContest === "yes") {
    general.push(
      "No-contest: any beneficiary who contests this will without probable cause shall be treated as having died before me and shall receive nothing under it.",
    );
  }
  if (d.provisions.independent === "yes") {
    general.push(
      "Independent administration: I direct that my estate be administered without court supervision to the extent the law allows.",
    );
  } else if (d.provisions.independent === "no") {
    general.push(
      "Supervised administration: I direct that my estate be administered under court supervision.",
    );
  }
  if (d.funeral.service || d.funeral.body || named(d.funeral.people).length) {
    general.push(
      "My funeral and final resting place wishes are recorded separately and are not legally binding.",
    );
  }
  if (general.length) {
    heading("General provisions");
    out.push(...general);
  }

  out.push(
    "",
    `Signed on ____________, 20___ at ${place || "____________"}.`,
    "",
    "______________________________",
    testator,
    "",
    "WITNESSES",
    "We declare that the testator signed this will in our presence, appeared to be of sound mind and free of undue influence, and that we signed as witnesses in the testator's presence and in each other's presence.",
    "",
    "Witness 1: ______________________________   Address: ______________________________",
    "Witness 2: ______________________________   Address: ______________________________",
  );

  if (d.provisions.affidavit === "yes") {
    out.push(
      "",
      "SELF-PROVING AFFIDAVIT",
      `State of ${d.basics.address.state ? stateName(d.basics.address.state) : "__________"}, County of __________`,
      "The testator and witnesses, sworn before the undersigned notary, declare that the testator signed this instrument as their will, willingly, and that each witness signed in the presence of the testator and of each other.",
      "",
      "Notary Public: ______________________________   My commission expires: __________",
    );
  }

  const schedule = assetSchedule(d);
  if (schedule.length) {
    out.push(
      "",
      "SCHEDULE A — ASSETS LISTED FOR MY EXECUTOR (for reference only; this list does not make gifts)",
      ...schedule,
    );
  }

  if (
    d.funeral.service ||
    d.funeral.body ||
    named(d.funeral.people).length ||
    d.funeral.charities.length
  ) {
    out.push("", "ATTACHMENT — FUNERAL WISHES (not legally binding)");
    if (named(d.funeral.people).length)
      out.push("Responsible, in order of preference:", ...list(d.funeral.people));
    if (d.funeral.service) out.push(`Funeral service: ${d.funeral.service}`);
    if (d.funeral.body) out.push(`Body and final resting place: ${d.funeral.body}`);
    if (d.funeral.charities.length)
      out.push(`In my memory, please support: ${d.funeral.charities.join(", ")}`);
  }

  if (d.provisions.statement === "yes" && d.provisions.statementText.trim() && !mirror) {
    out.push(
      "",
      "ATTACHMENT — PERSONAL STATEMENT (not legally binding)",
      d.provisions.statementText.trim(),
    );
  }

  out.push(
    "",
    `Draft generated ${formatDate(MOCK_AS_OF, "medium")} by the PNC will planner (prototype).`,
  );
  return out.join("\n");
}

function residuaryPrimary(d: WillDraft, partner: string): string {
  const rows = primaryRows(d);
  if (d.residuary.primary.plan === "custom") return describeRows(rows);
  const rest = round2(100 - totalPercent(rows));
  return [describeRows(rows), `${rest}% to my spouse, ${partner}`].filter(Boolean).join("; ");
}

/**
 * For a mirror will, anyone named as the spouse becomes the account holder and
 * vice versa (e.g. "Executor: my spouse" points at the right person).
 */
function swapNames(d: WillDraft, spouse: string, holder: string): WillDraft {
  const norm = (s: string) => s.trim().toLowerCase();
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
      if (typeof out.name === "string" && "relationship" in out) {
        if (norm(out.name) === norm(spouse)) out.name = holder;
        else if (norm(out.name) === norm(holder)) out.name = spouse;
      }
      return out;
    }
    return v;
  };
  return walk(d) as WillDraft;
}

function assetSchedule(d: WillDraft): string[] {
  if (d.assets.method === "estimate") {
    return d.assets.estimate
      ? [`Estimated total value of assets distributed by this will: ${d.assets.estimate}`]
      : [];
  }
  return d.assets.items.map((a, i) => {
    const bits = [
      assetCategories[a.category].label,
      assetTitle(a),
      a.value && money(a.value),
      a.ownedBy && `owned by: ${ownedByLabels[a.ownedBy].toLowerCase()}`,
      a.payableOnDeath && "has payable-on-death beneficiaries",
      a.location && `location: ${a.location}`,
    ].filter(Boolean);
    return `  ${i + 1}. ${bits.join(" — ")}`;
  });
}

function joinAnd(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function roman(n: number): string {
  return (
    ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n - 1] ?? String(n)
  );
}
