<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# `AGENTS.md`

GloRe Certificate — multilingual e-learning platform for soft skills certification, built with Next.js 16, React 19, Neon (Postgres), Drizzle ORM, and Tailwind CSS 4.

> **MANDATORY:** Every agent working on this codebase MUST follow ALL rules in this file without exception. This file is the single source of truth for coding patterns, conventions, and workflows. Agents MUST auto-update this file whenever they make structural or architectural changes (see [Auto Updates](#auto-updates)).

---

## Commands

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm install`      | Install dependencies                           |
| `pnpm dev`          | Start Next.js dev server on port 3030          |
| `pnpm build`        | Production build                               |
| `pnpm start`        | Start production server on port 3030           |
| `pnpm email`        | Preview email templates on port 3031           |
| `pnpm lint`         | Lint with oxlint                               |
| `pnpm lint:fix`     | Auto-fix lint issues                           |
| `pnpm format`       | Format with oxfmt                              |
| `pnpm format:check` | Check formatting without writing               |
| `pnpm check`        | Type-check + lint + format check (in sequence) |
| `pnpm check:size`   | Bundle size check                              |
| `pnpm typecheck`    | Type-check only (`tsc --noEmit`)               |
| `pnpm typegen`      | Generate env types → `env.d.ts`                |
| `pnpm analyze`      | Next.js bundle analyzer                        |
| `pnpm release`      | Create a release (release-it)                  |
| `pnpm skills`       | Install agent skills from `skills-lock.json`   |
| `pnpm db <command>` | Run drizzle-kit commands                       |

**Pre-commit validation:** Run `pnpm check` before committing. This runs `tsc --noEmit`, oxlint, and `oxfmt --check` in sequence.

**Git hooks:** Husky manages hooks. Commitlint enforces conventional commits with sentence-case subjects. Allowed scopes: `deps`, `deps-dev`, `dev`, `release`, `security`.

---

## Stack

| Category         | Technology                                            | Version           |
| ---------------- | ----------------------------------------------------- | ----------------- |
| Framework        | Next.js (App Router, RSC, Cached Components)          | ^16.1.6           |
| Language         | TypeScript (strict mode)                              | ^5.9.3            |
| Runtime          | React                                                 | ^19.2.4           |
| Package manager  | pnpm                                                  | 10.29.1           |
| Database         | Neon Serverless Postgres (`@neondatabase/serverless`) | ^0.10.4           |
| ORM              | Drizzle ORM + drizzle-kit                             | ^0.44.0 / ^0.30.0 |
| Auth             | Better Auth (`better-auth`)                           | ^1.5.4            |
| Storage          | Vercel Blob (`@vercel/blob`)                          | ^0.27.0           |
| Linter           | oxlint (`.oxlintrc.json`)                             | latest            |
| Formatter        | oxfmt (`.oxfmtrc.json`)                               | latest            |
| Styling          | Tailwind CSS                                          | ^4.1.18           |
| UI Components    | shadcn/ui (new-york style)                            | ^3.8.4            |
| Rich text editor | Plate.js                                              | ^52.0.17          |
| i18n             | next-intl                                             | ^4.8.2            |
| Forms            | react-hook-form + zod                                 | ^7.71.1 / ^4.3.6  |
| State            | nuqs (URL state)                                      | ^2.8.8            |
| Email            | Nodemailer (SMTP)                                     | ^8.0.2            |
| AI               | Vercel AI SDK + OpenAI                                | ^6.0.77 / ^3.0.26 |
| Animation        | motion                                                | ^12.33.0          |
| DnD              | @dnd-kit                                              | ^6.3.1            |
| Icons            | lucide-react                                          | ^0.563.0          |
| Deployment       | Vercel                                                | ^50.13.2          |
| Analytics        | @vercel/analytics + @vercel/speed-insights            | ^1.6.1 / ^1.3.1   |
| Dates            | date-fns                                              | ^4.1.0            |
| Search           | fuse.js                                               | ^7.1.0            |
| Agent Skills     | skills CLI (https://skills.sh)                        | latest            |

---

## Agent Skills

This project uses [Agent Skills](https://skills.sh) (`skills` CLI) to provide domain-specific knowledge to AI agents. Skills are managed via symlinks in `.agents/skills/` and tracked in `skills-lock.json`.

### Setup

```bash
pnpm skills                           # Install all skills from skills-lock.json
skills experimental_install <name>    # Install a new external skill
skills list                           # List installed skills
skills help                           # Show all CLI commands
```

### Installed skills

| Skill                         | Source                      | Purpose                                             | When to use                                                                         |
| ----------------------------- | --------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `frontend-design`             | `anthropics/skills`         | Production-grade UI design with bold aesthetics     | **ALWAYS** when building/styling UI components, pages, layouts                      |
| `neon-auth`                   | `neondatabase/ai-rules`     | Neon Auth setup and configuration                   | When modifying auth flows, routes, or session management                            |
| `neon-drizzle`                | `neondatabase/ai-rules`     | Drizzle ORM + Neon database setup                   | When creating/modifying schemas, migrations, or database configuration              |
| `neon-postgres`               | `neondatabase/agent-skills` | Neon Serverless Postgres best practices             | When working with database queries, branching, or Neon platform features            |
| `vercel-react-best-practices` | `vercel-labs/agent-skills`  | 58 performance optimization rules for React/Next.js | **ALWAYS** when writing/reviewing React components, data fetching, or Next.js pages |
| `web-design-guidelines`       | `vercel-labs/agent-skills`  | Web Interface Guidelines compliance review          | When reviewing UI accessibility, UX patterns, or design compliance                  |
| `agents-md`                   | custom                      | Update AGENTS.md via `/agents-md <instruction>`     | When adding rules, syncing with codebase, or performing major AGENTS.md updates     |

### Skill enforcement rules

Agents MUST autonomously read and apply the relevant skill(s) before starting work:

1. **Any UI work** → Read `frontend-design/SKILL.md` AND `vercel-react-best-practices/SKILL.md`. Use shadcn/ui components from `components.json` (new-york style). Composable component patterns are mandatory.
2. **Any React/Next.js code** → Read `vercel-react-best-practices/SKILL.md`. Apply the 58 rules by priority (CRITICAL → HIGH → MEDIUM → LOW).
3. **Database/schema changes** → Read `neon-drizzle/SKILL.md` and `neon-postgres/SKILL.md`.
4. **Auth modifications** → Read `neon-auth/SKILL.md`.
5. **UI review requests** → Read `web-design-guidelines/SKILL.md`, fetch the latest guidelines, and produce terse `file:line` output.
6. **AGENTS.md updates** → Read `agents-md/SKILL.md`. Follow the workflow for add/remove/update operations.

### Creating custom skills

Custom skills can be created in `.agents/skills/` following the [Agent Skills format](https://agentskills.io):

1. Create a folder in `.agents/skills/<skill-name>/` with at minimum a `SKILL.md` file
2. The `SKILL.md` must have YAML frontmatter with `name` and `description` fields
3. **To track a custom skill in git:** Add `!<skill-name>` to `.agents/skills/.gitignore` (external skills installed via `skills` CLI are gitignored by default; only custom skills need explicit tracking)
4. If an agent creates a custom skill, it MUST ask the user whether to track it in git, and if yes, add the exclusion to `.agents/skills/.gitignore`

### Skills directory structure

```
.agents/
└── skills/
    ├── .gitignore              # Ignores all folders; add !<name> to track custom skills
    ├── agents-md/              # AGENTS.md update skill (custom, git-tracked)
    ├── frontend-design/        # UI design patterns (external)
    ├── neon-auth/              # Auth setup guides (external)
    ├── neon-drizzle/           # Drizzle ORM guides (external)
    ├── neon-postgres/          # Postgres best practices (external)
    ├── vercel-react-best-practices/  # React/Next.js performance (external)
    └── web-design-guidelines/  # Web Interface Guidelines (external)
```

---

## Architecture

```
src/
├── actions/            # Server actions (mutations and cached queries)
│   ├── admin.ts        # Team management, invitations
│   ├── auth.ts         # Login, logout, password reset, getAuthUser
│   ├── certificate.ts  # Certificate queries
│   ├── cookies.ts      # Typed cookie get/set/delete (wraps next/headers cookies)
│   ├── course.ts       # Course + lesson CRUD, cached queries
│   ├── onboarding.ts   # Complete onboarding flow
│   ├── storage.ts      # Avatar upload/remove via Vercel Blob
│   └── user.ts         # User CRUD, getCurrentUser (cached)
├── app/                # App Router pages and layouts
│   ├── layout.tsx      # Root layout (providers, analytics, JSON-LD)
│   ├── error.tsx       # Global error boundary (client)
│   ├── not-found.tsx   # Global 404 (server)
│   ├── globals.css     # Tailwind imports, theme tokens, animations
│   ├── (auth)/         # Unauthenticated routes (login, onboarding)
│   ├── (dashboard)/    # Authenticated routes (sidebar layout)
│   └── api/            # API routes (auth catch-all + v1/)
├── components/
│   ├── blocks/         # Complex composed blocks (rich-text-editor)
│   ├── features/       # Domain components grouped by feature
│   ├── icons/          # Custom SVG icon components + Lucide lazy wrapper
│   ├── layout/         # Shell components (sidebar, page header, fallbacks)
│   ├── providers/      # Context providers (session, i18n, theme, courses)
│   └── ui/             # shadcn/ui primitives and custom UI components
├── db/
│   ├── client.ts       # Neon + Drizzle client (neon HTTP driver)
│   ├── helpers.ts      # safeQuery(), queryError()
│   ├── types.ts        # Drizzle table type helpers (InferSelectModel, InferInsertModel)
│   ├── schema/         # Drizzle schema definitions per table
│   └── queries/        # Query parse functions per table
├── hooks/              # Custom React hooks
├── lib/                # Utilities, constants, types
│   ├── auth/           # Better Auth server + client instances
│   ├── cache.ts        # CacheTag enum
│   ├── constants.ts    # Route roots, regex validators
│   ├── cookies.ts      # Cookie type definitions, prefix helpers
│   ├── email.ts        # Nodemailer SMTP transport (sendMail utility)
│   ├── i18n.ts         # i18n config, Locale/Messages types, localizeRecord()
│   ├── metadata.ts     # App metadata, viewport, intlMetadata()
│   ├── storage.ts      # Storage URL helpers
│   ├── types.ts        # Shared types (Icon, IconProps, Any, Enum, etc.)
│   └── utils.ts        # cn(), debounce(), throttle(), camelize(), etc.
├── i18n.ts             # next-intl request config
└── proxy.ts            # NextProxy middleware (auth guard)
config/                 # Static JSON configuration
├── app.json            # Feature settings (minSkills, minRating, etc.)
├── i18n.json           # Locales, default locale, title-case locales
├── metadata.json       # App name, version, URL, SEO data
└── theme.json          # Theme modes, colors, breakpoints
drizzle/                # drizzle-kit output — auto-generated, do not edit manually
├── *.sql               # Migration SQL files (one per `pnpm db generate` run)
└── meta/               # Schema snapshots and migration journal
    ├── _journal.json
    └── *_snapshot.json
messages/               # Translation files
├── en.json
├── es.json
└── it.json
scripts/
└── typegen.ts          # Env + route type generation script
tmp/                    # Temporary files (git-ignored, see Temporary Files section)
```

### File naming conventions

- All files: **kebab-case** (enforced by oxlint `unicorn/filename-case`)
- Components: one component per file, named exports preferred
- Feature components: grouped by domain under `features/<domain>/`, sub-features in sub-folders
  - Drop domain prefix from filenames: `features/courses/editor/view.tsx` (not `course-editor-view.tsx`)
  - Context/params at sub-feature root: `context.tsx`, `params.ts`, `use-params.ts`
- Provider pattern: split into `*-context.tsx` + `*-provider.tsx`
- Database queries: `src/db/queries/<table>.ts` with `parse*` function
- Database schema: `src/db/schema/<table>.ts` with Drizzle table definitions

---

## Routing

### Route table

| Path                 | Auth               | Layout    | Description          |
| -------------------- | ------------------ | --------- | -------------------- |
| `/login`             | Public             | Root      | Login page           |
| `/onboarding`        | Auth (pre-onboard) | Root      | Onboarding form      |
| `/onboarding/error`  | Auth (pre-onboard) | Root      | Onboarding error     |
| `/dashboard`         | Auth               | Dashboard | Main dashboard       |
| `/about`             | Auth               | Dashboard | About page           |
| `/admin`             | Auth + `is_admin`  | Dashboard | Admin panel          |
| `/certificates`      | Auth + non-editor  | Dashboard | Certificate list     |
| `/certificates/new`  | Auth + non-editor  | Dashboard | New certificate      |
| `/certificates/[id]` | Auth + non-editor  | Dashboard | Certificate detail   |
| `/courses`           | Auth               | Dashboard | Course list          |
| `/courses/[slug]`    | Auth               | Dashboard | Course detail/editor |
| `/docs`              | Auth               | Dashboard | Documentation        |
| `/docs/intro`        | Auth               | Dashboard | Introduction docs    |
| `/docs/faq`          | Auth               | Dashboard | FAQ docs             |
| `/docs/tutorials`    | Auth               | Dashboard | Tutorial docs        |
| `/help`              | Auth               | Dashboard | Help page            |
| `/settings`          | Auth               | Dashboard | User settings        |

### API routes

| Path                  | Method   | Description                                    |
| --------------------- | -------- | ---------------------------------------------- |
| `/api/auth/[...path]` | GET/POST | Neon Auth catch-all handler                    |
| `/api/v1/ai/command`  | POST     | AI command endpoint                            |
| `/api/v1/ai/copilot`  | POST     | AI copilot endpoint                            |
| `/api/v1/health`      | GET      | Health check (cron: daily at midnight)         |
| `/api/v1/join`        | GET      | Team invitation join endpoint                  |
| `/api/v1/manifest`    | GET      | Dynamic PWA manifest (locale-aware, cached 1h) |
| `/api/v1/upload`      | POST     | File upload (UploadThing)                      |

### Route groups

| Group         | Purpose                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `(auth)`      | Unauthenticated pages — login, onboarding. No shared layout beyond root.                                |
| `(dashboard)` | Authenticated pages with sidebar. Wrapped in `SidebarProvider` → `SessionProvider` → `CoursesProvider`. |

### Redirects

- `/` → `/dashboard` (permanent redirect in `next.config.ts`)

---

## Authentication Flow

**Provider:** Better Auth (`better-auth`) — stores users/sessions/accounts in Neon database via Drizzle adapter

**Request lifecycle:**

1. `proxy.ts` (NextProxy) intercepts all non-static requests
2. `auth.api.getSession()` validates session via signed HTTP-only cookies
3. Unauthenticated → redirect to `/login`
4. Authenticated but not onboarded (`onboarded_at` is null) → redirect to `/onboarding`
5. Onboarded accessing `/onboarding` → redirect to `/dashboard`
6. Authenticated accessing `/login` → redirect to `/dashboard`

**Token storage:** Better Auth manages session tokens in signed HTTP-only cookies. Session data is cached in cookies (5-minute TTL) to reduce API calls.

**Cookie prefix:** All app cookies use `gl` prefix. Better Auth session cookies use `gl.` prefix via `advanced.cookiePrefix`.

**Auth instances:**

| Instance     | Location                 | Use case                                           |
| ------------ | ------------------------ | -------------------------------------------------- |
| `auth`       | `src/lib/auth/server.ts` | Server components, actions, proxy — `betterAuth()` |
| `authClient` | `src/lib/auth/client.ts` | Client components — `createAuthClient()`           |

**Plugins:**

| Plugin          | Purpose                              |
| --------------- | ------------------------------------ |
| `username()`    | Username/display username support    |
| `admin()`       | Admin role management, user creation |
| `nextCookies()` | Next.js cookie integration           |

**Auth API route:** `src/app/api/auth/[...all]/route.ts` — catch-all handler for all auth requests (sign-in, sign-up, session management, password reset, admin operations)

**Email:** Nodemailer SMTP transport (`src/lib/email.ts`) for transactional emails (invitations, notifications). Auth server has its own transport for password reset emails.

**Database client:**

| Client | Location           | Use case                                    |
| ------ | ------------------ | ------------------------------------------- |
| `db`   | `src/db/client.ts` | Drizzle ORM client via `neon()` HTTP driver |

---

## Data Fetching

### Query pattern

```typescript
// 1. Define interface extending InferSelectModel (src/db/queries/<table>.ts)
export interface Certificate extends InferSelectModel<typeof certificates> {
  organization: InferSelectModel<typeof organizations>
  reviewer: InferSelectModel<typeof users> | null
}

// 2. Define parser for computed fields
export const parseUser = (data: InferSelectModel<typeof users> & { memberships: ..., regions: ... }) => ({
  ...data,
  canEdit: Boolean(data.isAdmin || data.isEditor),
})

// 3. Derive type from parser
export type User = ReturnType<typeof parseUser>
```

### Drizzle query pattern

```typescript
// Server action with cache
const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(CacheTag.User)

  return await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  })
}

// Exposed action with cache bypass option
export const findUser = async (id: string, { cache = true } = {}) => {
  if (!cache) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  }
  const { data, error } = await fetchUser(id)
  if (error || !data) throw error || new Error('User not found')
  return data
}
```

### Error handling

- `safeQuery()` wraps a query function in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return `{ data, error }` or `{ error }` — callers check for errors
- Mutations that fail throw; queries that fail return error objects

### Cache strategy

**Cache tags** (defined in `src/lib/cache.ts` `CacheTag` enum):

| Tag                | Used by                                   |
| ------------------ | ----------------------------------------- |
| `auth-user`        | `fetchAuthUser`                           |
| `auth-user-status` | `logout`                                  |
| `course`           | `fetchCourse` (per-slug: `course-{slug}`) |
| `courses`          | `fetchCourses`                            |
| `doc-articles`     | Documentation articles                    |
| `doc-categories`   | Documentation categories                  |
| `skill-groups`     | `listSkillGroups`                         |
| `team-members`     | `fetchTeamMembers`                        |
| `user`             | `fetchUser`                               |
| `user-email`       | `fetchUserEmail`                          |

**Patterns:**

- `'use cache'` directive on inner fetch functions
- `cacheTag()` to tag cached data
- `cacheLife('max')` for long-lived caches
- `revalidateTag(tag, 'max')` after mutations
- React `cache()` for request-level deduplication
- `{ cache: false }` option to bypass `'use cache'` in actions

---

## Internationalization

**Library:** next-intl ^4.8.2

**Locales:** `en` (default), `es`, `it`

**Title-case locales:** `en` only

**Configuration:** `src/lib/i18n.ts` reads from `config/i18n.json`

**Request config:** `src/i18n.ts` — uses `getRequestConfig` from next-intl/server

**Locale storage:** Cookie named `NEXT_LOCALE` (no prefix)

**Message files:** `messages/{locale}.json`

**Namespace conventions:**

| Namespace                                   | Purpose                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| `Metadata`                                  | Page titles, descriptions, SEO                                         |
| `Common`                                    | Shared strings (actions, labels)                                       |
| `Components.*`                              | Component-specific (`Components.MultiSelect`, `Components.IconPicker`) |
| `Layout`                                    | Shell, navigation, footer                                              |
| `Auth`                                      | Authentication pages                                                   |
| `Courses`, `Certificates`, `Users`, `Admin` | Feature pages                                                          |
| `Intl.Countries.*`, `Intl.Languages.*`      | Country/language names                                                 |
| `Email.*`                                   | Email template strings                                                 |

**Key types:**

- `IntlRecord<T = string>` — `Record<Locale, T>` for multilingual DB fields
- `Translator<NestedKey>` — Typed translator function
- `Namespace` — Union of all valid namespace keys
- `MessageKey<T>` — Valid message keys for a namespace

**Adding a new translation:**

1. Add key to `messages/en.json` under the appropriate namespace
2. Add translations to `messages/es.json` and `messages/it.json`
3. Use `useTranslations('Namespace')` in client components or `getTranslations('Namespace')` in server components
4. Run `pnpm check i18n` to validate

---

## Component Patterns

### Export conventions

- **Named exports** preferred for components — always exported inline (see [Coding Patterns](#named-exports))
- **Default exports** for page components and email templates
- **Arrow functions (`const`)** for all components — never `function` keyword

### Server vs client components

- **Server Components** by default
- `'use client'` only when interactivity is needed (hooks, event handlers, browser APIs)
- Layout guards (admin, certificates) are server components that call `notFound()`

### Variant pattern

CVA (`class-variance-authority`) for component variants:

```typescript
import { cva } from 'class-variance-authority'
const buttonVariants = cva('base-classes', {
  variants: { variant: { default: '...', outline: '...' }, size: { sm: '...', lg: '...' } },
  defaultVariants: { variant: 'default', size: 'sm' },
})
```

oxfmt `sortTailwindcss` recognizes `cn` and `cva` functions for class sorting.

### Context/Provider pattern

Split into two files:

- `*-context.tsx` — context creation, hook logic, `createContext`, provider component
- `*-provider.tsx` — server-side data fetching, wraps context provider

Provider hierarchy (root layout):

```
SearchParamsProvider → I18nProvider → ThemeProvider
```

Dashboard layout adds:

```
SidebarProvider → SessionProvider → CoursesProvider
```

### Icon system

- **Lucide icons:** `lucide-react` with lazy loading via `src/components/icons/lucide.tsx`
  - Uses `Map` cache for `lazy()` components to avoid re-creation
  - Wrapped in `Suspense` with fallback
  - Import as `LucideIcon` with `name` prop (type: `IconName`)
- **Custom icons:** `src/components/icons/` — `GloreIcon`, `DashboardIcon`, `ErrorIcon`, etc.
- **Database icon field:** Courses store icon as `IconName` string

### URL state management

Uses `nuqs` for URL search params with type-safe parsers. Feature-specific `params.ts` + `use-params.ts` files define param schemas and hooks.

---

## Code Style

### Formatter (oxfmt — `.oxfmtrc.json`)

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

### Key lint rules (oxlint — `.oxlintrc.json`)

| Rule                                      | Setting                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `unicorn/no-array-for-each`               | Error — use `for..of`, `map`, `reduce`                   |
| `unicorn/no-for-loop`                     | Error — use `for..of`                                    |
| `eslint/arrow-body-style`                 | Error — concise arrow body (`as-needed`)                 |
| `eslint/no-else-return`                   | Error — use early returns                                |
| `eslint/prefer-arrow-callback`            | Error — arrow functions in callbacks                     |
| `eslint/prefer-const`                     | Error                                                    |
| `eslint/prefer-template`                  | Error — template literals over concatenation             |
| `eslint/require-await`                    | Error — async functions must await                       |
| `eslint/no-console`                       | Warn — only `info`, `error`, `warn` allowed              |
| `eslint/no-restricted-imports`            | Error — `../**` parent imports blocked                   |
| `import/no-relative-parent-imports`       | Error — use `@/` or `~/` path aliases                    |
| `import/consistent-type-specifier-style`  | Error — inline type imports                              |
| `import/no-namespace`                     | Error (except `src/components/ui/*`, `src/db/client.ts`) |
| `import/no-cycle`                         | Error                                                    |
| `import/no-commonjs`                      | Error — ESM only                                         |
| `typescript/consistent-type-definitions`  | Error — prefer `interface`                               |
| `typescript/consistent-type-imports`      | Error — inline type imports                              |
| `typescript/array-type`                   | Error — shorthand (`T[]`)                                |
| `typescript/no-inferrable-types`          | Error — omit obvious types                               |
| `typescript/no-explicit-any`              | Warn (only `src/lib/types.ts` may use `any`)             |
| `unicorn/filename-case`                   | Error — kebab-case                                       |
| `react/jsx-fragments`                     | Error — syntax fragments (`<>`) only                     |
| `react/jsx-no-constructed-context-values` | Error                                                    |
| `react/self-closing-comp`                 | Error                                                    |
| `promise/prefer-await-to-then`            | Error — use `await` over `.then()`                       |

### Lint overrides

| Files                                         | Override                  |
| --------------------------------------------- | ------------------------- |
| `src/components/ui/*.tsx`, `src/db/client.ts` | `import/no-namespace` off |

---

## Type System

### TypeScript config

| Setting              | Value       |
| -------------------- | ----------- |
| `strict`             | `true`      |
| `noImplicitAny`      | `true`      |
| `noUnusedLocals`     | `true`      |
| `noUnusedParameters` | `true`      |
| `target`             | `esnext`    |
| `module`             | `esnext`    |
| `moduleResolution`   | `bundler`   |
| `jsx`                | `react-jsx` |

### Path aliases

| Alias          | Maps to        |
| -------------- | -------------- |
| `@/*`          | `./src/*`      |
| `~/config/*`   | `./config/*`   |
| `~/messages/*` | `./messages/*` |

### Custom type helpers (`src/lib/types.ts`)

| Type                      | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `Any`                     | Escape hatch (only in `src/lib/types.ts`)           |
| `AnyRecord`               | `Record<string \| number \| symbol, any>`           |
| `AnyFunction`             | `(...args: any[]) => any`                           |
| `Icon<T>`, `IconProps<T>` | SVG component prop types extending LucideProps      |
| `IconName`                | Re-export from `lucide-react/dynamic`               |
| `Rgb`                     | `[number, number, number]` tuple                    |
| `Enum<T>`                 | `T \| \`${T}\`` — allows string literal or template |
| `PartialKeys<T, K>`       | Make specific keys optional                         |
| `Replace<S, From, To>`    | String replacement at type level                    |
| `HttpUrl`                 | `\`http://${string}\` \| \`https://${string}\``     |

### Database types (`src/db/types.ts`)

| Type             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `TableMap`       | Interface mapping snake_case names to Drizzle table objects |
| `TableName`      | Union of all table names (`keyof TableMap`)                 |
| `TableRow<T>`    | `InferSelectModel` for a table                              |
| `TableInsert<T>` | `InferInsertModel` for a table                              |
| `TableUpdate<T>` | `Partial<InferInsertModel>` for a table                     |
| `Enums`          | Interface of database enum types                            |
| `EnumType<T>`    | Extract a specific enum type                                |

### Enum pattern

- TypeScript `enum` only for `CacheTag`
- All other enums use `satisfies` + `as const` on arrays/objects
- Example: `COURSE_TYPES = ['intro', 'skill', 'learner'] satisfies Enums<'course_type'>[]`
- DB enums: `certificate_status` (`'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'`), `course_type` (`'intro' | 'skill' | 'learner'`), `role` (`'admin' | 'learner' | 'tutor' | 'representative' | 'volunteer'`)

---

## Utility Functions (`src/lib/utils.ts`)

| Function                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `cn(...inputs)`             | Merge Tailwind classes (extended `tailwind-merge` + `cx`) |
| `isProduction`              | `process.env.NODE_ENV === 'production'`                   |
| `hexToRgb(record)`          | Convert hex color record to RGB tuples                    |
| `isValidUsername(value)`    | Validate email or username format                         |
| `defaultFormDisabled(form)` | Check if form is pristine or has errors                   |
| `titleize(input)`           | Title-case string (words >3 chars capitalized)            |
| `camelize(input)`           | Convert to camelCase (typed)                              |
| `random(min, max)`          | Random integer in range                                   |
| `keysOf(record)`            | Type-safe `Object.keys()`                                 |
| `pluck(array, key)`         | Extract values of a key from array of objects             |
| `omit(record, keys)`        | Omit keys from object                                     |
| `debounce(callback, delay)` | Debounce with `.cancel()` and `.flush()`                  |
| `throttle(callback, limit)` | Throttle function calls                                   |
| `sleep(ms)`                 | Promise-based delay                                       |
| `noop()`                    | No-op function                                            |

---

## Custom Hooks

| Hook               | Purpose                               | Key behavior                                                                                                                                                                 |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useComposedRefs`  | Compose multiple refs into one        | Handles React 19 cleanup refs                                                                                                                                                |
| `useCookies`       | Browser-side typed cookie management  | Uses `document.cookie`; JSON serialize/parse; supports prefix                                                                                                                |
| `useDebounce`      | Debounce a value                      | Default 500ms delay                                                                                                                                                          |
| `useDevice`        | Detect device type and touch          | Uses `window.matchMedia`; configurable breakpoint (default 768px)                                                                                                            |
| `useFileUpload`    | UploadThing file upload with progress | Tracks progress, shows toast on error                                                                                                                                        |
| `useI18n`          | Access i18n context                   | Reads from `I18nContext`; throws if outside provider                                                                                                                         |
| `useMetadata`      | Client-side document metadata updates | Updates `<meta>` tags, PWA title formatting, 100ms delay                                                                                                                     |
| `useMounted`       | Check if component has mounted        | For hydration-safe rendering                                                                                                                                                 |
| `usePWA`           | Detect PWA display mode               | Detects TWA, Standalone, MinimalUI, Fullscreen, Browser                                                                                                                      |
| `useScroll`        | Track scroll position                 | Throttled at 100ms; returns `{ scroll, scrolled }`                                                                                                                           |
| `useSession`       | Access session context                | Reads from `SessionContext`; throws if outside provider; user includes `isOrgAdmin`, `isLearner`, `isRepresentative`, `isTutor`, `isVolunteer` computed from active org role |
| `useSidebarResize` | Drag-to-resize sidebar                | Configurable min/max widths; collapse/expand thresholds                                                                                                                      |
| `useTheme`         | Theme with cookie + view transitions  | Extends next-themes; uses View Transitions API; respects `prefers-reduced-motion`                                                                                            |

---

## Theming & Styling

### Color system

Uses **OKLCH** color space. CSS custom properties defined in `src/app/globals.css` with light/dark variants.

**Semantic tokens:**

| Token                                                  | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `--background` / `--foreground`                        | Base page colors                                      |
| `--card` / `--card-foreground`                         | Card surfaces                                         |
| `--popover` / `--popover-foreground`                   | Popover surfaces                                      |
| `--primary` / `--primary-foreground`                   | Primary actions                                       |
| `--secondary` / `--secondary-foreground`               | Secondary actions                                     |
| `--muted` / `--muted-foreground`                       | Muted/disabled elements                               |
| `--accent` / `--accent-foreground`                     | Accent highlights                                     |
| `--brand` / `--brand-accent` / `--brand-foreground`    | Brand primary (teal)                                  |
| `--brand-secondary` / `--brand-secondary-*`            | Brand secondary (olive)                               |
| `--brand-tertiary` / `--brand-tertiary-*`              | Brand tertiary (navy)                                 |
| `--link` / `--link-accent`                             | Link colors                                           |
| `--info` / `--success` / `--warning` / `--destructive` | Status colors (each with `-accent` and `-foreground`) |
| `--border` / `--input` / `--ring`                      | Interactive element borders                           |
| `--sidebar-*`                                          | Sidebar-specific tokens                               |
| `--editor-highlight`                                   | Rich text editor highlight                            |
| `--chart-1` through `--chart-5`                        | Chart colors                                          |

**Border radius:** `--radius: 0.625rem` with computed `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

**Custom utilities:** `text-stroke-*` (webkit text stroke width and color).

**Animations:**

- `shine` — shimmer effect (3s ease-out infinite)
- `gradient-flow` — background gradient animation (10s ease infinite)

**Theme switching:** Uses `next-themes` with `class` attribute strategy. Supports `system`, `light`, `dark`. View Transitions API used for smooth theme changes (with fallback for browsers without support).

**Mobile breakpoint:** 768px (from `config/theme.json`)

---

## Form Patterns

**Library:** `react-hook-form` + `@hookform/resolvers` with `zod` validation.

**Patterns:**

- Zod schemas for form validation
- `defaultFormDisabled(form)` — utility to check if form submit button should be disabled
- `sonner` toast for user feedback: `toast.success()`, `toast.error()`
- Server actions called from form `onSubmit` handlers

---

## Email Templates

**Templates** in `src/email/templates/`:

| Template         | Path                       |
| ---------------- | -------------------------- |
| Auth recovery    | `auth/recovery`            |
| Auth invite      | `auth/invite`              |
| Team invite      | `team/invite`              |
| Password changed | `account/password-changed` |
| Email changed    | `account/email-changed`    |

**SMTP config:** `emailjs` client with settings from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`).

**Email rendering:** `@react-email/render` with `pretty` output + `toPlainText` fallback.

---

## Environment Variables

| Variable             | Purpose                            | Scope  |
| -------------------- | ---------------------------------- | ------ |
| `APP_URL`            | Application base URL               | Server |
| `BETTER_AUTH_SECRET` | Better Auth secret key             | Server |
| `BETTER_AUTH_URL`    | Better Auth base URL               | Server |
| `COOKIE_PREFIX`      | App cookie prefix (default: `gl_`) | Server |
| `DATABASE_URL`       | Neon Postgres connection string    | Server |
| `OPENAI_API_KEY`     | OpenAI API key                     | Server |
| `OPENAI_MODEL`       | OpenAI model name (e.g., `gpt-4o`) | Server |
| `SMTP_HOST`          | SMTP server hostname               | Server |
| `SMTP_PORT`          | SMTP port                          | Server |
| `SMTP_USER`          | SMTP username                      | Server |
| `SMTP_PASSWORD`      | SMTP password                      | Server |
| `SMTP_SENDER`        | Email sender address               | Server |
| `GITHUB_TOKEN`       | GitHub personal access token       | Server |
| `VERCEL_TOKEN`       | Vercel CLI token                   | Server |

---

## Static Data

| File                   | Purpose                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `config/app.json`      | Feature settings (`minSkills: 3`, `minRating: 3`, `mapsUrl`, `sidebarShortcut: "s"`) |
| `config/i18n.json`     | Locale definitions, default locale, title-case locales, hardcoded messages           |
| `config/metadata.json` | App name, version, URL, email, keywords, authors                                     |
| `config/theme.json`    | Theme modes, breakpoints, hex color palette for light/dark                           |

---

## Constants Reference (`src/lib/constants.ts`)

| Constant            | Value                                                      | Purpose                     |
| ------------------- | ---------------------------------------------------------- | --------------------------- |
| `AUTH_ROOT`         | `'/login'`                                                 | Login page route            |
| `APP_ROOT`          | `'/dashboard'`                                             | Default authenticated route |
| `JOIN_ROOT`         | `'/api/v1/join'`                                           | Team invitation endpoint    |
| `ONBOARDING_ROOT`   | `'/onboarding'`                                            | Onboarding route            |
| `EMAIL_REGEX`       | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`                             | Email validation            |
| `USERNAME_REGEX`    | `/^(?!\.)(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9.]+$/`               | Username validation         |
| `PASSWORD_REGEX`    | `/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/` | Password strength           |
| `SLUG_REGEX`        | `/^(?!.*--)(?!.*-$)[a-z0-9-]+$/`                           | URL slug validation         |
| `CAMEL_CASE_REGEX`  | `/[\s_.\\/-]+/`                                            | CamelCase split pattern     |
| `WHITESPACES_REGEX` | `/\s+/`                                                    | Whitespace matching         |

---

## Error Handling

**Global error boundary:** `src/app/error.tsx` (client component) — logs error, offers "go back" / "back to home" / "refresh page" actions.

**Global 404:** `src/app/not-found.tsx` (server component) — checks auth to show appropriate link.

**Layout guards:** Admin layout calls `notFound()` if `!user.is_admin`. Certificates layout calls `notFound()` if `user.canEdit`.

**Database errors:**

- `safeQuery()` returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return error objects — callers must check

**User feedback:** `sonner` toast notifications via `toast.success()`, `toast.error()`.

---

## Gotchas & Critical Behaviors

1. **Cookie import restriction:** Never import `cookies` from `next/headers` directly. Use `@/actions/cookies` which provides typed `get`/`set`/`delete` with prefix management.

2. **Parent imports blocked:** `../**` imports are blocked by oxlint. Always use `@/` or `~/` path aliases.

3. **Proxy vs middleware:** The app uses `NextProxy` (`src/proxy.ts`), not standard Next.js `middleware.ts`. The proxy handles auth checks, onboarding redirects, and session management.

4. **`'use cache'` + `cacheTag`:** Cache functions are inner functions that wrap the actual database query. The outer exposed function accepts a `{ cache: boolean }` option to bypass caching.

5. **`safeQuery` wrapping:** `safeQuery()` wraps Drizzle queries in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`. Inner cached functions use `safeQuery()`; outer exposed functions check errors.

6. **IntlRecord fields:** Many database text fields are `IntlRecord` (JSON with locale keys), not plain strings. Use `localize(record)` from `useI18n()` to get the current locale value.

7. **No `any` allowed:** `any` type is only permitted in `src/lib/types.ts` (where `Any`/`AnyRecord`/`AnyFunction` are defined). Use the typed aliases elsewhere.

8. **No `forEach`:** Use `for..of`, `map`, or `reduce` instead. Enforced by oxlint `unicorn/no-array-for-each: error`.

9. **No JSX literals:** All user-facing strings must go through `next-intl` translations.

10. **Async page export pattern:** Page components use anonymous default export wrapping an async function: `export default async () => { ... }`.

11. **Lucide icon import:** Import types from `lucide-react`, but use the lazy `LucideIcon` component from `@/components/icons/lucide` for rendering. The `lucide-react` module is augmented to re-export from `lucide-react/dist/lucide-react.suffixed`.

12. **Build tsconfig:** Production builds use `tsconfig.build.json` which excludes dev types. The base `tsconfig.json` includes `.next/dev/types/**/*.ts`.

13. **Vercel cron:** `/api/v1/health` is hit daily at midnight by Vercel cron.

14. **`cacheComponents: true`:** Enabled in `next.config.ts` for Next.js cached components feature.

15. **Never edit generated files:** Files like `env.d.ts` and everything under `drizzle/` (migrations, snapshots, journal) are auto-generated and MUST NOT be edited manually. Use the corresponding generation command instead (`pnpm typegen` for `env.d.ts`, `pnpm db generate` / `pnpm db migrate` for `drizzle/`). If a codegen/typegen script exists for a file, always use it.

---

## Coding Patterns (ENFORCED)

> **MANDATORY:** Every agent MUST follow these patterns with NO exceptions. These rules apply to all generated, modified, or reviewed code.

### Function definitions

- **Always use `const` arrow functions** — never the `function` keyword:

```typescript
// ✅ Correct
const sum = (a: number, b: number) => a + b
const MyComponent = () => <div />
export default async () => { ... }

// ❌ Wrong — never use `function`
function sum(a: number, b: number) { return a + b }
function MyComponent() { return <div /> }
export default function Page() { ... }
```

### Return types

- **Never specify return types** unless they are required for type narrowing, overloads, or recursive types:

```typescript
// ✅ Correct — let TypeScript infer
const sum = (a: number, b: number) => a + b
const getUser = async (id: string) => { ... }

// ❌ Wrong — unnecessary explicit return type
const sum = (a: number, b: number): number => a + b
const getUser = async (id: string): Promise<User> => { ... }
```

### Control flow

- **Always use early returns** — never use `else` or `else if`:

```typescript
// ✅ Correct
const getStatus = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  return 'needs-improvement'
}

// ❌ Wrong
const getStatus = (score: number) => {
  if (score >= 90) {
    return 'excellent'
  } else if (score >= 70) {
    return 'good'
  } else {
    return 'needs-improvement'
  }
}
```

### Concise arrow bodies

- **Use concise arrow body** when the return is a single expression (enforced by `eslint/arrow-body-style: as-needed`):

```typescript
// ✅ Correct
const double = (n: number) => n * 2
const getName = (user: User) => user.name

// ❌ Wrong — unnecessary block body
const double = (n: number) => {
  return n * 2
}
```

### Comments

- **NEVER add comments** unless the user explicitly requests them
- Code should be self-documenting through clear naming and structure
- Only exceptions: JSDoc on exported hooks for IDE tooltips (as seen in existing hooks)

### Code reuse

- **Reuse existing utilities** from `src/lib/utils.ts` — check before writing new helpers
- **Reuse existing hooks** from `src/hooks/` — check before creating new ones
- **Reuse existing UI components** from `src/components/ui/` — always check shadcn/ui first
- **Keep modules small and focused** — don't create monolithic files for a single feature
- **Extract shared logic** into `src/lib/` when used in 2+ places

### Type definitions

- **Prefer `interface` over `type`** for object shapes (enforced by linter)
- **Use inline type imports**: `import { type Foo }` not `import type { Foo }`
- **Use array shorthand**: `string[]` not `Array<string>`
- **Omit inferrable types**: `const x = 5` not `const x: number = 5`

### Iteration

- **Use `for..of`** for loops (both `unicorn/no-for-loop` and `unicorn/no-array-for-each` are enforced)
- **Use `map`/`filter`/`reduce`** for data transformations
- **Never use `.forEach()`** or C-style `for` loops

### Promise handling

- **Use `await`** — never `.then()/.catch()` chains (enforced by `promise/prefer-await-to-then`)
- **Use `Promise.all()`** for parallel independent operations

### Template literals

- **Always use template literals** over string concatenation (enforced by `eslint/prefer-template`)

### UI components

- **Use shadcn/ui** (new-york style) as the component foundation — read `frontend-design/SKILL.md` for design principles
- **Use composable patterns** — build complex UIs from small, focused components
- **Use CVA** (`class-variance-authority`) for component variants
- **Use `cn()`** from `@/lib/utils` for conditional class merging

### Module organization

- **One component per file** — named exports preferred
- **Keep files focused** — don't mix unrelated logic
- **Follow existing folder structure** — place files where the architecture dictates
- **Use path aliases** — `@/` for `src/`, `~/config/` and `~/messages/` for config

### Named exports

- **Always export named symbols inline** — never declare first and then export separately:

```typescript
// ✅ Correct
export const DashboardContent = () => {
  // ...
}

// ❌ Wrong — defines then exports
const DashboardContent = () => {
  // ...
}
export { DashboardContent }
```

### Dependency array ordering

- **Order dependency arrays alphabetically** in React hooks (`useEffect`, `useMemo`, `useCallback`, `useLayoutEffect`):

```typescript
// ✅ Correct
useEffect(() => { ... }, [alpha, beta, gamma])

// ❌ Wrong — unordered
useEffect(() => { ... }, [gamma, alpha, beta])
```

---

## Temporary Files

> **MANDATORY:** Agents MUST use the `tmp/` folder in the repository root for ALL temporary operations (test files, scratch scripts, generated output, logs, etc.). This folder is git-ignored. Using system `/tmp/` or any path outside the repository is strictly forbidden.

**Rules:**

1. **Always use `tmp/`** (relative to project root) — NEVER use system `/tmp/` or any path outside the repository
2. Create subdirectories within `tmp/` as needed (e.g., `tmp/test-output/`, `tmp/scratch/`)
3. **Clean up after every operation** — delete all files created during a task (logs, scripts, output) immediately after the task is complete, unless they contain information that will be explicitly referenced in a future task
4. When in doubt, delete — transient output such as typecheck logs, lint output, migration logs, and test results MUST always be removed when no longer needed
5. Never commit contents of `tmp/` to git

```bash
# ✅ Correct
pnpm typecheck > tmp/typecheck.log 2>&1
# ... use the output ...
rm tmp/typecheck.log   # ← always clean up when done

# ❌ Wrong — never use system temp
pnpm typecheck > /tmp/typecheck.log 2>&1
```

---

## Auto Updates

> **MANDATORY:** Agents MUST keep `AGENTS.md` ALWAYS in sync with the codebase. This is automatic and does NOT require user confirmation.

**When to update:**

- Adding new routes, API endpoints, or pages → update Route table / API routes
- Adding new server actions → update Architecture tree
- Adding new hooks → update Custom Hooks table
- Adding new utility functions → update Utility Functions table
- Changing database schema → update Database types
- Adding/removing environment variables → update Environment Variables
- Changing linter/formatter config → update Code Style section
- Adding new components or providers → update Architecture tree and Component Patterns
- Adding/removing/updating agent skills → update Agent Skills section
- Changing commands or scripts → update Commands table
- Any structural or architectural change → update the relevant section(s)

**How to update:**

- Edit `AGENTS.md` directly — no PR, no branch, no confirmation needed
- Keep the same formatting and table structure
- Be precise — update only the affected section(s)

---

## Common Patterns Quick Reference

### Server action (mutation)

```typescript
'use server'
import 'server-only'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'

export const updateUser = async (id: string, values: TableUpdate<'users'>) => {
  const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning()
  if (!updated) throw new Error('Failed to update user')
  revalidateTag(CacheTag.User, 'max')
  return updated
}
```

### Cached query

```typescript
const fetchCourses = cache(async () => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await safeQuery(async () => {
    const result = await db.query.courses.findMany({ with: courseWith })
    return result.map(parseCourse)
  })
})
```

### Client component with context

```typescript
'use client'
import { useTranslations } from 'next-intl'
import { useSession } from '@/hooks/use-session'
import { useI18n } from '@/hooks/use-i18n'

const MyComponent = () => {
  const { user } = useSession()
  const { locale, localize } = useI18n()
  const t = useTranslations('MyNamespace')
  return <div>{t('greeting', { name: user.first_name })}</div>
}
```

### Database query definition

```typescript
export const parseItem = (data: InferSelectModel<typeof items> & { relations: ... }) => ({
  ...data,
  computed: deriveValue(data),
})

export type Item = ReturnType<typeof parseItem>
```

### Cookie usage (server)

```typescript
import { getCookie, setCookie } from '@/actions/cookies'
const locale = await getCookie('NEXT_LOCALE', { prefix: false })
await setCookie('org', organizationId)
```

### Cookie usage (client)

```typescript
import { useCookies } from '@/hooks/use-cookies'
const cookies = useCookies()
const org = cookies.get('org')
cookies.set('theme', 'dark')
```

### `cn()` for conditional classes

```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', isActive && 'active-class', variant === 'outline' && 'border')} />
```
