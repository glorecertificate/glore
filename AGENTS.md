# `AGENTS.md`

GloRe Certificate, a multilingual e-learning platform that certifies the soft skills people gain through volunteering. Built with Next.js 16 (App Router, RSC, Cached Components), React 19, Neon Postgres, Drizzle ORM, and Tailwind CSS 4.

It is a real product by [Associazione Joint](https://associazionejoint.org), a Milan youth-mobility non-profit, and this repo is the new version of the live platform. Read the "Domain context" section in `.agents/specs/app.md` before product work.

Other stack picks an agent would otherwise guess wrong: Better Auth, Cloudflare R2 storage, Plate.js editor, next-intl, react-hook-form + zod, nuqs for URL state, React Email + Nodemailer, Vercel AI SDK with Google Gemini, motion, @dnd-kit, shadcn/ui (new-york), oxlint + oxfmt through `vite.config.ts`, portless for local HTTPS hosts.

> **Source of truth:** this file governs agent behavior in this repo (`CLAUDE.md` only imports it via `@AGENTS.md`). The user's machine-wide rules take precedence over it, and an explicit user instruction takes precedence over both. Detail belongs in `.agents/specs/`, linked from here.

> **Budget:** keep this file under 3,500 estimated tokens and each `.agents/specs/*.md` under 6,000. When an edit would exceed it, move detail into the most relevant spec and leave a one-line reference.

## Reference specs

Load the relevant file on demand before starting work in that area.

| File                            | Content                                                            | Read when                                   |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `.agents/specs/app.md`          | Canonical application spec: roles, features, flows, business rules | Understanding product requirements          |
| `.agents/specs/architecture.md` | Full src/ tree, file naming, server vs. client rules               | Navigating the codebase or adding new files |
| `.agents/specs/code.md`         | Formatter settings, import order, restricted imports, lint rules   | Writing or reviewing code style             |
| `.agents/specs/reference.md`    | Routing, auth flow, data fetching, transactions, cache, env vars   | Working on routing, auth, data, or config   |
| `.agents/specs/patterns.md`     | Components, types, hooks, utils, theming, forms, emails, snippets  | Authoring UI, hooks, utils, or templates    |

## Commands

> **MANDATORY:** always `pnpm run <script>`, never bare `pnpm <script>`, so nothing collides with a built-in pnpm command. Exceptions: `pnpm install`, and the README (which uses the bare shorthand for human readers on purpose).

| Command                 | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm run dev`          | Dev server at `https://glore.localhost` (portless, port 45673)    |
| `pnpm run dev:clean`    | Wipe `.next` then start the dev server (reclaims Turbopack disk)  |
| `pnpm run build`        | Production build                                                 |
| `pnpm run check`        | All `check:*` scripts in parallel (types, lint, format, knip)     |
| `pnpm run check:types`  | Type-check only (`tsgo --noEmit`)                                |
| `pnpm run check:lint`   | Lint check (`vp lint`)                                           |
| `pnpm run typegen`      | Generate route and public-file types into `types/`               |
| `pnpm run email`        | Preview email templates at `https://email.glore.localhost`       |
| `pnpm run db <command>` | drizzle-kit (`migrate`, `generate`, `studio`, ...)               |
| `pnpm run db:up`        | Start local Postgres in Docker on port 5433 (used by `next dev`) |
| `pnpm run db:reset`     | Wipe and recreate the local Postgres volume                      |
| `pnpm run skills`       | Install agent skills from `skills-lock.json`                     |

Remaining scripts (`start`, `analyze`, `release`, `deploy:preview`, `deploy:production`, `bump`, `db:down`, `db:logs`) are in `package.json`.

**Committing:** commit only when the current prompt asks for it. When it does, `pnpm run check` MUST exit 0 first, no exceptions, and one logical task is one commit (never split a task into partial commits). Conventional Commits with sentence-case subjects, header max 100, allowed scopes `release`, `deps`, `deps-dev`, `security`. Vite+ owns the hooks through `.vite-hooks`: `pre-commit` runs `vp staged`, `commit-msg` runs commitlint, `pre-push` runs commitlint then `pnpm run check`.

## Agent skills and MCP

Skills are installed into `.agents/skills/` from `skills-lock.json` (`pnpm run skills`) and are gitignored: the tree behaves like `node_modules` and is never committed. `.claude/skills` is a symlink to it, so `.agents/skills/` is the only path to read or edit.

**Installed:** `cloudflare`, `neon-drizzle`, `neon-postgres`, `react-email`, `shadcn`, `vercel-react-best-practices`, `web-design-guidelines`.

**MCP servers** (`.mcp.json`): `better-auth` (auth setup), `cloudflare` (R2 and Workers docs), `neon` (database ops), `shadcn` (component registry). Query them for live docs and operations.

Read and apply the matching skill before starting. Rows marked *(machine-wide)* are global skills invoked by name.

| Working on                       | Read / run                                                          |
| -------------------------------- | ------------------------------------------------------------------- |
| Any React or Next.js code        | `vercel-react-best-practices` (apply CRITICAL > HIGH > MEDIUM > LOW) |
| Next.js APIs and config          | `node_modules/next/dist/docs/` (version-exact, see `reference.md`)   |
| UI and visual review             | `vercel-react-best-practices` + `web-design-guidelines`              |
| Driving or verifying the real UI | `agent-browser` *(machine-wide)*                                     |
| shadcn/ui components             | `shadcn`                                                             |
| Database and schema              | `neon-drizzle` + `neon-postgres`                                     |
| Email (`src/emails/`)            | `react-email`                                                        |
| Cloudflare                       | `cloudflare`                                                         |
| Translations (`messages/`)       | `sync-i18n` *(machine-wide)*                                         |
| Docs (README, `.agents/`)        | `sync-docs`, or `sync-agents` for agentic files *(machine-wide)*     |

## Architecture

Full source tree, file naming, and server/client rules: `.agents/specs/architecture.md`.

**Top-level `src/`:** `actions/` (server actions), `app/` (App Router), `components/` (`features/`, `icons/`, `layout/`, `providers/`, `ui/`), `db/` (`schema/`, `queries/`, `mutations/`, `client.ts`), `emails/`, `hooks/`, `lib/`, `proxy.ts`, `i18n.ts`.

**Shared layers are domain-free (lint-enforced).** `ui/`, `icons/`, `hooks/`, `lib/` must NOT import from `@/components/features/**`, `@/app/**`, or `@/actions/**`. Dependencies flow shared > features > app, one way. Placement test: if you could ship it in a generic component library it belongs in `ui/`; the moment it knows the GloRe domain it belongs in `features/<domain>/`. `ui/rich-text-editor/` is the vendored Plate.js block (CLI-installed): treat it as one unit and never refactor its internals, since a registry re-pull overwrites them.

**Providers:** app-wide providers (i18n, search-params, session, theme) are flat single files in `src/components/providers/`. Feature-scoped contexts live in `src/components/features/<domain>/`. Split into `context.tsx` + `provider.tsx` + `index.ts` only when a server-side data fetch is needed.

## Internationalization

next-intl, locales `en` (default), `es`, `it`, title-case for `en` only. Config in `src/lib/i18n.ts` from `config/i18n.json`; request config in `src/i18n.ts`. Locale lives in the `NEXT_LOCALE` cookie (no path prefix); messages in `messages/{locale}.json`.

Top-level namespaces match feature domains (`Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`). `Components.<Name>` is reserved for generic primitives in `src/components/ui/`; i18n data uses `Intl.Countries.*` and `Intl.Languages.*`; email uses `Email.*`. Add a key to `messages/en.json` plus both translations in the same change, remove unused keys from all three files together, and read keys with `useTranslations()` (client) or `getTranslations()` (server).

## Conventions

Style detail and the full lint table are in `.agents/specs/code.md`. These shape first-pass output, so apply them everywhere you write code, legacy files included.

- **Guard clauses only.** `if/else`, `else if`, and `else` are forbidden.
- **No comments in new code.** The only exception is a `{/* Section */}` divider in long JSX. Never touch existing comments.
- **No JSX string literals.** All user-facing text goes through next-intl.
- **Functions:** `const` arrow functions only, named exports inline (`export const Foo = ...`). A default-exported component is defined first, then `export default Component`. Page and layout components use a direct anonymous default export.
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
4. `src/lib/utils.ts` keeps its own lint override because it re-exports `cnfast`; import `cn` from `@/lib/utils` everywhere else.

**Data and runtime**

5. The app uses `NextProxy` (`src/proxy.ts`), not Next.js `middleware.ts`.
6. Cached queries are inner `'use cache'` + `cacheTag` functions wrapping the DB call; the outer function takes `{ cache: boolean }` to bypass. `safeQuery()` returns `{ data, error }`: mutations throw, queries return error objects.
7. Multi-statement writes go through `transaction(fn)` from `@/db/client` (prod neon-http has no interactive transactions). Logic lives in `src/db/mutations/<domain>.ts` as `(tx, ...args) => ...` units, and statements inside a transaction run sequentially. See `reference.md`.
8. All course-tree primary keys are Postgres `integer` identity columns. Records created client-side get a placeholder id from `tempId()` in `src/lib/utils.ts` (negative, never `Date.now()`, which overflows `int4`), and `isTempId()` decides insert vs. update. Never send a placeholder id or a placeholder foreign key to the database: resolve the parent's real id from the insert result first.
9. Many DB text fields are `IntlRecord` (locale-keyed JSON); read them with `localize(record)` from `useI18n()`.
10. Org profile is split: sparse fields in `organization_profiles`, identity in `organizations`. Query parsers flatten profile fields.
11. `emailAndPassword.autoSignIn` is `false` and MUST stay false: `signUpEmail` only creates accounts for invitees. See `reference.md`.
12. Every env var used by Next.js MUST be in the Zod schema in `next.config.ts`, and `next.config.ts` MUST never import from `src/` (it would restart the dev server on every source edit). See `reference.md`.

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
