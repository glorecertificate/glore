# `AGENTS.md`

GloRe Certificate, multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

> **Source of truth**: This file is the single source of truth for all AI agent instructions. `CLAUDE.md` redirects here via `@AGENTS.md`.

> **Auto-update rule**: When making changes that affect the information documented here, update this file as part of the same change. Move detail to `.agents/specs/` and link here.

> **Line cap (all agentic docs)**: `AGENTS.md` and every `.agents/specs/*.md` file MUST stay under 300 lines (about 4,000 tokens of dense Markdown). When an edit would push a file over, move detail to the most relevant spec file and leave a one-line reference.

> **MANDATORY:** Every agent MUST follow ALL rules in this file. Agents MUST auto-update this file on structural/architectural changes (see [Auto Updates](#auto-updates)).

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

| Command                   | Description                                                     |
| ------------------------- | --------------------------------------------------------------- |
| `pnpm install`            | Install dependencies                                            |
| `pnpm run dev`            | Start Next.js dev server on port 3030                           |
| `pnpm run dev:clean`      | Wipe `.next` then start the dev server (reclaims Turbopack disk) |
| `pnpm run build`          | Production build                                                |
| `pnpm run start`          | Start production server on port 3030                            |
| `pnpm run email`          | Preview email templates on port 3031                            |
| `pnpm run lint`           | Lint with vp                                                    |
| `pnpm run lint:fix`       | Auto-fix lint issues                                            |
| `pnpm run format`         | Format with vp                                                  |
| `pnpm run check`          | Run all `check:*` scripts in parallel                           |
| `pnpm run check:types`    | Type-check only (`tsgo --noEmit`)                               |
| `pnpm run check:lint`     | Lint + format check (`vp check`)                                |
| `pnpm run check:knip`     | Unused files, exports, and dependencies (knip)                 |
| `pnpm run typecheck`      | Type-check (`tsgo`)                                             |
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

**Git hooks:** Vite+ manages hooks via `.vite-hooks` (set up by `vp config`). `pre-commit` runs `vp staged`. `commit-msg` runs commitlint (skipping `#`-comment messages). `pre-push` runs commitlint then `pnpm run check`. Commitlint extends `config-conventional` (sentence-case subjects, header max 100). Allowed scopes: `release`, `deps`, `deps-dev`, `security`.

> **MANDATORY:** Always use `pnpm run <script>` (never bare `pnpm <script>`) to avoid conflicts with built-in pnpm commands. The only exception is `pnpm install` itself and the repository documentation.

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

Skills live in `.agents/skills/`. External skills are tracked in `skills-lock.json` and installed with `pnpm run skills` (they behave like `node_modules` and are gitignored). Custom skills are committed by unignoring them in `.agents/skills/.gitignore` (`!/<name>/`).

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. Any `skills/` folder inside `.claude/` is a symlink. Always use `.agents/skills/` as the canonical path.

**Installed skills:** external (in `skills-lock.json`): `cloudflare`, `frontend-design`, `neon-drizzle`, `neon-postgres`, `react-email`, `shadcn`, `skill-creator`, `vercel-react-best-practices`, `web-design-guidelines`. Custom (git-tracked): `i18n-audit`.

Agents MUST autonomously read and apply the relevant skill(s) before starting work:

1. **Any UI work** > Read `frontend-design/SKILL.md` AND `vercel-react-best-practices/SKILL.md`. Use shadcn/ui (new-york style).
2. **Any React/Next.js code** > Read `vercel-react-best-practices/SKILL.md`. Apply rules by priority (CRITICAL > HIGH > MEDIUM > LOW).
3. **Database/schema changes** > Read `neon-drizzle/SKILL.md` and `neon-postgres/SKILL.md`.
4. **UI review requests** > Read `web-design-guidelines/SKILL.md`, fetch the latest guidelines, produce terse `file:line` output.
5. **shadcn/ui component work** > Read `shadcn/SKILL.md`.
6. **Any email work** (`src/emails/`) > Read `react-email/SKILL.md`.
7. **Cloudflare work** > Read `cloudflare/SKILL.md`.
8. **Translation file audits** (`messages/`) > Run the `i18n-audit` skill.
9. **Documentation updates** (AGENTS.md, `.agents/`, README) > Run the machine-wide `sync-docs` skill (`/sync-docs [focus]`); it auto-detects this project scope and reads the constraints declared here.
10. **Creating or optimizing skills** > Read `skill-creator/SKILL.md`.

---

## Architecture

Full source tree, file naming, and server/client rules: see `.agents/specs/architecture.md`.

**Top-level `src/` layout:** `actions/` (server actions), `app/` (App Router), `components/` (`auth/`, `features/`, `icons/`, `layout/`, `providers/`, `ui/`), `db/` (`schema/`, `queries/`, `mutations/`, `client.ts`), `emails/` (React Email), `hooks/`, `lib/` (shared utils, types, constants), `proxy.ts`, `i18n.ts`.

**Context/provider placement:** global, app-wide providers (i18n, search-params, session, theme) live in `src/components/providers/` as flat single files. Feature-scoped contexts (e.g. courses) live in `src/components/features/<domain>/`. Split a provider into `context.tsx` + `provider.tsx` + `index.ts` only when it needs a server-side data fetch; otherwise keep it a single file.

---

## Code Style

Full formatter, import order, and lint rule details: see `.agents/specs/code.md`.

**Summary:** Single quotes, no semicolons, no trailing commas on arrows, inline type imports, early returns only (no `else`), `for..of` over `.forEach()`.

---

## Internationalization

**Library:** next-intl ^4.13.0 | **Locales:** `en` (default), `es`, `it` | **Title-case:** `en` only

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
14. **React Compiler enabled in production only:** `reactCompiler` is set to `phase !== PHASE_DEVELOPMENT_SERVER` in `next.config.ts`: enabled for builds, disabled in dev to keep HMR fast (React Compiler relies on Babel which kills Turbopack HMR speed). Do not add manual `useMemo`/`useCallback` unless the compiler cannot handle the pattern.
15. **Never edit generated files:** `types/*.generated.d.ts` and everything under `drizzle/` are auto-generated. Use `pnpm typegen` or `pnpm db generate`/`pnpm db migrate`.
16. **Remove unused translation keys:** After changes, scan all three translation files and source code. Remove unused keys from all three files simultaneously.
17. **No comments in new code:** Never add inline or JSDoc comments. Exception: `{/* Section */}` dividers in long JSX components. Do NOT touch comments in existing code.
18. **Certificate PDF template:** Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.
19. **Org admin uniqueness:** One admin per org (owner/creator). Representatives have same management rights except deletion. Use `isOrgAdmin` for management checks; `membership.role === 'admin'` for owner-exclusive operations.
20. **Certificate review workflow:** Only tutors review. Tutor auto-assigned as reviewer. Review form MUST allow editing activity fields and skills/evaluations. Status: `draft` > `submitted` > `in_review` > `approved` or `changes_requested`.
21. **Registration creates org request:** New users register and request to join an existing org (status `pending`). Platform admin approves/rejects.
22. **Env vars require schema entry:** Every env var used by Next.js MUST be in the Zod schema in `next.config.ts`. See `.agents/specs/reference.md` for the full table.
23. **Env validation lives in `next.config.ts`:** The Zod schema is a module-scope constant there; `schema.parse(process.env)` runs at config load (skipped when `SKIP_ENV_VALIDATION` is set), and the file declares the global `ProcessEnv` type. NEVER import application code (anything under `src/`) into `next.config.ts`: Next watches the config's dependency graph and restarts the dev server on every change to a watched file, so a `src/` import makes every `src/**` edit trigger a full restart.
24. **Organization profile table split:** Sparse profile fields in `organization_profiles`, core identity in `organizations`. Query parsers must flatten profile fields for downstream use.
25. **Turbopack persistent dev cache disabled:** `experimental.turbopackFileSystemCacheForDev: false` in `next.config.ts` is REQUIRED. Next 16 defaults this to `true`, which makes `.next/dev/cache/turbopack` balloon (1.4GB+ observed) and Turbopack's `turbopack-compaction`/`turbopack-persistence` passes stall every HMR by 5-10s. Do not remove this flag in refactors. To reclaim disk after toggling, run `pnpm run dev:clean`.
26. **Oxlint `typeAware` split: on in CLI, off in LSP.** `vite.config.ts` keeps `typeAware: true` (so `vp check`, `vp lint`, pre-push, and CI run the full type-aware rule set including `no-floating-promises`, `no-misused-promises`, `unbound-method`). `.vscode/settings.json` sets `oxc.typeAware: false`, which the `oxc.oxc-vscode` extension forwards to the LSP as an explicit override, keeping the editor LSP off the slow `oxlint-tsgolint` path. Do not change either side without changing the other deliberately.
27. **Editor save chain is minimal:** `.vscode/settings.json` `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`. `source.format.oxc` was removed because `editor.formatOnSave: true` already runs oxfmt (running both serialized saves). `source.removeUnusedImports` was removed because it calls tsgo on every save. Knip uses `knip.deferSession: true` so the module graph is not built until manually started.
28. **Dual DB driver (Neon HTTP in prod, `pg` in dev):** `src/db/client.ts` picks the driver by URL host: `localhost`/`127.0.0.1` uses `drizzle-orm/node-postgres` + `pg.Pool`, anything else uses `drizzle-orm/neon-http`. The `DATABASE_URL` validator in `next.config.ts` accepts either `sslmode=require` (Neon) or `@localhost`/`@127.0.0.1`. Local Postgres is activated by `.env.development.local` (gitignored, dev-only) on **port 5433** (avoids a Mac/host Postgres on 5432). Provision with `pnpm run db:up`, then `pnpm run db migrate` (the `db` script is `dotenv -e .env.development.local -e .env -- drizzle-kit`, so it loads the local `DATABASE_URL` from `.env.development.local`, which wins over `.env`; only pass `DATABASE_URL=...` inline before that file exists or its `DATABASE_URL` is set). Removes ~1.9s/HMR of Neon HTTP latency. Both drivers expose the same read/single-statement query API, so the `db` cast in `client.ts` is safe; multi-statement writes take the separate `transaction()` path (gotcha 31), which handles each driver explicitly.
29. **Auth schema imports must stay slim:** `src/lib/auth.ts` imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (NOT `* as schema from '@/db/schema'`). `proxy.ts` calls `auth.api.getSession` on every request, so a barrel import here drags the entire schema graph into the proxy's compile + HMR cost.
30. **Deploys are prebuilt in CI, not built on Vercel:** `vercel.json` sets `git.deploymentEnabled: false`; `.github/workflows/deploy.yml` runs `vercel pull` + `vercel build` + `vercel deploy --prebuilt` on the 4-core CI runner with a warm `.next/cache` (`actions/cache`), so the Vercel "Building" step is a ~20s artifact upload, not a ~3min build. `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` live in the workflow `env` (non-secret IDs) because `.vercel/` is gitignored. Two `next.config.ts` flags keep builds fast and MUST NOT be reverted: `typescript.ignoreBuildErrors: true` (safe because the CI `validate` job runs `tsgo` before deploy; re-enabling adds 30-45s of redundant type-checking per build) and `experimental.turbopackFileSystemCacheForBuild: true` (lets the restored `.next/cache` actually speed up Turbopack compile; without it the cache is dead weight).
31. **Multi-statement writes use `transaction()`, not raw `db`:** prod runs on neon-http which has NO interactive transactions, so any write spanning >1 statement MUST go through `transaction(fn)` from `@/db/client` (dev: `pg` pool; prod: a lazily-initialized, module-scoped neon-serverless WebSocket pool reused across invocations, `max: 3`, needs global `WebSocket` / Node 22+, pinned to `24.14.0` via `.node-version` with an `engines.node: ">=22"` floor). Write logic lives in `src/db/mutations/<domain>.ts` as composable `(tx: Transaction, ...args) => ...` units; the action wraps it (`await transaction(tx => deleteUser(tx, id))`). **Statements inside a transaction run sequentially** (`await` one at a time) since they share one connection (`Promise.all` on a `tx` corrupts the session, hence `react-doctor/async-parallel` is disabled in those files). Keep PDF/email/R2 side effects OUTSIDE the transaction. See `.agents/specs/reference.md` ("Transactions & the mutation layer").
32. **`emailAndPassword.autoSignIn` is `false` in `src/lib/auth.ts` and MUST stay false:** every `auth.api.signUpEmail` call in the app creates an account for *someone else* (team/org invites in `src/actions/admin/team.ts`, `src/actions/admin/organizations.ts`, `src/actions/organizations/members.ts`, `src/actions/organizations/requests.ts`), never for the actor. With `autoSignIn: true` (the Better Auth default), `signUpEmail` + the `nextCookies()` plugin write the *new* user's session cookie onto the inviter's response, so on the next request the proxy reads the invitee's session, sees `onboardedAt = null`, and redirects the admin into the invitee's onboarding. Self-registration does NOT use `signUpEmail` (it creates a `pending` join request), so disabling auto sign-in is safe. Do not re-enable it to "fix login": login uses `signInEmail`, which is unaffected.
33. **Dev server runs on a fixed port behind portless; agents reuse it, never spawn:** the `dev` script is `portless run --app-port 3030 next dev`, so Next always binds **port 3030** (humans still reach it as `https://glore.localhost` via the portless proxy on 443). `.claude/launch.json` declares `"port": 3030` so the preview MCP probes that port, finds the running server, and **reuses** it instead of running `pnpm run dev`. Without the pinned `--app-port` + `port`, portless auto-assigns a random port and `preview_start` re-runs the dev command, which fails with `"glore.localhost" is already registered`. Do not drop `--app-port 3030` or the `port` field. Agents must use `preview_start` (name `preview`), never start the server via Bash.

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
  1. `pnpm run typecheck`: zero errors
  2. `pnpm run lint`: zero errors
  3. Unit/integration tests for logic changes (write the failing test first for bug fixes)
  4. UI/animation work: verify visually via the preview MCP (screenshot or scripted interaction). A passing typecheck is not visual verification.

<!-- engineering-guidelines:end -->
