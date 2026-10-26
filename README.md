# PNC Concept Prototype — CSL Case Competition 2026

A Next.js + React base app that mirrors the PNC online banking site and mobile
app. It is the starting point for the competition solution (Client & Family
Experience + Advisor Workbench). **Every figure on screen is mock data.**

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # next typegen + tsc
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

| User ID    | Role                                                      | Lands on                                              | Navigation                                                             |
| ---------- | --------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `customer` | Customer (Jordan Sample; spouse Casey)                    | `/accounts` — the banking dashboard                   | Accounts, Pay & Transfer, Cards, Rewards, Help (web) / 5 tabs (mobile) |
| `advisor`  | Bank representative (Alex Example, Senior Wealth Advisor) | `/advisor` — Notifications + paginated Your Customers | Home only (for now)                                                    |

The role is stored in a demo session cookie by the `signIn` Server Action
(`src/lib/auth.ts`). `src/proxy.ts` then keeps each role on its own pages:
signed-out visitors only see sign-on, advisors only see `/advisor`, customers
never see `/advisor`. Sign off via the profile icon (web), the header button
(mobile advisor) or More → Sign Off (mobile customer).

**Loss of a family member.** Customers in `src/data/advisor.ts` carry
`lossEvents`. Any event with `followUpComplete: false` automatically creates
an urgent "Loss of a family member" notification with next steps and moves
that customer to the top of the advisor's table with a needs-attention icon
(`src/lib/advisor.ts`). Add a loss event to any customer to see it surface.

## Family dashboard (customer) — `/family`

Laptop: **Family** in the top nav. Phone: **More → Family Dashboard**. The
signed-in customer (Jordan) is an admin of the _Sample Family_.

- **Role-based access.** The built-in **Admin** role (more than one allowed)
  can add members, add assets and manage access. Admins create member roles
  (e.g. Adult child, Teen, Trusted advisor) in a segmented access editor:
  per asset, **Visibility** (view balance, view activity) and **Control**
  (transact, manage), plus a Full column. Any permission implies view balance.
  The last living admin can't be demoted or removed, and you can't remove your
  own admin access.
- **Access limits are confidential to admins.** A non-admin member only sees
  the assets shared with them and the actions they can take — nothing tells
  them an asset or action is hidden. Admins check this with **Preview as**
  (Overview tab), which renders that exact member view.
- **Assets** are grouped into 13 categories (Joint checking/savings, Real
  Estate, Brokerage account, 401(k) / IRA, Life insurance, Social Security,
  Pension, Employer benefits, Vehicles, Digital assets, Business interests,
  Debts, IP). _Add asset_ asks only for name, category, value, optional last 4
  and owners.
- The legal-process model (how each asset passes on death and its steps) is
  kept in `src/data/family.ts` / `src/lib/family.ts` but is not shown in the UI.
- Changes are saved in the browser (`localStorage`); **Reset demo** restores
  the seed data in `src/data/family.ts`.

### Will tab — `/family#will`

Every customer should have a will. The **Will** tab (deep link `/family#will`)
shows the will taking shape as a document, then opens an 8-step planner
(Basics → Nominees → Assets → Residuary → Gifts → Funeral → Provisions →
Review) that starts from the family on file and renders a draft will.
Until a will is on file, the Accounts dashboard shows a reminder.

- **Executing a will.** Once a will is on file, any family member it names as
  executor or beneficiary sees _"Jordan Sample named you in their will"_ with
  **Begin will execution** (try **Preview as → Casey Sample** on the Overview
  tab). That starts an estate checklist: the executor ticks off each step and
  everyone named follows along. Only the executor sees the testator's accounts.
- **Advisors** see each household's will status in the customer table, and the
  assistant (`willAdvice` / `willNotifications` in `src/lib/advisor.ts`)
  recommends a will by relationship value and household.
- No backend: the will, its status and any execution live in `localStorage`,
  so a will finished as `customer` shows as on file when you sign in as
  `advisor` in the same browser. **Start over** at the bottom of the planner
  clears it.

## Loss in the family — bank, advisor and surviving spouse

1. **Bank / advisor** (`advisor`): _Record a death notice_ on the advisor home
   (defaults to Casey Sample, Jordan's spouse). The household moves to the top
   with the attention icon, an urgent notification appears, and an outreach
   banner recommends a personal call with suggested first words.
2. **Customer** (`customer`, Jordan): a soft red strip appears under the
   navigation (above the tab bar on phones), Reminders shows _Action needed_,
   and a **Next steps** page (`/next-steps`) opens: a Today → Event timeline,
   _Key assets_ (joint account, life insurance, IRA) and _Secondary assets_,
   plus support resources and people.
3. **Transfer flows:** _Joint checking/savings_ and _401(k)/IRA_ are fully
   guided — each document is tagged _Upload_, _Filled in for you_ or _You fill
   in_; the death certificate is uploaded once and reused. Other assets have a
   placeholder flow. _Send to PNC_ → _In review_ → (demo) _simulate approval_.

State is kept in the browser (`src/lib/bereavement.ts`) so the demo works by
signing out of the advisor view and into the customer view in the same browser.
_Reset demo_ (advisor) clears it; _Reset demo progress_ (Next steps) keeps the
recorded death but clears the flows.

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
