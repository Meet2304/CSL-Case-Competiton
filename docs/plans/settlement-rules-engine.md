# Implementation plan — Settlement Rules Engine ("Transition plan")

> **For the coding agent.** This document is self-contained. Read it top to bottom once, then
> execute the phases in order. Every file path, type, rule, expected test value and UI state you
> need is here. Where this plan and the code disagree about something that already exists, the
> code wins — stop and re-read the file rather than guessing. Where this plan and `AGENTS.md`
> disagree, `AGENTS.md` wins.
>
> Repo: `Meet2304/CSL-Case-Competiton` (branch from `main`, commit `1d4c7c4` or later).
> Suggested branch: `feat/settlement-rules-engine`.
> Competition deadline: **Wed Oct 28, 11:59 PM**. Phases are tagged **P0** (must ship for the
> submission), **P1** (ship if time allows), **P2** (after submission / finals).

---

## 0. What we are building, in one paragraph

A **deterministic, cited rules engine** that answers, for any household and any person in it:
_"When this person dies, what legally happens to each account, who gets it, what has to be done,
by when, under which federal or Pennsylvania rule, and which steps need a human professional to
sign off?"_ It runs in two modes from the **same rulebook**:

1. **Settlement mode (after a death):** the bank has recorded a death → the advisor sees a
   per-account route table, a dated deadline list, a household checklist, a review queue, and for
   every outcome a "why" trace of the decisions taken with the statute/regulation behind each one.
2. **Simulation mode (before a death):** "What if Riley died today?" → the same engine runs on
   today's data and turns every bad outcome (probate, a beneficiary who has died, no beneficiary,
   a minor named directly) into an **advisor alert with a fix**.

The pitch line this feature must make true on screen: **"Same protocols, run before the death
instead of after."**

The rulebook is **data with citations**, not prose in components and not a language model. The
(simulated) assistant in `src/lib/assistant.ts` keeps writing the human words; the engine supplies
the facts, routes, dates and sources it cites.

---

## 1. Orientation — read these before writing code

| File                                                                        | Why it matters                                                                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                 | Conventions you must follow (tokens, `MockBadge`, `routes`, public paths, CI checks, gentle copy).                                                              |
| `README.md`                                                                 | Demo flows: advisor records a death → customer sees Next steps.                                                                                                 |
| `src/data/types.ts`                                                         | All shapes. `Holding`, `ClientMember`, `ClientProfile`, `FamilyAsset`, `SuccessionMethod` matter most.                                                          |
| `src/data/clients.ts`                                                       | Advisor-side profiles. **Morgan Placeholder** (`c-placeholder`, spouse Riley died 2026-10-23) and **Avery Example** (`c-example`, parent Drew died 2026-10-19). |
| `src/data/family.ts`, `src/lib/family.ts`                                   | Customer-side family assets with a hand-labelled `method` (`joint`/`pod`/`tod`/`retirement`/`trust`/`estate`/`close`) and `methodSteps`.                        |
| `src/lib/assistant.ts`                                                      | Simulated assistant. `factsFor`, `assetRecommendations`, `lossBriefing`, `answerQuestion`, `engagementPlan`, `dailyBrief`.                                      |
| `src/lib/advisor.ts`                                                        | `openLoss`, `lossContact`, `withRecordedLosses` — deaths recorded at runtime.                                                                                   |
| `src/lib/bereavement.ts`                                                    | `useSyncExternalStore` + `localStorage` store pattern — copy it for the review store.                                                                           |
| `src/components/advisor/client/ClientWorkspace.tsx`                         | Tabbed client page (`useHashTab`). The new tab goes here.                                                                                                       |
| `src/components/advisor/client/panels.tsx`, `LossGuide.tsx`, `AskPanel.tsx` | UI patterns: `AssistantPanel`, `Chip`, `priorityTone`, tables, `@container` breakpoints.                                                                        |
| `src/components/advisor/assistant/parts.tsx`                                | `AssistantMark`, `AssistantPanel`, `Chip`, `tabButton`.                                                                                                         |
| `src/components/advisor/DailyBrief.tsx`                                     | Daily brief kinds → tab deep links.                                                                                                                             |
| `src/lib/routes.ts`, `src/proxy.ts`, `src/lib/session.ts`                   | Public routes; advisor pages live under `/advisor/...` in both `app/web/advisor` and `app/mobile/advisor`.                                                      |
| `src/app/globals.css`                                                       | Color tokens. Use only these (`pnc-*`, `attention*`, `mock*`).                                                                                                  |

**Facts about the current codebase you will rely on**

- `MOCK_AS_OF = "2026-10-25"` (`src/data/mock.ts`) is "today" everywhere. The engine must never
  call `Date.now()` / `new Date()` without an explicit ISO input.
- Dates are ISO `yyyy-mm-dd` strings, parsed at `T12:00:00Z` (see `src/lib/format.ts`).
- Every hand-written and generated client lives in Pennsylvania (`profile.city` ends in `", PA"`).
  Pennsylvania is therefore the pilot state; everything else falls back to "state law not
  modelled — attorney confirms".
- `Holding.beneficiaries === undefined` means "not applicable to this account type";
  `[]` means "none on file". Keep that distinction — it drives the tree.
- No test runner exists yet. CI runs `format:check`, `typecheck`, `lint`, `build`. This plan adds
  Vitest (P0) because a legal rules engine without golden tests is not credible.
- There is a known inaccuracy in the assistant today: it says a missed year-of-death RMD is "due
  by Dec 31". Under the 2024 final RMD regulations the beneficiary has until their tax-filing
  deadline (with extensions) or, if later, Dec 31 of the year after death. Phase 12 fixes it by
  sourcing that sentence from the engine.

---

## 2. Scope

### In scope

| Tag | Item                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------- |
| P0  | Rulebook data: source registry, account decision tree, overlays, household rules, Pennsylvania state pack      |
| P0  | Pure engine: fact derivation, tree walk with trace, overlays, household rules, deadline math, totals           |
| P0  | Simulation ("what if X died today") with findings and fixes                                                    |
| P0  | Vitest + rulebook integrity tests + golden tests for Morgan, Avery, the Sample family; CI job                  |
| P0  | Advisor **Transition plan** tab (settlement view + what-if simulator) in `ClientWorkspace`                     |
| P0  | Advisor **Rulebook** page `/advisor/rules` (web + mobile) rendering the tree and sources                       |
| P1  | Review sign-off store + review queue UI                                                                        |
| P1  | Assistant integration: recommendations cite rule sources; new Ask intents; RMD copy fix; Daily brief readiness |
| P1  | Small data-model additions: `contingentBeneficiaries`, `successorOwner` on `Holding`                           |
| P2  | Customer-side "why this happens" on Next steps via the family adapter                                          |
| P2  | Align the advisor profile for `c-sample` with the customer family data                                         |
| P2  | Optional LLM "explain" layer, strictly grounded on engine output                                               |

### Out of scope (do not build)

- Fine-tuning or training any model. The engine is code + data.
- Any real backend, API calls to PNC, or real customer data.
- States other than Pennsylvania (only a generic fallback).
- Tax calculations (amounts of inheritance or estate tax). The engine flags which returns and
  rates apply and routes to a tax professional; it never computes tax owed.
- Changing how `methodSteps` / `familyReducer` / transfer flows behave today.

---

## 3. Vocabulary (use these names in code)

| Term                 | Meaning                                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rulebook**         | All rule data: sources, tree nodes, actions, overlays, household rules. Versioned (`RULEBOOK_VERSION`).                                                                                                                                                                    |
| **Source**           | A citable authority (statute, regulation, agency page, form, bank policy). Every rule points to ≥1 source id.                                                                                                                                                              |
| **Fact**             | A discrete value derived from the data about one account (`accountClass`, `decedentRole`, `beneficiaryStatus`, …), with an evidence string.                                                                                                                                |
| **Decision node**    | Asks one question about one fact; each possible fact value maps to a branch.                                                                                                                                                                                               |
| **Outcome node**     | A leaf: the settlement **route** for the account, who it passes to, actions, review levels, sources.                                                                                                                                                                       |
| **Route**            | How the account legally passes: `survivorship`, `beneficiary-claim`, `spousal-retirement-options`, `inherited-retirement`, `successor-trustee`, `successor-owner`, `probate`, `closes-estate-pays`, `insurer-claim`, `designation-update`, `not-affected`, `needs-review`. |
| **Overlay**          | A rule that adds actions/flags on top of an outcome when conditions match (FDIC grace period, step-up in basis, year-of-death RMD, PA §3101(b)…).                                                                                                                          |
| **Household rule**   | A rule evaluated once per death, not per account (final 1040, portability, PA inheritance tax, SSA, reclamation…).                                                                                                                                                         |
| **Action**           | A step with an owner (advisor, client, executor, bank operations, attorney, tax advisor, insurer), optional deadline, sources.                                                                                                                                             |
| **Deadline**         | An action date computed from the date of death. Kinds: `statutory` (set by law), `recommended`, `opportunity` (missing it costs a benefit).                                                                                                                                |
| **Review level**     | Who must sign off before the step is treated as final: `advisor`, `operations`, `trust-officer`, `attorney`, `tax-advisor`.                                                                                                                                                |
| **Assumption**       | Something the engine inferred instead of knowing (e.g. "Drew was 78, so we assume he had passed his required beginning date").                                                                                                                                             |
| **Open question**    | A fact the engine needs but the data doesn't have (e.g. "Was Drew's 2026 RMD already taken?"). Shown to the advisor; never guessed silently.                                                                                                                               |
| **Settlement plan**  | Engine output for a recorded death.                                                                                                                                                                                                                                        |
| **Readiness report** | Engine output for a simulated death: the plan + exposure totals + findings with fixes.                                                                                                                                                                                     |

---

## 4. Architecture and file map

```
                       ┌──────────────────────────────────────────────┐
  src/data/settlement/ │ RULEBOOK (data only, imports types only)       │
                       │  sources.ts   tree.ts   actions.ts             │
                       │  overlays.ts  household.ts  states/pa.ts       │
                       │  index.ts  → export const rulebook             │
                       └───────────────┬──────────────────────────────┘
                                       │
  src/lib/settlement/  ┌───────────────▼──────────────────────────────┐
  (pure functions)     │ facts.ts     derive AccountFacts/HouseholdFacts│
                       │ conditions.ts  evaluate Clause[]               │
                       │ walk.ts      tree walk → outcome + trace       │
                       │ dates.ts     deadline anchors → ISO dates      │
                       │ engine.ts    settlementPlan(input)             │
                       │ simulate.ts  readinessReport(...)              │
                       │ adapters.ts  ClientFacts / profile / family →  │
                       │              SettlementInput                   │
                       │ reviews.ts   sign-off store (client hook)      │
                       └───────────────┬──────────────────────────────┘
                                       │
         ┌─────────────────────────────┼──────────────────────────────┐
         ▼                             ▼                              ▼
 components/advisor/settlement/   lib/assistant.ts (P1)      components/bereavement (P2)
 TransitionPanel + views          cites rule sources          "why this happens"
 components/advisor/rulebook/     daily brief readiness
 app/{web,mobile}/advisor/rules/
```

### New files

```
docs/plans/settlement-rules-engine.md           (this file — commit it)
vitest.config.ts
src/data/settlement/sources.ts
src/data/settlement/actions.ts
src/data/settlement/tree.ts
src/data/settlement/overlays.ts
src/data/settlement/household.ts
src/data/settlement/states/pa.ts
src/data/settlement/index.ts
src/lib/settlement/dates.ts
src/lib/settlement/conditions.ts
src/lib/settlement/facts.ts
src/lib/settlement/walk.ts
src/lib/settlement/engine.ts
src/lib/settlement/simulate.ts
src/lib/settlement/adapters.ts
src/lib/settlement/reviews.ts                    (P1)
src/lib/settlement/__tests__/rulebook.test.ts
src/lib/settlement/__tests__/dates.test.ts
src/lib/settlement/__tests__/facts.test.ts
src/lib/settlement/__tests__/morgan.test.ts
src/lib/settlement/__tests__/avery.test.ts
src/lib/settlement/__tests__/family.test.ts
src/lib/settlement/__tests__/simulate.test.ts
src/lib/settlement/__tests__/fallback.test.ts
src/components/advisor/settlement/TransitionPanel.tsx
src/components/advisor/settlement/SettlementView.tsx
src/components/advisor/settlement/SimulationView.tsx
src/components/advisor/settlement/RouteTable.tsx
src/components/advisor/settlement/RuleTrace.tsx
src/components/advisor/settlement/DeadlineList.tsx
src/components/advisor/settlement/HouseholdChecklist.tsx
src/components/advisor/settlement/ReviewQueue.tsx    (P1)
src/components/advisor/settlement/FindingList.tsx
src/components/advisor/settlement/SourceChip.tsx
src/components/advisor/settlement/parts.ts           (route/review tone maps, labels)
src/components/advisor/rulebook/Rulebook.tsx
src/app/web/advisor/rules/page.tsx
src/app/mobile/advisor/rules/page.tsx
```

### Modified files (keep each diff small — other agents work in parallel)

```
package.json                     add vitest + "test" script
.github/workflows/ci.yml         add "test" job
src/data/types.ts                append "Settlement rules engine" section; 2 optional Holding fields (P1)
src/data/clients.ts              Morgan's IRA contingent beneficiary; Morgan's 529 successor (P1)
src/lib/routes.ts                advisorRules, advisorRuleNode
src/components/advisor/client/ClientWorkspace.tsx   add "transition" tab
src/components/advisor/client/LossGuide.tsx         link to Transition plan (P1)
src/components/advisor/client/panels.tsx            show contingent beneficiaries; rec sources (P1)
src/components/advisor/DailyBrief.tsx               "readiness" kind (P1)
src/components/advisor/RecordPassingPanel.tsx       Reset demo also clears reviews (P1)
src/components/web/WebHeader.tsx                    advisor nav: Rulebook
src/components/mobile/BottomTabBar.tsx              advisor tab: Rulebook
src/lib/assistant.ts                                P1 integration only (Phase 12)
README.md, AGENTS.md                                docs (Phase 12)
```

---

## 5. Phase 1 (P0) — Tooling: Vitest

1. `npm install -D vitest@^3` (any current major is fine; pin what installs).
2. `package.json` → scripts: add `"test": "vitest run"`.
3. Create `vitest.config.ts`:

   ```ts
   import { fileURLToPath } from "node:url";
   import { defineConfig } from "vitest/config";

   export default defineConfig({
     resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
     test: { include: ["src/**/*.test.ts"], environment: "node" },
   });
   ```

4. Tests import explicitly: `import { describe, expect, it } from "vitest";` (no globals, so
   `tsc --noEmit` passes without extra type config).
5. `.github/workflows/ci.yml` → add a fourth job mirroring the others:

   ```yaml
   test:
     name: Test
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v7
       - uses: actions/setup-node@v7
         with:
           node-version: 24
           cache: npm
       - run: npm ci
       - run: npm test
   ```

6. Confirm `npm run lint` does not complain about `vitest.config.ts`; if it does, fix the config,
   do not disable rules globally.

**Done when:** `npm test` runs (zero tests is fine at this point) and all four existing checks pass.

---

## 6. Phase 2 (P0) — Types

Append a new section at the **end** of `src/data/types.ts` (do not reorder existing code):

```ts
// ---------------------------------------------------------------------------
// Settlement rules engine: what legally happens to each account when someone
// dies, with the rule and source behind every step. Data in src/data/settlement,
// engine in src/lib/settlement. General guidance, not legal or tax advice.

export type Jurisdiction = "US" | "PA";

export type SourceAuthority =
  | "IRS"
  | "US Treasury"
  | "FDIC"
  | "SSA"
  | "CFPB"
  | "PA General Assembly"
  | "PA Department of Revenue"
  | "PNC"
  | "Plan documents";

export type SourceKind =
  | "statute"
  | "regulation"
  | "agency-guidance"
  | "form-instructions"
  | "bank-policy"
  | "plan-document";

export type RuleSource = {
  id: string;
  /** Short display title, e.g. "Right of survivorship". */
  title: string;
  /** Formal cite, e.g. "20 Pa.C.S. § 6304". */
  citation: string;
  authority: SourceAuthority;
  jurisdiction: Jurisdiction;
  kind: SourceKind;
  url: string;
  /** One or two sentences in our own words: what the source says that the rule relies on. */
  summary: string;
  /** ISO date someone on the team checked the source; absent = not yet verified. */
  verifiedOn?: string;
};

export type AccountClass =
  | "deposit" // checking, savings, money market
  | "cd"
  | "brokerage"
  | "ira-traditional" // incl. 401(k) rollover IRA
  | "ira-roth"
  | "ira-inherited"
  | "trust"
  | "education-529"
  | "life-insurance"
  | "credit-card"
  | "real-estate"
  | "vehicle"
  | "other";

/** What the person who died was to this account. */
export type DecedentRole =
  | "sole-owner"
  | "joint-owner"
  | "co-trustee"
  | "sole-trustee"
  | "plan-owner" // 529 account owner
  | "named-beneficiary" // someone else's account names them
  | "not-involved";

export type BeneficiaryStatus = "living" | "none-on-file" | "all-deceased" | "not-applicable";

export type PrimaryBeneficiaryCategory =
  | "spouse"
  | "minor-child-of-decedent"
  | "within-10-years-of-age" // not more than 10 years younger than the decedent
  | "other-individual"
  | "not-applicable";

export type TriState = "yes" | "no" | "unknown";

export type StateCode = "PA" | "other";

/** Discrete facts about one account, relative to one death. */
export type AccountFactValues = {
  accountClass: AccountClass;
  decedentRole: DecedentRole;
  beneficiaryStatus: BeneficiaryStatus;
  primaryBeneficiaryCategory: PrimaryBeneficiaryCategory;
  beneficiaryCount: number;
  anyBeneficiaryMinor: TriState;
  decedentPastRequiredBeginningDate: TriState;
  successorOwnerNamed: TriState; // 529 plans
  heldOutsidePnc: boolean;
  value: number;
  state: StateCode;
};

export type AccountFactKey = keyof AccountFactValues;

/** One fact with the plain-English evidence it was derived from. */
export type Fact<V> = { value: V; evidence: string };
export type AccountFacts = { [K in AccountFactKey]: Fact<AccountFactValues[K]> };

/** Household-level facts for one death. */
export type HouseholdFactValues = {
  state: StateCode;
  survivorIsSpouse: boolean;
  executorKnown: boolean;
  hasProbateAssets: boolean;
  probateValueAtPnc: number;
  /** Rough decedent gross estate (see facts.ts for the formula); always paired with an assumption. */
  estimatedGrossEstate: number;
  receivedFederalBenefits: TriState;
};

export type HouseholdFactKey = keyof HouseholdFactValues;
export type HouseholdFacts = { [K in HouseholdFactKey]: Fact<HouseholdFactValues[K]> };

/** A test on one fact. All clauses in a list must hold (AND). */
export type Clause<K extends string = string> = {
  fact: K;
  eq?: string | number | boolean;
  in?: (string | number | boolean)[];
  gt?: number;
  lte?: number;
};

export type SettlementRoute =
  | "survivorship"
  | "beneficiary-claim"
  | "spousal-retirement-options"
  | "inherited-retirement"
  | "successor-trustee"
  | "successor-owner"
  | "probate"
  | "closes-estate-pays"
  | "insurer-claim"
  | "designation-update"
  | "not-affected"
  | "needs-review";

export type ReviewLevel = "advisor" | "operations" | "trust-officer" | "attorney" | "tax-advisor";

export type ActionOwner =
  "advisor" | "client" | "executor" | "bank-operations" | "attorney" | "tax-advisor" | "insurer";

export type DeadlineAnchor =
  | { from: "date-of-death"; months: number }
  | { from: "dec-31"; yearsAfterDeath: number } // 0 = Dec 31 of the year of death
  | { from: "apr-15"; yearsAfterDeath: number };

export type DeadlineKind = "statutory" | "recommended" | "opportunity";

export type RuleAction = {
  id: string;
  label: string;
  /** Advisor-facing detail; may contain {decedent}, {survivor}, {account} placeholders. */
  detail: string;
  owner: ActionOwner;
  deadline?: { anchor: DeadlineAnchor; kind: DeadlineKind; label: string };
  sources: string[];
};

export type DecisionNode = {
  id: string;
  kind: "decision";
  question: string;
  fact: AccountFactKey;
  /** One branch per possible value of `fact` (enforced by a test). */
  branches: { when: string; label: string; next: string }[];
  sources: string[];
};

export type OutcomeNode = {
  id: string;
  kind: "outcome";
  route: SettlementRoute;
  title: string;
  /** Advisor-facing explanation. Placeholders allowed. */
  summary: string;
  /** Client-facing explanation: gentle, no jargon, no urgency. Placeholders allowed. */
  plain: string;
  passesTo:
    | "surviving-owners"
    | "beneficiaries"
    | "estate"
    | "successor-trustee"
    | "successor-owner"
    | "nobody"
    | "unchanged";
  probate: boolean;
  survivorAccess: "uninterrupted" | "after-claim" | "after-letters" | "not-applicable";
  typicalTimeline: string;
  actions: string[];
  review: ReviewLevel[];
  sources: string[];
};

export type RuleNode = DecisionNode | OutcomeNode;

export type Overlay = {
  id: string;
  title: string;
  /** Extra condition on the outcome's route; omitted = any route. */
  routes?: SettlementRoute[];
  when: Clause<AccountFactKey>[];
  detail: string;
  actions: string[];
  review?: ReviewLevel[];
  /** Show as a warning chip on the account row. */
  attention?: boolean;
  /** Questions to raise when a fact used here is "unknown". */
  asks?: { fact: AccountFactKey; question: string }[];
  sources: string[];
};

export type HouseholdRule = {
  id: string;
  jurisdiction: Jurisdiction;
  title: string;
  when: Clause<HouseholdFactKey>[];
  detail: string;
  actions: string[];
  review?: ReviewLevel[];
  asks?: { fact: HouseholdFactKey; question: string }[];
  sources: string[];
};

export type Rulebook = {
  version: string;
  /** ISO date the rule content was last reviewed. */
  asOf: string;
  rootNodeId: string;
  nodes: Record<string, RuleNode>;
  actions: Record<string, RuleAction>;
  overlays: Overlay[];
  household: HouseholdRule[];
  sources: Record<string, RuleSource>;
};
```

Engine output types go in `src/lib/settlement/engine.ts` (they are not mock data shapes):

```ts
export type TraceStep = {
  nodeId: string;
  question: string;
  answer: string; // branch label
  evidence: string; // Fact.evidence
  sources: string[];
};

export type PlannedAction = {
  key: string; // `${scope}:${actionId}`; scope = holding id or "household"
  action: RuleAction;
  detail: string; // placeholders filled
  due?: string; // ISO
  accountIds: string[];
};

export type OpenQuestion = { key: string; question: string; accountIds: string[] };

export type AccountPlan = {
  holding: Holding;
  facts: AccountFacts;
  outcome: OutcomeNode;
  summary: string; // filled
  plain: string; // filled
  passesToNames: string[];
  trace: TraceStep[];
  overlays: Overlay[];
  actions: PlannedAction[];
  assumptions: string[];
  openQuestions: OpenQuestion[];
  review: ReviewLevel[];
  attention: boolean;
};

export type SettlementTotals = {
  /** Value that passes without probate (survivorship, beneficiaries, trust, plan owner). */
  outsideProbate: number;
  /** Subset of outsideProbate the survivor can keep using with no paperwork at all. */
  uninterrupted: number;
  probate: number;
  debts: number; // negative or 0
  heldOutsidePnc: number;
  needsReview: number;
};

export type SettlementPlan = {
  rulebookVersion: string;
  asOf: string;
  mode: "settlement" | "simulation";
  deceased: { name: string; age?: number; dateOfDeath: string };
  survivor: { name: string; relationshipToDeceased: string };
  state: StateCode;
  accounts: AccountPlan[]; // decedent-involved accounts only (not "not-affected")
  household: { rule: HouseholdRule; detail: string; actions: PlannedAction[] }[];
  deadlines: PlannedAction[]; // every dated action, ascending by due
  openQuestions: OpenQuestion[];
  reviewQueue: { key: string; label: string; levels: ReviewLevel[] }[];
  assumptions: string[];
  totals: SettlementTotals;
  sourcesUsed: string[]; // ids, deduped, in first-use order
};
```

**P1 additions to `Holding`** (optional fields, so nothing else breaks):

```ts
  /** Named contingent beneficiaries (paid only if every primary beneficiary has died). */
  contingentBeneficiaries?: string[];
  /** 529 plans: who becomes account owner if the owner dies. Absent = not on file. */
  successorOwner?: string;
```

Semantics from now on: `beneficiaries` = **co-primary** beneficiaries (equal shares unless the
UI says otherwise); `contingentBeneficiaries` = contingent. For 529 plans, `beneficiaries` means
the **student**, not who inherits the account.

---

## 7. Phase 3 (P0) — Source registry `src/data/settlement/sources.ts`

`export const sources: Record<string, RuleSource>` — keyed by id. Write the `summary` in your own
words (no copied text). The table below is the content. The **Verified** column reflects what was
checked against the source on 2026-10-26; set `verifiedOn: "2026-10-26"` only for rows marked ✅.
Rows marked ⚠️ must ship **without** `verifiedOn` — the UI shows them as "citation not yet
verified" and a test (Phase 8) pins the list so nobody adds unverified sources silently.

| id                     | citation                                                      | authority / kind                              | url                                                                                                       | what the rule relies on                                                                                                                                                                                                                                                                                                                               | Verified                                                                     |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pa-6304`              | 20 Pa.C.S. § 6304                                             | PA General Assembly / statute                 | https://law.justia.com/codes/pennsylvania/title-20/chapter-63/section-6304/                               | Sums left in a joint (multiple-party) account at a party's death belong to the surviving party or parties.                                                                                                                                                                                                                                            | ✅                                                                           |
| `pa-ch64`              | 20 Pa.C.S. §§ 6401–6413                                       | PA General Assembly / statute                 | https://law.justia.com/codes/pennsylvania/title-20/chapter-64/                                            | Transfer-on-death registration of securities; on the owner's death the securities belong to the surviving TOD beneficiaries.                                                                                                                                                                                                                          | ✅                                                                           |
| `pa-7790-3`            | 20 Pa.C.S. § 7790.3                                           | PA General Assembly / statute                 | https://law.onecle.com/pennsylvania/title-20/7790.3.html                                                  | A trustee can give a third party a certification of trust instead of the full trust instrument.                                                                                                                                                                                                                                                       | ✅                                                                           |
| `pa-3101`              | 20 Pa.C.S. § 3101(b), as amended by Act 50 of 2025            | PA General Assembly / statute                 | https://www.lccpa.org/forms/RegOfWills/General/20PaCSA3101-publicweb.pdf                                  | Without letters, a bank pays a decedent's deposits totalling **$20,000 or less** to the spouse (then child, parent, sibling) on a receipted funeral bill or funeral director's affidavit. Limit rose from $10,000 effective about Jan 23, 2026.                                                                                                       | ✅                                                                           |
| `pa-act50-2025`        | Act 50 of 2025 (HB 1176)                                      | PA General Assembly / statute                 | https://www.monroecountypa.gov/getmedia/27edf25f-4dcb-4bee-a7f2-5f026c6d8bb4/A_20250718_HouseBill513.pdf  | Raised the § 3101(b) deposit limit from $10,000 to $20,000 (effective 60 days after Nov 24, 2025).                                                                                                                                                                                                                                                    | ✅                                                                           |
| `pa-3102`              | 20 Pa.C.S. § 3102                                             | PA General Assembly / statute                 | https://settledestate.com/pennsylvania/small-estate-affidavit/                                            | Small-estate petition when the decedent's personal property (excluding real estate and § 3101 payments) is **$50,000 or less**.                                                                                                                                                                                                                       | ✅ (secondary source; replace URL with the official statute page when found) |
| `pa-inheritance-tax`   | PA inheritance tax (72 P.S. § 9116 et seq.)                   | PA Department of Revenue / agency-guidance    | https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/inheritance-tax.html              | Rates: 0% spouse; 0% to a parent from a child 21 or younger; 4.5% lineal heirs; 12% siblings; 15% others. Due at death, delinquent after **9 months**; **5% discount** if paid within **3 months**.                                                                                                                                                   | ✅                                                                           |
| `pa-register-of-wills` | 20 Pa.C.S. Ch. 31 (Register of Wills; letters)                | PA General Assembly / statute                 | https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/20.HTM                                                 | The executor (or administrator) gets letters from the Register of Wills before acting for the estate.                                                                                                                                                                                                                                                 | ⚠️                                                                           |
| `irs-706-instr`        | Instructions for Form 706 (07/2026); Rev. Proc. 2022-32       | IRS / form-instructions                       | https://www.irs.gov/instructions/i706                                                                     | For 2026 deaths: basic exclusion **$15,000,000**; return due **9 months** after death (6-month extension on Form 4768); executor may file to elect portability of the unused exclusion to the surviving spouse; estates not otherwise required to file may elect late, up to the **5th anniversary** of death.                                        | ✅                                                                           |
| `irs-estate-whats-new` | IRS — What's new, estate and gift tax                         | IRS / agency-guidance                         | https://www.irs.gov/businesses/small-businesses-self-employed/whats-new-estate-and-gift-tax               | Basic exclusion amount for 2026 deaths is $15,000,000; portability lets a surviving spouse use the unused exclusion.                                                                                                                                                                                                                                  | ✅                                                                           |
| `irs-1041`             | IRS — File an estate income tax return                        | IRS / agency-guidance                         | https://www.irs.gov/individuals/file-an-estate-tax-income-tax-return                                      | An estate files Form 1041 if it has more than $600 of gross income in a year; it needs its own EIN; the decedent's final individual return is filed separately.                                                                                                                                                                                       | ✅                                                                           |
| `irs-pub-559`          | IRS Publication 559                                           | IRS / agency-guidance                         | https://www.irs.gov/publications/p559                                                                     | Survivors, executors and administrators: final return (due April 15 of the year after death), fiduciary duties, Form 56 notice.                                                                                                                                                                                                                       | ⚠️                                                                           |
| `irs-pub-590b`         | IRS Publication 590-B                                         | IRS / agency-guidance                         | https://www.irs.gov/publications/p590b                                                                    | Inherited IRAs: spouse may treat as own or keep as inherited; non-spouse rules; separate accounts for multiple beneficiaries by Dec 31 of the year after death.                                                                                                                                                                                       | ⚠️                                                                           |
| `rmd-final-regs-2024`  | Treas. Reg. §§ 1.401(a)(9)-2, -5 (final, July 2024)           | IRS / regulation                              | https://taxnews.ey.com/news/2024-1945-irs-issues-final-required-minimum-distribution-regulations          | 10-year rule; annual RMDs in years 1–9 when the owner died on/after the required beginning date; surviving spouse is an eligible designated beneficiary; applicable age 73 for those born 1951–1958; a missed year-of-death RMD may be taken by the beneficiary's tax-filing deadline (with extensions) or, if later, Dec 31 of the year after death. | ✅ (law-firm summary; replace with Federal Register link when convenient)    |
| `rmd-minor-child`      | Treas. Reg. § 1.401(a)(9)-4 (age of majority)                 | IRS / regulation                              | https://irahelp.com/slottreport/new-rmd-regs-have-a-surprising-result-for-minor-child-beneficiaries       | A minor child of the owner is an eligible designated beneficiary until 21; then the 10-year rule applies (annual RMDs continue).                                                                                                                                                                                                                      | ✅ (secondary)                                                               |
| `irc-1014`             | 26 U.S.C. § 1014                                              | US Congress / statute → use authority `"IRS"` | https://www.law.cornell.edu/uscode/text/26/1014                                                           | Basis of property acquired from a decedent is generally its fair market value at the date of death.                                                                                                                                                                                                                                                   | ⚠️                                                                           |
| `fdic-330-3j`          | 12 C.F.R. § 330.3(j)                                          | FDIC / regulation                             | https://www.fdic.gov/financial-institution-employees-guide-deposit-insurance/death-account-owner          | Deposits of a deceased owner are insured as if the owner were alive for **six months** after death, unless restructured (and only if that doesn't reduce coverage).                                                                                                                                                                                   | ✅                                                                           |
| `treas-210`            | 31 C.F.R. § 210.10                                            | US Treasury / regulation                      | https://www.law.cornell.edu/cfr/text/31/210.10                                                            | The bank must return federal benefit payments received after it learns of the recipient's death; the agency can reclaim post-death payments.                                                                                                                                                                                                          | ✅                                                                           |
| `ssa-lump-sum`         | SSA — Lump-sum death payment                                  | SSA / agency-guidance                         | https://www.ssa.gov/personal-record/when-someone-dies/lump-sum-death-payment                              | A surviving spouse may receive a one-time **$255**; apply within **2 years** of the death.                                                                                                                                                                                                                                                            | ✅                                                                           |
| `cfpb-1026-11c`        | 12 C.F.R. § 1026.11(c)                                        | CFPB / regulation                             | https://www.consumerfinance.gov/rules-policy/regulations/1026/11/                                         | Card issuers must let the estate's administrator learn and pay the balance; disclosure within 30 days of a request is timely; no new fees or APR increases after the request. Doesn't apply while a joint accountholder remains.                                                                                                                      | ✅                                                                           |
| `pnc-death-claims`     | PNC — What happens to a bank account when someone dies        | PNC / bank-policy                             | https://www.pnc.com/insights/personal-finance/spend/what-happens-to-a-bank-account-when-someone-dies.html | PNC secures accounts on notice of death; joint-with-survivorship and POD/TOD accounts pass outside probate; executors may open an estate account.                                                                                                                                                                                                     | ✅                                                                           |
| `pnc-cd-agreement`     | PNC CD/IRA account agreement (as summarized by a third party) | PNC / bank-policy                             | https://simplytrust.com/financial-institutions/pnc-bank/death-claim/                                      | Early-withdrawal penalty on a CD is waived on the depositor's death.                                                                                                                                                                                                                                                                                  | ⚠️ (confirm against the actual PNC agreement)                                |
| `plan-529`             | The 529 plan's program description                            | Plan documents / plan-document                | https://www.pa529.com/                                                                                    | Who controls a 529 after the owner dies is set by the plan's documents and any successor-owner designation.                                                                                                                                                                                                                                           | ⚠️                                                                           |

Export also:

```ts
export const UNVERIFIED_SOURCE_IDS = Object.values(sources)
  .filter((s) => !s.verifiedOn)
  .map((s) => s.id);
```

---

## 8. Phase 4 (P0) — Actions `src/data/settlement/actions.ts`

`export const actions: Record<string, RuleAction>`. Placeholders `{decedent}`, `{survivor}`,
`{account}` are filled by the engine (first names for people, `label(holding)` for accounts).
Use exactly these ids; tests reference them.

| id                         | label                                                                      | owner           | deadline (anchor · kind · label)                                                                                     | sources                                 |
| -------------------------- | -------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `flag-death`               | Flag the death on every account                                            | bank-operations | —                                                                                                                    | `pnc-death-claims`                      |
| `death-certificate`        | Collect a certified death certificate                                      | client          | —                                                                                                                    | `pnc-death-claims`                      |
| `retitle-joint`            | Retitle {account} to {survivor}                                            | bank-operations | —                                                                                                                    | `pa-6304`, `pnc-death-claims`           |
| `pod-claim`                | Submit the beneficiary claim for {account}                                 | client          | —                                                                                                                    | `pnc-death-claims`                      |
| `tod-claim`                | Re-register {account} to the TOD beneficiaries                             | bank-operations | —                                                                                                                    | `pa-ch64`                               |
| `record-basis`             | Record date-of-death values for the new cost basis                         | advisor         | —                                                                                                                    | `irc-1014`                              |
| `spousal-election`         | Help {survivor} choose: treat as own IRA or keep as inherited              | advisor         | — (no statutory deadline for the choice)                                                                             | `irs-pub-590b`, `rmd-final-regs-2024`   |
| `inherited-setup`          | Open an inherited IRA for each beneficiary                                 | bank-operations | —                                                                                                                    | `irs-pub-590b`                          |
| `separate-accounts`        | Split into separate inherited IRAs                                         | bank-operations | `{from:"dec-31", yearsAfterDeath:1}` · recommended · "Separate accounts for each beneficiary"                        | `irs-pub-590b`                          |
| `yod-rmd`                  | Confirm {decedent}'s year-of-death RMD was taken                           | advisor         | `{from:"dec-31", yearsAfterDeath:1}` · statutory · "Latest date to take a missed year-of-death RMD"                  | `rmd-final-regs-2024`                   |
| `annual-rmds`              | Schedule annual RMDs in years 1–9                                          | advisor         | `{from:"dec-31", yearsAfterDeath:1}` · statutory · "First annual RMD for beneficiaries"                              | `rmd-final-regs-2024`                   |
| `ten-year-end`             | Empty the inherited IRA by the 10-year deadline                            | advisor         | `{from:"dec-31", yearsAfterDeath:10}` · statutory · "10-year rule: account must be emptied"                          | `rmd-final-regs-2024`                   |
| `minor-custodian`          | Arrange a custodian or trust for the minor beneficiary                     | attorney        | —                                                                                                                    | `rmd-minor-child`                       |
| `trust-certification`      | Request a certification of trust naming {survivor} as successor trustee    | trust-officer   | —                                                                                                                    | `pa-7790-3`                             |
| `trust-first-death`        | Review the trust's first-death provisions before moving assets             | attorney        | —                                                                                                                    | `pa-7790-3`                             |
| `successor-owner`          | Confirm the 529's successor owner                                          | bank-operations | —                                                                                                                    | `plan-529`                              |
| `close-card`               | Close {account} to new charges and stop autopays                           | bank-operations | —                                                                                                                    | `cfpb-1026-11c`                         |
| `card-balance-to-executor` | Give the executor the balance on request (within 30 days)                  | bank-operations | —                                                                                                                    | `cfpb-1026-11c`                         |
| `insurer-claim`            | Start the claim with the insurer                                           | client          | —                                                                                                                    | `pnc-death-claims`                      |
| `letters`                  | Executor obtains letters from the Register of Wills                        | executor        | —                                                                                                                    | `pa-register-of-wills`                  |
| `estate-ein`               | Get an EIN for the estate                                                  | executor        | —                                                                                                                    | `irs-1041`                              |
| `estate-account`           | Open an estate account once letters are issued                             | bank-operations | —                                                                                                                    | `pnc-death-claims`                      |
| `form-56`                  | File Form 56 (notice of fiduciary relationship)                            | executor        | —                                                                                                                    | `irs-pub-559`                           |
| `form-1041`                | File Form 1041 if estate income exceeds $600                               | tax-advisor     | —                                                                                                                    | `irs-1041`                              |
| `final-1040`               | File {decedent}'s final income tax return                                  | tax-advisor     | `{from:"apr-15", yearsAfterDeath:1}` · statutory · "Final individual return due"                                     | `irs-pub-559`                           |
| `portability`              | Consider filing Form 706 to elect portability for {survivor}               | tax-advisor     | `{from:"date-of-death", months:9}` · opportunity · "Portability election (timely 706)"                               | `irs-706-instr`                         |
| `portability-late`         | Late portability election window closes                                    | tax-advisor     | `{from:"date-of-death", months:60}` · opportunity · "Last date for a late portability election (Rev. Proc. 2022-32)" | `irs-706-instr`                         |
| `form-706`                 | File Form 706 (estate tax return)                                          | tax-advisor     | `{from:"date-of-death", months:9}` · statutory · "Estate tax return due"                                             | `irs-706-instr`, `irs-estate-whats-new` |
| `pa-it-discount`           | Pay PA inheritance tax early for the 5% discount                           | tax-advisor     | `{from:"date-of-death", months:3}` · opportunity · "PA inheritance tax 5% discount ends"                             | `pa-inheritance-tax`                    |
| `pa-it-return`             | File the PA inheritance tax return                                         | tax-advisor     | `{from:"date-of-death", months:9}` · statutory · "PA inheritance tax due"                                            | `pa-inheritance-tax`                    |
| `pa-small-estate`          | Ask the attorney whether a small-estate petition applies                   | attorney        | —                                                                                                                    | `pa-3102`                               |
| `pa-3101b`                 | Pay up to $20,000 of deposits to family on a funeral bill, without letters | bank-operations | —                                                                                                                    | `pa-3101`, `pa-act50-2025`              |
| `fdic-review`              | Re-check deposit insurance coverage before the grace period ends           | advisor         | `{from:"date-of-death", months:6}` · recommended · "FDIC 6-month grace period ends"                                  | `fdic-330-3j`                           |
| `cd-penalty-waiver`        | Apply the CD early-withdrawal penalty waiver if {survivor} wants the cash  | bank-operations | —                                                                                                                    | `pnc-cd-agreement`                      |
| `reclamation-watch`        | Watch for federal benefit deposits made after the death                    | bank-operations | —                                                                                                                    | `treas-210`                             |
| `ssa-lump-sum`             | Remind {survivor} to claim the $255 SSA lump-sum payment                   | advisor         | `{from:"date-of-death", months:24}` · statutory · "SSA lump-sum application deadline"                                | `ssa-lump-sum`                          |
| `update-designation`       | Send {survivor} a new beneficiary form for {account}                       | advisor         | —                                                                                                                    | `irs-pub-590b`, `pnc-death-claims`      |
| `ops-review`               | Operations confirms the titling and the right process                      | bank-operations | —                                                                                                                    | `pnc-death-claims`                      |
| `attorney-review`          | Estate attorney confirms how this passes under state law                   | attorney        | —                                                                                                                    | `pa-register-of-wills`                  |

---

## 9. Phase 5 (P0) — The account decision tree `src/data/settlement/tree.ts`

`export const ROOT_NODE_ID = "n.role";` and `export const nodes: Record<string, RuleNode>`.

Rules for writing nodes:

- Every decision node has **one branch for every value** in the fact's domain (see
  `FACT_DOMAINS` in Phase 7). Numbers (`value`, `beneficiaryCount`) are **never** branched on in
  the tree — numeric thresholds belong in overlays/household rules.
- Every node lists ≥1 source.
- `summary` = advisor voice. `plain` = client voice: condolence-safe, no deadlines, no "must".

### 9.1 Decision nodes

```
n.role — "What was {decedent} to this account?"          fact: decedentRole
  not-involved       → o.not-affected
  named-beneficiary  → o.designation-update
  joint-owner        → n.joint.class
  co-trustee         → o.successor-trustee
  sole-trustee       → o.successor-trustee
  plan-owner         → n.529.successor
  sole-owner         → n.sole.class
  sources: pnc-death-claims

n.joint.class — "What kind of jointly owned account is it?"   fact: accountClass
  deposit, cd                    → o.survivorship-deposit
  brokerage                      → o.survivorship-securities
  real-estate                    → o.survivorship-real-estate
  vehicle                        → o.needs-review-titled-property
  ira-traditional, ira-roth, ira-inherited, trust, education-529,
  life-insurance, credit-card, other → o.needs-review-titling
  sources: pa-6304

n.529.successor — "Is a successor owner on file for the 529 plan?"   fact: successorOwnerNamed
  yes     → o.successor-owner
  no      → o.successor-owner-missing
  unknown → o.successor-owner-missing
  sources: plan-529

n.sole.class — "What kind of account did {decedent} own alone?"   fact: accountClass
  credit-card                     → o.closes-estate-pays
  life-insurance                  → n.life.ben
  ira-traditional, ira-roth       → n.ret.ben
  ira-inherited                   → o.needs-review-inherited-ira
  deposit, cd, brokerage          → n.sole.ben
  trust                           → o.successor-trustee
  education-529                   → n.529.successor
  real-estate, vehicle            → o.needs-review-titled-property
  other                           → o.needs-review-titling
  sources: pnc-death-claims

n.life.ben — "Is a living beneficiary named on the policy?"   fact: beneficiaryStatus
  living                          → o.insurer-claim
  none-on-file, all-deceased      → o.insurer-claim-estate
  not-applicable                  → o.needs-review-titling
  sources: pnc-death-claims

n.ret.ben — "Is a living beneficiary named on the retirement account?"   fact: beneficiaryStatus
  living                          → n.ret.who
  none-on-file, all-deceased      → o.retirement-to-estate
  not-applicable                  → o.needs-review-titling
  sources: irs-pub-590b

n.ret.who — "Who is the primary beneficiary?"   fact: primaryBeneficiaryCategory
  spouse                          → o.spousal-retirement-options
  minor-child-of-decedent         → o.inherited-minor-child
  within-10-years-of-age          → o.inherited-edb-life-expectancy
  other-individual                → o.inherited-ten-year
  not-applicable                  → o.needs-review-titling
  sources: rmd-final-regs-2024, irs-pub-590b

n.sole.ben — "Does it have a living POD/TOD beneficiary?"   fact: beneficiaryStatus
  living                          → n.sole.podtod
  none-on-file, all-deceased, not-applicable → n.state.probate
  sources: pnc-death-claims

n.sole.podtod — "Is it a bank deposit or a securities account?"   fact: accountClass
  deposit, cd                     → o.pod-claim
  brokerage                       → o.tod-claim
  (every other class)             → o.needs-review-titling
  sources: pnc-death-claims, pa-ch64

n.state.probate — "Which state's probate rules apply?"   fact: state
  PA     → o.probate-pa
  other  → o.probate-other-state
  sources: pa-register-of-wills
```

### 9.2 Outcome nodes

Fields: route · passesTo · probate · survivorAccess · typicalTimeline · actions · review · sources.
Write `summary`/`plain` in the spirit given (exact wording is yours; keep placeholders).

| id                                | route                      | passesTo          | probate | survivorAccess | timeline               | actions                                                         | review                  | sources                                    |
| --------------------------------- | -------------------------- | ----------------- | ------- | -------------- | ---------------------- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------ |
| `o.not-affected`                  | not-affected               | unchanged         | no      | not-applicable | —                      | —                                                               | —                       | `pnc-death-claims`                         |
| `o.designation-update`            | designation-update         | unchanged         | no      | not-applicable | —                      | `update-designation`                                            | advisor                 | `irs-pub-590b`                             |
| `o.survivorship-deposit`          | survivorship               | surviving-owners  | no      | uninterrupted  | 1–3 business days      | `death-certificate`, `retitle-joint`                            | —                       | `pa-6304`, `pnc-death-claims`              |
| `o.survivorship-securities`       | survivorship               | surviving-owners  | no      | uninterrupted  | 1–2 weeks              | `death-certificate`, `retitle-joint`, `record-basis`            | operations              | `pnc-death-claims`                         |
| `o.survivorship-real-estate`      | survivorship               | surviving-owners  | no      | uninterrupted  | 2–6 weeks              | `death-certificate`, `attorney-review`                          | attorney                | `pnc-death-claims`                         |
| `o.successor-trustee`             | successor-trustee          | successor-trustee | no      | uninterrupted  | 1–2 weeks              | `death-certificate`, `trust-certification`, `trust-first-death` | trust-officer, attorney | `pa-7790-3`                                |
| `o.successor-owner`               | successor-owner            | successor-owner   | no      | after-claim    | 2–4 weeks              | `death-certificate`, `successor-owner`                          | operations              | `plan-529`                                 |
| `o.successor-owner-missing`       | successor-owner            | successor-owner   | no      | after-claim    | varies                 | `successor-owner`, `attorney-review`                            | operations, attorney    | `plan-529`                                 |
| `o.closes-estate-pays`            | closes-estate-pays         | nobody            | no      | not-applicable | 30–60 days             | `close-card`, `card-balance-to-executor`                        | —                       | `cfpb-1026-11c`                            |
| `o.insurer-claim`                 | insurer-claim              | beneficiaries     | no      | after-claim    | 2–4 weeks after filing | `death-certificate`, `insurer-claim`                            | —                       | `pnc-death-claims`                         |
| `o.insurer-claim-estate`          | insurer-claim              | estate            | yes     | after-letters  | months                 | `insurer-claim`, `attorney-review`                              | attorney                | `pnc-death-claims`                         |
| `o.retirement-to-estate`          | probate                    | estate            | yes     | after-letters  | 3–9 months             | `letters`, `attorney-review`                                    | attorney, tax-advisor   | `irs-pub-590b`                             |
| `o.spousal-retirement-options`    | spousal-retirement-options | beneficiaries     | no      | after-claim    | 2–3 weeks              | `death-certificate`, `spousal-election`                         | advisor                 | `irs-pub-590b`, `rmd-final-regs-2024`      |
| `o.inherited-minor-child`         | inherited-retirement       | beneficiaries     | no      | after-claim    | 2–3 weeks              | `inherited-setup`, `minor-custodian`                            | attorney                | `rmd-minor-child`                          |
| `o.inherited-edb-life-expectancy` | inherited-retirement       | beneficiaries     | no      | after-claim    | 2–3 weeks              | `inherited-setup`                                               | tax-advisor             | `rmd-final-regs-2024`                      |
| `o.inherited-ten-year`            | inherited-retirement       | beneficiaries     | no      | after-claim    | 2–3 weeks              | `inherited-setup`, `ten-year-end`                               | advisor                 | `rmd-final-regs-2024`, `irs-pub-590b`      |
| `o.pod-claim`                     | beneficiary-claim          | beneficiaries     | no      | after-claim    | 5–10 business days     | `death-certificate`, `pod-claim`                                | —                       | `pnc-death-claims`                         |
| `o.tod-claim`                     | beneficiary-claim          | beneficiaries     | no      | after-claim    | 2–4 weeks              | `death-certificate`, `tod-claim`, `record-basis`                | operations              | `pa-ch64`, `irc-1014`                      |
| `o.probate-pa`                    | probate                    | estate            | yes     | after-letters  | 3–9 months             | `letters`, `estate-ein`, `estate-account`                       | attorney                | `pa-register-of-wills`, `pnc-death-claims` |
| `o.probate-other-state`           | probate                    | estate            | yes     | after-letters  | varies by state        | `attorney-review`                                               | attorney                | `pnc-death-claims`                         |
| `o.needs-review-inherited-ira`    | needs-review               | beneficiaries     | no      | after-claim    | varies                 | `ops-review`                                                    | operations, tax-advisor | `rmd-final-regs-2024`                      |
| `o.needs-review-titled-property`  | needs-review               | estate            | no      | not-applicable | varies                 | `attorney-review`                                               | attorney                | `pnc-death-claims`                         |
| `o.needs-review-titling`          | needs-review               | unchanged         | no      | not-applicable | —                      | `ops-review`                                                    | operations              | `pnc-death-claims`                         |

---

## 10. Phase 6 (P0) — Overlays and household rules

### 10.1 Overlays — `src/data/settlement/overlays.ts`

`export const overlays: Overlay[]`, evaluated **in this order** after the tree walk.

| id                     | routes                                                    | when (all)                                                                         | actions             | review      | attention | asks                                                                                                                           | sources                    |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `ov.fdic-grace`        | survivorship, beneficiary-claim, probate                  | accountClass ∈ {deposit, cd}; value > 250000                                       | `fdic-review`       | advisor     | yes       | —                                                                                                                              | `fdic-330-3j`              |
| `ov.cd-waiver`         | survivorship, beneficiary-claim, probate                  | accountClass = cd                                                                  | `cd-penalty-waiver` | —           | no        | —                                                                                                                              | `pnc-cd-agreement`         |
| `ov.step-up`           | survivorship, probate                                     | accountClass = brokerage                                                           | `record-basis`      | tax-advisor | no        | —                                                                                                                              | `irc-1014`                 |
| `ov.yod-rmd`           | spousal-retirement-options, inherited-retirement, probate | accountClass = ira-traditional; decedentPastRequiredBeginningDate ∈ {yes, unknown} | `yod-rmd`           | advisor     | yes       | `decedentPastRequiredBeginningDate` → "Was {decedent} already taking required withdrawals, and was this year's taken?"         | `rmd-final-regs-2024`      |
| `ov.annual-rmds`       | inherited-retirement                                      | accountClass = ira-traditional; decedentPastRequiredBeginningDate = yes            | `annual-rmds`       | advisor     | no        | —                                                                                                                              | `rmd-final-regs-2024`      |
| `ov.separate-accounts` | inherited-retirement                                      | beneficiaryCount > 1                                                               | `separate-accounts` | operations  | no        | —                                                                                                                              | `irs-pub-590b`             |
| `ov.minor-beneficiary` | beneficiary-claim, insurer-claim, inherited-retirement    | anyBeneficiaryMinor = yes                                                          | `minor-custodian`   | attorney    | yes       | —                                                                                                                              | `rmd-minor-child`          |
| `ov.disability-check`  | inherited-retirement                                      | primaryBeneficiaryCategory = other-individual                                      | —                   | —           | no        | `primaryBeneficiaryCategory` → "Is any beneficiary disabled or chronically ill? They'd be an eligible designated beneficiary." | `rmd-final-regs-2024`      |
| `ov.pa-3101b`          | probate                                                   | state = PA; accountClass ∈ {deposit, cd}; value ≤ 20000                            | `pa-3101b`          | operations  | no        | —                                                                                                                              | `pa-3101`, `pa-act50-2025` |
| `ov.held-outside`      | (any)                                                     | heldOutsidePnc = true                                                              | —                   | —           | no        | —                                                                                                                              | `pnc-death-claims`         |

`ov.held-outside` has no actions; its only effect is that the engine adds the assumption
"Held outside PNC — tracked for planning; the client handles it with the provider."

Note `ov.disability-check` deliberately has an `asks` entry but **no clause on an unknown fact**:
disability is never in our data, so the question is always raised for adult non-spouse heirs.

### 10.2 Household rules — `src/data/settlement/household.ts` (federal) and `states/pa.ts` (PA)

`export const federalHousehold: HouseholdRule[]` and `export const paHousehold: HouseholdRule[]`.
`index.ts` concatenates: federal first, then the state pack for `state` (PA → `paHousehold`,
other → a single rule `hh.state-unmodelled` with action `attorney-review`, review `attorney`).

Federal (`jurisdiction: "US"`):

| id                 | when                                                     | actions                           | review                | asks                                                                                                              | sources                                 |
| ------------------ | -------------------------------------------------------- | --------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `hh.flag`          | (always)                                                 | `flag-death`, `death-certificate` | —                     | —                                                                                                                 | `pnc-death-claims`                      |
| `hh.reclamation`   | (always)                                                 | `reclamation-watch`               | operations            | `receivedFederalBenefits` → "Did {decedent} receive Social Security or other federal benefits by direct deposit?" | `treas-210`                             |
| `hh.ssa`           | survivorIsSpouse = true                                  | `ssa-lump-sum`                    | —                     | —                                                                                                                 | `ssa-lump-sum`                          |
| `hh.final-1040`    | (always)                                                 | `final-1040`                      | tax-advisor           | —                                                                                                                 | `irs-pub-559`                           |
| `hh.fiduciary`     | executorKnown = true                                     | `form-56`                         | attorney              | —                                                                                                                 | `irs-pub-559`                           |
| `hh.estate-income` | hasProbateAssets = true                                  | `estate-ein`, `form-1041`         | tax-advisor           | —                                                                                                                 | `irs-1041`                              |
| `hh.portability`   | survivorIsSpouse = true; estimatedGrossEstate ≤ 15000000 | `portability`, `portability-late` | tax-advisor           | —                                                                                                                 | `irs-706-instr`, `irs-estate-whats-new` |
| `hh.form-706`      | estimatedGrossEstate > 15000000                          | `form-706`                        | tax-advisor, attorney | —                                                                                                                 | `irs-706-instr`, `irs-estate-whats-new` |

Pennsylvania (`jurisdiction: "PA"`, all require `state = PA`):

| id                   | when                                                           | actions                          | review      | sources                |
| -------------------- | -------------------------------------------------------------- | -------------------------------- | ----------- | ---------------------- |
| `hh.pa-inheritance`  | state = PA                                                     | `pa-it-discount`, `pa-it-return` | tax-advisor | `pa-inheritance-tax`   |
| `hh.pa-letters`      | state = PA; hasProbateAssets = true                            | `letters`, `estate-account`      | attorney    | `pa-register-of-wills` |
| `hh.pa-small-estate` | state = PA; hasProbateAssets = true; probateValueAtPnc ≤ 50000 | `pa-small-estate`                | attorney    | `pa-3102`              |

`hh.pa-inheritance.detail` must say the rate depends on who inherits (0% to a spouse) and that a
tax professional decides what's taxable — the engine never computes the tax.

### 10.3 `src/data/settlement/index.ts`

```ts
export const RULEBOOK_VERSION = "2026.10-pa-pilot";
export const RULEBOOK_AS_OF = "2026-10-26";
export const rulebook: Rulebook = {
  version: RULEBOOK_VERSION,
  asOf: RULEBOOK_AS_OF,
  rootNodeId: ROOT_NODE_ID,
  nodes,
  actions,
  overlays,
  household: [...federalHousehold, ...paHousehold],
  sources,
};
export const DISCLAIMER =
  "General guidance under federal and Pennsylvania rules as reviewed on Oct 26, 2026. " +
  "Not legal or tax advice. Steps marked for review need sign-off before they're final.";
```

(The engine filters PA household rules by their own `state = PA` clause, so keeping them in one
array is fine; the non-PA fallback rule `hh.state-unmodelled` has `when: [{fact:"state", eq:"other"}]`.)

---

## 11. Phase 7 (P0) — Engine `src/lib/settlement/*`

All files: pure functions, no React, no `window`, no `Date.now()`. Import types from
`@/data/types`, rulebook from `@/data/settlement`.

### 11.1 `dates.ts`

```ts
export function addDays(iso: string, days: number): string;
/** Adds calendar months, clamping to the month's last day (Aug 31 + 6 → Feb 28/29). */
export function addMonths(iso: string, months: number): string;
export function resolveDeadline(anchor: DeadlineAnchor, dateOfDeath: string): string;
// "dec-31": `${year(dateOfDeath) + yearsAfterDeath}-12-31`
// "apr-15": `${year(dateOfDeath) + yearsAfterDeath}-04-15`
// "date-of-death": addMonths(dateOfDeath, months)
```

Implement with `Date.UTC` at noon like `src/lib/format.ts`. Move the private `addDays` in
`assistant.ts` to import from here **only in Phase 12** (not before — keep P0 diffs separate).

### 11.2 `conditions.ts`

```ts
export function holds<K extends string>(
  clauses: Clause<K>[],
  values: Record<K, string | number | boolean>,
): boolean;
```

Semantics: every clause must hold; a clause may set several operators — all must hold.
`eq` strict equality; `in` membership; `gt`/`lte` numeric (false if value isn't a number). Throw
in development if `clause.fact` isn't a key of `values` (helps catch typos; tests cover it).

### 11.3 `facts.ts` — derivation rules (the heart of correctness)

```ts
export type DerivationContext = {
  deceased: { name: string; age?: number };
  survivor: { name: string };
  members: ClientMember[]; // with the deceased already marked "Deceased"
  state: StateCode;
};
export function accountClassOf(h: Holding): AccountClass;
export function deriveAccountFacts(h: Holding, ctx: DerivationContext): AccountFacts;
export function stateFromCity(city: string): StateCode; // /,\s*PA$/ → "PA", else "other"
export function deriveHouseholdFacts(...): HouseholdFacts; // see 11.3.3
```

#### 11.3.1 `accountClassOf(h)` (by `HoldingType`)

| HoldingType                          | AccountClass    |
| ------------------------------------ | --------------- |
| Checking, Savings, Money market      | deposit         |
| CD                                   | cd              |
| Brokerage                            | brokerage       |
| Traditional IRA, 401(k) rollover IRA | ira-traditional |
| Roth IRA                             | ira-roth        |
| Inherited IRA                        | ira-inherited   |
| Trust                                | trust           |
| 529 plan                             | education-529   |
| Life insurance                       | life-insurance  |
| Credit card                          | credit-card     |

Write it as a `Record<HoldingType, AccountClass>` so adding a `HoldingType` breaks the build.

#### 11.3.2 `deriveAccountFacts(h, ctx)` — one rule per fact, with evidence

Let `d = ctx.deceased.name`, `isOwner = h.owners.includes(d)`,
`status(name) = ctx.members.find(m => m.name === name)?.status ?? "Living"`,
`livingCoOwners = h.owners.filter(o => o !== d && status(o) !== "Deceased")`.

Co-owners or co-trustees who **already died** don't count. This matters in simulation: if
Morgan dies while her accounts are still titled jointly with Riley (who died first), there is no
surviving co-owner, so those accounts are effectively hers alone and fall to her estate.

- **accountClass** — `accountClassOf(h)`. Evidence: `"${h.type}"`.
- **decedentRole**
  - `h.type === "Trust" && isOwner` → `livingCoOwners.length > 0 ? "co-trustee" : "sole-trustee"`
  - `h.type === "529 plan" && isOwner` → `"plan-owner"`
  - `isOwner && h.ownership === "Joint" && livingCoOwners.length > 0` → `"joint-owner"`
  - `isOwner` → `"sole-owner"` (includes joint accounts whose other owners have all died; add
    the assumption "Still titled jointly with {names} (deceased); no surviving co-owner, so it's
    treated as {decedent}'s alone")
  - `!isOwner && (h.beneficiaries ?? []).includes(d)`, the type is **not** 529, **and at least
    one owner is living** → `"named-beneficiary"` (a deceased owner's account naming `d` is not
    an action item for anyone)
  - else `"not-involved"`
  - Evidence: `"Owners: A, B (deceased)"` or `"Beneficiary: B (deceased)"`.
- **beneficiaryStatus** — if `h.beneficiaries === undefined` or type is 529 → `"not-applicable"`;
  if `length === 0` → `"none-on-file"`; if every beneficiary (primary list) is Deceased **or is
  `d`** → `"all-deceased"`; else `"living"`. Contingents (`contingentBeneficiaries`) do **not**
  make it "living" — if only contingents are alive, set `"living"` **and** add an assumption
  "Primary beneficiary has died; the contingent beneficiary takes" (handle in engine, see 11.4
  step 4). Evidence: `"Beneficiaries: X, Y"` / `"No beneficiary on file"`.
- **primaryBeneficiaryCategory** — only when beneficiaryStatus is `living`; take the first
  living primary `b`:
  - `b === ctx.survivor.name` and the survivor's member relationship to the household is the
    deceased's spouse → `"spouse"`. Practically: the deceased's member record has
    `relationship === "Spouse"` and `b` is `"Self"`, **or** the deceased is `"Self"` and `b` is
    the member with `relationship === "Spouse"`. Write a helper `areSpouses(a, b, members)`.
  - member `b` is `relationship === "Child"` of the household **and** the deceased is a parent
    of that child (deceased is `"Self"` or `"Spouse"`), **and** `b.age < 21` →
    `"minor-child-of-decedent"`.
  - both ages known and `b.age >= ctx.deceased.age - 10` → `"within-10-years-of-age"`.
  - else `"other-individual"`.
  - not living → `"not-applicable"`.
- **beneficiaryCount** — number of living primary beneficiaries.
- **anyBeneficiaryMinor** — any living primary beneficiary with `age < 18` → `"yes"`; any with
  unknown age → `"unknown"`; else `"no"`. (Ages only exist on `ClientMember`.)
- **decedentPastRequiredBeginningDate** — Roth IRA → `"no"` (no lifetime RMDs). Otherwise
  `age === undefined` → `"unknown"`; `age >= 74` → `"yes"`; `age <= 72` → `"no"`; `age === 73`
  → `"unknown"`. Add assumption text when `"yes"`: "{decedent} was {age}; we assume they had
  reached their required beginning date (applicable age 73 for those born 1951–1958)."
- **successorOwnerNamed** — 529 only: `h.successorOwner` set → `"yes"`; else `"unknown"`.
  Other types → `"no"`.
- **heldOutsidePnc** — `h.external === true`.
- **value** — `h.value`.
- **state** — `ctx.state`.

#### 11.3.3 `deriveHouseholdFacts(input, accountPlans)`

- `state` — from input.
- `survivorIsSpouse` — `areSpouses(deceased, survivor, members)`.
- `executorKnown` — any member with a role starting `"Executor"`.
- `hasProbateAssets` — any account plan with `outcome.probate === true` and `holding.value > 0`.
- `probateValueAtPnc` — sum of those values where `!holding.external`.
- `estimatedGrossEstate` — `sum(sole-owned, value>0) + 0.5 × sum(joint-owned) + 0.5 × sum(trust where co-trustee) + external life insurance owned by the decedent`. Always push assumption: "Estimated gross estate ≈ {money} — sole accounts, half of joint and trust accounts, and life insurance the decedent owned. Accounts outside PNC that we don't track are not included."
- `receivedFederalBenefits` — always `"unknown"` (no data) → raises the reclamation question.

### 11.4 `walk.ts` and `engine.ts`

```ts
export function walk(
  facts: AccountFacts,
  book: Rulebook,
): { outcome: OutcomeNode; trace: TraceStep[] };
```

Algorithm: start at `book.rootNodeId`; while the node is a decision, read
`facts[node.fact].value`, convert to string, find the branch with `when === value`; if none,
**throw** `Error(\`No branch for ${node.id} = ${value}\`)`(the exhaustiveness test makes this
unreachable). Push a`TraceStep` per decision. Guard against cycles with a visited set (throw).

```ts
export type SettlementInput = {
  mode: "settlement" | "simulation";
  asOf: string;
  deceased: { name: string; age?: number; dateOfDeath: string };
  survivor: { name: string; relationshipToDeceased: string };
  members: ClientMember[];
  holdings: Holding[];
  state: StateCode;
};

export function settlementPlan(input: SettlementInput, book: Rulebook = rulebook): SettlementPlan;
```

Steps:

1. **Context.** Mark the deceased `status: "Deceased"` in a copy of `members` (idempotent).
2. **Per holding:** `facts = deriveAccountFacts`; `{outcome, trace} = walk(facts)`. If
   `outcome.route === "not-affected"`, skip the holding entirely.
3. **Overlays:** for each overlay in order, include it when
   `(!ov.routes || ov.routes.includes(outcome.route)) && holds(ov.when, plainValues(facts))`.
   Collect `ov.actions`, `ov.review`, `ov.attention`, and for each `ov.asks` whose fact value is
   `"unknown"` (or, for `ov.disability-check`, unconditionally) an `OpenQuestion`.
4. **Passes to:** by `outcome.passesTo` —
   `surviving-owners` → living co-owners; `beneficiaries` → living primaries, or living
   contingents if no primary is alive (push the assumption from 11.3.2);
   `successor-trustee` → living co-trustees (sole-trustee: `[]` + open question "Who is the
   successor trustee named in the trust instrument?"); `successor-owner` → `[h.successorOwner]`
   or `[]` + open question "Who should own {account} now?"; `estate` → `["Estate of {decedent}"]`;
   `nobody`/`unchanged` → `[]`.
5. **Actions:** dedupe outcome actions + overlay actions by id (first occurrence wins, outcome
   first). For each, fill placeholders and resolve `due` when the action has a deadline
   (anchor from **date of death**). Key = `${holding.id}:${action.id}`.
6. **Review:** union of outcome review + overlay review, ordered
   `advisor, operations, trust-officer, attorney, tax-advisor`.
7. **Household:** compute household facts (needs the account plans), then every household rule
   whose `when` holds → filled detail + planned actions keyed `household:${actionId}`; raise
   `asks` whose fact value is `"unknown"`.
8. **Deadlines:** all planned actions (account + household) with `due`, **deduped by
   `action.id` + `due`** (e.g. `fdic-review` on two deposit accounts → one deadline listing both
   `accountIds`), sorted ascending by `due`, then by kind order `statutory, opportunity,
recommended`. In `simulation` mode, still compute dates (from `asOf` as date of death) — the UI
   labels them "if it happened today".
9. **Review queue:** one entry per account plan with non-empty `review` (label: `"{account}:
{outcome.title}"`) and one per household rule with non-empty `review`. Key = plan/rule key.
10. **Totals:** over account plans with `holding.value`:
    - `debts` += value when `outcome.route === "closes-estate-pays"`;
    - `heldOutsidePnc` += value when `holding.external`;
    - otherwise if `outcome.probate` → `probate`; else if `route === "needs-review"` →
      `needsReview`; else if route ∉ {designation-update} → `outsideProbate`, and also
      `uninterrupted` when `outcome.survivorAccess === "uninterrupted"`.
    - Accounts with route `designation-update` contribute to no total (they are not the
      decedent's).
11. **sourcesUsed:** every source id seen in trace steps, outcomes, overlays, actions and
    household rules, deduped in first-use order.
12. Placeholder filling: `{decedent}` → first name of deceased, `{survivor}` → first name of
    survivor, `{account}` → `` `${h.name}${h.last4 ? ` x${h.last4}` : ""}` ``. Household rules
    have no `{account}`.

Export small selectors for the UI: `plansByRoute(plan)`, `nextDeadlines(plan, fromIso, days)`,
`routeLabel(route)`.

### 11.5 `adapters.ts`

```ts
/** For an open loss in the advisor book. Undefined when there's no loss or no deceased member. */
export function settlementInputFromFacts(f: ClientFacts): SettlementInput | undefined;
// deceased = f.deceased (name, age, dateOfDeath: f.loss.date); survivor = f.self with
// relationshipToDeceased = f.relToSurvivor ?? "family member"; members = f.p.members;
// holdings = f.p.holdings; state = stateFromCity(f.p.city); mode "settlement"; asOf = f.today.

/** "What if {personName} died on asOf?" */
export function simulationInput(
  customer: AdvisorCustomer,
  profile: ClientProfile,
  personName: string,
  asOf: string,
): SettlementInput;
// survivor: if personName === customer.name → spouse member if living, else lossContact()
// ordering (Spouse, Child, Parent, Sibling) over living members; otherwise the primary customer.

/** Customer-side family data → engine input (P2 consumer, but write + test it in P0). */
export function settlementInputFromFamily(
  s: FamilyState,
  deceasedId: string,
  dateOfDeath: string,
  asOf: string,
): SettlementInput;
```

`settlementInputFromFamily` mapping (`FamilyAsset` → `Holding`):

| FamilyAsset.category          | HoldingType used                                                                                                             | ownership                                    | beneficiaries                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Joint checking/savings        | `"Money market"` if name includes "Money Market", else `"Checking"`                                                          | `owners.length > 1 ? "Joint" : "Individual"` | `method ∈ {pod, estate}` → `successors` mapped to names for `pod`, `[]` for `estate`; joint → `undefined` |
| Brokerage account             | `method === "trust" ? "Trust" : "Brokerage"`                                                                                 | `"Trust"` if trust, else by owner count      | `tod` → successors' names; `estate` → `[]`                                                                |
| 401(k) / IRA                  | `name.includes("Roth") ? "Roth IRA" : "Traditional IRA"`                                                                     | Individual                                   | successors' names (or `[]`)                                                                               |
| Life insurance                | `"Life insurance"` (external)                                                                                                | Individual                                   | `successors` names if any, else `[]`                                                                      |
| Debts                         | `"Credit card"`                                                                                                              | Individual                                   | `undefined`                                                                                               |
| Real Estate, Vehicles, others | skip (return no holding) — the engine has no class for them in the advisor model; P2 may add `real-estate`/`vehicle` mapping | —                                            | —                                                                                                         |

Members: map `FamilyMember` → `ClientMember` (relationship `"Self"|"Spouse"|"Child"|…`; parse
age from `note` like `"Age 15"`; status Deceased if `id === deceasedId`). State: `"PA"` (the
family seed has no address; add the assumption "Assumes the family lives in Pennsylvania").

### 11.6 `simulate.ts`

```ts
export type FindingSeverity = "high" | "medium" | "low";
export type Finding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  fix: string;
  holdingIds: string[];
  sources: string[];
};
export type ReadinessReport = {
  person: string;
  survivor: string;
  plan: SettlementPlan;
  findings: Finding[];
  status: "ready" | "gaps" | "exposed";
};

export function readinessReport(
  customer: AdvisorCustomer,
  profile: ClientProfile,
  personName: string,
  asOf: string,
): ReadinessReport;

/** People worth simulating: living members (not attorney / sibling-in-law) who own a PNC holding. */
export function simulatablePeople(profile: ClientProfile): string[];
```

Findings (compute from the plan **and** from the household's holdings):

| id                 | trigger                                                                                                                                                                                     | severity                            | fix                                                                                                       | sources                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| `f.probate`        | account plans with `outcome.probate` and value > 0                                                                                                                                          | high if total ≥ 100,000 else medium | "Add a POD/TOD or retirement beneficiary to {accounts}"                                                   | outcome sources           |
| `f.names-deceased` | any holding owned by someone **living in the real profile** (evaluate on `profile.members` as stored, not on the simulated copy) whose beneficiaries include a member who has actually died | high                                | "Send new beneficiary forms for {accounts}"                                                               | `irs-pub-590b`            |
| `f.no-beneficiary` | retirement or brokerage holdings owned by `person` with `beneficiaries` `[]`                                                                                                                | high                                | "Name beneficiaries on {accounts}"                                                                        | `irs-pub-590b`, `pa-ch64` |
| `f.minor-direct`   | plans where `anyBeneficiaryMinor === "yes"`                                                                                                                                                 | medium                              | "Name a custodian or a trust for {minor} instead of the child directly"                                   | `rmd-minor-child`         |
| `f.529-successor`  | 529 plans owned by `person` with no `successorOwner`                                                                                                                                        | medium                              | "Name a successor owner on the 529"                                                                       | `plan-529`                |
| `f.no-will`        | `customer.will.status !== "on-file"` and `plan.totals.probate > 0`                                                                                                                          | medium                              | "Finish the will in the PNC planner" (link `routes.familyWill` is customer-only — advisor sees text only) | `pa-register-of-wills`    |
| `f.fdic`           | any plan that matched `ov.fdic-grace`                                                                                                                                                       | low                                 | "Review coverage within 6 months of a death"                                                              | `fdic-330-3j`             |

`status`: any high → `"exposed"`; else any medium → `"gaps"`; else `"ready"`.
Sort findings by severity, then by value affected (desc).

Note: in the Morgan household, `f.names-deceased` fires even when simulating Morgan (her Roth
names Riley). That is the demo moment — keep it.

### 11.7 `reviews.ts` (P1)

Copy the store pattern of `src/lib/bereavement.ts`:

```ts
const STORAGE_KEY = "pnc-settlement-reviews-v1";
export type ReviewSignOff = { level: ReviewLevel; by: string; on: string };
export type ReviewState = Record<string, ReviewSignOff[]>; // key = `${customerId}:${queueKey}`
export function useReviews(): ReviewState;
export const reviewActions = { signOff(key, signOff), undo(key, level), reset() };
```

Never store derived data (no "done" flags for actions — completion of a review is a sign-off
record, which is genuinely new information).

---

## 12. Phase 8 (P0) — Tests

All under `src/lib/settlement/__tests__/`. Use `MOCK_AS_OF` and data from `src/data/*`. Use
`advisorCustomers.find(...)`, `profileFor(...)`, `factsFor(...)` and
`withRecordedLosses` exactly as the app does.

### 12.1 `rulebook.test.ts` — integrity (these must never be skipped)

1. Every `sources` id referenced by any node, action, overlay or household rule exists.
2. Every source has an `https://` url, non-empty `citation` and `summary`.
3. Every action id referenced by outcomes, overlays and household rules exists.
4. Every decision node has `sources.length ≥ 1`; every outcome too.
5. **Exhaustiveness:** with
   ```ts
   export const FACT_DOMAINS: Partial<Record<AccountFactKey, readonly string[]>> = {
     accountClass: [...], decedentRole: [...], beneficiaryStatus: [...],
     primaryBeneficiaryCategory: [...], successorOwnerNamed: ["yes","no","unknown"],
     state: ["PA","other"],
   };
   ```
   (export it from `facts.ts`), each decision node's branch `when` values equal its fact's domain
   as a set — no missing, no extras, no duplicates.
6. Every `next` id exists; every node is reachable from the root; no cycles.
7. Every action with a `deadline` has ≥1 source.
8. `UNVERIFIED_SOURCE_IDS` equals exactly
   `["pa-register-of-wills","irs-pub-559","irs-pub-590b","irc-1014","pnc-cd-agreement","plan-529"]`
   (sorted compare). When someone verifies a source they update this list on purpose.
9. Placeholders: every `{…}` in any `detail`/`summary`/`plain` is one of
   `{decedent}`, `{survivor}`, `{account}`; household rule text never uses `{account}`.

### 12.2 `dates.test.ts`

- `addMonths("2026-10-23", 3) === "2027-01-23"`; `addMonths("2026-08-31", 6) === "2027-02-28"`;
  `addMonths("2027-08-31", 6) === "2028-02-29"`.
- `resolveDeadline({from:"apr-15", yearsAfterDeath:1}, "2026-10-23") === "2027-04-15"`.
- `resolveDeadline({from:"dec-31", yearsAfterDeath:10}, "2026-10-19") === "2036-12-31"`.

### 12.3 `facts.test.ts`

One assertion per row of 11.3.1 (all `HoldingType`s), plus decedentRole for: joint, sole, trust
co-trustee, 529 plan-owner, named-beneficiary (Morgan's Roth → Riley), not-involved;
beneficiaryStatus for `undefined`, `[]`, all-deceased, living; RBD for ages 61, 73, 78 and Roth.

### 12.4 `morgan.test.ts` — Riley Placeholder's death (golden)

Input: `settlementInputFromFacts(factsFor(c-placeholder, profile, MOCK_AS_OF))`.
Death 2026-10-23. Survivor Morgan (spouse). State PA.

Expected routes by holding id:

| holding      | route                      | outcome id                                                                           | passesToNames      | probate |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------ | ------------------ | ------- |
| `h-pl-chk`   | survivorship               | `o.survivorship-deposit`                                                             | Morgan Placeholder | no      |
| `h-pl-mm`    | survivorship               | `o.survivorship-deposit` (+ `ov.fdic-grace`, attention)                              | Morgan Placeholder | no      |
| `h-pl-cd`    | survivorship               | `o.survivorship-deposit` (+ `ov.cd-waiver`)                                          | Morgan Placeholder | no      |
| `h-pl-brk`   | beneficiary-claim          | `o.tod-claim`                                                                        | Morgan Placeholder | no      |
| `h-pl-ira`   | spousal-retirement-options | `o.spousal-retirement-options` (no `ov.yod-rmd`: Riley was 61)                       | Morgan Placeholder | no      |
| `h-pl-roth`  | designation-update         | `o.designation-update`                                                               | —                  | no      |
| `h-pl-trust` | successor-trustee          | `o.successor-trustee`                                                                | Morgan Placeholder | no      |
| `h-pl-529`   | successor-owner            | `o.successor-owner-missing` (no `successorOwner` on file — stays missing on purpose) | —                  | no      |
| `h-pl-visa`  | closes-estate-pays         | `o.closes-estate-pays`                                                               | —                  | no      |
| `h-pl-life`  | insurer-claim              | `o.insurer-claim` (held outside PNC)                                                 | Morgan Placeholder | no      |

Totals: `outsideProbate = 7_786_400`; `uninterrupted = 3_276_800`
(chk + mm + cd + trust); `probate = 0`; `debts = -8_400`; `heldOutsidePnc = 1_000_000`;
`needsReview = 0`. Sanity: `outsideProbate + debts + 642_000 (Morgan's own Roth)` equals the
customer's `relationshipValue` `8_420_000`.

Household rules present: `hh.flag`, `hh.reclamation`, `hh.ssa`, `hh.final-1040`,
`hh.fiduciary` (Morgan is "Executor of Riley's will"), `hh.portability`, `hh.pa-inheritance`.
Absent: `hh.estate-income`, `hh.form-706`, `hh.pa-letters`, `hh.pa-small-estate`.

Deadlines (ascending, each exactly once):

| due        | action                                | kind        |
| ---------- | ------------------------------------- | ----------- |
| 2027-01-23 | `pa-it-discount`                      | opportunity |
| 2027-04-15 | `final-1040`                          | statutory   |
| 2027-04-23 | `fdic-review` (accountIds: `h-pl-mm`) | recommended |
| 2027-07-23 | `pa-it-return`                        | statutory   |
| 2027-07-23 | `portability`                         | opportunity |
| 2028-10-23 | `ssa-lump-sum`                        | statutory   |
| 2031-10-23 | `portability-late`                    | opportunity |

(Order on 2027-07-23: statutory before opportunity.) Open questions include the reclamation
question and the 529 successor-owner question. `estimatedGrossEstate < 15_000_000`.

After the P1 data change (Morgan's IRA: `beneficiaries: ["Morgan Placeholder"]`,
`contingentBeneficiaries: ["Sam Placeholder"]`; 529: still **no** `successorOwner` — leave it
missing on purpose, it's a good demo finding), update only what changes.

### 12.5 `avery.test.ts` — Drew Example's death (golden)

Death 2026-10-19, Drew 78, survivor Avery (child), state PA.

| holding                              | route                | outcome id             | notes                                                                                                          |
| ------------------------------------ | -------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `h-ex-dira`                          | inherited-retirement | `o.inherited-ten-year` | overlays `ov.yod-rmd`, `ov.annual-rmds`, `ov.separate-accounts`, `ov.disability-check`; passesTo Avery + Quinn |
| `h-ex-dchk`                          | beneficiary-claim    | `o.pod-claim`          | passesTo Avery                                                                                                 |
| `h-ex-dbrk`                          | probate              | `o.probate-pa`         | overlay `ov.step-up`; not `ov.pa-3101b` (not a deposit)                                                        |
| `h-ex-ira` (Avery's own)             | designation-update   | `o.designation-update` | names Drew                                                                                                     |
| others (Avery's checking, brokerage) | —                    | not in plan            |                                                                                                                |

Totals: `outsideProbate = 454_200`, `probate = 181_000`, `uninterrupted = 0`.
Household: `hh.estate-income`, `hh.pa-letters` present; `hh.pa-small-estate` **absent**
(181,000 > 50,000); `hh.ssa` and `hh.portability` absent (not a spouse); `hh.fiduciary` present.
Deadlines include `yod-rmd` 2027-12-31, `separate-accounts` 2027-12-31, `annual-rmds`
2027-12-31, `ten-year-end` 2036-12-31, `pa-it-discount` 2027-01-19, `final-1040` 2027-04-15,
`pa-it-return` 2027-07-19. Assumptions include the RBD assumption for Drew (78).

### 12.6 `family.test.ts` — engine agrees with the hand-labelled family data

`settlementInputFromFamily(initialFamilyState, "m-casey", MOCK_AS_OF, MOCK_AS_OF)`. For every
mapped asset Casey owns, the engine route must be consistent with `asset.method`:

| method     | allowed routes                                   |
| ---------- | ------------------------------------------------ |
| joint      | survivorship                                     |
| pod        | beneficiary-claim                                |
| tod        | beneficiary-claim                                |
| retirement | spousal-retirement-options, inherited-retirement |
| trust      | successor-trustee                                |
| estate     | probate                                          |
| close      | closes-estate-pays                               |

Write this as a table-driven test over `initialFamilyState.assets`. If it fails for a seed
asset, **fix the adapter**, not the seed. Expected: `a-money-market` (Casey sole, method
`estate`) → probate; `a-brokerage` (tod, Jordan + Avery) → beneficiary-claim; `a-ira`
(retirement, Jordan) → spousal-retirement-options.

### 12.7 `simulate.test.ts`

- `readinessReport(Morgan customer, factsFor(...).p, "Morgan Placeholder", MOCK_AS_OF)` →
  status `"exposed"`; findings include `f.names-deceased` (h-pl-roth) and `f.probate` covering
  `h-pl-roth` (its only beneficiary has died → `o.retirement-to-estate`) **and** `h-pl-chk`,
  `h-pl-mm`, `h-pl-cd` (still titled jointly with Riley, no surviving co-owner, no POD →
  `o.probate-pa`). `plan.totals.probate === 2_268_800` (642,000 + 186,400 + 1,240,000 +
  200,400). The trust becomes `sole-trustee` → `o.successor-trustee` with the open question
  about the named successor trustee. Riley's own accounts (brokerage, IRA, 529, Visa) are
  `not-affected` in this simulation.
- `simulatablePeople(Morgan profile)` includes "Morgan Placeholder", excludes "Dana Example",
  "Jamie Placeholder", "Sam Placeholder" (owns nothing) and the deceased Riley.
- For every generated profile (customers without hand-written profiles), simulating the primary
  customer never throws and returns totals whose sum (`outsideProbate + probate + debts +
needsReview`) equals the sum of `holding.value` over the plan's accounts that are not
  `external` and not `designation-update`.
- At least one generated profile reports `f.no-beneficiary` (≈35% of generated retirement
  accounts have none on file — if this ever fails, the generator changed).

### 12.8 `fallback.test.ts`

Same Avery input with `state: "other"` → `h-ex-dbrk` is `o.probate-other-state`; household has
`hh.state-unmodelled` and no `hh.pa-*`; federal rules unchanged.

**Done when:** `npm test` is green and the four existing checks pass.

---

## 13. Phase 9 (P0) — Advisor UI: Transition plan tab

### 13.1 Wiring in `ClientWorkspace.tsx`

- Add `{ id: "transition", label: "Transition plan" }` to `allTabs`, after `"loss"`.
- Always visible (unlike `loss`): with an open loss it opens in **Settlement** view; otherwise in
  **What if** view.
- Render `<TransitionPanel facts={facts} onAsk={ask} />`.
- Deep link `#transition` must work (it does via `useHashTab`).

### 13.2 `TransitionPanel.tsx`

```
<header>
  AssistantMark label="Transition plan"       Rulebook chip: "Rules v2026.10-pa-pilot · PA" → link routes.advisorRules
  One-line disclaimer (DISCLAIMER), text-xs muted
</header>
Segmented control (role="tablist", 2 buttons):   [ After {Riley}'s death ]  [ What if… ]
  - First segment only when facts.loss exists. Default = first available.
  - Local state, not hash (keeps the outer tab's hash clean).
{view === "settlement" ? <SettlementView/> : <SimulationView/>}
```

Compute the plan with `useMemo(() => settlementPlan(settlementInputFromFacts(facts)!), [facts])`.

### 13.3 `SettlementView.tsx` — layout (top → bottom)

1. **Summary strip** (4 stat tiles, `@2xl:grid-cols-4`, use `Money compact`):
   - "Passes outside probate" `totals.outsideProbate` — sub: "of which {uninterrupted} keeps working with no paperwork"
   - "Goes through probate" `totals.probate` — attention tone when > 0
   - "Deadlines in the next 90 days" count from `nextDeadlines(plan, asOf, 90)`
   - "Need sign-off" `reviewQueue.length` (minus signed-off, P1)
     Plus `MockBadge` on the section header (figures are shown).
2. **RouteTable** — one row per account plan, sorted: probate first, then needs-review, then by
   value desc. Columns (web, `@3xl` and up): Account (name, x-last4, type) · Route chip ·
   Passes to · Typical time · Review chips · Value. Under `@3xl` render each row as a card.
   Clicking a row expands **RuleTrace** inline (`aria-expanded`).
3. **DeadlineList** — vertical timeline: date (`formatDate(…, "medium")`), relative day
   (`relativeDay`), label, kind chip (`statutory` = attention tone, `opportunity` = orange tone,
   `recommended` = blue tone), owner, the accounts it applies to, source chips.
4. **HouseholdChecklist** — grouped "Federal" / "Pennsylvania"; each rule: title, filled detail,
   actions with owners, review chips, source chips.
5. **Open questions** — list with an "Ask" button per question that calls
   `onAsk(question)` (Phase 12 adds an intent that answers "I don't have that — confirm with …").
6. **ReviewQueue** (P1) — each item with review level chips and a "Mark reviewed" button per
   level → `reviewActions.signOff`. Signed items show "Reviewed by Alex Example · Oct 25, 2026"
   and an Undo.
7. **Assumptions** — muted list at the bottom, always shown.

### 13.4 `RuleTrace.tsx`

For one `AccountPlan`:

```
Why: {outcome.title}
  {summary}
  Decision path
   1. {question}  →  {answer}        evidence: {evidence}     [source chips]
   2. …
   ⟶ Outcome: {outcome.title}                                   [source chips]
  Also applies: {overlay.title}: {overlay detail}                [source chips]
  Steps (ordered): label · owner · due (if any)
  For the client (plain): "{plain}"          ← quoted, italic: what Morgan would read
  View this branch in the rulebook → routes.advisorRuleNode(outcome.id)
```

### 13.5 `SourceChip.tsx`

`<a href={source.url} target="_blank" rel="noreferrer">` styled as `Chip`
(`bg-white ring-pnc-line text-pnc-link`), text = `citation`, `title` = `summary`. If
`!verifiedOn`, append a small dot and set `title` to `"{summary} — citation not yet verified"`.
Accepts `id` and looks up `rulebook.sources[id]`.

### 13.6 `SimulationView.tsx`

```
"If {person} died today ({formatDate(asOf,'medium')})"     person picker: segmented buttons from simulatablePeople(profile)
  default person: the primary customer when no loss; the survivor (facts.self) when a loss is open
Status banner: ready (positive tones) / gaps (orange) / exposed (attention)
  e.g. "Exposed — $2.27M would go through probate, and 1 designation names someone who has died."
Stat tiles: outside probate · probate · uninterrupted · findings count
FindingList: severity chip, title, detail, Fix (bold), accounts, source chips,
             button "Ask about this" → onAsk(`Why: ${finding.title}?`) (Phase 12 handles it)
RouteTable (simulation mode: same component, prop mode="simulation" changes the header copy and
            hides review chips)
DeadlineList collapsed by default under "Dates this would start" (they're hypothetical)
```

Use `readinessReport(customer, profile, person, MOCK_AS_OF)` in a `useMemo` keyed on
`[facts, person]`. For the recorded-loss case, call it with `facts.p` (the profile whose members
already mark the deceased) so the Roth-names-Riley finding appears.

### 13.7 `parts.ts` — tone + label maps (no raw hex; tokens only)

```ts
export const routeLabels: Record<SettlementRoute, string> = {
  survivorship: "Passes to co-owner",
  "beneficiary-claim": "Beneficiary claim",
  "spousal-retirement-options": "Spouse's IRA options",
  "inherited-retirement": "Inherited IRA",
  "successor-trustee": "Successor trustee",
  "successor-owner": "New plan owner",
  probate: "Probate",
  "closes-estate-pays": "Closes · estate pays",
  "insurer-claim": "Insurance claim",
  "designation-update": "Update beneficiary",
  "not-affected": "Not affected",
  "needs-review": "Needs review",
};
export const routeTone: Record<SettlementRoute, string> = {
  survivorship: "bg-pnc-positive-bg text-pnc-positive ring-transparent",
  "successor-trustee": "bg-pnc-positive-bg text-pnc-positive ring-transparent",
  "beneficiary-claim": "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent",
  "spousal-retirement-options": "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent",
  "inherited-retirement": "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent",
  "successor-owner": "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent",
  "insurer-claim": "bg-pnc-blue-50 text-pnc-blue-800 ring-transparent",
  probate: "bg-attention-bg text-attention ring-attention-line",
  "needs-review": "bg-pnc-orange/10 text-pnc-orange-600 ring-pnc-orange/30",
  "designation-update": "bg-pnc-orange/10 text-pnc-orange-600 ring-pnc-orange/30",
  "closes-estate-pays": "bg-pnc-chip text-pnc-muted ring-transparent",
  "not-affected": "bg-pnc-chip text-pnc-muted ring-transparent",
};
export const reviewLabels: Record<ReviewLevel, string> = {
  advisor: "Advisor",
  operations: "Operations",
  "trust-officer": "Trust officer",
  attorney: "Attorney",
  "tax-advisor": "Tax advisor",
};
export const ownerLabels: Record<ActionOwner, string> = {
  /* advisor: "You", client: "{survivor}", … */
};
```

### 13.8 Accessibility and responsiveness checklist

- Segmented controls: `role="tablist"`/`role="tab"`/`aria-selected`, arrow-key support (copy
  `onTabKey` from `ClientWorkspace`).
- Expandable rows: real `<button>` with `aria-expanded` + `aria-controls`.
- Every chip has text, not color alone.
- Works inside the phone frame (`?view=mobile`): everything uses `@container` breakpoints, no
  fixed widths; tables collapse to cards under `@3xl`.
- Lucide icons only, `aria-hidden="true"` on decorative ones. The repo pins
  `lucide-react ^1.61`; confirm each icon name exists in `node_modules/lucide-react` before using
  it (`BookOpenCheck`, `ShieldAlert`, `Scale`, `Gavel`, `CalendarClock`) and fall back to
  `BookOpen` / `AlertTriangle` if not.

---

## 14. Phase 10 (P0) — Rulebook page `/advisor/rules`

1. `src/lib/routes.ts`: add
   ```ts
   /** Advisor: the settlement rulebook (decision tree, rules and sources). */
   advisorRules: "/advisor/rules",
   advisorRuleNode: (id: string) => `/advisor/rules#${id}`,
   ```
   `isAdvisorPath` already covers `/advisor/*`; no proxy change needed because both views get a
   page.
2. `src/app/web/advisor/rules/page.tsx`: `metadata = { title: "Rulebook" }`; `WebHero` title
   "Settlement rulebook", subtitle "Federal + Pennsylvania pilot · v{version} · reviewed
   {formatDate(asOf,'medium')}", `showDate={false}`; body `<Rulebook />` in the standard
   `mx-auto max-w-6xl px-4 py-8 sm:px-6` container.
3. `src/app/mobile/advisor/rules/page.tsx`: `MobileHeader title="Rulebook" backHref={routes.advisor}`
   - `<div className="px-3 pt-4"><Rulebook /></div>`.
4. Nav: `WebHeader.tsx` advisor entries → `[{ label: "Home", … }, { label: "Rulebook", href:
routes.advisorRules }]`. `BottomTabBar.tsx` advisor entries → add `{ label: "Rulebook", href:
routes.advisorRules, icon: BookOpenCheck }`. Check active-state logic handles the new path.
5. `src/components/advisor/rulebook/Rulebook.tsx` (client component only if it needs state; a
   server component is fine — it's static data):
   - **Intro card:** what the rulebook is, the disclaimer, counts (nodes, overlays, household
     rules, sources, unverified sources).
   - **Decision tree:** recursive render from the root. Decision = card with the question and
     the fact name in muted mono text; each branch = indented row "when {label} →" followed by
     the child. Outcomes = cards with route chip, `summary`, actions (labels + owners), review
     chips, source chips. Give every node `id={node.id}` so `routes.advisorRuleNode` scrolls to
     it (use `scroll-mt-24`). Shared children (e.g. `o.needs-review-titling`) render once with
     full details; subsequent references render as a link "→ {title} (see above)".
   - **Overlays** and **Household rules** (Federal / Pennsylvania) as lists of cards with
     their conditions rendered human-readably: `accountClass ∈ {deposit, cd}` → "Account is a
     deposit or CD"; write a tiny `describeClause()` helper next to the component.
   - **Sources table:** citation · authority · kind · verified (date or "Not yet verified") ·
     link. Sort by jurisdiction (US then PA), then citation.

**Done when:** every trace "View in rulebook" link lands on the right node in both views.

---

## 15. Phase 11 (P1) — Data model additions

1. `src/data/types.ts`: add `contingentBeneficiaries?` and `successorOwner?` to `Holding` (see
   Phase 2).
2. `src/data/clients.ts` (Morgan): `h-pl-ira` → `beneficiaries: ["Morgan Placeholder"],
contingentBeneficiaries: ["Sam Placeholder"]`. Leave `h-pl-529` **without** `successorOwner`.
3. `src/lib/assistant.ts`, minimal edits so behavior stays the same:
   - In `assetRecommendations`, the spouse IRA branch: replace
     `...(bens[1] ? [\`Note ${firstName(bens[1])} is the contingent beneficiary\`] : [])`with`...(h.contingentBeneficiaries?.[0] ? [\`Note ${firstName(h.contingentBeneficiaries[0])} is the contingent beneficiary\`] : [])`and`basedOn` lists contingents as "contingent: …".
   - In `lossBriefing`, heir collection: also add names from `h.contingentBeneficiaries`; stake
     text: primary → "Beneficiary of X", contingent → "Contingent beneficiary of X" (fixes Quinn
     being mislabelled "Contingent" on Drew's IRA today).
4. `panels.tsx` `HoldingRow`: after the beneficiaries, render contingents as
   `"(contingent: Sam Placeholder)"` in muted text.
5. Re-run tests; update the Morgan golden test only where the plan said it would change.

---

## 16. Phase 12 (P1) — Assistant integration

Goal: the assistant stops asserting legal rules in its own prose where the engine knows better,
and every legal claim it makes can cite a source.

1. `Recommendation` gets `sources?: string[]` (source ids). In `assetRecommendations`, when
   `f.loss` exists compute `const plan = settlementPlan(settlementInputFromFacts(f)!)` once, and
   for each loss-related rec set `sources` = union of `sourcesUsed` from the account plans whose
   `holding.id` appears in the rec's accounts (`retitle` → joint accounts; `tod-*` → that
   holding; `ira-*` → that holding; `probate`; `trust`; `529`; `card`; `life`).
   `RecommendationCard` in `panels.tsx` renders a "Rules" row of `SourceChip`s when present.
2. **Fix the RMD sentences** (both in `assetRecommendations` non-spouse IRA rationale and in
   `lossBriefing.personalized`): replace "is due by Dec 31" with text built from the plan's
   `yod-rmd` deadline: `"…confirm whether {d}'s {year} RMD was taken; if not, the beneficiary can
take it by their tax-filing deadline or, at the latest, {formatDate(due)}."`
3. `answerQuestion` — add these intents **before** the existing ones (order matters):
   - `/deadline|key date|due date|when (is|are).*(due|file)/` → paragraphs: the next 5
     deadlines `"{date} — {label} ({kind})"`; sources: their citations.
   - `/why.*probate|go(es)? (to|through) probate|what goes to probate/` → probate account plans
     with the decision path in one sentence each; or "Nothing goes through probate at PNC." with
     the totals.
   - `/\blaw\b|statute|regulation|legal basis|cite|which rule/` → the 6 most-used sources:
     `"{citation} — {summary}"`.
   - `/what if|if .* (died|passed)|simulat|readiness/` → run `readinessReport` for the named
     person if their name/first name appears in the question, else for `f.self`; answer with
     status + top 3 findings and fixes.
   - `/^why:\s*/` already handles recommendations; extend it to also match a finding title from
     the readiness report (for the "Ask about this" buttons in SimulationView).
   - Open questions from the plan (asked via the Transition tab): match the exact question text →
     answer "I don't have that in {first}'s records. Confirm it with {owner}; until then the plan
     assumes the cautious option."
     Sources in all new answers are **citations** (e.g. "20 Pa.C.S. § 6304"), so the existing
     "Sources:" line shows the law.
4. `suggestedQuestions`: when there's a loss add `"What are the key deadlines?"`; always add
   `` `What if ${f.first} died today?` `` (keep the `slice(0, 6)` cap; replace the cash question
   first if needed).
5. `traceFor` in `AskPanel.tsx`: add `"Applied the settlement rulebook (v…)"` when the engine was
   used.
6. `LossGuide.tsx`: under the header add a one-line link button "Open the transition plan — {n}
   deadlines, {m} items to sign off" → `onOpen`-style tab switch. (LossGuide only receives
   `onAsk`; add an optional `onOpen?: OpenTab` prop and pass `setTab` from `ClientWorkspace`.)
7. `DailyBrief`: add kind `"readiness"` → `{ icon: ShieldAlert, tab: "transition", tone:
"text-pnc-orange-600" }`. In `dailyBrief()` (assistant.ts), after the cash items, for
   customers **without** a loss compute `readinessReport(c, p, c.name, today)`; push items for
   status `"exposed"` with text `"If {first} died today, {money(probate)} would go through
probate{ — n designation(s) need updating}."`, action `"See what if"`; keep at most 3,
   largest probate first. Memoize at the call site as today.
8. `RecordPassingPanel.tsx`: the existing "Reset demo" also calls `reviewActions.reset()`.

**Done when:** Ask "What are the key deadlines?" on Morgan lists the 7 Morgan deadlines in order
with citations; the old "due by Dec 31" phrase no longer appears anywhere (`grep -rn "due by Dec
31" src` is empty).

---

## 17. Phase 13 (P2) — Customer side and data alignment

1. **Why this happens (gentle).** In `PlaceholderFlowView` and `TransferFlowView`, when the
   household has a recorded loss, build the plan with `settlementInputFromFamily(...)` for the
   deceased member (Casey → `m-casey`) and show a small "Why this happens" disclosure with
   `plan.accounts[i].plain` and a "Learn more" link to the outcome's first source. **Do not**
   show deadlines, review levels, totals or anything urgent to the customer (AGENTS.md: gentle
   copy, nothing urgent today). Opportunities (e.g. the 5% PA discount) are advisor-only.
2. **Align `c-sample`.** The advisor-side profile for Jordan Sample is generated, so recording
   Casey's death shows different accounts to the advisor than to Jordan. Option A (preferred,
   needs team sign-off because it changes the advisor table totals): hand-write a `c-sample`
   profile in `clients.ts` mirroring `initialFamilyState` PNC assets and update
   `relationshipValue`/`accountCount` in `advisor.ts` so the sum rule still holds. Option B:
   leave as is and demo the spouse case on Morgan only. Ask before doing A.

---

## 18. Phase 14 (P2, after submission) — Optional grounded LLM explanations

Only if the team wants a live model in the finals. Never let a model decide a route.

- Add `src/app/api/explain/route.ts` (note: `src/proxy.ts` matcher already skips `/api/`).
- Input: one `AccountPlan` (or the household section) serialized; system prompt: "Rewrite the
  `summary` for {audience} in ≤ 80 words. Use only facts in the JSON. Keep every citation.
  If information is missing, say so." Output is shown **next to** the deterministic text, labeled
  "AI wording — check against the rule", never replacing it.
- Server-side env key only; feature flag `NEXT_PUBLIC_EXPLAIN_LLM=1`; the app must work identically
  with the flag off. Add a test that the plan rendering doesn't depend on the endpoint.

---

## 19. Phase 15 (P0/P1) — Docs

- `README.md`: new section **"Settlement rules engine"** after "Advisor assistant": what it is,
  the two modes, where data/engine live, how to add a rule (node + source + test), `npm test`,
  the `/advisor/rules` page, and the disclaimer. Add `npm test` to the "Run it" block.
- `AGENTS.md`, new bullet under conventions:
  > **Settlement rules** live in `src/data/settlement` (rulebook data, every rule cites a source
  > in `sources.ts`) and `src/lib/settlement` (pure engine). Never hard-code legal rules, dates or
  > thresholds in components or in `assistant.ts` — add a node, overlay or household rule with a
  > source and a test. Label engine output with `AssistantMark` and show `SourceChip`s. New
  > sources without `verifiedOn` must be added to the pinned unverified list in
  > `rulebook.test.ts` on purpose. `npm test` must pass.
- Also add `npm test` to the "Before finishing" line in `AGENTS.md`.
- Commit this plan as `docs/plans/settlement-rules-engine.md`.

---

## 20. Order of work and time budget (deadline Wed 11:59 PM)

| #   | Work                                                                   | Tag | Est.  |
| --- | ---------------------------------------------------------------------- | --- | ----- |
| 1   | Phase 1 Vitest + CI                                                    | P0  | 0.5 h |
| 2   | Phase 2 types                                                          | P0  | 0.5 h |
| 3   | Phases 3–6 rulebook data (sources, actions, tree, overlays, household) | P0  | 3 h   |
| 4   | Phase 7 engine + adapters + simulate                                   | P0  | 3 h   |
| 5   | Phase 8 tests (integrity first, then goldens)                          | P0  | 2 h   |
| 6   | Phase 9 Transition tab                                                 | P0  | 4 h   |
| 7   | Phase 10 Rulebook page                                                 | P0  | 1.5 h |
| 8   | Phase 15 docs                                                          | P0  | 0.5 h |
| 9   | Phases 11–12 data + assistant + daily brief + reviews                  | P1  | 3–4 h |
| 10  | Phases 13–14                                                           | P2  | later |

Commit after each numbered row with a clear message (`feat(settlement): rulebook data`, etc.)
and keep CI green at every commit. Open one PR; P1 can be a second PR if P0 is ready first.

---

## 21. Acceptance checklist (run before opening the PR)

- [ ] `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] No component or `assistant.ts` contains a legal threshold or date literal that the
      rulebook owns (`grep -rnE "15,000,000|20,000|50,000|\\b255\\b|nine months|9 months" src/components src/lib/assistant.ts` returns only UI copy that reads from the plan).
- [ ] Every engine-derived panel shows `AssistantMark`; every figure section has `MockBadge`.
- [ ] Every outcome shown has ≥1 `SourceChip`; unverified sources are visibly marked.
- [ ] Morgan (`/advisor/clients/c-placeholder#transition`): totals and the 7 deadlines match §12.4.
- [ ] Avery (`/advisor/clients/c-example#transition`): Drew's brokerage shows Probate with the PA
      letters checklist; the IRA shows the 10-year rule, the RMD question and separate accounts.
- [ ] What if → Morgan Placeholder: status Exposed; findings show the Roth still naming Riley
      and the joint accounts still titled with Riley; $2.27M would go through probate.
- [ ] A household with no loss (e.g. `c-fictional`) opens Transition plan on What if, no errors.
- [ ] Recording a new death on the advisor home (default Casey Sample) → `c-sample` Transition
      tab works (generated data; numbers will be generic).
- [ ] `?view=mobile` (phone frame): Transition tab and Rulebook are usable, no horizontal scroll.
- [ ] Customer views unchanged unless P2 was done; nothing urgent or advisor-only leaks to them.
- [ ] Keyboard: tabs, segmented controls and expandable rows work with arrows/Enter/Space.

---

## 22. Demo script (feeds the 2-minute video)

1. Sign in as `advisor`. Daily brief: Morgan Placeholder's loss on top; (P1) a readiness item
   "If Harper died today…" further down.
2. Open Morgan → **Transition plan**. "Riley died two days ago. $7.8M passes outside probate,
   $3.3M of it with no paperwork at all; nothing goes to probate." Point at the 7 dated
   deadlines — the first is the PA inheritance-tax discount on Jan 23.
3. Expand **Brokerage Account**: decision path with citations (TOD → 20 Pa.C.S. ch. 64; basis
   step-up → 26 U.S.C. § 1014). Show the "For Morgan" plain-language line.
4. (P1) Sign off the trust item as Trust officer.
5. Switch to **What if… → Morgan**. "Exposed: her Roth still names Riley and three accounts
   are still titled with Riley. If Morgan died today, $2.3M would go through probate and Sam
   would wait months. Fix: retitle with a POD and send one beneficiary form." This is the pitch
   line: the same rules, run before the death.
6. Open **Rulebook**: every branch, every source, which are verified. "Rules are data, reviewed by
   people, cited to the law — no model decides who inherits."

---

## 23. Pitfalls — read before you start

- **Don't branch on numbers in the tree.** Thresholds ($20K, $50K, $15M) are overlays/household
  rules so the tree stays exhaustive and testable.
- **Don't confuse 529 "beneficiaries" with heirs.** For 529 plans they're the student.
- **Don't count Morgan's own Roth in Riley's totals.** It's `designation-update`, outside every total.
- **Don't compute tax.** Flag returns, rates and dates; route to a tax advisor.
- **Don't write placeholder-free copy that bakes in names** — use `{decedent}`/`{survivor}`/`{account}`.
- **Don't use `new Date()`** — pass `MOCK_AS_OF` / the date of death.
- **Don't store derived state** (AGENTS.md). Only review sign-offs are stored.
- **Don't let customer-facing copy mention deadlines, probate amounts or review levels.**
- **Keep diffs to shared files tiny** (`types.ts`, `ClientWorkspace.tsx`, `assistant.ts`,
  `routes.ts`, nav files) — other agents work in parallel worktrees.
- **Next.js 16 differs from your training data.** Before writing the new pages, read the relevant
  guide in `node_modules/next/dist/docs/` and copy the patterns of the existing advisor pages
  (`PageProps`, `Metadata`, server components by default).
- **If a golden number in §12 doesn't match**, first check the data in `clients.ts` hasn't
  changed; then check fact derivation; only then question the expected value — and if you change
  it, say why in the commit message.
