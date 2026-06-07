# `AGENTS.md`

GloRe Certificate, multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

> **Source of truth**: This file is the single source of truth for all AI agent instructions. `CLAUDE.md` redirects here via `@AGENTS.md`.

> **Auto-update rule**: When making changes that affect the information documented here, update this file as part of the same change. **Keep this file under 300 lines.** Move detail to `.agents/specs/` and link here.

> **MANDATORY:** Every agent MUST follow ALL rules in this file. Agents MUST auto-update this file on structural/architectural changes (see [Auto Updates](#auto-updates)).

---

## Reference Specs

Detailed reference material lives in `.agents/specs/`. Load the relevant file on demand before starting work in that area.

| File                              | Content                                                                                    | Read when                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `.agents/specs/app.md`            | Canonical application specification                                                        | Understanding product requirements               |
| `.agents/specs/architecture.md`   | Full src/ directory tree, file naming, server vs. client rules                             | Navigating the codebase or adding new files      |
| `.agents/specs/code.md`           | Formatter settings, import order, restricted imports, lint rules                           | Writing or reviewing code style                  |
| `.agents/specs/reference.md`      | Routing, auth flow, data fetching, cache, types, hooks, utils, theming, emails, env vars   | Working on any specific domain area              |
| `.agents/specs/skills.md`         | Installed skills tables, workflow skills, custom skill creation                            | Managing or creating agent skills                |
| `.agents/specs/decisions.md`      | Decisions log                                                                              | Understanding past decisions                     |
| `.agents/specs/roadmap.md`        | Feature backlog and roadmap (P0-P3)                                                        | Prioritizing work                                |

---

<!-- BEGIN:nextjs-agent-rules -->

## Next.js Docs

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated.

<!-- END:nextjs-agent-rules -->

---

## Commands

| Command                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm install`            | Install dependencies                                            |
| `pnpm run dev`            | Start Next.js dev server on port 3030                           |
| `pnpm run build`          | Production build                                                |
| `pnpm run start`          | Start production server on port 3030                            |
| `pnpm run email`          | Preview email templates on port 3031                            |
| `pnpm run lint`           | Lint with vp                                                    |
| `pnpm run lint:fix`       | Auto-fix lint issues                                            |
| `pnpm run format`         | Format with vp                                                  |
| `pnpm run check`          | Type check + lint + format + unused exports (in sequence)       |
| `pnpm run check:ci`       | Same as `check` but runs all tools in parallel                  |
| `pnpm run check:fix`      | Same as `check:ci` but with auto-fix enabled                    |
| `pnpm run check:size`     | Bundle size check                                               |
| `pnpm run typecheck`      | Type-check only (`tsgo --noEmit`)                               |
| `pnpm run typegen`        | Generate route + public-file types into `types/`               |
| `pnpm run analyze`        | Next.js bundle analyzer                                         |
| `pnpm run release`        | Create a release (release-it)                                   |
| `pnpm run deploy:preview` | Deploy preview to Vercel                                        |
| `pnpm run deploy:production` | Deploy to production on Vercel                               |
| `pnpm run bump`           | Update pnpm and upgrade all dependencies                        |
| `pnpm run skills`         | Install agent skills from `skills-lock.json`                    |
| `pnpm run db <command>`   | Run drizzle-kit commands                                        |
| `pnpm run db:up`          | Start local Postgres in Docker (used by `next dev`)             |
| `pnpm run db:down`        | Stop local Postgres                                             |
| `pnpm run db:logs`        | Tail local Postgres logs                                        |
| `pnpm run db:reset`       | Wipe and recreate the local Postgres volume                     |
| `pnpm run db:pull [env]`  | Pull DB from env file (default `.env`) into local Postgres      |

**Pre-commit validation:** Run `pnpm run check` before committing. **`pnpm run check` MUST exit with code 0 before any commit is made. No exceptions.**

**Git hooks:** Vite+ manages hooks via `.vite-hooks` (set up by `vp config`). `pre-commit` runs `vp staged`. `commit-msg` runs commitlint and `vp staged`. `pre-push` runs commitlint and full `check:ci`. Commitlint enforces conventional commits with sentence-case subjects. Allowed scopes: `deps`, `deps-dev`, `dev`, `release`, `security`.

> **MANDATORY:** Always use `pnpm run <script>` (never bare `pnpm <script>`) to avoid conflicts with built-in pnpm commands. The only exception is `pnpm install` itself.

**Commit discipline:** Make one commit per logical task or feature. Never split a single task into partial commits.

---

## Model Selection

| Model               | Role                 | Use for                                                                                 |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `Claude Sonnet 4.6` | Default              | Day-to-day tasks: features, bug fixes, refactors, code review, docs                    |
| `Claude Opus 4.6`   | High-complexity only | Architectural decisions with high ambiguity, large cross-cutting refactors (>10K lines) |

Agents MUST proactively suggest switching when the current model is not the best fit. Say so at the start of the response before doing any work. Do not block on the suggestion.

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

Skills are managed in `.agents/skills/` and tracked in `skills-lock.json`. See `.agents/specs/skills.md` for full tables.

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. Any `skills/` folder inside `.claude/` is a symlink. Always use `.agents/skills/` as the canonical path.

Agents MUST autonomously read and apply the relevant skill(s) before starting work:

1. **Any UI work** > Read `frontend-design/SKILL.md` AND `vercel-react-best-practices/SKILL.md`. Use shadcn/ui (new-york style).
2. **Any React/Next.js code** > Read `vercel-react-best-practices/SKILL.md`. Apply rules by priority (CRITICAL > HIGH > MEDIUM > LOW).
3. **Database/schema changes** > Read `neon-drizzle/SKILL.md` and `neon-postgres/SKILL.md`.
4. **Auth modifications** > Read `better-auth-best-practices/SKILL.md`, `better-auth-security-best-practices/SKILL.MD`, and `email-and-password-best-practices/SKILL.md`.
5. **UI review requests** > Read `web-design-guidelines/SKILL.md`, fetch the latest guidelines, produce terse `file:line` output.
6. **AGENTS.md updates** > Read `agents-md/SKILL.md`.
7. **Any email work** (`src/emails/`) > Read `email-best-practices/SKILL.md` AND `react-email/SKILL.md`.
8. **shadcn/ui component work** > Read `shadcn/SKILL.md`.
9. **Committing changes** > Read `commit/SKILL.md`.
10. **Releasing versions** > Read `release/SKILL.md`.
11. **Cloudflare work** > Read `cloudflare/SKILL.md`.
12. **Creating or optimizing skills** > Read `skill-creator/SKILL.md`.

---

## Architecture

Full source tree, file naming, and server/client rules: see `.agents/specs/architecture.md`.

**Top-level `src/` layout:** `actions/` (server actions), `app/` (App Router), `components/` (UI + features), `db/` (schema + queries), `emails/` (React Email), `hooks/`, `lib/` (shared utils, types, constants), `proxy.ts`, `i18n.ts`.

---

## Code Style

Full formatter, import order, and lint rule details: see `.agents/specs/code.md`.

**Summary:** Single quotes, no semicolons, no trailing commas on arrows, inline type imports, early returns only (no `else`), `for..of` over `.forEach()`.

---

## Internationalization

**Library:** next-intl ^4.8.2 | **Locales:** `en` (default), `es`, `it` | **Title-case:** `en` only

**Configuration:** `src/lib/i18n.ts` reads from `config/i18n.json`. Request config in `src/i18n.ts`.

**Locale storage:** Cookie named `NEXT_LOCALE` (no prefix). Message files: `messages/{locale}.json`.

**Namespace conventions:** Top-level namespaces match feature/domain names (`Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`). Component-specific: `Components.<Name>`. i18n data: `Intl.Countries.*`, `Intl.Languages.*`. Email: `Email.*`.

**Adding translations:** Add key to `messages/en.json`, add translations to `es.json` and `it.json`. Use `useTranslations('Namespace')` in client or `getTranslations('Namespace')` in server components.

---

## Gotchas & Critical Behaviors

1. **Cookie import restriction:** Never import `cookies` from `next/headers` directly. Use `@/actions/cookies`.
2. **Parent imports blocked:** `../**` imports are blocked. Always use `@/` or `~/` path aliases.
3. **Proxy vs middleware:** The app uses `NextProxy` (`src/proxy.ts`), not standard Next.js `middleware.ts`.
4. **`'use cache'` + `cacheTag`:** Cache functions are inner functions wrapping the database query. The outer function accepts `{ cache: boolean }` to bypass.
5. **`safeQuery` wrapping:** Returns `{ data, error: null }` or `{ data: null, error: { code, message } }`. Inner cached functions use `safeQuery()`; outer functions check errors.
6. **IntlRecord fields:** Many database text fields are `IntlRecord` (JSON with locale keys). Use `localize(record)` from `useI18n()`.
7. **No `any` allowed:** `any` is only permitted in `src/lib/types.ts`. Use typed aliases elsewhere.
8. **No `forEach`:** Use `for..of`, `map`, or `reduce`. Enforced by oxlint.
9. **No JSX literals:** All user-facing strings must go through `next-intl` translations.
10. **Default export pattern:** Page/layout components MUST use direct anonymous default export. Never assign to a named variable first.
11. **Lucide icon import:** Import types from `lucide-react`, but use `LucideIcon` from `@/components/icons/lucide` for rendering.
12. **Build tsconfig:** Production builds use `tsconfig.build.json` which excludes dev types.
13. **`cacheComponents: true`:** Enabled in `next.config.ts` for cached components.
14. **React Compiler enabled in production only:** `reactCompiler` is set to `phase !== PHASE_DEVELOPMENT_SERVER` in `next.config.ts` — enabled for builds, disabled in dev to keep HMR fast (React Compiler relies on Babel which kills Turbopack HMR speed). Do not add manual `useMemo`/`useCallback` unless the compiler cannot handle the pattern.
15. **Never edit generated files:** `types/*.generated.d.ts` and everything under `drizzle/` are auto-generated. Use `pnpm typegen` or `pnpm db generate`/`pnpm db migrate`.
16. **Remove unused translation keys:** After changes, scan all three translation files and source code. Remove unused keys from all three files simultaneously.
17. **No comments in new code:** Never add inline or JSDoc comments. Exception: `{/* Section */}` dividers in long JSX components. Do NOT touch comments in existing code.
18. **Certificate PDF template:** Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.
19. **Org admin uniqueness:** One admin per org (owner/creator). Representatives have same management rights except deletion. Use `isOrgAdmin` for management checks; `membership.role === 'admin'` for owner-exclusive operations.
20. **Certificate review workflow:** Only tutors review. Tutor auto-assigned as reviewer. Review form MUST allow editing activity fields and skills/evaluations. Status: `draft` > `submitted` > `in_review` > `approved` or `changes_requested`.
21. **Registration creates org request:** New users register and request to join an existing org (status `pending`). Platform admin approves/rejects.
22. **Env vars require schema entry:** Every env var used by Next.js MUST be in the Zod schema in `next.config.ts`. See `.agents/specs/reference.md` for the full table.
23. **Env validation lives in `next.config.ts`:** The Zod schema is a module-scope constant there; `schema.parse(process.env)` runs at config load (skipped when `SKIP_ENV_VALIDATION` is set), and the file declares the global `ProcessEnv` type. NEVER import application code (anything under `src/`) into `next.config.ts` — Next watches the config's dependency graph and restarts the dev server on every change to a watched file, so a `src/` import makes every `src/**` edit trigger a full restart.
24. **Organization profile table split:** Sparse profile fields in `organization_profiles`, core identity in `organizations`. Query parsers must flatten profile fields for downstream use.
25. **Turbopack persistent dev cache disabled:** `experimental.turbopackFileSystemCacheForDev: false` in `next.config.ts` is REQUIRED. Next 16 defaults this to `true`, which makes `.next/dev/cache/turbopack` balloon (1.4GB+ observed) and Turbopack's `turbopack-compaction`/`turbopack-persistence` passes stall every HMR by 5-10s. Do not remove this flag in refactors. To reclaim disk after toggling, run `pnpm run dev:clean`.
26. **Oxlint `typeAware` split: on in CLI, off in LSP.** `vite.config.ts` keeps `typeAware: true` (so `vp check`, `vp lint`, pre-push, and CI run the full type-aware rule set including `no-floating-promises`, `no-misused-promises`, `unbound-method`). `.vscode/settings.json` sets `oxc.typeAware: false`, which the `oxc.oxc-vscode` extension forwards to the LSP as an explicit override — keeps the editor LSP off the slow `oxlint-tsgolint` path. Do not change either side without changing the other deliberately.
27. **Editor save chain is minimal:** `.vscode/settings.json` `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`. `source.format.oxc` was removed because `editor.formatOnSave: true` already runs oxfmt — running both serialized saves. `source.removeUnusedImports` was removed because it calls tsgo on every save. Knip uses `knip.deferSession: true` so the module graph is not built until manually started.
28. **Dual DB driver (Neon HTTP in prod, `pg` in dev):** `src/db/client.ts` picks the driver by URL host: `localhost`/`127.0.0.1` uses `drizzle-orm/node-postgres` + `pg.Pool`, anything else uses `drizzle-orm/neon-http`. The `DATABASE_URL` validator in `next.config.ts` accepts either `sslmode=require` (Neon) or `@localhost`/`@127.0.0.1`. Local Postgres is activated by `.env.development.local` (gitignored, dev-only) on **port 5433** (avoids a Mac/host Postgres on 5432). Provision with `pnpm run db:up`, then apply migrations with `DATABASE_URL=postgresql://glore:glore@localhost:5433/glore pnpm run db migrate` (drizzle-kit does not auto-load `.env.development.local`). Removes ~1.9s/HMR of Neon HTTP latency. Both drivers expose identical query API; no transactions are used, so the type cast in `client.ts` is safe.
29. **Auth schema imports must stay slim:** `src/lib/auth.ts` imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (NOT `* as schema from '@/db/schema'`). `proxy.ts` calls `auth.api.getSession` on every request, so a barrel import here drags the entire schema graph into the proxy's compile + HMR cost.
30. **Deploys are prebuilt in CI, not built on Vercel:** `vercel.json` sets `git.deploymentEnabled: false`; `.github/workflows/deploy.yml` runs `vercel pull` + `vercel build` + `vercel deploy --prebuilt` on the 4-core CI runner with a warm `.next/cache` (`actions/cache`), so the Vercel "Building" step is a ~20s artifact upload, not a ~3min build. `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` live in the workflow `env` (non-secret IDs) because `.vercel/` is gitignored. Two `next.config.ts` flags keep builds fast and MUST NOT be reverted: `typescript.ignoreBuildErrors: true` (safe because the CI `validate` job runs `tsgo` before deploy; re-enabling adds 30-45s of redundant type-checking per build) and `experimental.turbopackFileSystemCacheForBuild: true` (lets the restored `.next/cache` actually speed up Turbopack compile; without it the cache is dead weight).

---

## Coding Patterns (ENFORCED)

> **MANDATORY:** Every agent MUST follow these patterns with NO exceptions.

### Functions and exports

- **Always `const` arrow functions**, never `function` keyword
- **Never specify return types** unless required for type narrowing, overloads, or recursive types
- **Named exports inline**: `export const Foo = () => ...` (never declare then export separately)
- **Default exports defined first**: `const Component = () => { ... }` and `export default Component`

### Control flow

- **`if/else`, `else if`, and `else` are FORBIDDEN.** Use guard clauses (early returns) only.

### Types

- **`interface` over `type`** for object shapes
- **Inline type imports**: `import { type Foo }` not `import type { Foo }`
- **Array shorthand**: `string[]` not `Array<string>`
- **Omit inferrable types**: `const x = 5` not `const x: number = 5`

### Iteration and promises

- **`for..of`** for loops, **`map`/`filter`/`reduce`** for transforms, **never `.forEach()`**
- **`await`** always, never `.then()/.catch()` chains
- **`Promise.all()`** for parallel independent operations

### UI and modules

- **shadcn/ui (new-york style)** with CVA variants and `cn()` from `@/lib/utils`
- **One component per file**, path aliases (`@/`, `~/`)
- **Reuse** existing utils, hooks, UI components before writing new ones
- **`src/lib/` is app-wide only**: feature-scoped code lives in `src/components/features/<domain>/`

### Other rules

- **Dependency arrays alphabetically ordered** in React hooks
- **No em/en dashes or middle dots** in output. Use commas, colons, parentheses.

---

## Temporary Files

> **MANDATORY:** Use `tmp/` (project root) for ALL temporary operations. Never use system `/tmp/`.

- **Delete every file you create in `tmp/` before ending your turn**
- Never commit contents of `tmp/`

---

## Auto Updates

> **MANDATORY:** Agents MUST keep `AGENTS.md` and `README.md` in sync with the codebase. No confirmation needed.

**When to update AGENTS.md:** Adding routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or any structural/architectural change. **Keep this file under 300 lines** — move detail to `.agents/specs/` and add a reference row to the table above.

**When to update README.md:** Adding features, changing setup steps, modifying scripts, structural changes.

**Rules:** Edit directly. Never edit `CLAUDE.md` (it only contains `@AGENTS.md`). Keep formatting and table structure.
