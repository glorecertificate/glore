# `AGENTS.md`

GloRe Certificate, a multilingual e-learning platform that certifies the soft skills people gain through volunteering.

A real product by [Associazione Joint](https://associazionejoint.org), a Milan youth-mobility non-profit. This repo is the new version of the live platform.

Read "Domain context" in `.agents/specs/app.md` before product work.

Stack: Next.js 16 (App Router, RSC, Cached Components), React 19, Neon Postgres, Drizzle ORM, Tailwind CSS 4.

Libraries to use, not guess: Better Auth, Cloudflare R2, Plate.js, next-intl, react-hook-form + zod, nuqs, React Email + Nodemailer, AI SDK with Gemini, motion, @dnd-kit, shadcn/ui (new-york).

This file governs agents here, and `CLAUDE.md` only imports it. Machine-wide user rules outrank it, and an explicit user instruction outranks both.

Budget: this file stays under 2,000 estimated tokens and each spec under 4,500. Over budget means moving detail into a spec, never dropping a fact.

## Specs and plans

Load only the spec you need from `.agents/specs/`:

- `app.md`: product, roles, features, domain rules.
- `certificates.md`: lifecycle, screens, PDF, verification.
- `organizations.md`: invitations, members, ownership, settings, applications.
- `admin.md`: admin area, moderation, impersonation.
- `routes.md`: routes, gates, API routes, proxy.
- `reference.md`: auth, queries, transactions, cache, env vars, storage, cron.
- `architecture.md`: `src/` tree, naming, layers, server vs client, events and email.
- `patterns.md`: components, types, hooks, utils, i18n, forms.
- `ui.md`: release UI kit, theming, motion.
- `code.md`: formatter, imports, lint rules, git hooks.
- `workflow.md`: commands, seeds, translations, commits, skills, worktrees, testing, dev performance.

Plans live in tracked `.agents/plans/`, one file or folder per effort. Read the matching plan before resuming planned work, write new plans there, and delete a plan once it ships.

References live in `.agents/references/`: the certificate PDF template and the per-role manual testing flows.

## Commands and commits

- Always run `pnpm run <script>`, never bare `pnpm <script>`. `pnpm install` is the exception. Full table: `workflow.md`.
- Tests: `pnpm run test` (Vitest), `pnpm run test:e2e` (Playwright, needs `pnpm run db:seed` once).
- Commit only when the current prompt asks. `pnpm run check` MUST exit 0 first, and one logical task is one commit.
- Commit headers are Conventional Commits with a lower-case subject, max 100 characters, scopes only `release`, `deps`, `deps-dev`, `security`.
- Never run `pnpm install` in a lane worktree, because its `node_modules` links to the main checkout (`workflow.md`, "Worktrees and lanes").

## Skills

- Before starting, read and apply the matching skill from the routing table in `workflow.md`. Any React or Next.js code needs `vercel-react-best-practices`.
- Vendored skills in `.agents/skills/` are tracked. Never hand-edit them.
- `pnpm run skills` pulls upstream default branches and can rewrite every tracked skill. Review its diff and `git restore` unintended updates.

## Architecture

- Dependencies flow shared > features > app. `ui/`, `icons/`, `hooks/`, `lib/` are domain-free and lint-blocked from `@/components/features/**`, `@/app/**`, `@/actions/**`.
- `ui/rich-text-editor/` is a vendored Plate.js block. Never refactor its internals, since a registry re-pull overwrites them.
- Reuse the release UI kit in `ui/` before adding primitives (`ui.md`).
- Locales are `en` (default), `es`, `it`. Add or remove a key in all three `messages/{locale}.json` catalogs in the same change.

## Conventions

Apply these on the first pass in every file, legacy included. Lint detail: `code.md`.

- Guard clauses only: `if/else`, `else if`, and `else` are forbidden.
- No comments in new code, except a `{/* Section */}` divider in long JSX. Never touch existing comments.
- No JSX string literals: user-facing text goes through `useTranslations()` or `getTranslations()`.
- Use `const` arrow functions with inline named exports. A default export is a named `const` first, then `export default Name`, because inline forms break HMR.
- Use `interface` over `type`, inline type imports, and `string[]` over `Array<string>`. Omit return types and inferrable annotations unless narrowing needs them.
- Use `any` only in `src/lib/types.ts`.
- Use `for..of`, `map`, `filter`, `reduce`, never `.forEach()`. Use `await`, never `.then()` chains, and `Promise.all()` for independent work.
- One component per file, `@/` and `~/` aliases, `cva` variants, `cn()` from `@/lib/utils`. Reuse existing utils, hooks, and components.
- Order hook dependency arrays alphabetically.
- Render icons through `LucideIcon` from `@/components/icons/lucide`. Add new icons to `icons/registry.ts`, never `lucide-react/dynamic`.

## Gotchas: data and imports

1. Never import `cookies` from `next/headers` (use `@/actions/cookies`), `cnfast` (use `@/lib/utils`), or `../**`.
2. `src/lib/auth.ts` imports tables from `@/db/schema/<table>`, never the barrel, because `proxy.ts` calls `getSession` on every request.
3. `db/queries/<table>.ts` parsers MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles.
4. A cached query wraps the DB call in an inner `'use cache'` + `cacheTag` function, and the outer takes `{ cache: boolean }`.
5. Multi-statement writes use `transaction(fn)` from `@/db/client` with `(tx, ...args)` units in `src/db/mutations/`, and statements inside run sequentially.
6. Client-created course-tree records use negative `tempId()` ids, never `Date.now()`. Resolve the real parent id before any DB write.
7. Read `IntlRecord` fields with `localize(record)` from `useI18n()`.

## Gotchas: runtime and domain

8. The app uses `NextProxy` (`src/proxy.ts`), not `middleware.ts`.
9. `emailAndPassword.autoSignIn` MUST stay `false`, or an invitee's session lands on the inviter's response.
10. Every env var MUST be in the Zod schema in `next.config.ts`, which MUST never import from `src/` (that restarts dev on every edit).
11. Never edit `types/*.generated.d.ts` or `drizzle/`. Regenerate with `pnpm run typegen`, `pnpm run db generate`, `pnpm run db migrate`.
12. Never add manual `useMemo` or `useCallback`: the React Compiler runs in builds.
13. Never revert the dev-performance flags in `workflow.md`, "Dev environment and performance".
14. Certificate state changes go through `certificateAction` and `commitTransition` in `@/actions/certificates/helpers` (`certificates.md`).
15. Invitations never create memberships. Accepting one does (`db/mutations/invitation.ts`). Never `signUpEmail` or insert a membership for an invitee.
16. Role changes, removals, leaving, and ownership transfers live in `db/mutations/organization.ts`. Org actions take an optional `organizationId` (`organizations.md`).
17. Call admin `auth.api.*` only from `actions/admin/*` after `requireAdmin` (`admin.md`).

## Verification

Run the rungs in order and report which ones ran:

1. `pnpm run check` exits 0.
2. `pnpm run test` for logic, with a failing test first for bug fixes. `pnpm run test:e2e` for auth, routing, and role flows.
3. Test email flows yourself with Mailpit, never handing them to the user (`workflow.md`).
4. Verify UI, layout, or animation in a real browser with `agent-browser` at `https://glore.localhost` as a seeded user. A typecheck is not visual verification.

When routes, actions, hooks, utils, env vars, components, providers, skills, commands, or structure change, update `AGENTS.md`, `README.md`, and specs in the same change.
