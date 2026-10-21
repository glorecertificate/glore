# Plan: client JS reduction and Partial Prefetching

Status: planned, not started (2026-10-21). Next 16.3.0. Gains are static estimates until step 0 measures them.

## 0. Measure first

1. Create a clean worktree: `git worktree add ../glore-perf HEAD`, then `pnpm install --frozen-lockfile` (pass the pnpm store dir).
2. Build with dummy env values that satisfy `envSchema` in `next.config.ts`, with `DATABASE_URL` on `localhost:5433`.
3. Run `pnpm exec next experimental-analyze --output` and keep `.next/diagnostics/analyze/data/routes.json`.
4. Run `next start -p 3100`, curl each route with the cookies from `.playwright/.auth/{admin,volunteer}.json`, and sum the gzipped `<script src>` chunks.
5. Save both outputs as `before/`.

Baseline (gzipped JS from HTML script chunks, measured 2026-10-20): /dashboard 373 KB, /courses 562, /settings 539, /organization 524, /admin/users 400, /certificates 365.

Acceptance: /courses at most 470 KB, /settings 460, /organization 450, /dashboard 355, /admin/users 385, /certificates 350. No route grows by more than 1%. `pnpm run check` and `pnpm run test:e2e` stay green.

## Part 1: JS size, ordered by gain and risk

| #   | Change                                                                                                                                                                                                  | Files                                                                                                                         | Est. gain                                    | Risk                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| 1   | Load `CourseDialog` with `next/dynamic` and mount it only when open. It pulls react-hook-form, zod, resolvers, radix select and tabs, and icon-picker.                                                  | `courses/course-dialog.tsx`, `course-list/card-actions.tsx`, `course-list/dialog.tsx`                                         | 35-50 KB on /courses                         | Low                                   |
| 2   | Load the `Sortable` grid (@dnd-kit) and `IconPicker` only when `user.canEdit`; learners get the plain `AnimatedList`.                                                                                   | `course-list/index.tsx`, `course-list/card.tsx`                                                                               | 15-25 KB for non-editors                     | Medium: check reordering              |
| 3   | Load inactive tab panels lazily: `AccountForm`, `OrganizationSettings`, `OrganizationJoinRequests`, `OrganizationMembers`. Also lazy-load `Calendar` inside the date picker popover and `ImageCropper`. | `users/user-settings.tsx`, `organization/panel.tsx`, `ui/date-picker.tsx`, `profile-form.tsx`, `organization/avatar-menu.tsx` | 40-60 KB each on /settings and /organization | Low                                   |
| 4   | Keep the cmd+K handler, but render the `SearchCommand` palette (cmdk) with `dynamic()` after the first open.                                                                                            | `layout/dashboard-sidebar.tsx`, `search-command.tsx`                                                                          | 6-12 KB on every dashboard page              | Low                                   |
| 5   | Wrap the motion provider in `LazyMotion` (async `domMax`) and switch to `m`.                                                                                                                            | `providers/motion.tsx`, `ui/tabs.tsx`, `ui/animated-list.tsx`, `auth/auth-flow.tsx`                                           | 20-30 KB                                     | Medium: check tab and list animations |
| 6   | Drop the server-only message namespaces (`Email`, `About`, `Metadata`) before `I18nProvider`.                                                                                                           | `app/layout.tsx`                                                                                                              | 3-4 KB gzipped HTML                          | Low                                   |

Already fine: lucide-react is in Next's default `optimizePackageImports`. Plate and `icons.json` are already dynamic. Keep `dynamic()` in client files, because a server-side dynamic import does not code-split.

After each step, re-run step 0 and diff `routes.json`. Then run `pnpm run check` and open the affected tab, dialog, or cmd+K palette with agent-browser.

## Part 2: Partial Prefetching

Flag: top-level `partialPrefetching: true` in `next.config.ts`. It needs `cacheComponents`, which is already on. Per-segment escape hatches: `export const prefetch = 'partial' | 'force-disabled'` and `instant = false`. Install the adoption skill first: `npx skills add vercel/next.js --skill next-partial-prefetching-adoption`.

Prefetched content is included only if it is behind `'use cache'` with a stale time of at least 5 minutes. Cookies and headers stay in the per-session shell. Anything uncached streams in after navigation.

1. Remove `prefetch` from the sidebar `<Link>`s (`dashboard-sidebar.tsx`). They trigger about 10 runtime server renders per page view.
2. Remove `prefetch` from the course card links (`course-list/card.tsx`), which causes one runtime render per card.
3. Add a render-only `getAuthUser` wrapper with `'use cache: private'` and `cacheLife({ stale: 300 })`. This matches the 5-minute Better Auth cookie cache. Keep the uncached `getAuthUser` for actions. Risk: Better Auth refreshing cookies inside the cache scope, so test login, logout, and ban.
4. Enable the flag. Load every dashboard route in `next dev` and clear the `instant-shell-url-data` insights.
5. Fix or opt out of the routes with little gain: `/courses/[slug]` (`generateMetadata` loads all the data), `/organization` (uncached panel query), and the auth routes.

Verify:

- The Next DevTools Navigation Inspector shows the sidebar and header in the shell.
- The number of `_rsc` prefetch requests per /dashboard load drops from about 10 to 0 runtime renders.
- Sidebar navigation shows no `loading.tsx` flash.
- Optional: an `@next/playwright` `instant()` test, which adds a devDependency.
