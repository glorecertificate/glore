# `AGENTS.md`

GloRe Certificate, a multilingual e-learning platform that certifies the soft skills people gain through volunteering. Next.js 16 (App Router, RSC, Cached Components), React 19, Neon Postgres, Drizzle ORM, Tailwind CSS 4.

A real product by [Associazione Joint](https://associazionejoint.org), a Milan youth-mobility non-profit; this repo is the new version of the live platform. Read "Domain context" in `.agents/specs/app.md` before product work.

Stack picks an agent would otherwise guess wrong: Better Auth, Cloudflare R2, Plate.js editor, next-intl, react-hook-form + zod, nuqs for URL state, React Email + Nodemailer, Vercel AI SDK with Google Gemini, motion, @dnd-kit, shadcn/ui (new-york), standalone oxlint + oxfmt (`.oxlintrc.json`, `.oxfmtrc.json`, both auto-discovered), portless for local HTTPS hosts.

> **Source of truth:** this file governs agent behavior here; `CLAUDE.md` only imports it. Machine-wide user rules outrank it, and an explicit user instruction outranks both.

> **Budget:** this file loads on every session, so keep it under 3,200 estimated tokens and each `.agents/specs/*.md` under 4,500. Over budget means moving detail into the most relevant spec, never dropping a fact. Inventories the code already enumerates (hook lists, env var tables, cache tags) belong in the code with a pointer here, not copied.

## Reference specs

In `.agents/specs/`. Load the one you need, not the set.

| File              | Read when                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| `app.md`          | Product requirements: domain, roles, features, certificate lifecycle, rules   |
| `architecture.md` | Navigating `src/`, adding files, naming, layer boundaries, server vs client   |
| `code.md`         | Formatter, import order, restricted imports, lint rules                       |
| `reference.md`    | Routes, auth, queries, transactions, cache, env vars, dev performance         |
| `patterns.md`     | Authoring components, types, hooks, utils, theming, forms, emails             |

## Commands

> **MANDATORY:** always `pnpm run <script>`, never bare `pnpm <script>`, so nothing collides with a built-in pnpm command. Exceptions: `pnpm install`, and the README's bare shorthand for human readers.

| Command                 | Description                                                              |
| ----------------------- | -------------------------------------------------------------------------- |
| `pnpm run dev`          | Dev server at `https://glore.localhost` (portless, port 45673)            |
| `pnpm run dev:clean`    | Wipe `.next`, then start dev (reclaims Turbopack disk)                    |
| `pnpm run check`        | Parallel `check:types` (tsc), `check:lint` (oxlint), `check:format` (oxfmt), `check:knip` |
| `pnpm run build`        | Production build                                                          |
| `pnpm run typegen`      | Generate route and public-file types into `types/`                        |
| `pnpm run db <command>` | drizzle-kit (`migrate`, `generate`, `studio`, ...)                        |
| `pnpm run db:up`        | Local Postgres in Docker on port 5433 (used by `next dev`)                |
| `pnpm run db:reset`     | Wipe and recreate the local Postgres volume                               |
| `pnpm run email`        | Preview email templates at `https://email.glore.localhost`                |
| `pnpm run skills`       | Install agent skills from `skills-lock.json`                              |

Remaining scripts (`start`, `analyze`, `release`, `deploy:preview`, `deploy:production`, `bump`, `db:down`, `db:logs`) are in `package.json`.

**Committing:** only when the current prompt asks for it. `pnpm run check` MUST exit 0 first, no exceptions, and one logical task is one commit (never split a task into partial commits). Conventional Commits with sentence-case subjects, header max 100, allowed scopes `release`, `deps`, `deps-dev`, `security`. Hook mechanics: `code.md`.

## Skills and MCP

Skills install into gitignored `.agents/skills/` (`pnpm run skills`), which behaves like `node_modules`; `.claude/skills` symlinks to it, so `.agents/skills/` is the only path to read or edit. Installed: `cloudflare`, `neon-drizzle`, `neon-postgres`, `react-email`, `shadcn`, `vercel-react-best-practices`, `web-design-guidelines`. MCP servers in `.mcp.json`: `better-auth`, `cloudflare` (R2 and Workers docs), `neon` (database ops), `shadcn` (component registry).

Read and apply the matching skill before starting. `*` marks machine-wide skills invoked by name.

| Working on                       | Read / run                                                          |
| -------------------------------- | ------------------------------------------------------------------- |
| Any React or Next.js code        | `vercel-react-best-practices` (apply CRITICAL > HIGH > MEDIUM > LOW) |
| Next.js APIs and config          | `node_modules/next/dist/docs/` (version-exact, see `reference.md`)   |
| UI and visual review             | `vercel-react-best-practices` + `web-design-guidelines`              |
| Driving or verifying the real UI | `agent-browser`*                                                     |
| shadcn/ui components             | `shadcn`                                                             |
| Database and schema              | `neon-drizzle` + `neon-postgres`                                     |
| Email (`src/emails/`)            | `react-email`                                                        |
| Cloudflare                       | `cloudflare`                                                         |
| Translations (`messages/`)       | `sync-i18n`*                                                         |
| Docs (README, `.agents/`)        | `sync-docs`, or `sync-agents` for agentic files*                     |

## Architecture

`src/`: `actions/` (server actions), `app/` (App Router), `components/` (`features/`, `icons/`, `layout/`, `providers/`, `ui/`), `db/` (`schema/`, `queries/`, `mutations/`, `client.ts`), `emails/`, `hooks/`, `lib/`, `proxy.ts`, `i18n.ts`.

Dependencies flow one way, shared > features > app. The shared layers (`ui/`, `icons/`, `hooks/`, `lib/`) are domain-free and lint-blocked from importing `@/components/features/**`, `@/app/**`, or `@/actions/**`. `ui/rich-text-editor/` is a vendored Plate.js block: treat the subtree as one unit and never refactor its internals, since a registry re-pull overwrites them. Full tree, naming, placement test, provider layout, and server/client rules: `architecture.md`.

## Internationalization

next-intl. Locales `en` (default), `es`, `it`, title-case for `en` only. Locale lives in the `NEXT_LOCALE` cookie (no path prefix); messages in `messages/{locale}.json`. Read keys with `useTranslations()` (client) or `getTranslations()` (server), and add or remove a key in all three catalogs in the same change. Namespace scheme and config files: `patterns.md`.

## Conventions

Full style detail and the lint table are in `code.md`. These shape first-pass output, so apply them everywhere you write code, legacy files included.

- **Guard clauses only.** `if/else`, `else if`, and `else` are forbidden.
- **No comments in new code.** The only exception is a `{/* Section */}` divider in long JSX. Never touch existing comments.
- **No JSX string literals.** All user-facing text goes through next-intl.
- **Functions:** `const` arrow functions only, named exports inline (`export const Foo = ...`). A default-exported component is defined first, then `export default Component`. Pages and layouts use a direct anonymous default export.
- **Types:** `interface` over `type` for object shapes, inline type imports (`import { type Foo }`), `string[]` over `Array<string>`. Omit return types and inferrable annotations unless narrowing needs them. `any` is allowed only in `src/lib/types.ts`.
- **Iteration and promises:** `for..of`, `map`, `filter`, `reduce`, never `.forEach()`. `await`, never `.then()`/`.catch()` chains. `Promise.all()` for independent parallel work.
- **Modules:** one component per file, `@/` and `~/` aliases (`../**` is blocked), shadcn/ui new-york with `cva` variants and `cn()` from `@/lib/utils`. Reuse existing utils, hooks, and components before adding new ones.
- **Other:** hook dependency arrays alphabetically ordered. Import icon TYPES from `lucide-react` but render them through `LucideIcon` from `@/components/icons/lucide`.

## Gotchas

Non-obvious rules that break a change if missed. Domain rules are in `app.md`; runtime and dev-performance detail in `reference.md`.

**Imports and modules**

1. Never import `cookies` from `next/headers`. Use `@/actions/cookies`.
2. `src/lib/auth.ts` imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files, never the `@/db/schema` barrel, because `proxy.ts` calls `getSession` on every request.
3. `db/queries/<table>.ts` parsers MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles.
4. Import `cn` from `@/lib/utils`, never `cnfast` directly. `src/lib/utils.ts` holds its own lint override because it is the re-export source.

**Data and runtime**

5. The app uses `NextProxy` (`src/proxy.ts`), not Next.js `middleware.ts`.
6. Cached queries are inner `'use cache'` + `cacheTag` functions wrapping the DB call; the outer function takes `{ cache: boolean }` to bypass. `safeQuery()` returns `{ data, error }`: mutations throw, queries return error objects.
7. Multi-statement writes go through `transaction(fn)` from `@/db/client` (prod neon-http has no interactive transactions). Logic lives in `src/db/mutations/<domain>.ts` as `(tx, ...args) => ...` units, and statements inside a transaction MUST run sequentially.
8. All course-tree primary keys are Postgres `integer` identity columns. Records created client-side get a placeholder id from `tempId()` in `src/lib/utils.ts` (negative, never `Date.now()`, which overflows `int4`), and `isTempId()` decides insert vs. update. Never send a placeholder id or a placeholder foreign key to the database: resolve the parent's real id from the insert result first.
9. Many DB text fields are `IntlRecord` (locale-keyed JSON); read them with `localize(record)` from `useI18n()`.
10. Org data is split: identity in `organizations`, sparse fields in `organization_profiles`. Query parsers flatten the profile fields.
11. `emailAndPassword.autoSignIn` is `false` and MUST stay false: `signUpEmail` only ever creates accounts for invitees, so auto sign-in would write their session onto the inviter's response.
12. Every env var used by the app MUST be in the Zod schema in `next.config.ts`, and `next.config.ts` MUST never import from `src/` (it would restart the dev server on every source edit).

**Generated files and config**

13. Never edit generated files: `types/*.generated.d.ts` and everything under `drizzle/`. Regenerate with `pnpm run typegen`, `pnpm run db generate`, `pnpm run db migrate`.
14. New `drizzle/*.sql` migrations need `git add -f`: a global gitignore rule for `*.sql` silently skips them.
15. `cacheComponents: true` and the React Compiler (builds only, off in dev) are set in `next.config.ts`. Do not add manual `useMemo`/`useCallback`.
16. Dev-performance flags that MUST NOT be reverted (Turbopack dev cache off, prebuilt CI deploys, dual DB driver on port 5433, oxlint typeAware split, minimal editor save chain): full list and rationale in `reference.md`, "Dev environment and performance".

## Verification

Machine-checkable rungs first, in order, and report which ones actually ran:

1. `pnpm run check` exits 0.
2. Tests for logic changes, writing the failing test first for bug fixes.
3. UI, layout, or animation work is verified in a real browser with the `agent-browser` skill against the running dev server (`https://glore.localhost`). A passing typecheck is not visual verification.

Keep `AGENTS.md` and `README.md` in sync with the code in the same change, no confirmation needed, whenever routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or structure change. Edit `AGENTS.md` directly and never `CLAUDE.md`; push detail into `.agents/specs/` to stay inside the budget.
