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
```

## Routes — one URL, view chosen by device

There is no view switcher. `src/proxy.ts` reads the user-agent: **phones get the
mobile app, laptops/desktops/tablets get online banking**, on the same URL.

| URL | Laptop / desktop (`app/web`) | Phone (`app/mobile`) |
| --- | --- | --- |
| `/` | Sign-on | Sign-on (Image 1) |
| `/accounts` | Accounts dashboard (Image 7) | Home / Virtual Wallet (Image 2) |
| `/pay-transfer` | Pay & Transfer + payment history | Pay & Transfer list (Image 3) |
| `/rewards` | TotalRewards | TotalRewards (Images 4–5) |
| `/cards` | All cards with controls | → redirects to `/more` |
| `/cards/[cardId]` | → redirects to `/cards` | Card Details (Image 6) |
| `/deposit`, `/more` | → redirect to `/accounts` | Mobile Deposit, More |
| `/help` | Help | → redirects to `/more` |

To test the phone view on a laptop, use Chrome DevTools device mode (it sends a
phone user-agent) and reload. For demos/recordings you can also pin a view with
`?view=mobile` or `?view=web` on any URL (stored in a cookie; `?view=auto` clears
it). A pinned mobile view on a wide screen is shown inside an iPhone frame.

## Roles — customer vs. advisor

Sign-on decides the experience. Demo User IDs (any password; defined in
`src/data/users.ts`):

| User ID | Role | Lands on | Navigation |
| --- | --- | --- | --- |
| `customer` | Customer (Jordan Sample; spouse Casey) | `/accounts` — the banking dashboard | Accounts, Pay & Transfer, Cards, Rewards, Help (web) / 5 tabs (mobile) |
| `advisor` | Bank representative (Alex Example, Senior Wealth Advisor) | `/advisor` — Notifications + paginated Your Customers | Home only (for now) |

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
  lib/format.ts       money/date formatting, cn()
  lib/routes.ts       public URL map + toPublicPath()
  lib/session.ts      session cookie + role helpers (shared by proxy and actions)
  lib/auth.ts         signIn / signOff Server Actions
  lib/advisor.ts      attention sorting + notification building
```

See `AGENTS.md` for the conventions to follow when extending the app.
