# `AGENTS.md`

GloRe Certificate, multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

It is a real product by [Associazione Joint](https://associazionejoint.org) (a Milan youth-mobility non-profit) that certifies the soft skills people gain through volunteering. This repo is the new version of the live platform. For the domain background that motivates the data model and flows, read the "Domain context" section in `.agents/specs/app.md` before product work.

> **Source of truth & updates:** This file is the single source of truth for AI agent instructions (`CLAUDE.md` redirects here via `@AGENTS.md`). Every agent MUST follow these rules and MUST update this file in the same change as any structural/architectural change (see [Auto Updates](#auto-updates)). Push detail into `.agents/specs/` and link here.

> **Line cap:** `AGENTS.md` and each `.agents/specs/*.md` file MUST stay under 300 lines. When an edit would exceed it, move detail to the most relevant spec and leave a one-line reference.

---

## Reference Specs

Detailed reference material lives in `.agents/specs/`. Load the relevant file on demand before starting work in that area.

| File                            | Content                                                              | Read when                                   |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| `.agents/specs/app.md`          | Canonical application spec: roles, features, flows, business rules   | Understanding product requirements          |
| `.agents/specs/architecture.md` | Full src/ tree, file naming, server vs. client rules                 | Navigating the codebase or adding new files |
| `.agents/specs/code.md`         | Formatter settings, import order, restricted imports, lint rules     | Writing or reviewing code style             |
| `.agents/specs/reference.md`    | Routing, auth flow, data fetching, transactions, cache, env vars     | Working on routing, auth, data, or config   |
| `.agents/specs/patterns.md`     | Components, types, hooks, utils, theming, forms, emails, snippets    | Authoring UI, hooks, utils, or templates    |

---

<!-- BEGIN:nextjs-agent-rules -->

## Next.js Docs

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated.

<!-- END:nextjs-agent-rules -->

---

## Commands

| Command                      | Description                                                             |
| -------------------------    | ----------------------------------------------------------------------- |
| `pnpm install`               | Install dependencies                                                    |
| `pnpm run dev`               | Start the Next.js dev server at `https://glore.localhost` (portless)     |
| `pnpm run dev:clean`         | Wipe `.next` then start the dev server (reclaims Turbopack disk)        |
| `pnpm run build`             | Production build                                                        |
| `pnpm run start`             | Start the production server via portless                                |
| `pnpm run email`             | Preview email templates at `https://email.glore.localhost`              |
| `pnpm run check`             | Run all `check:*` scripts in parallel                                   |
| `pnpm run check:types`       | Type-check only (`tsgo --noEmit`)                                       |
| `pnpm run check:lint`        | Lint check (`vp lint`)                                                  |
| `pnpm run check:format`      | Format check (`vp format --check`)                                      |
| `pnpm run check:knip`        | Unused files, exports, and dependencies (knip)                          |
| `pnpm run typegen`           | Generate route + public-file types into `types/`                        |
| `pnpm run analyze`           | Next.js bundle analyzer                                                 |
| `pnpm run release`           | Create a release (release-it)                                           |
| `pnpm run deploy:preview`    | Deploy preview to Vercel                                                |
| `pnpm run deploy:production` | Deploy to production on Vercel                                          |
| `pnpm run bump`              | Update pnpm and upgrade all dependencies                                |
| `pnpm run skills`            | Install agent skills from `skills-lock.json`                            |
| `pnpm run db <command>`      | Run drizzle-kit (`migrate`, `generate`, `studio`, ...)                  |
| `pnpm run db:up`             | Start local Postgres in Docker (used by `next dev`)                     |
| `pnpm run db:down`           | Stop local Postgres                                                     |
| `pnpm run db:logs`           | Tail local Postgres logs                                                |
| `pnpm run db:reset`          | Wipe and recreate the local Postgres volume                             |

**Pre-commit validation:** Run `pnpm run check` before committing. **`pnpm run check` MUST exit with code 0 before any commit is made. No exceptions.**

**Git hooks:** Vite+ manages hooks via `.vite-hooks` (set up by `vp config`). `pre-commit` runs `vp staged`. `commit-msg` runs commitlint (skipping `#`-comment messages). `pre-push` runs commitlint then `pnpm run check`. Commitlint extends `config-conventional` (sentence-case subjects, header max 100). Allowed scopes: `release`, `deps`, `deps-dev`, `security`.

> **MANDATORY:** Agents always use `pnpm run <script>` (never bare `pnpm <script>`), to avoid conflicts with built-in pnpm commands. Exceptions: `pnpm install`, and the README (which uses the bare `pnpm <script>` shorthand for human readers on purpose).

**Commit discipline:** Make one commit per logical task or feature. Never split a single task into partial commits.

---

## Stack

| Category         | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Framework        | Next.js (App Router, RSC, Cached Components)          |
| Language         | TypeScript (strict mode)                              |
| Runtime          | React (with React Compiler enabled)                   |
| Package manager  | pnpm                                                  |
| Database         | Neon Serverless Postgres (`@neondatabase/serverless`) in prod; local Postgres (`pg`) in dev |
| ORM              | Drizzle ORM + drizzle-kit                             |
| Auth             | Better Auth (`better-auth`)                           |
| Storage          | Cloudflare R2 (`@aws-sdk/client-s3`)                  |
| Linter/Formatter | oxlint + oxfmt (via `vite.config.ts`)                 |
| Styling          | Tailwind CSS 4                                        |
| UI Components    | shadcn/ui (new-york style)                            |
| Rich text editor | Plate.js                                              |
| i18n             | next-intl                                             |
| Forms            | react-hook-form + zod                                 |
| State            | nuqs (URL state)                                      |
| Email            | Nodemailer (SMTP) + React Email                       |
| AI               | Vercel AI SDK + Google Gemini (`@ai-sdk/google`)      |
| Animation        | motion                                                |
| DnD              | @dnd-kit                                              |
| Icons            | lucide-react                                          |
| Deployment       | Vercel                                                |
| Agent Skills     | skills CLI (https://agentskills.io)                   |

---

## Agent Skills

Skills live in `.agents/skills/`. They are tracked in `skills-lock.json`, installed with `pnpm run skills`, and gitignored (the whole `.agents/skills/` tree behaves like `node_modules`, never committed).

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. `.claude/` is a symlink to `.agents/`, so `.claude/skills` resolves to the same place. Always use `.agents/skills/` as the canonical path.

**Installed** (in `skills-lock.json`): `cloudflare`, `neon-drizzle`, `neon-postgres`, `react-email`, `shadcn`, `vercel-react-best-practices`, `web-design-guidelines`.

**MCP servers** (`.mcp.json`): `better-auth` (auth setup), `cloudflare` (R2/Workers docs), `neon` (database ops), `shadcn` (component registry). They auto-connect for compatible agents; query them for live docs and operations.

Read and apply the matching skill(s) before starting work. Project skills are under `.agents/skills/`; rows marked *(machine-wide)* are global skills invoked by name.

| Working on                       | Read / run                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- |
| Any UI                           | `frontend-design` *(machine-wide)* + `vercel-react-best-practices`; shadcn/ui new-york |
| Any React/Next.js code           | `vercel-react-best-practices` (apply by priority CRITICAL > HIGH > MEDIUM > LOW) |
| Database / schema                | `neon-drizzle` + `neon-postgres`                                            |
| shadcn/ui components             | `shadcn`                                                                     |
| UI review                        | `web-design-guidelines` (fetch latest, output terse `file:line`)            |
| Email (`src/emails/`)            | `react-email`                                                               |
| Cloudflare                       | `cloudflare`                                                                |
| Translation audits (`messages/`) | `i18n-audit` *(machine-wide)*                                               |
| Docs (AGENTS.md, `.agents/`, README) | `sync-docs` *(machine-wide)*, `/sync-docs [focus]`                      |
| Creating/optimizing skills       | `skill-creator` *(machine-wide)*                                            |

---

## Architecture

Full source tree, file naming, and server/client rules: see `.agents/specs/architecture.md`.

**Top-level `src/` layout:** `actions/` (server actions), `app/` (App Router), `components/` (`features/` incl. `features/auth/`, `icons/`, `layout/`, `providers/`, `ui/`), `db/` (`schema/`, `queries/`, `mutations/`, `client.ts`), `emails/` (React Email), `hooks/`, `lib/` (shared utils, types, constants), `proxy.ts`, `i18n.ts`.

**Shared layers are domain-free (lint-enforced).** `ui/`, `icons/`, `hooks/`, `lib/` must NOT import from `@/components/features/**`, `@/app/**`, or `@/actions/**` (dependencies flow shared -> features -> app, one way). A domain-coupled component (a select bound to the data model, a feature widget) lives in `features/<domain>/`, never in `ui/`. Test: if you could ship it in a generic component library, it belongs in `ui/`; the moment it knows the GloRe domain, it belongs in `features/`. `ui/rich-text-editor/` is the vendored Plate.js block (CLI-installed, domain-free): treat it as one unit, do not refactor its internals (a registry re-pull overwrites them).

**Context/provider placement:** global, app-wide providers (i18n, search-params, session, theme) live in `src/components/providers/` as flat single files. Feature-scoped contexts (e.g. courses) live in `src/components/features/<domain>/`. Split a provider into `context.tsx` + `provider.tsx` + `index.ts` only when it needs a server-side data fetch; otherwise keep it a single file.

---

## Code Style

Formatter (oxfmt): single quotes, no semicolons, `es5` trailing commas, avoid arrow parens, Tailwind class sorting. Authoring conventions are in "Coding Patterns" below; full formatter + import-order + lint-rule detail in `.agents/specs/code.md`.

---

## Internationalization

**Library:** next-intl ^4.13.0 | **Locales:** `en` (default), `es`, `it` | **Title-case:** `en` only

**Configuration:** `src/lib/i18n.ts` reads from `config/i18n.json`. Request config in `src/i18n.ts`.

**Locale storage:** Cookie named `NEXT_LOCALE` (no prefix). Message files: `messages/{locale}.json`.

**Namespace conventions:** Top-level namespaces match feature/domain names (`Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`); feature components use their feature's namespace. `Components.<Name>` is only for generic reusable UI primitives in `src/components/ui/` (e.g. `DatePicker`, `PasswordInput`). i18n data: `Intl.Countries.*`, `Intl.Languages.*`. Email: `Email.*`.

**Adding translations:** Add key to `messages/en.json`, add translations to `es.json` and `it.json`. Use `useTranslations('Namespace')` in client or `getTranslations('Namespace')` in server components.

---

## Gotchas & Critical Behaviors

Non-obvious rules that break a change if missed. Domain rules are in `app.md`; runtime/data and dev-perf detail in `reference.md`.

**Imports & modules**

1. Never import `cookies` from `next/headers`. Use `@/actions/cookies`.
2. `../**` parent imports are blocked; use `@/` or `~/` aliases.
3. Shared layers (`ui/`, `icons/`, `hooks/`, `lib/`) cannot import from `@/components/features/**`, `@/app/**`, or `@/actions/**` (lint-enforced via scoped `no-restricted-imports` overrides in `vite.config.ts`). Keeps the shared layer domain-free; dependencies flow shared -> features -> app. `src/lib/utils.ts` keeps its own override (it re-exports `cnfast`).
4. `src/lib/auth.ts` imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files, never the `@/db/schema` barrel (`proxy.ts` calls `getSession` per request).
5. `db/queries/<table>.ts` parsers MUST stay pure: importing `@/db/client` there leaks `server-only` into client bundles.

**Code rules (also lint-enforced)**

6. `any` is allowed only in `src/lib/types.ts`; use typed aliases elsewhere.
7. No `.forEach()`: use `for..of`, `map`, `reduce`.
8. No JSX string literals: all user-facing text goes through next-intl.
9. No comments in new code. Exception: `{/* Section */}` dividers in long JSX. Never touch existing comments.
10. Page/layout components use a direct anonymous default export, never a named variable first.
11. Import icon TYPES from `lucide-react`, render via `LucideIcon` from `@/components/icons/lucide`.
12. After translation changes, remove unused keys from all three `messages/*.json` files together.

**Data & runtime**

13. The app uses `NextProxy` (`src/proxy.ts`), not Next.js `middleware.ts`.
14. Cached queries are inner `'use cache'` + `cacheTag` functions wrapping the DB call; the outer fn takes `{ cache: boolean }` to bypass. `safeQuery()` returns `{ data, error }`; mutations throw, queries return error objects.
15. Multi-statement writes go through `transaction(fn)` from `@/db/client` (prod neon-http has no interactive transactions). Logic lives in `src/db/mutations/<domain>.ts` as `(tx, ...args) => ...` units; statements run sequentially inside a tx. See `reference.md`.
16. Many DB text fields are `IntlRecord` (locale-keyed JSON); read with `localize(record)` from `useI18n()`.
17. Org profile is split: sparse fields in `organization_profiles`, identity in `organizations`. Query parsers flatten profile fields.
18. `emailAndPassword.autoSignIn` is `false` and MUST stay false: `signUpEmail` only creates accounts for invitees. See `reference.md`.
19. Every env var used by Next.js MUST be in the Zod schema in `next.config.ts`; never import `src/` code into `next.config.ts`. See `reference.md`.

**Generated & config**

20. Never edit generated files: `types/*.generated.d.ts` and everything under `drizzle/`. Regenerate with `pnpm run typegen` / `pnpm run db generate` / `pnpm run db migrate`.
21. `cacheComponents: true` and the React Compiler (builds only, off in dev) are set in `next.config.ts`. Do not add manual `useMemo`/`useCallback`.
22. Dev-perf flags that MUST NOT be reverted (Turbopack dev cache off, prebuilt CI deploys, dual DB driver on port 5433, oxlint typeAware split, minimal editor save chain): full list and rationale in `reference.md` ("Dev environment and performance").

**Preview / visual checks**

23. Prefer the Claude-in-Chrome MCP against the human server (`https://glore.localhost`), reusing the human's existing Chrome window (never a fresh one). The isolated `agent-preview` MCP (separate stack, port 24368) is the fallback; never spawn it via Bash, and `preview_stop` when done. Full sequence in `reference.md` ("Dev environment and performance").

---

## Coding Patterns (ENFORCED)

Mostly lint-enforced (full rule table in `code.md`); follow them when writing code, including in legacy files.

- **Functions:** `const` arrow functions only (no `function`). Named exports inline (`export const Foo = ...`). Default-exported component defined first, then `export default Component`. Omit return types unless needed for narrowing/overloads/recursion.
- **Control flow:** guard clauses only. `if/else`, `else if`, `else` are forbidden.
- **Types:** `interface` over `type` for object shapes; inline type imports (`import { type Foo }`); `string[]` not `Array<string>`; omit inferrable annotations.
- **Iteration/promises:** `for..of` and `map`/`filter`/`reduce`, never `.forEach()`; `await`, never `.then()`/`.catch()` chains; `Promise.all()` for independent parallel ops.
- **UI/modules:** shadcn/ui (new-york) with `cva` variants and `cn()` from `@/lib/utils`; one component per file; `@/`/`~/` aliases; reuse existing utils/hooks/components first. `src/lib/` and `src/components/ui/` are app-wide and domain-free (lint-enforced, see gotcha 3); feature code lives in `src/components/features/<domain>/`.
- **Other:** hook dependency arrays alphabetically ordered; no em/en dashes or middle dots in output (use commas, colons, parentheses).

---

## Temporary Files

> **MANDATORY:** Use `tmp/` (project root) for ALL temporary operations. Never use system `/tmp/`.

- **Delete every file you create in `tmp/` before ending your turn**
- Never commit contents of `tmp/`

---

## Auto Updates

> **MANDATORY:** Agents MUST keep `AGENTS.md` and `README.md` in sync with the codebase. No confirmation needed.

**When to update AGENTS.md:** Adding routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or any structural/architectural change. Respect the line cap (see top of file): move detail to `.agents/specs/` and add a reference row to the table above.

**When to update README.md:** Adding features, changing setup steps, modifying scripts, structural changes.

**Rules:** Edit directly. Never edit `CLAUDE.md` (it only contains `@AGENTS.md`). Keep formatting and table structure.

---

<!-- engineering-guidelines:start -->

## Engineering Guidelines

Precedence: explicit user instruction > project conventions above > existing file style.

- **Think first.** Surface assumptions and tradeoffs in the spec/plan phase, not mid-implementation. Present multiple valid interpretations instead of picking one silently. Push back when a simpler approach exists.
- **Simplicity.** Minimum code that solves the stated problem: no speculative features, abstractions, or single-use helpers. Handle realistic failures at boundaries (network, user input, third-party APIs, webhooks); skip guards for states the types or invariants already exclude.
- **Surgical changes.** Touch only what the task requires: no drive-by refactors or reformatting. Project conventions (guard clauses only, no `if/else`, Conventional Commits, one commit per task) apply to ALL code you write, legacy files included. Remove only what YOUR change orphaned; flag pre-existing dead code instead of deleting it.
- **Verify against a machine-checkable criterion**, run what applies in order, and report which rungs ran:
  1. `pnpm run check`: zero errors
  2. Unit/integration tests for logic changes (write the failing test first for bug fixes)
  3. UI/animation work: verify visually via the preview MCP (screenshot or scripted interaction). A passing typecheck is not visual verification.

<!-- engineering-guidelines:end -->
