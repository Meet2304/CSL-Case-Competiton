# PNC Concept Prototype — CSL Case Competition 2026

A Next.js + React base app that mirrors the PNC online banking site and mobile
app. It is the starting point for the competition solution (Client & Family
Experience + Advisor Workbench). **Every figure on screen is mock data.**

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # next typegen + tsc
npm test           # Vitest: settlement rulebook integrity + golden tests
npm run build      # production build
npm run lint
npm run format       # Prettier --write
npm run format:check # Prettier --check
```

## Routes — one URL, view chosen by device

There is no view switcher. `src/proxy.ts` reads the user-agent: **phones get the
mobile app, laptops/desktops/tablets get online banking**, on the same URL.

| URL                 | Laptop / desktop (`app/web`)     | Phone (`app/mobile`)            |
| ------------------- | -------------------------------- | ------------------------------- |
| `/`                 | Sign-on                          | Sign-on (Image 1)               |
| `/accounts`         | Accounts dashboard (Image 7)     | Home / Virtual Wallet (Image 2) |
| `/pay-transfer`     | Pay & Transfer + payment history | Pay & Transfer list (Image 3)   |
| `/rewards`          | TotalRewards                     | TotalRewards (Images 4–5)       |
| `/cards`            | All cards with controls          | → redirects to `/more`          |
| `/cards/[cardId]`   | → redirects to `/cards`          | Card Details (Image 6)          |
| `/deposit`, `/more` | → redirect to `/accounts`        | Mobile Deposit, More            |
| `/help`             | Help                             | → redirects to `/more`          |

To test the phone view on a laptop, use Chrome DevTools device mode (it sends a
phone user-agent) and reload. For demos/recordings you can also pin a view with
`?view=mobile` or `?view=web` on any URL (stored in a cookie; `?view=auto` clears
it). A pinned mobile view on a wide screen is shown inside an iPhone frame.

## Roles — customer vs. advisor

Sign-on decides the experience. Demo User IDs (any password; defined in
`src/data/users.ts`):

| User ID   | Who                                                       | Lands on    |
| --------- | --------------------------------------------------------- | ----------- |
| `jordan`  | Jordan Sample, 52                                         | `/accounts` |
| `casey`   | Casey Sample, 49 — Jordan's spouse                        | `/accounts` |
| `avery`   | Avery Sample, 17 — turns 18 on Nov 30, 2026               | `/accounts` |
| `riley`   | Riley Sample, 14                                          | `/accounts` |
| `advisor` | Bank representative (Alex Example, Senior Wealth Advisor) | `/advisor`  |

All four customers read one shared household (`src/data/household.ts`): ten
simple accounts (joint checking, savings, an IRA, a brokerage account, a credit
card, a life policy held outside PNC, Casey's savings and Roth IRA, and the
kids' custodial accounts). The session keeps the role (`pnc-session`) and the
person (`pnc-person`); `src/proxy.ts` keeps each role on its own pages.

Customer navigation: **Home · My Assets · Family · Help** on laptops, and
**Home · My Assets · Family · More** on phones (Pay & Transfer, Cards,
Rewards and Deposit live under More). **Next steps** appears for adults once
the bank records a death in the household.

## Accounts — `/accounts`

Each person sees their own dashboard: reminders, the accounts they own, the
accounts they manage for a child, and accounts shared with them through a
family (with what they're allowed to do).

**Reminders** (`src/lib/nudges.ts`) come from what's on file: write or finish
a will, add a beneficiary to each account that can take one, and update a
beneficiary who has died. Avery gets a heads-up about turning 18; Riley gets
none. The count also shows on **My Assets** in the navigation, where both are
resolved.

## Family — `/family`

A family is a group of people you trust with access to your finances. Anyone
18 or over can **create a family** and becomes its admin; a person can belong
to several families and switch between them. Jordan's _Sample Family_ is
seeded: Jordan and Casey are admins, Avery can see the joint checking account,
Riley sees nothing, and Dana (the estate attorney) is invited.

- **Share an account** you own with a family, or stop sharing it. Nobody sees
  a shared account until their role is given access.
- **Members**: add people from your household in one tap, or invite someone
  by email.
- **Roles & access**: per account, **Visibility** (balance, activity) and
  **Control** (transact, manage). The last admin can't be removed.
- **Access limits are confidential to admins.** Members only see what they
  can use; admins check it with **Preview as**.
- Families keep working after a death: the person shows as deceased.

## Wills and beneficiaries — on My Assets (`/assets`)

There's no separate Planning page; the old `/plan` URL redirects to My Assets.

- **Your will** (`/assets#will`): open it from the ⋮ menu on _What you own_
  (**Manage will**). An 8-step planner, pre-filled with your
  household, saved per person as you go. Adults only.
- **Beneficiaries** (`/assets#manage-<accountId>`): in each account's
  **Manage** panel, name or change who inherits it. Changes feed the reminders
  and, after a death, decide whether an account passes directly or through the
  estate.
- After a death, anyone the will names follows its execution on **Next steps**.

## Loss in the family

Nothing happens automatically. A death only exists once the bank records it.

1. **Advisor** (`advisor`): _Record a death notice_ (defaults to Jordan).
2. **Jordan's login** shows that the accounts are being settled.
3. **Casey** sees a soft condolence strip and a **Next steps** page
   (`src/lib/survivor.ts`), built from Jordan's accounts as they stand:
   - _Coming to you_: a guided flow for each account that passes to Casey (the
     joint account, the IRA, Riley's account as new custodian, and any
     account where Jordan had named Casey as beneficiary). The life policy is
     claimed with the insurer.
   - _Handled through the estate_: accounts with no beneficiary, and the
     credit card.
   - The death certificate is uploaded once and reused. _Send to PNC_ leaves a
     flow **In review**; nothing approves itself.
   - If Jordan's will is on file and names Casey, the executor can begin
     executing it from this page.
4. **Avery and Riley** get a gentle message and nothing to do.

State lives in the browser (`localStorage`). _Reset demo_ on the advisor home
clears the recorded deaths, flows, families, beneficiary changes and wills.

## Advisor assistant (simulated) — `/advisor/clients/[id]`

The advisor dashboard opens with **search** (clients or family members; press
`/`) and a **daily briefing** of who needs attention and why. Every client name,
search result and notification opens that client's page. It reads top to bottom,
with the **assistant docked on the right** (below the content on phones):

- **Next steps** (default) — _Where things stand_ (one headline, one paragraph,
  three figures), then _Do next_: a short ranked list decided by the settlement
  rulebook — people first, then what the rulebook needs you to confirm, then one
  step per account outcome, dated deadlines, hand-offs to the attorney or tax
  advisor, and sign-off. Each step has **Why?** (the agent explains the
  decisions and the law behind it) and **Done**. Everything else — how to talk to
  the client, each account's route, key dates, the household checklist, sign-off,
  the outreach draft, your answers and our assumptions — sits under _Details_,
  closed until you need it.
- **Client** — reference: profile, goals, notes, contact history, family and
  accounts. No advice here.
- **What if** — run the rulebook as if anyone in the household died today.
- **Findoe** (the assistant, docked on the right) — opens with what it worked
  out ("I walked 10 accounts through the rulebook…", with _Show how I decided_),
  then asks for the facts the rulebook can't know, with answer buttons (who owns
  the 529 now, whether a beneficiary is disabled, whether federal benefits were
  paid). Each answer is fed back into the decision tree, and Findoe says what
  changed. **Ask AI** on any next step asks Findoe for personalized help with
  it; free-text questions work too.

### Findoe and Claude Haiku 5.5

Findoe's replies come from **Claude Haiku 5.5** (`src/app/api/findoe/route.ts`),
grounded in the rulebook: the browser sends a client context built by
`src/lib/findoe/context.ts` (the plan, ranked steps, decision paths, dates,
citations, open questions, the client's notes and family), and the system prompt
forbids inventing any route, date, amount or citation. The model writes the
advice; the rulebook still makes every decision. Only signed-in advisors can call
the route, and the context is prompt-cached per client.

To switch it on, add your key to `.env.local` (git-ignored) and restart `npm run dev`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

On Vercel, set the same `ANTHROPIC_API_KEY` in the project's environment
variables. Without it, the route falls back to **Vercel AI Gateway**
(`anthropic/claude-haiku-5.5`): it uses `AI_GATEWAY_API_KEY` if set, otherwise
the deployment's own OIDC token, so a deployed project with AI Gateway credits
needs no key at all. Locally, `vercel env pull` fetches a short-lived OIDC token.

Without a key Findoe shows _Offline · answers from the rulebook only_ and falls
back to the simulated rules-based answers, so the demo still works.

The assistant is **simulated**: `src/lib/assistant.ts` is a rules engine over the
mock profiles in `src/data/clients.ts` (hand-written for Morgan Placeholder and
Avery Example; generated for everyone else so totals match the table). Every
assistant panel is labeled "Simulated". It handles deaths recorded at runtime,
including when the customer themself died (it then works with the next of kin).

## Settlement rules engine — Next steps and the assistant

A deterministic, cited rules engine answers, for any household and any person in
it: _when this person dies, what legally happens to each account, who gets it,
what has to be done by when, under which federal or Pennsylvania rule, and which
steps need a professional to sign off?_ It runs in two modes from the same
rulebook — **same protocols, run before the death instead of after**:

1. **After a death** — the plan behind _Next steps_: a route per account (each
   expands to the decision path, evidence and citations, and a plain-language
   line for the client), key dates counted from the date of death, a federal +
   Pennsylvania household checklist, questions the engine won't guess, a
   sign-off queue and the assumptions it made.
2. **What if** (tab) — pick a household member; the same engine runs on today's
   data and turns every bad outcome (probate, a designation naming someone who
   has died, no beneficiary, a minor named directly) into a finding with a fix.
   With no open loss, these fixes are the client's _Next steps_. The daily brief
   surfaces exposed households.

- **Decisions:** `src/lib/nextSteps.ts` turns the plan into ranked steps;
  `src/lib/agent.ts` is the assistant over it (briefing, _Why?_, what an answer
  changed). Answers and done steps live in `src/lib/settlement/casework.ts` (in
  the browser) and are fed back into `settlementPlan` as `answers`.

- **Rulebook data** lives in `src/data/settlement` (sources, actions, decision
  tree, overlays, household rules, Pennsylvania pack). Every rule cites a source;
  sources nobody has verified yet are marked and pinned by a test.
- **Engine** lives in `src/lib/settlement` — pure functions, no clock, no model.
  `src/lib/assistant.ts` writes the words; the engine supplies routes, dates and
  citations.
- Advisors see the rules that apply through each account's decision path and
  `SourceChip` citations; there is no standalone rulebook page.
- **Add a rule:** add a node / overlay / household rule with a source in
  `src/data/settlement`, then a test in `src/lib/settlement/__tests__`. `npm test`
  checks every branch is covered, every source exists, and the golden plans for
  Morgan, Avery and the Sample family.
- The only stored state is what the advisor tells us: sign-offs
  (`src/lib/settlement/reviews.ts`), answers and done steps
  (`src/lib/settlement/casework.ts`), all in the browser. _Reset demo_ on the
  advisor home clears them.

General guidance under federal and Pennsylvania rules as reviewed on Oct 26, 2026. Not legal or tax advice. The plan is in `docs/plans/settlement-rules-engine.md`.

## Structure

```
src/
  app/
    web/              internal: laptop view. page.tsx = sign-on
      (signed-in)/    customer pages (customer nav + footer)
      advisor/        advisor pages (advisor nav + footer)
    mobile/           internal: phone view. page.tsx = sign-on
      (tabs)/         customer screens (5-tab bar)
      advisor/        advisor screens (Home-only tab bar)
  proxy.ts            device detection -> rewrites public URLs into web/ or mobile/
  components/
    brand/            PncLogo, FacetBackdrop (the blue triangle pattern)
    advisor/          CustomerTable (web), CustomerList (mobile), NotificationList, Pagination
    family/           FamilyProvider (state + persistence), FamilyDashboard (tabs) and its
                      Overview / Members / Roles (RoleEditor, AccessMatrix) panels and
                      MemberFamilyView (what non-admins see)
    will/             WillTab (overview), WillPlanner + screens/, WillDocument (the will as a
                      sheet), WillExecution (begin + track execution), WillReminder
    mock/             MockBadge
    ui/               Money, IconChip, Toggle, CardArt (shared by both views)
    shared/           catalog.ts (Pay & Transfer options), CardLockRow
    web/              WebHeader, WebHero, WebCard, AccountRow, WebSignOnForm
    mobile/           PhoneFrame, MobileHeader, MobileCard rows, BottomTabBar, ...
  data/
    types.ts          data shapes
    mock.ts           customer mock data
    advisor.ts        advisor profile, assigned customers, loss events, notifications
    users.ts          demo sign-on User IDs and roles
    family.ts         family seed data + legal steps and timelines per succession method
    bereavement.ts    transfer flows, key/secondary asset groups, resources, outreach wording
    will.ts           will planner reference data (placeholder charities, institutions, states)
  lib/format.ts       money/date formatting, cn()
  lib/routes.ts       public URL map + toPublicPath()
  lib/session.ts      session cookie + role helpers (shared by proxy and actions)
  lib/auth.ts         signIn / signOff Server Actions
  lib/advisor.ts      attention sorting + notification building (+ bank-recorded losses)
  lib/bereavement.ts  bereavement demo store (recorded deaths, certificate, flow progress)
  lib/transfer.ts     derived step/flow completion for the transfer flows
  lib/family.ts       family access rules, succession rules and the state reducer
  lib/will/           planner flow + validation, will text generator, roles/estate steps, storage
```

See `AGENTS.md` for the conventions to follow when extending the app.
