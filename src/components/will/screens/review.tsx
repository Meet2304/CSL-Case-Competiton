"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Download, FileCheck2 } from "lucide-react";
import { NavButtons, usePlanner } from "@/components/will/context";
import { WillDocument } from "@/components/will/WillDocument";
import { genderOptions, SpouseNameFields } from "@/components/will/screens/basics";
import { yesNoOptions } from "@/components/will/screens/nominees";
import {
  buttonClass,
  Callout,
  DateInput,
  LearnMore,
  OptionTiles,
  PageHeading,
  Question,
  QuestionCard,
} from "@/components/will/ui";
import { formatDate } from "@/lib/format";
import {
  assetCategories,
  assetTitle,
  contingentLines,
  formatAddress,
  genderLabels,
  giftTitle,
  lastResortSummary,
  maritalLabels,
  money,
  primarySummary,
  yesNo,
} from "@/lib/will/describe";
import {
  incompleteScreens,
  isMarried,
  minorChildren,
  named,
  screenTitles,
  spouseName,
} from "@/lib/will/flow";
import { generateWill } from "@/lib/will/generate";
import { readWillStatus, setWillStatus } from "@/lib/will/storage";
import type { Person, WillDraft } from "@/lib/will/types";

export function MirrorWillsScreen() {
  const { draft, update, errors, goTo } = usePlanner();
  const setReview = (patch: Partial<WillDraft["review"]>) =>
    update((d) => ({ ...d, review: { ...d.review, ...patch } }));
  const { review } = draft;

  return (
    <>
      <PageHeading title="Mirror Wills">
        <p>
          Mirror Wills are Wills made by two individuals (most commonly spouses or partners) with
          similar wishes for the distribution of their estates. When your Will is mirrored, your
          spouse&apos;s name will replace your name and vice versa. Mirror Wills generally
          aren&apos;t suitable for couples with different wishes or if there are children from prior
          relationships.
        </p>
        <LearnMore label="Learn more about Mirror Wills">
          A mirror will is a separate, independent will for your spouse that copies your choices
          with your names swapped. Each of you signs your own will, and either of you can change
          yours later without changing the other.
        </LearnMore>
        <Callout>
          If you listed a nonprofit as a primary beneficiary in your Will, the gift will also appear
          in your spouse&apos;s Will as part of the mirroring process. This means the nonprofit will
          receive two separate gifts of the same value - one distributed upon your passing and
          another upon your spouse&apos;s passing. Please review your plan and{" "}
          <button
            type="button"
            onClick={() => goTo("residuary.primary")}
            className="text-pnc-link underline underline-offset-2"
          >
            click here if you need to make any adjustments
          </button>{" "}
          (e.g., gift amount).
        </Callout>
      </PageHeading>

      <QuestionCard>
        <Question
          label="Do you want to create a one-time will for your spouse?"
          required
          error={errors.mirror}
          hint="By selecting “Yes”, the Mirror Will and profile for your spouse will be created under this account. Subsequent changes made to either document will not be reflected in the other."
        >
          <OptionTiles
            label="Create a mirror will"
            options={yesNoOptions}
            value={review.mirror}
            onChange={(mirror) => setReview({ mirror })}
          />
        </Question>

        {review.mirror === "yes" && (
          <>
            <SpouseNameFields
              spouse={draft.basics.spouse}
              onChange={(patch) =>
                update((d) => ({
                  ...d,
                  basics: { ...d.basics, spouse: { ...d.basics.spouse, ...patch } },
                }))
              }
            />
            <Question
              label="What is your spouse's gender?"
              required
              error={errors.spouseGender}
              help="This lets your spouse's will describe them correctly."
            >
              <OptionTiles
                label="Spouse's gender"
                wide
                options={genderOptions}
                value={review.spouseGender}
                onChange={(spouseGender) => setReview({ spouseGender })}
              />
            </Question>
            <Question
              label="What is your spouse's birthdate?"
              required
              size="sm"
              hint="Enter the date in mm/dd/yyyy order."
            >
              <DateInput
                aria-label="Spouse's birthdate"
                value={review.spouseBirthdate}
                required
                onChange={(spouseBirthdate) => setReview({ spouseBirthdate })}
              />
            </Question>
            <label className="flex items-start gap-3 text-md">
              <input
                type="checkbox"
                required
                checked={review.spouseConsent}
                onChange={(e) => setReview({ spouseConsent: e.target.checked })}
                className="mt-1 size-5 shrink-0 accent-pnc-blue-700"
              />
              <span>
                By checking this box, your spouse, {spouseName(draft) || "your spouse"}, confirms
                they have read and accepted our{" "}
                <a href="#" className="text-pnc-link underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-pnc-link underline">
                  Privacy Notice
                </a>
                .
              </span>
            </label>
          </>
        )}
      </QuestionCard>
      <NavButtons />
    </>
  );
}

type Row = { label: string; value: ReactNode; screen: string };

const date = (iso: string) => (iso ? formatDate(iso, "medium") : "—");
const people = (rows: Person[]) =>
  named(rows).length
    ? named(rows)
        .map((p, i) => `${i + 1}. ${p.name}${p.relationship ? ` (${p.relationship})` : ""}`)
        .join("\n")
    : "—";
const text = (s: string) => s.trim() || "—";

function reviewSections(d: WillDraft, accountHolder: string): { title: string; rows: Row[] }[] {
  const { basics, nominees, assets, residuary, provisions, funeral } = d;
  const children = nominees.hasChildren === "yes" ? named(nominees.children) : [];
  return [
    {
      title: "Basics",
      rows: [
        { label: "Your name", value: accountHolder, screen: "basics.details" },
        {
          label: "Gender",
          value: basics.gender ? genderLabels[basics.gender] : "—",
          screen: "basics.details",
        },
        { label: "Birthdate", value: date(basics.birthdate), screen: "basics.details" },
        { label: "Phone number", value: text(basics.phone), screen: "basics.details" },
        { label: "Address", value: formatAddress(basics.address) || "—", screen: "basics.details" },
        {
          label: "Marital status",
          value: basics.marital ? maritalLabels[basics.marital] : "—",
          screen: "basics.marital",
        },
        ...(isMarried(d)
          ? [{ label: "Spouse", value: spouseName(d) || "—", screen: "basics.marital" }]
          : []),
      ],
    },
    {
      title: "Nominees",
      rows: [
        {
          label: "Children",
          value: children.length
            ? children.map((c) => `${c.name} (born ${date(c.birthdate)})`).join("\n")
            : "None",
          screen: "nominees.children",
        },
        ...(minorChildren(d).length
          ? [
              {
                label: "Guardians for minor children",
                value: people(nominees.guardians),
                screen: "nominees.guardians",
              },
            ]
          : []),
        {
          label: "Pet guardians",
          value:
            nominees.hasPets === "yes"
              ? `${people(nominees.petGuardians)}${nominees.petNames ? `\nPets: ${nominees.petNames}` : ""}`
              : "None",
          screen: "nominees.pets",
        },
      ],
    },
    {
      title: "Assets",
      rows:
        assets.method === "estimate"
          ? [
              {
                label: "Estimated total value",
                value: assets.estimate ?? "—",
                screen: "assets.estimate",
              },
            ]
          : [
              {
                label: "Listed assets",
                value: assets.items.length
                  ? assets.items
                      .map(
                        (a) =>
                          `${assetCategories[a.category].label}: ${assetTitle(a)}${a.value ? ` — ${money(a.value)}` : ""}`,
                      )
                      .join("\n")
                  : assets.method
                    ? "None listed yet"
                    : "—",
                screen: assets.method === "list" ? "assets.list" : "assets.method",
              },
            ],
    },
    {
      title: "Residuary",
      rows: [
        {
          label: "Nonprofits you care about",
          value: residuary.charities.join(", ") || "None",
          screen: "residuary.causes",
        },
        ...(residuary.charities.length
          ? [
              {
                label: "Let nonprofits know who you are",
                value: yesNo(residuary.consent),
                screen: "residuary.consent",
              },
            ]
          : []),
        { label: "Primary beneficiaries", value: primarySummary(d), screen: "residuary.primary" },
        {
          label: "Contingent beneficiaries",
          value:
            contingentLines(d)
              .map((l) => `→ ${l}`)
              .join("\n") || "—",
          screen: "residuary.secondary",
        },
        {
          label: "Takers of last resort",
          value: lastResortSummary(d),
          screen: "residuary.lastResort",
        },
      ],
    },
    {
      title: "Gifts",
      rows: [
        {
          label: "Specific gifts",
          value: d.gifts.length
            ? d.gifts
                .map(
                  (g) =>
                    `${giftTitle(g)} → ${
                      named(g.primary)
                        .map((p) => p.name)
                        .join(", ") || "not assigned"
                    }${
                      named(g.contingent).length
                        ? ` (else ${named(g.contingent)
                            .map((p) => p.name)
                            .join(", ")})`
                        : ""
                    }`,
                )
                .join("\n")
            : "None",
          screen: "gifts",
        },
      ],
    },
    {
      title: "Funeral",
      rows: [
        { label: "Responsible for your wishes", value: people(funeral.people), screen: "funeral" },
        { label: "Funeral service", value: text(funeral.service), screen: "funeral" },
        { label: "Body and final resting place", value: text(funeral.body), screen: "funeral" },
        {
          label: "Charities in your memory",
          value: funeral.charities.filter(Boolean).join(", ") || "—",
          screen: "funeral",
        },
      ],
    },
    {
      title: "Provisions",
      rows: [
        { label: "Executors", value: people(provisions.executors), screen: "provisions.executors" },
        {
          label: "Digital executor",
          value:
            provisions.digital === "yes"
              ? people(provisions.digitalExecutors)
              : provisions.digital === "no"
                ? "Same as my executor"
                : "—",
          screen: "provisions.digital",
        },
        {
          label: "Access to electronic communications",
          value: yesNo(provisions.digitalComms),
          screen: "provisions.digital",
        },
        {
          label: "No-contest clause",
          value: yesNo(provisions.noContest),
          screen: "provisions.noContest",
        },
        {
          label: "Self-proving affidavit",
          value: yesNo(provisions.affidavit),
          screen: "provisions.affidavit",
        },
        {
          label: "Independent administration",
          value: yesNo(provisions.independent),
          screen: "provisions.independent",
        },
        {
          label: "Personal statement",
          value:
            provisions.statement === "yes"
              ? text(provisions.statementText)
              : yesNo(provisions.statement),
          screen: "provisions.statement",
        },
      ],
    },
    ...(isMarried(d)
      ? [
          {
            title: "Mirror Will",
            rows: [
              {
                label: "One-time will for your spouse",
                value:
                  d.review.mirror === "yes"
                    ? `Yes — for ${spouseName(d)}${d.review.spouseGender ? `, ${genderLabels[d.review.spouseGender]}` : ""}, born ${date(d.review.spouseBirthdate)}`
                    : yesNo(d.review.mirror),
                screen: "review.mirror",
              },
            ],
          },
        ]
      : []),
  ];
}

export function ReviewScreen() {
  const { draft, goTo, previous, accountHolder, owner, exit } = usePlanner();
  const [wills, setWills] = useState<{ title: string; text: string }[] | null>(null);
  const [onFile, setOnFile] = useState(() => readWillStatus(owner) === "on-file");
  const incomplete = incompleteScreens(draft).filter((id) => id !== "review.summary");
  const edit = (screen: string) => goTo(screen, { returnToReview: true });

  function generate() {
    const mine = { title: "Your will", text: generateWill(draft, accountHolder) };
    const mirror =
      isMarried(draft) && draft.review.mirror === "yes"
        ? [
            {
              title: `Mirror will for ${spouseName(draft)}`,
              text: generateWill(draft, accountHolder, { mirror: true }),
            },
          ]
        : [];
    setWills([mine, ...mirror]);
  }

  return (
    <>
      <PageHeading title="Review your will">
        <p>
          Check every answer below. Use &lsquo;Edit&rsquo; to change one — you&apos;ll come straight
          back here. When everything looks right, generate a preview of your will.
        </p>
      </PageHeading>

      {reviewSections(draft, accountHolder).map((section) => (
        <section
          key={section.title}
          className="overflow-hidden rounded-md border border-pnc-line bg-white"
        >
          <h3 className="border-b border-pnc-line bg-pnc-surface/60 px-5 py-3 font-semibold text-pnc-ink">
            {section.title}
          </h3>
          <dl className="divide-y divide-pnc-line">
            {section.rows.map((r) => (
              <div
                key={r.label}
                className="grid gap-x-6 gap-y-1 px-6 py-3 text-sm @2xl:grid-cols-[14rem_1fr_auto]"
              >
                <dt className="text-pnc-muted">{r.label}</dt>
                <dd className="whitespace-pre-line text-pnc-ink">{r.value}</dd>
                <dd>
                  <button type="button" onClick={() => edit(r.screen)} className={buttonClass.link}>
                    Edit
                  </button>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {incomplete.length > 0 && (
        <div
          role="alert"
          className="space-y-2 rounded-md bg-attention-bg px-5 py-4 text-sm text-attention ring-1 ring-attention-line"
        >
          <p className="font-semibold">
            A few answers need attention before your will can be generated:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {incomplete.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => edit(id)}
                  className="underline underline-offset-2"
                >
                  {screenTitles[id]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pnc-line pt-5">
        {previous && (
          <button type="button" onClick={previous} className={buttonClass.secondary}>
            Previous
          </button>
        )}
        <button
          type="button"
          disabled={incomplete.length > 0}
          onClick={generate}
          className={buttonClass.primary}
        >
          {wills ? "Regenerate preview" : "Generate will (preview)"}
        </button>
      </div>

      {wills && (
        <div className="space-y-6 pt-2">
          {wills.map((w) => (
            <WillPreview key={w.title} title={w.title} text={w.text} />
          ))}
          <div className="flex flex-wrap items-center gap-4 rounded-md bg-pnc-blue-50 px-5 py-4">
            {onFile ? (
              <>
                <p className="flex flex-1 items-center gap-2 text-sm font-semibold text-pnc-positive">
                  <FileCheck2 className="size-5 shrink-0" aria-hidden="true" />
                  Your will is on file. The people it names can find it on their Family page.
                </p>
                <button type="button" onClick={exit} className={buttonClass.primary}>
                  Go to will overview
                </button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 basis-64 text-sm leading-relaxed">
                  Happy with the draft? Add it to your account so your family and your PNC advisor
                  know it&apos;s in place. It becomes legally valid once you print, sign and witness
                  it.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setWillStatus(owner, "on-file");
                    setOnFile(true);
                  }}
                  className={buttonClass.primary}
                >
                  Add will to my account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function WillPreview({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-medium">{title}</h3>
        <span className="flex gap-4">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}
            className={buttonClass.link}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{" "}
            {copied ? "Copied" : "Copy text"}
          </button>
          <button type="button" onClick={download} className={buttonClass.link}>
            <Download className="size-4" /> Download
          </button>
        </span>
      </header>
      <div className="rounded-md bg-pnc-surface px-3 py-6 @2xl:px-8 @2xl:py-10">
        <WillDocument text={text} />
      </div>
    </section>
  );
}
