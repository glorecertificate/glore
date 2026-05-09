# `AGENTS.md`

GloRe Certificate, multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

> **Source of truth**: This file is the single source of truth for all AI agent instructions. `CLAUDE.md` redirects here via `@AGENTS.md`.

> **Auto-update rule**: When making changes that affect the information documented here, update this file as part of the same change.

> **MANDATORY:** Every agent MUST follow ALL rules in this file. Agents MUST auto-update this file on structural/architectural changes (see [Auto Updates](#auto-updates)).

---

## Reference Specs

Detailed reference material lives in `.agents/specs/`. Read the relevant file when working on a specific area.

| File                         | Content                                                                                    | Read when                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `.agents/specs/reference.md` | Routing, auth flow, data fetching, cache strategy, types, hooks, utils, env vars, theming, emails, error handling, code examples | Working on any specific domain area              |
| `.agents/specs/skills.md`    | Installed skills tables, workflow skills, custom skill creation, gitignore enforcement      | Managing or creating agent skills                |
| `.agents/specs/app.md`       | Canonical application specification                                                        | Understanding product requirements               |
| `.agents/specs/decisions.md` | Decisions log                                                                              | Understanding past decisions                     |
| `.agents/specs/roadmap.md`   | Feature backlog and roadmap (P0-P3)                                                        | Prioritizing work                                |

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
| `pnpm run typecheck`      | Type-check only (`tsgo --noEmit`)                                |
| `pnpm run typegen`        | Generate route + public-file types into `env.d.ts`              |
| `pnpm run analyze`        | Next.js bundle analyzer                                         |
| `pnpm run release`        | Create a release (release-it)                                   |
| `pnpm run deploy:preview` | Deploy preview to Vercel                                        |
| `pnpm run deploy:prod`    | Deploy to production on Vercel                                  |
| `pnpm run bump`           | Update pnpm and upgrade all dependencies                        |
| `pnpm run skills`         | Install agent skills from `skills-lock.json`                    |
| `pnpm run db <command>`   | Run drizzle-kit commands                                        |

**Pre-commit validation:** Run `pnpm run check` before committing. **`pnpm run check` MUST exit with code 0 before any commit is made. No exceptions.**

**Git hooks:** Vite+ manages hooks via `.vite-hooks` (set up by `vp config`). `pre-commit` runs `vp staged`. `commit-msg` runs commitlint and `vp staged`. `pre-push` runs commitlint and full `check:ci`. Commitlint enforces conventional commits with sentence-case subjects. Allowed scopes: `deps`, `deps-dev`, `dev`, `release`, `security`.

> **MANDATORY:** Always use `pnpm run <script>` (never bare `pnpm <script>`) to avoid conflicts with built-in pnpm commands. The only exception is `pnpm install` itself.

**Commit discipline:** Make one commit per logical task or feature. Never split a single task into partial commits.

---

## Model Selection

| Model               | Role                 | Use for                                                                                   |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `Claude Sonnet 4.6` | Default              | Day-to-day tasks: features, bug fixes, refactors, code review, docs                      |
| `Claude Opus 4.6`   | High-complexity only | Architectural decisions with high ambiguity, large cross-cutting refactors (>10K lines)   |

Agents MUST proactively suggest switching when the current model is not the best fit. Say so at the start of the response before doing any work. Do not block on the suggestion.

---

## Stack

| Category         | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Framework        | Next.js (App Router, RSC, Cached Components)          |
| Language         | TypeScript (strict mode)                              |
| Runtime          | React (with React Compiler enabled)                   |
| Package manager  | pnpm                                                  |
| React Compiler   | babel-plugin-react-compiler                           |
| Database         | Neon Serverless Postgres (`@neondatabase/serverless`) |
| ORM              | Drizzle ORM + drizzle-kit                             |
| Auth             | Better Auth (`better-auth`)                           |
| Storage          | Cloudflare R2 (`@aws-sdk/client-s3`)                  |
| Linter           | oxlint (`vite.config.ts`)                             |
| Formatter        | oxfmt (`vite.config.ts`)                              |
| Styling          | Tailwind CSS                                          |
| UI Components    | shadcn/ui (new-york style)                            |
| Rich text editor | Plate.js                                              |
| i18n             | next-intl                                             |
| Forms            | react-hook-form + zod                                 |
| State            | nuqs (URL state)                                      |
| Email            | Nodemailer (SMTP)                                     |
| AI               | Vercel AI SDK + Google Gemini (`@ai-sdk/google`)      |
| Animation        | motion                                                |
| DnD              | @dnd-kit                                              |
| Icons            | lucide-react                                          |
| Deployment       | Vercel                                                |
| Analytics        | @vercel/analytics + @vercel/speed-insights            |
| Search           | fuse.js                                               |
| QR code          | qrcode                                                |
| Agent Skills     | skills CLI (https://agentskills.io)                   |

---

## Agent Skills

This project uses [Agent Skills](https://agentskills.io) to provide domain-specific knowledge. Skills are managed in `.agents/skills/` and tracked in `skills-lock.json`. See `.agents/specs/skills.md` for full tables and management details.

> **MANDATORY:** The **only** skills folder to read or edit is `.agents/skills/`. Any `skills/` folder inside `.claude/` is a symlink. Always use `.agents/skills/` as the canonical path.

### Skill enforcement rules

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
11. **All development work** > Follow the superpowers workflow: `brainstorming` > `writing-plans` > `dispatching-parallel-agents` or `executing-plans`. Invoke each skill manually at the appropriate phase.
12. **Cloudflare work** > Read `cloudflare/SKILL.md`.
13. **Creating or optimizing skills** > Read `skill-creator/SKILL.md`.

---

## Architecture

```
src/
├── actions/            # Server actions (mutations and cached queries)
│   ├── admin/
│   │   ├── organizations.ts    # Organization approvals, invitations
│   │   ├── team.ts             # Team member management, invitations
│   │   └── users.ts            # User moderation (ban/unban, role updates)
│   ├── certificates/
│   │   ├── management.ts       # Certificate mutations: review, create, submit, assign
│   │   └── queries.ts          # Certificate reads: list, find, eligibility + column configs
│   ├── courses/
│   │   ├── helpers.ts          # Shared server-only helpers, courseWith, buildCourseWith (no 'use server')
│   │   ├── management.ts       # Course and content CRUD (lessons, questions, evaluations)
│   │   ├── progress.ts         # Learner progress and analytics (enroll, complete, submit)
│   │   └── queries.ts          # Course read queries
│   ├── organizations/
│   │   ├── helpers.ts          # Shared server-only helpers, types, column configs (no 'use server')
│   │   ├── members.ts          # Org member management: invite, role update, remove
│   │   ├── queries.ts          # Org reads: getOrganizationPanel, listOrgTutors
│   │   ├── requests.ts         # Org join requests: approve, reject, register
│   │   └── settings.ts         # Org entity: update, avatar upload/remove, delete
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── doc.ts          # Doc category + article CRUD, cached queries
│   ├── notification.ts # Notification creation helpers
│   ├── onboarding.ts   # Complete onboarding flow
│   ├── storage.ts      # Avatar upload/remove via Cloudflare R2
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated routes (login, onboarding)
│   ├── (dashboard)/    # Authenticated routes (sidebar layout)
│   ├── [username]/     # Public certificate page route
│   └── api/            # API routes (auth catch-all + v1/)
├── components/
│   ├── blocks/         # Complex composed blocks (rich-text-editor)
│   ├── features/       # Domain components grouped by feature
│   │   ├── about/         # About page components
│   │   ├── admin/         # Admin panel components
│   │   ├── auth/          # Auth forms, login/register UI
│   │   ├── certificates/  # Certificate management UI
│   │   ├── courses/       # Course viewer/editor components
│   │   ├── dashboard/     # Dashboard page components
│   │   ├── docs/          # Docs article cards, list/search, sheets, editor dialog
│   │   ├── help/          # Help page components
│   │   ├── notifications/ # Notification list and items
│   │   ├── onboarding/    # Onboarding form steps
│   │   ├── organization/  # Org panel header, tabs, management sections
│   │   ├── pwa/           # PWA install prompts, offline UI
│   │   ├── search/        # Global command palette (SearchCommand) with Fuse.js
│   │   └── users/         # User profile components
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper
│   ├── layout/         # Shell components (sidebar, page header, fallbacks)
│   ├── providers/      # Context providers (session, i18n, theme, courses, notifications, PWA)
│   └── ui/             # shadcn/ui primitives and custom UI components
├── db/
│   ├── client.ts       # Neon + Drizzle client (neon HTTP driver)
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── types.ts        # Drizzle table type helpers (InferInsertModel)
│   ├── schema/         # Drizzle schema definitions per table
│   └── queries/        # Query parse functions per table
├── emails/             # React Email templates (auth, team, certificates, org)
├── hooks/              # Custom React hooks
├── instrumentation.ts  # Next.js instrumentation hook (runtime env validation)
├── lib/                # App-wide shared utilities, constants, and types ONLY
│   ├── auth.ts         # Better Auth server instance
│   ├── cache.ts        # CacheTag enum, per-record tag helpers
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail utility)
│   ├── env.ts          # Zod env schema, runtime validation, ProcessEnv augmentation
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── push.ts         # Web Push (VAPID) utilities
│   ├── rate-limit.ts   # Rate limiting helpers
│   ├── storage.ts      # R2 Put/Delete/URL helpers (r2Put, r2Delete, r2Url)
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, etc.)
│   └── utils.ts        # cn(), debounce(), throttle(), camelize(), etc.
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
```

### File naming conventions

- All files: **kebab-case** (enforced by `unicorn/filename-case`)
- Components: one component per file, named exports preferred
- Feature components: grouped by domain under `features/<domain>/`, sub-features in sub-folders
  - Drop domain prefix from filenames: `features/courses/editor/view.tsx` (not `course-editor-view.tsx`)
  - Context/params at sub-feature root: `context.tsx`, `params.ts`, `use-params.ts`
- Provider pattern: split into `*-context.tsx` + `*-provider.tsx`
- Database queries: `src/db/queries/<table>.ts` with `parse*` function
- Database schema: `src/db/schema/<table>.ts` with Drizzle table definitions

### Server vs client components

- **Server Components** by default
- `'use client'` only when interactivity is needed (hooks, event handlers, browser APIs)
- Layout guards (admin, certificates) are server components that call `notFound()`
- **Page Suspense pattern:** Pages that fetch data async MUST use an inner async component + outer sync page with `<Suspense fallback={<LoadingFallback />}>`. The page header renders immediately while data loads.

---

## Code Style

### Formatter (oxfmt, configured in `vite.config.ts`)

| Setting         | Value                          |
| --------------- | ------------------------------ |
| Quotes          | Single                         |
| Semicolons      | None (`semi: false`)           |
| Trailing commas | ES5                            |
| Arrow parens    | Avoid (`arrowParens: "avoid"`) |

### Import organization (oxfmt `sortImports`)

```
:BUILTIN:                       # Node built-ins
                                # blank line
react / react/**                # React imports
next / next/**                  # Next.js imports
                                # blank line
:EXTERNAL:                      # Third-party packages
                                # blank line
~/**                            # Config/messages aliases
@/**                            # Internal @/ aliases
                                # blank line
:RELATIVE:                      # Sibling/index (parent imports are blocked)
```

**Import type style:** Inline type imports (`import { type Foo }`)

### Restricted imports

| Import                         | Restriction | Alternative                   |
| ------------------------------ | ----------- | ----------------------------- |
| `cookies` from `next/headers`  | Blocked     | `@/actions/cookies`           |
| `useRouter` from `next/router` | Blocked     | `next/navigation`             |
| `cn` from `@udecode/cn`        | Blocked     | `@/lib/utils`                 |
| `default` from `zod`           | Blocked     | Use `z` named import          |
| `../**` (parent imports)       | Blocked     | Use path aliases (`@/`, `~/`) |

### Key lint rules (oxlint, configured in `vite.config.ts`)

| Rule                                     | Setting                                      |
| ---------------------------------------- | -------------------------------------------- |
| `unicorn/no-array-for-each`              | Error: use `for..of`, `map`, `reduce`        |
| `eslint/no-else-return`                  | Error: use early returns                     |
| `import/no-relative-parent-imports`      | Error: use `@/` or `~/` path aliases         |
| `import/consistent-type-specifier-style` | Error: inline type imports                   |
| `typescript/no-explicit-any`             | Warn (only `src/lib/types.ts` may use `any`) |
| `unicorn/filename-case`                  | Error: kebab-case                            |

---

## Internationalization

**Library:** next-intl ^4.8.2 | **Locales:** `en` (default), `es`, `it` | **Title-case:** `en` only

**Configuration:** `src/lib/i18n.ts` reads from `config/i18n.json`. Request config in `src/i18n.ts`.

**Locale storage:** Cookie named `NEXT_LOCALE` (no prefix). Message files: `messages/{locale}.json`.

**Namespace conventions:** Top-level namespaces match feature/domain names (`Auth`, `Courses`, `Certificates`, `Admin`, `Layout`, `Common`, `Metadata`). Component-specific: `Components.<Name>`. i18n data: `Intl.Countries.*`, `Intl.Languages.*`. Email: `Email.*`.

**Key types:** `IntlRecord<T = string>` (Record<Locale, T>), `Translator<NestedKey>`, `Namespace`, `MessageKey<T>`.

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

14. **React Compiler enabled:** `reactCompiler: true` at top level of `next.config.ts` (NOT inside `experimental`). Do not add manual `useMemo`/`useCallback` unless the compiler cannot handle the pattern.

15. **Never edit generated files:** `env.d.ts` and everything under `drizzle/` are auto-generated. Use `pnpm typegen` or `pnpm db generate`/`pnpm db migrate`.

16. **Remove unused translation keys:** After changes, scan all three translation files and source code. Remove unused keys from all three files simultaneously.

17. **No comments in new code:** Never add inline or JSDoc comments. Exception: `{/* Section */}` dividers in long JSX components. Do NOT touch comments in existing code.

18. **Certificate PDF template:** Inter font, teal `#0f766e`, GloRe header/logo, QR code linking to `/{username}?v={handle}`, reviewer signature block.

19. **Org admin uniqueness:** One admin per org (owner/creator). Representatives have same management rights except deletion. Use `isOrgAdmin` for management checks; `membership.role === 'admin'` for owner-exclusive operations.

20. **Certificate review workflow:** Only tutors review. Tutor auto-assigned as reviewer. Review form MUST allow editing activity fields and skills/evaluations. Status: `draft` > `submitted` > `in_review` > `approved` or `changes_requested`.

21. **Registration creates org request:** New users register and request to join an existing org (status `pending`). Platform admin approves/rejects.

22. **Env vars require env.ts entry:** Every env var used by Next.js MUST be in the Zod schema at `src/lib/env.ts`. See `.agents/specs/reference.md` for the full table.

23. **`validateEnv` at startup only:** Called from `next.config.ts` (phase-guarded) and `src/instrumentation.ts`. Never from application code.

24. **Organization profile table split:** Sparse profile fields in `organization_profiles`, core identity in `organizations`. Query parsers must flatten profile fields for downstream use.

---

## Coding Patterns (ENFORCED)

> **MANDATORY:** Every agent MUST follow these patterns with NO exceptions.

### Functions and exports

- **Always `const` arrow functions**, never `function` keyword
- **Never specify return types** unless required for type narrowing, overloads, or recursive types
- **Concise arrow body** for single expressions (enforced by `arrow-body-style: as-needed`)
- **Named exports inline**: `export const Foo = () => ...` (never declare then export separately)
- **Default exports direct**: `export default () => ...` or `export default async () => ...`

### Control flow

- **`if/else`, `else if`, and `else` are FORBIDDEN.** Use guard clauses (early returns) only:

```typescript
if (score >= 90) return 'excellent'
if (score >= 70) return 'good'
return 'needs-improvement'
```

### Types

- **`interface` over `type`** for object shapes
- **Inline type imports**: `import { type Foo }` not `import type { Foo }`
- **Array shorthand**: `string[]` not `Array<string>`
- **Omit inferrable types**: `const x = 5` not `const x: number = 5`

### Iteration and promises

- **`for..of`** for loops, **`map`/`filter`/`reduce`** for transforms, **never `.forEach()`** or C-style `for`
- **`await`** always, never `.then()/.catch()` chains
- **`Promise.all()`** for parallel independent operations
- **Template literals** over string concatenation

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

- Create subdirectories as needed (`tmp/test-output/`, `tmp/scratch/`)
- **Delete every file you create in `tmp/` before ending your turn**
- Tool output (grep results, typecheck logs, build logs, etc.) is ALWAYS deleted when done
- Never commit contents of `tmp/`

---

## Auto Updates

> **MANDATORY:** Agents MUST keep `AGENTS.md` and `README.md` in sync with the codebase. No confirmation needed.

**When to update AGENTS.md:** Adding routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or any structural/architectural change.

**When to update README.md:** Adding features, changing setup steps, modifying scripts, structural changes.

**Rules:** Edit directly. Never edit `CLAUDE.md` (it only contains `@AGENTS.md`). Keep formatting and table structure.
