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

## Structure

```
src/
  app/
    web/              internal: laptop view. page.tsx = sign-on; (signed-in)/ adds nav + footer
    mobile/           internal: phone view. page.tsx = sign-on; (tabs)/ adds bottom tab bar
  proxy.ts            device detection -> rewrites public URLs into web/ or mobile/
  components/
    brand/            PncLogo, FacetBackdrop (the blue triangle pattern)
    mock/             MockBadge
    ui/               Money, IconChip, Toggle, CardArt (shared by both views)
    shared/           catalog.ts (Pay & Transfer options), CardLockRow
    web/              WebHeader, WebHero, WebCard, AccountRow, WebSignOnForm
    mobile/           PhoneFrame, MobileHeader, MobileCard rows, BottomTabBar, ...
  data/
    types.ts          data shapes
    mock.ts           ALL mock data (single source)
  lib/format.ts       money/date formatting, cn()
  lib/routes.ts       public URL map + toPublicPath()
```

See `AGENTS.md` for the conventions to follow when extending the app.
