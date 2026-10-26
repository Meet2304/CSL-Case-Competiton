<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions (PNC concept prototype)

This repo is a Next.js (App Router) + **React** + TypeScript + Tailwind v4 app. Do not
introduce Vue or other UI frameworks. Several agents work on it in parallel, each in
its own git worktree/branch — keep changes scoped and follow these rules so the web
and mobile views stay in one design language.

- **Mock data only.** Every name, balance and account number lives in
  `src/data/mock.ts` (customer), `src/data/advisor.ts` (advisor) or
  `src/data/users.ts` (demo logins); shapes are in `src/data/types.ts`. Never hard-code figures in
  components. Keep names obviously fake (e.g. "Jordan Sample", "Sample Grocer",
  account numbers x0001–x0099).
- **Label mock data.** Any section that shows figures gets a `MockBadge`.
- **Colors come from tokens** in `src/app/globals.css` (`bg-pnc-blue-700`,
  `text-pnc-link`, `text-pnc-orange`, `border-pnc-line`, ...). Add a token there
  rather than using a raw hex in a component.
- **Reuse the building blocks:** `FacetBackdrop` for blue headers, `WebHero` +
  `WebCard` on web pages, `MobileHeader` (with an overlapping first card as
  `children`) + `MobileCard`/`MobileIconRow`/`MobileLinkRow` on mobile pages,
  `Money` for every currency value, `IconChip` for round icon discs.
- **Icons:** `lucide-react` only.
- **One URL, two views, chosen by device.** `src/proxy.ts` rewrites every public URL
  (e.g. `/accounts`) to `app/web/...` for laptops/tablets or `app/mobile/...` for
  phones. Do not add buttons or links that switch views.
- **Links use public paths only** — import `routes` from `src/lib/routes.ts`; never
  link to `/web/...` or `/mobile/...`. Any UI that reads `usePathname()` must wrap
  it in `toPublicPath()` to avoid hydration mismatches.
- **New pages:** add the public path to `routes`, then create
  `src/app/web/(signed-in)/<path>/page.tsx` and/or `src/app/mobile/(tabs)/<path>/page.tsx`
  at the same relative path. If a page exists in only one view, add a fallback for
  the other view in `src/proxy.ts`. Top-level web pages get a nav entry in
  `WebHeader.tsx`; mobile headers pad their top with `var(--status-h)` (handled by
  `MobileHeader`).
- **Two roles: customer and advisor.** The sign-on User ID sets a role cookie
  (`src/lib/auth.ts`); `src/proxy.ts` keeps each role on its own pages.
  Customer pages live in `app/web/(signed-in)/` and `app/mobile/(tabs)/`; advisor
  pages live under `app/web/advisor/` and `app/mobile/advisor/` (public URL
  `/advisor/...`). Advisor-only nav items go in the `advisor` entries of
  `WebHeader.tsx` and `BottomTabBar.tsx`.
- **Sign off with `SignOffButton`** (a Server Action form), never a `<Link>` —
  link prefetching must never be able to end a session.
- **Advisor assistant is simulated.** Recommendations, the loss guide, Q&A and
  engagement plans come from rules in `src/lib/assistant.ts` over the profiles in
  `src/data/clients.ts` (keep each profile's PNC holdings summing to the
  customer's `relationshipValue`). Label assistant output with `AssistantMark` /
  `AssistantPanel` so it's never mistaken for account data.
- **Advisor attention logic** lives in `src/lib/advisor.ts`; drive UI from
  `openLoss` / `needsAttention` / `sortByAttention` / `buildNotifications` rather
  than re-implementing the rules in components.
- **Family dashboard rules live in `src/lib/family.ts`** (`effectiveAccess`,
  `isLocked`, `successorsFor`, `familyReducer`). Components read state through
  `useFamily()` and change it only via `dispatch` actions; add a reducer action
  rather than mutating state in a component. Seed data and per-method legal
  steps are in `src/data/family.ts`. The dashboard adapts with container queries
  (`@container` / `@2xl:`), so it works inside the phone frame as well.
- **Never reveal access limits to non-admins.** Member-facing UI (`MemberFamilyView`)
  renders only what the member can see and the actions they can take: no "view
  only" labels, disabled/locked controls, hidden-asset counts, or other members'
  roles. Explanations of limits belong only in admin UI.
- **Bereavement journey:** deaths recorded by the bank and the survivor's flow
  progress live in `src/lib/bereavement.ts` (`useBereavement`, `bereavementActions`).
  Flow content is data in `src/data/bereavement.ts`; completion is derived in
  `src/lib/transfer.ts` — don't store "done" flags. Customer-facing copy about a
  loss must stay gentle: condolence first, no pressure, nothing urgent today.
- **Formatting:** Prettier (`.prettierrc.json`, print width 100). Run `npm run format`
  before committing.
- **Settlement rules** live in `src/data/settlement` (rulebook data, every rule cites a source
  in `sources.ts`) and `src/lib/settlement` (pure engine). Never hard-code legal rules, dates or
  thresholds in components or in `assistant.ts` — add a node, overlay or household rule with a
  source and a test. Label engine output with `AssistantMark` and show `SourceChip`s. New
  sources without `verifiedOn` must be added to the pinned unverified list in
  `rulebook.test.ts` on purpose. `npm test` must pass.
- Before finishing: `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` must pass
  (the same checks run in GitHub Actions CI on every PR — `.github/workflows/ci.yml`).
