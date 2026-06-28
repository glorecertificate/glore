# `AGENTS.md`

GloRe Certificate, multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

It is a real product by [Associazione Joint](https://associazionejoint.org) (a Milan youth-mobility non-profit) that certifies the soft skills people gain through volunteering. This repo is the new version of the live platform. For the domain background that motivates the data model and flows, read the "Domain context" section in `.agents/specs/app.md` before product work.

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
| `pnpm run db <command>`      | Run drizzle-kit commands                                                |
| `pnpm run db:up`             | Start local Postgres in Docker (used by `next dev`)                     |
| `pnpm run db:down`           | Stop local Postgres                                                     |
| `pnpm run db:logs`           | Tail local Postgres logs                                                |
| `pnpm run db:reset`          | Wipe and recreate the local Postgres volume                             |

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

Skills live in `.agents/skills/`. They are tracked in `skills-lock.json`, installed with `pnpm run skills`, and gitignored (the whole `.agents/skills/` tree behaves like `node_modules`, never committed).

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. `.claude/` is a symlink to `.agents/`, so `.claude/skills` resolves to the same place. Always use `.agents/skills/` as the canonical path.

**Installed skills** (in `skills-lock.json`): `cloudflare`, `frontend-design`, `neon-drizzle`, `neon-postgres`, `react-email`, `shadcn`, `vercel-react-best-practices`, `web-design-guidelines`.

**MCP servers** (`.mcp.json`): `better-auth` (auth setup), `cloudflare` (R2/Workers docs), `neon` (database ops), `shadcn` (component registry). They auto-connect for compatible agents; query them for live docs and operations in their domain.

Agents MUST autonomously read and apply the relevant skill(s) before starting work:

1. **Any UI work** > Read `frontend-design/SKILL.md` AND `vercel-react-best-practices/SKILL.md`. Use shadcn/ui (new-york style).
2. **Any React/Next.js code** > Read `vercel-react-best-practices/SKILL.md`. Apply rules by priority (CRITICAL > HIGH > MEDIUM > LOW).
3. **Database/schema changes** > Read `neon-drizzle/SKILL.md` and `neon-postgres/SKILL.md`.
4. **UI review requests** > Read `web-design-guidelines/SKILL.md`, fetch the latest guidelines, produce terse `file:line` output.
5. **shadcn/ui component work** > Read `shadcn/SKILL.md`.
6. **Any email work** (`src/emails/`) > Read `react-email/SKILL.md`.
7. **Cloudflare work** > Read `cloudflare/SKILL.md`.
8. **Translation file audits** (`messages/`) > Run the machine-wide `i18n-audit` skill.
9. **Documentation updates** (AGENTS.md, `.agents/`, README) > Run the machine-wide `sync-docs` skill (`/sync-docs [focus]`); it auto-detects this project scope and reads the constraints declared here.
10. **Creating or optimizing skills** > Run the machine-wide `skill-creator` skill.

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
14. **React Compiler enabled in production only:** on for builds, off in dev (Babel kills Turbopack HMR). Do not add manual `useMemo`/`useCallback`. See `.agents/specs/reference.md` ("Dev environment and performance").
15. **Never edit generated files:** `types/*.generated.d.ts` and everything under `drizzle/` are auto-generated. Use `pnpm typegen` or `pnpm db generate`/`pnpm db migrate`.
16. **Remove unused translation keys:** After changes, scan all three translation files and source code. Remove unused keys from all three files simultaneously.
17. **No comments in new code:** Never add inline or JSDoc comments. Exception: `{/* Section */}` dividers in long JSX components. Do NOT touch comments in existing code.
18. **Certificate PDF template:** Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.
19. **Org admin uniqueness:** One admin per org (owner/creator). Representatives have same management rights except deletion. Use `isOrgAdmin` for management checks; `membership.role === 'admin'` for owner-exclusive operations.
20. **Certificate review workflow:** Only tutors review. Tutor auto-assigned as reviewer. Review form MUST allow editing activity fields and skills/evaluations. Status: `draft` > `submitted` > `in_review` > `approved` or `changes_requested`.
21. **Registration creates org request:** New users register and request to join an existing org (status `pending`). Platform admin approves/rejects.
22. **Env vars require schema entry:** Every env var used by Next.js MUST be in the Zod schema in `next.config.ts`. See `.agents/specs/reference.md` for the full table.
23. **Env validation lives in `next.config.ts`:** Zod schema is a module-scope constant; `schema.parse(process.env)` runs at config load (skipped when `SKIP_ENV_VALIDATION` is set). NEVER import `src/` code into `next.config.ts` (Next restarts the dev server on every watched-file change). See `.agents/specs/reference.md` ("Environment variables").
24. **Organization profile table split:** Sparse profile fields in `organization_profiles`, core identity in `organizations`. Query parsers must flatten profile fields for downstream use.
25. **Turbopack persistent dev cache disabled:** `experimental.turbopackFileSystemCacheForDev: false` is REQUIRED (the `true` default balloons the cache and stalls HMR). See `.agents/specs/reference.md` ("Dev environment and performance").
26. **Oxlint `typeAware` split: on in CLI, off in LSP.** Keep both sides in sync. See `.agents/specs/reference.md` ("Dev environment and performance") and `code.md`.
27. **Editor save chain is minimal:** `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`; knip defers its session. See `.agents/specs/reference.md` ("Dev environment and performance").
28. **Dual DB driver (Neon HTTP in prod, `pg` in dev):** `src/db/client.ts` picks by URL host; local Postgres runs on **port 5433** via `.env.development.local`. See `.agents/specs/reference.md` ("Dev environment and performance").
29. **Auth schema imports must stay slim:** `src/lib/auth.ts` imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (NOT the `@/db/schema` barrel). `proxy.ts` calls `auth.api.getSession` per request, so a barrel import drags the whole schema graph into proxy compile + HMR.
30. **Deploys are prebuilt in CI, not built on Vercel:** `git.deploymentEnabled: false`; CI runs `vercel build` + `deploy --prebuilt` with a warm `.next/cache`. Do not revert `typescript.ignoreBuildErrors: true` or `turbopackFileSystemCacheForBuild: true`. See `.agents/specs/reference.md` ("Dev environment and performance").
31. **Multi-statement writes use `transaction()`, not raw `db`:** prod neon-http has no interactive transactions, so any write spanning >1 statement goes through `transaction(fn)` from `@/db/client`. Logic lives in `src/db/mutations/<domain>.ts` as `(tx, ...args) => ...` units; statements inside a tx run sequentially. See `.agents/specs/reference.md` ("Transactions and the mutation layer").
32. **`emailAndPassword.autoSignIn` is `false` in `src/lib/auth.ts` and MUST stay false:** `signUpEmail` only creates accounts for others (team/org invites); auto sign-in would write the invitee's session onto the inviter. Login (`signInEmail`) is unaffected. See `.agents/specs/reference.md` ("Authentication flow").
33. **The agent preview is a SEPARATE, isolated dev server; never share or spawn it via Bash:** it lives entirely in `.agents/launch.json` on **port 24368** as `https://agent-preview.glore.localhost`, with its own dist dir and tsconfig. Use `preview_start` (name `agent-preview`); call `preview_stop` when done in a turn (it does not auto-stop and is a full second stack). The MCP cannot attach to the human's server. See `.agents/specs/reference.md` ("Dev environment and performance").

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
  1. `pnpm run check`: zero errors
  2. Unit/integration tests for logic changes (write the failing test first for bug fixes)
  3. UI/animation work: verify visually via the preview MCP (screenshot or scripted interaction). A passing typecheck is not visual verification.

<!-- engineering-guidelines:end -->
