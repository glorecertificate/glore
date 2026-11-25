# `AGENTS.md`

GloRe Certificate, a multilingual e-learning platform that certifies the soft skills people gain through volunteering.

A real product by Associazione Joint, a Milan youth-mobility non-profit (`app.md`). This repo is the new version of the live platform.

Read "Domain context" in `.agents/specs/app.md` before product work.

Stack: Next.js 16 (App Router, RSC, Cached Components), React 19, Neon Postgres, Drizzle ORM, Tailwind CSS 4.

Libraries to use, not guess: `patterns.md`, "Libraries".

Machine-wide user rules outrank this file, and an explicit user instruction outranks both.

Budget: this file stays under 2,000 estimated tokens and each spec under 4,500. Over budget means moving detail into a spec, never dropping a fact.

## Specs and plans

Read only the specs whose rows apply (`.agents/specs/`).

| Work                                                      | Spec               |
| --------------------------------------------------------- | ------------------ |
| Product, roles, features, domain rules                    | `app.md`           |
| Certificate lifecycle, screens, PDF                       | `certificates.md`  |
| Invitations, members, ownership, settings, applications   | `organizations.md` |
| Admin area, moderation, impersonation                     | `admin.md`         |
| Courses, AI writing, content and interface translation    | `content.md`       |
| Routes, verification, gates, API routes, proxy            | `routes.md`        |
| Auth, sessions, cookies, sign-up guard, hardening         | `auth.md`          |
| Queries, transactions, cache, env vars, storage, cron     | `reference.md`     |
| `src/` tree, naming, layers, server/client                | `architecture.md`  |
| Activity events, notify, notifications, email templates   | `notifications.md` |
| Components, types, hooks, utils, i18n, forms              | `patterns.md`      |
| Release UI kit, shell, theming, motion                    | `ui.md`            |
| Formatter, imports, lint rules, git hooks, release age    | `code.md`          |
| Issues, PRs, labels, Claude workflows, CI, deploys        | `github.md`        |
| Commands, seeds, i18n, git, skills, MCP, lanes, tests, QA | `workflow.md`      |
| Performance targets, measurement, perf CI                 | `performance.md`   |

Work lives in GitHub issues. Plan files in `.agents/plans/` are gitignored: a draft PR body or a parent issue holds the shared plan (`github.md`).

References in `.agents/references/`: product decisions, product record, visual rules, certificate PDF, translations, manual test flows, release runbook.

## Commands and commits

- Always run `pnpm run <script>`, never bare `pnpm <script>`, except `pnpm install`. Table: `workflow.md`.
- Tests: `pnpm run test` (Vitest), `pnpm run test:e2e` (Playwright) for auth, routing, and role flows.
- Commit only when the current prompt asks. `pnpm run check` MUST exit 0 first.
- Commit headers are Conventional Commits with a lower-case subject, max 100 characters, scopes only `release`, `deps`, `deps-dev`, `security`.
- One PR is one logical task. It merges by squash, with its title as the commit header. Never create a merge commit (`workflow.md`, "Git history").
- Fix the blocking findings of the `Claude review` check (`github.md`).
- Never run `pnpm install` in a lane worktree (`workflow.md`, "Worktrees and lanes").

## Skills

- Before starting, apply the matching skill from the `workflow.md` routing table. Any React or Next.js code needs `vercel-react-best-practices`.
- Vendored skills in `.agents/skills/` are tracked. Never hand-edit them. After `pnpm run skills`, `git restore` unintended updates (`workflow.md`).

## Architecture

- Dependencies flow shared > features > app. `ui/`, `icons/`, `hooks/`, `lib/` stay domain-free (`architecture.md`).
- Never refactor the internals of `ui/rich-text-editor/`, a vendored Plate.js block (`architecture.md`).
- Reuse the `ui/` release kit before adding primitives (`ui.md`).
- Locales are `en` (default), `es`, `it`. Add or remove a key in all three `messages/{locale}.json` catalogs in the same change.

## UI quality bar

- The owner's UI bar is non-negotiable in every run: enterprise-grade, instant, themed, beautiful. Rules: `ui.md`, "Quality bar".
- A UI PR attaches before and after screenshots, and "looks the same" fails it.

## Conventions

Apply these on the first pass in every file, legacy included. Lint detail: `code.md`.

- Guard clauses only: `if/else`, `else if`, and `else` are forbidden.
- No comments in new code, except a `{/* Section */}` divider in long JSX. Never touch existing comments.
- No JSX string literals: user-facing text goes through `useTranslations()` or `getTranslations()`.
- Use `const` arrow functions with inline named exports. A default export is a named `const` first, then `export default Name`.
- Use `interface` over `type`, inline type imports, and `string[]` over `Array<string>`. Use `any` only in `src/lib/types.ts`. Omit return types and inferrable annotations.
- Use `for..of`, `map`, `filter`, `reduce`, never `.forEach()`. Use `await`, never `.then()` chains, and `Promise.all()` for independent work.
- One component per file, `@/` and `~/` aliases, `cva` variants, `cn()` from `@/lib/utils`. Reuse existing utils, hooks, and components.
- Order hook dependency arrays alphabetically.
- Render icons through `LucideIcon` from `@/components/icons/lucide` and add new ones to `icons/registry.ts`. Never import `lucide-react` elsewhere (`patterns.md`).

## Gotchas: data and imports

1. Never import `cookies` from `next/headers`, `cnfast`, or `../**` (`code.md`, "Restricted imports").
2. `src/lib/auth.ts` imports tables from `@/db/schema/<table>`, never the barrel (`auth.md`).
3. `db/queries/<table>.ts` parsers MUST stay pure and never import `@/db/client` (`architecture.md`).
4. A cached query is an inner `'use cache'` + `cacheTag` function under an outer `{ cache: boolean }` one (`reference.md`).
   Render-path loaders read the user through `getViewer()` (`actions/viewer.ts`), never `getAuthUser()`, `connection()`, or `Date.now()`, so the data joins the prefetch (`architecture.md`).
5. Multi-statement writes use `transaction(fn)` units in `src/db/mutations/`, run sequentially (`reference.md`).
6. Client-created course-tree records use negative `tempId()` ids that never reach the DB (`patterns.md`).
7. Read `IntlRecord` fields with `localize(record)` from `useI18n()`.

## Gotchas: runtime and domain

8. The app uses `NextProxy` (`src/proxy.ts`), not `middleware.ts`.
9. `emailAndPassword.autoSignIn` MUST stay `false` (`auth.md`, "Sign-up guard").
10. Every env var MUST be in the Zod schema in `next.config.ts`, which MUST never import from `src/` (`code.md`, "Config traps").
11. Never edit `types/*.generated.d.ts` or `drizzle/`. Regenerate with `pnpm run typegen` or `pnpm run db` (`workflow.md`).
12. Never add manual `useMemo` or `useCallback`: the React Compiler runs in builds.
13. Never revert the dev-performance flags in `workflow.md`, "Dev environment and performance".
14. Certificate state changes go through `certificateAction` and `commitTransition` (`certificates.md`).
15. Invitations never create memberships. Accepting one does (`organizations.md`, "Invitation rules").
16. Membership changes live in `db/mutations/organization.ts` (`organizations.md`).
17. Call admin `auth.api.*` only from `actions/admin/*` after `requireAdmin` (`admin.md`).
18. Controls keep their visible size on touch. Add a hit area with `touch-hit`, never a bigger control (`ui-components.md`, "Mobile and touch").

## Verification

Run the rungs in order and report which ones ran:

1. `pnpm run check` exits 0.
2. Prove a fix or a feature with a temporary test, then run the suites (`workflow.md`, "Testing").
3. Test email flows yourself with Mailpit, never handing them to the user (`workflow.md`).
4. Verify UI, layout, or animation in a real browser with `agent-browser` at `https://glore.localhost` as a seeded user. A typecheck is not visual verification.

Update `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, and specs in the same change as any structural change (triggers: `workflow.md`, "Docs sync").
