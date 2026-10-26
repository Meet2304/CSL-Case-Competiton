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
  `src/data/mock.ts` (shapes in `src/data/types.ts`). Never hard-code figures in
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
- Before finishing: `npm run typecheck`, `npm run lint` and `npm run build` must pass
  (the same checks run in GitHub Actions CI on every PR — `.github/workflows/ci.yml`).
