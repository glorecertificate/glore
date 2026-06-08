# Technical Reference

Detailed technical reference for the GloRe Certificate codebase. Read the relevant section when working on a specific area.

---

## Routing

### Route table

| Path                   | Auth               | Layout    | Description                                        |
| ---------------------- | ------------------ | --------- | -------------------------------------------------- |
| `/login`               | Public             | Root      | Login page                                         |
| `/register`            | Public             | Root      | Registration page                                  |
| `/onboarding`          | Auth (pre-onboard) | Root      | Onboarding form                                    |
| `/onboarding/error`    | Auth (pre-onboard) | Root      | Onboarding error                                   |
| `/[username]`          | Public             | Root      | Public certificate page                            |
| `/dashboard`           | Auth               | Dashboard | Main dashboard                                     |
| `/about`               | Auth               | Dashboard | About page                                         |
| `/admin`               | Auth + `is_admin`  | Dashboard | Admin panel                                        |
| `/admin/users`         | Auth + `is_admin`  | Dashboard | User moderation: ban/unban, platform role changes  |
| `/admin/organizations` | Auth + `is_admin`  | Dashboard | Org approval workflow: approve/reject pending orgs |
| `/organization`        | Auth + org manager | Dashboard | Organization panel                                 |
| `/certificates`        | Auth + non-editor  | Dashboard | Certificate list                                   |
| `/certificates/new`    | Auth + non-editor  | Dashboard | New certificate                                    |
| `/certificates/[id]`   | Auth + non-editor  | Dashboard | Certificate detail                                 |
| `/courses`             | Auth               | Dashboard | Course list                                        |
| `/courses/[slug]`      | Auth               | Dashboard | Course detail/editor                               |
| `/docs`                | Auth               | Dashboard | Documentation                                      |
| `/docs/intro`          | Auth               | Dashboard | Introduction docs                                  |
| `/docs/faq`            | Auth               | Dashboard | FAQ docs                                           |
| `/docs/tutorials`      | Auth               | Dashboard | Tutorial docs                                      |
| `/help`                | Auth               | Dashboard | Help page                                          |
| `/settings`            | Auth               | Dashboard | User settings                                      |
| `/offline`             | Public             | Root      | PWA offline fallback page                          |

### API routes

| Path                  | Method   | Description                                    |
| --------------------- | -------- | ---------------------------------------------- |
| `/api/auth/[...path]` | GET/POST | Neon Auth catch-all handler                    |
| `/api/v1/ai/command`  | POST     | AI command endpoint                            |
| `/api/v1/ai/copilot`  | POST     | AI copilot endpoint                            |
| `/api/v1/join`        | GET      | Team invitation join endpoint                  |
| `/api/v1/manifest`    | GET      | Dynamic PWA manifest (locale-aware, cached 1h) |
| `/api/v1/upload`      | POST     | R2 file upload                                 |
| `/api/v1/health`      | GET      | Health check (returns `{ status: 'ok' }`)      |

### Route groups

| Group         | Purpose                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `(auth)`      | Unauthenticated pages (login, register, onboarding). No shared layout beyond root.                |
| `(dashboard)` | Authenticated pages with sidebar. Wrapped in `SidebarProvider > SessionProvider > CoursesProvider` |

### Redirects

- `/` > `/dashboard` (permanent redirect in `next.config.ts`)

---

## Authentication Flow

**Provider:** Better Auth (`better-auth`), stores users/sessions/accounts in Neon database via Drizzle adapter

**Request lifecycle:**

1. `proxy.ts` (NextProxy) intercepts all non-static requests
2. `auth.api.getSession()` validates session via signed HTTP-only cookies
3. Unauthenticated > redirect to `/login`
4. Authenticated but not onboarded (`onboarded_at` is null) > redirect to `/onboarding`
5. Onboarded accessing `/onboarding` > redirect to `/dashboard`
6. Authenticated accessing `/login` > redirect to `/dashboard`

**Token storage:** Better Auth manages session tokens in signed HTTP-only cookies. Session data is cached in cookies (5-minute TTL) to reduce API calls.

**Cookie prefix:** All app cookies use `gl` prefix. Better Auth session cookies use `gl` prefix via `advanced.cookiePrefix`.

**Auth instance:** `auth` exported from `src/lib/auth.ts`, server-only (`betterAuth()`). Used in server components, server actions, and the proxy.

**Plugins:**

| Plugin          | Purpose                              |
| --------------- | ------------------------------------ |
| `username()`    | Username/display username support    |
| `admin()`       | Admin role management, user creation |
| `nextCookies()` | Next.js cookie integration           |

**Auth API route:** `src/app/api/auth/[...all]/route.ts` (catch-all for all auth requests)

**Email:** Nodemailer SMTP transport (`src/lib/email.ts`) for transactional emails. Auth server has its own transport for password reset emails.

**Database client:** `db` from `src/db/client.ts` (Drizzle ORM via `neon()` HTTP driver)

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

Factor the actual `db.query` into a single private executor and reuse it from both the cached and the `{ cache: false }` branch (no copy-pasted query bodies):

```typescript
// Single source of truth for the query
const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, id), with: userWith })
  if (!user) throw new Error('User not found')
  return parseUser(user)
}

// Cached inner fetch
const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))
  return await safeQuery(() => queryUserById(id))
}

// Exposed action with cache bypass option
export const findUser = async (id: string, { cache = true } = {}) => {
  if (!cache) return await queryUserById(id)
  const { data, error } = await fetchUser(id)
  if (error || !data) throw error || new Error('User not found')
  return data
}
```

### Transactions & the mutation layer

Production runs on the **neon-http** driver, which has **no interactive transactions**. For any write that spans more than one statement, use the `transaction()` helper from `@/db/client` instead of firing statements at `db` directly:

- `transaction(fn)` runs `fn(tx)` atomically. In dev (`pg`) it uses the pooled `node-postgres` transaction; in prod it reuses a lazily-initialized, module-scoped **neon-serverless** (WebSocket) pool (`max: 3`, shared across invocations in a warm function instance). Requires a global `WebSocket` (Node 22+; the repo pins `24.14.0` via `.node-version`, with an `engines.node: ">=22"` floor). neon-http (the read path) cannot do interactive transactions, which is why writes need this separate driver.
- Multi-statement write logic lives in `src/db/mutations/<domain>.ts` as composable units `(tx: Transaction, ...args) => ...` (Midday convention). The server action wraps the call: `await transaction(tx => deleteUser(tx, id))`.
- **Inside a transaction, statements MUST run sequentially** (`await` one at a time). All statements share one connection; `Promise.all` on a single `tx` corrupts the session. This is why `react-doctor/async-parallel` is disabled in transactional mutation files.
- Keep slow side effects (PDF generation, email, R2 uploads) **outside** the transaction; compute inputs first, then open a short transaction for the DB writes only.

```typescript
// src/db/mutations/certificate.ts
export const createCertificateWithSkills = async (tx: Transaction, values: TableInsert<'certificates'>, skillCourseIds: number[]) => {
  const [created] = await tx.insert(certificates).values(values).returning()
  if (!created) throw new Error('Failed to create certificate')
  if (skillCourseIds.length > 0) {
    await tx.insert(certificateSkills).values(skillCourseIds.map(courseId => ({ certificateId: created.id, courseId })))
  }
  return created
}

// In the action:
const cert = await transaction(tx => createCertificateWithSkills(tx, values, skillCourseIds))
```

**Tenancy:** authorization/tenant scoping stays at the action boundary (verify ownership / org membership before calling the mutation); mutations operate on already-authorized ids.

### Error handling

- `safeQuery()` wraps a query function in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return `{ data, error }` or `{ error }`, callers check for errors
- Mutations that fail throw; queries that fail return error objects

### Cache strategy

**Cache tags** (defined in `src/lib/cache.ts` `CacheTag` enum):

| Tag                | Used by                                                                      | Pattern    |
| ------------------ | ---------------------------------------------------------------------------- | ---------- |
| `admin-users`      | `fetchAdminUsers`                                                            | Global     |
| `auth-user`        | `fetchAuthUser`                                                              | Global     |
| `auth-user-status` | `logout`                                                                     | Global     |
| `certificates`     | `fetchUserCertificates`, `fetchTutorCertificates`, `fetchUnassignedOrgCerts` | Per-record |
| `course`           | `fetchCourse`                                                                | Per-record |
| `courses`          | `fetchCourses`                                                               | Global     |
| `doc-categories`   | `fetchDocCategories`                                                         | Global     |
| `organizations`    | `fetchOrganizations`                                                         | Global     |
| `skill-groups`     | `listSkillGroups`                                                            | Global     |
| `team-members`     | `fetchTeamMembers`                                                           | Global     |
| `user`             | `fetchUser`                                                                  | Per-record |
| `user-email`       | `fetchUserEmail`                                                             | Global     |

**Per-record tag helpers** (`src/lib/cache.ts`):

| Helper                             | Tag format                        |
| ---------------------------------- | --------------------------------- |
| `userTag(id)`                      | `user-{id}`                       |
| `courseTag(slug)`                   | `course-{slug}`                   |
| `certificatesUserTag(userId)`      | `certificates-user-{userId}`      |
| `certificatesTutorTag(reviewerId)` | `certificates-tutor-{reviewerId}` |
| `certificatesOrgTag(orgId)`        | `certificates-org-{orgId}`        |

**Patterns:**

- `'use cache'` directive on inner fetch functions
- `cacheTag()` to tag cached data
- `cacheLife('max')` for long-lived caches
- `revalidateTag(tag, 'max')` after mutations
- React `cache()` for request-level deduplication
- `{ cache: false }` option to bypass `'use cache'` in actions

---

## Component Patterns

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

- `*-context.tsx`: context creation, hook logic, `createContext`, provider component
- `*-provider.tsx`: server-side data fetching, wraps context provider

Provider hierarchy (root layout):

```
SearchParamsProvider > I18nProvider > PWAContextProvider > ThemeProvider
```

Dashboard layout adds:

```
SidebarProvider > SessionProvider > CoursesProvider
```

### Icon system

- **Lucide icons:** `lucide-react` with lazy loading via `src/components/icons/lucide.tsx`
  - Uses `Map` cache for `lazy()` components to avoid re-creation
  - Wrapped in `Suspense` with fallback
  - Import as `LucideIcon` with `name` prop (type: `IconName`)
- **Custom icons:** `src/components/icons/` (Logo, DashboardIcon, ErrorIcon, etc.)
- **Database icon field:** Courses store icon as `IconName` string

### URL state management

Uses `nuqs` for URL search params with type-safe parsers. Feature-specific `params.ts` + `use-params.ts` files define param schemas and hooks.

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

| Type                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `Any`                     | Escape hatch (only in `src/lib/types.ts`)             |
| `AnyRecord`               | `Record<string \| number \| symbol, any>`             |
| `AnyFunction`             | `(...args: any[]) => any`                             |
| `AuthView`                | Union of valid auth view names (from `AUTH_VIEWS`)    |
| `CamelCase<S>`            | Convert snake/kebab string to camelCase at type level |
| `Icon<T>`, `IconProps<T>` | SVG component prop types extending LucideProps        |
| `IconName`                | Re-export from `lucide-react/dynamic`                 |
| `Rgb`                     | `[number, number, number]` tuple                      |
| `Enum<T>`                 | `T \| \`${T}\`` (allows string literal or template)   |
| `HttpUrl`                 | `\`http://${string}\` \| \`https://${string}\``       |

### Database types (`src/db/types.ts`)

| Type             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `TableMap`       | Interface mapping snake_case names to Drizzle table objects  |
| `TableName`      | Union of all table names (`keyof TableMap`)                  |
| `TableInsert<T>` | `InferInsertModel` for a table                               |
| `TableUpdate<T>` | `Partial<InferInsertModel>` for a table                      |
| `Enums`          | Interface of database enum types (derived from `pgEnum.enumValues`) |
| `EnumType<T>`    | Extract a specific enum type                                 |

The `Enums` interface is **derived from the `pgEnum` definitions** (`(typeof certificateStatusEnum.enumValues)[number]`, etc.), not hand-maintained. Adding/removing a value in `src/db/schema/enums.ts` updates `EnumType<...>` automatically — no parallel edit.

### Validation schemas (`src/db/schemas.ts`)

- `drizzle-zod` derives runtime validation from the table definitions (`createInsertSchema`/`createUpdateSchema`), keeping validation in lockstep with the schema.
- Used to validate direct-DB-write inputs at server-action boundaries that take raw `TableInsert`/`TableUpdate` (e.g. doc category/article actions). Validate with `safeParse(data)`, then pass the typed `data` to the insert.
- Form input (react-hook-form + zod in `src/components/features/**/schemas.ts`) is UI-shaped (coercion, refinements) and stays hand-written — do not replace it with drizzle-zod.

### Enum pattern

- TypeScript `enum` only for `CacheTag`
- All other enums use `satisfies` + `as const` on arrays/objects
- Example: `COURSE_TYPES = ['intro', 'skill', 'learner'] satisfies Enums<'course_type'>[]`
- DB enums: `certificate_status` (`'draft' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'`), `course_type` (`'intro' | 'skill' | 'learner'`), `organization_request_status` (`'pending' | 'accepted' | 'rejected'`), `role` (`'admin' | 'learner' | 'tutor' | 'representative' | 'volunteer'`)

---

## Utility Functions (`src/lib/utils.ts`)

| Function                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `cn(...inputs)`             | Merge Tailwind classes (extended `tailwind-merge` + `cx`) |
| `hexToRgb(record)`          | Convert hex color record to RGB tuples                    |
| `isValidUsername(value)`     | Validate email or username format                         |
| `defaultFormDisabled(form)`  | Check if form is pristine or has errors                   |
| `publicFile(file)`           | Resolve a public file URL relative to `APP_URL`           |
| `titleize(input)`            | Title-case string (words >3 chars capitalized)            |
| `camelize(input)`            | Convert to camelCase (typed)                              |
| `keysOf(record)`             | Type-safe `Object.keys()`                                 |
| `pluck(array, key)`          | Extract values of a key from array of objects             |
| `omit(record, keys)`         | Omit keys from object                                     |
| `debounce(callback, delay)`  | Debounce with `.cancel()` and `.flush()`                  |
| `throttle(callback, limit)`  | Throttle function calls                                   |
| `sleep(ms)`                  | Promise-based delay                                       |
| `noop()`                     | No-op function                                            |

---

## Custom Hooks

| Hook               | Purpose                               | Key behavior                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useComposedRefs`  | Compose multiple refs into one        | Handles React 19 cleanup refs                                                                                                                                                                                                  |
| `useCookies`       | Browser-side typed cookie management  | Uses `document.cookie`; JSON serialize/parse; supports prefix                                                                                                                                                                  |
| `useDebounce`      | Debounce a value                      | Default 500ms delay                                                                                                                                                                                                            |
| `useDevice`        | Detect device type and touch          | Uses `window.matchMedia`; configurable breakpoint (default 768px)                                                                                                                                                              |
| `useFileUpload`    | File upload with progress             | Tracks progress, shows toast on error                                                                                                                                                                                          |
| `useI18n`          | Access i18n context                   | Reads from `I18nContext`; throws if outside provider                                                                                                                                                                           |
| `useMetadata`      | Client-side document metadata updates | Updates `<meta>` tags, PWA title formatting, 100ms delay                                                                                                                                                                       |
| `useMounted`       | Check if component has mounted        | For hydration-safe rendering                                                                                                                                                                                                   |
| `usePWA`           | Detect PWA display mode               | Detects TWA, Standalone, MinimalUI, Fullscreen, Browser                                                                                                                                                                        |
| `usePWA`    | Access PWA context                    | Reads from PWA context provider                                                                                                                                                                                                |
| `useScroll`        | Track scroll position                 | Throttled at 100ms; returns `{ scroll, scrolled }`                                                                                                                                                                             |
| `useSession`       | Access session context                | Reads from `SessionContext`; throws if outside provider; exposes `isOrgAdmin` (true for admin or representative role), `isLearner`, `isTutor`, `isVolunteer`; use `membership.role === 'admin'` for owner-exclusive operations  |
| `useSidebarResize` | Drag-to-resize sidebar                | Configurable min/max widths; collapse/expand thresholds                                                                                                                                                                        |
| `useTheme`         | Theme with cookie + view transitions  | Extends next-themes; uses View Transitions API; respects `prefers-reduced-motion`                                                                                                                                              |

---

## Theming & Styling

### Color system

Uses **OKLCH** color space. CSS custom properties defined in `src/app/globals.css` with light/dark variants.

Semantic token groups (all defined in `src/app/globals.css` with light/dark variants): page surface (`--background`, `--foreground`), cards and popovers, primary/secondary/muted/accent actions, brand colors (`--brand` teal, `--brand-secondary` olive, `--brand-tertiary` navy), link colors, status colors (`--info`, `--success`, `--warning`, `--destructive`), interactive borders (`--border`, `--input`, `--ring`), sidebar tokens, editor highlight, and five chart colors.

**Border radius:** `--radius: 0.625rem` with computed `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

**Custom utilities:** `text-stroke-*` (webkit text stroke width and color).

**Theme switching:** Uses `next-themes` with `class` attribute strategy. Supports `system`, `light`, `dark`. View Transitions API used for smooth theme changes (with fallback for browsers without support).

**Mobile breakpoint:** 768px (from `config/theme.json`)

---

## Form Patterns

**Library:** `react-hook-form` + `@hookform/resolvers` with `zod` validation.

**Patterns:**

- Zod schemas for form validation
- `defaultFormDisabled(form)` to check if form submit button should be disabled
- `sonner` toast for user feedback: `toast.success()`, `toast.error()`
- Server actions called from form `onSubmit` handlers

---

## Email Templates

**Templates** in `src/emails/`:

| Template                  | Path                        |
| ------------------------- | --------------------------- |
| Auth recovery             | `auth/recovery`             |
| Auth invite               | `auth/invite`               |
| Auth verify email         | `auth/verify-email`         |
| Team invite               | `team/invite`               |
| Password changed          | `account/password-changed`  |
| Email changed             | `account/email-changed`     |
| Certificate assigned      | `certificate/assigned`      |
| Certificate review        | `certificate/review`        |
| Organization join request | `organization/join-request` |
| Organization member added | `organization/member-added` |

**SMTP config:** Nodemailer client with settings from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`).

---

## Environment Variables

> **MANDATORY:** Every environment variable used by the Next.js app MUST be declared in the Zod schema in `next.config.ts`. `GITHUB_TOKEN` and `VERCEL_TOKEN` are excluded (external CLI tools only).

| Variable               | Purpose                                          | Scope  | In schema   |
| ---------------------- | ------------------------------------------------ | ------ | ----------- |
| `APP_URL`              | Application base URL                             | Server | Yes         |
| `BETTER_AUTH_SECRET`   | Better Auth secret key                           | Server | Yes         |
| `R2_ACCOUNT_ID`        | Cloudflare account ID                            | Server | Yes         |
| `R2_ACCESS_KEY_ID`     | R2 API token access key                          | Server | Yes         |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret                              | Server | Yes         |
| `R2_BUCKET_NAME`       | R2 bucket name                                   | Server | Yes         |
| `R2_PUBLIC_URL`        | R2 public base URL (custom domain or r2.dev URL) | Server | Yes         |
| `COOKIE_PREFIX`        | App cookie prefix (default: `gl_`)               | Server | Yes         |
| `DATABASE_URL`         | Neon Postgres connection string                  | Server | Yes         |
| `GEMINI_API_KEY`       | Google Gemini API key                            | Server | Yes         |
| `GEMINI_MODEL`         | Gemini model name (e.g., `gemini-2.0-flash`)     | Server | Yes         |
| `SMTP_HOST`            | SMTP server hostname                             | Server | Yes         |
| `SMTP_PORT`            | SMTP port                                        | Server | Yes         |
| `SMTP_USER`            | SMTP username                                    | Server | Yes         |
| `SMTP_PASSWORD`        | SMTP password                                    | Server | Yes         |
| `SMTP_SENDER`          | Email sender address                             | Server | Yes         |
| `GITHUB_TOKEN`         | GitHub personal access token                     | Server | No          |
| `VERCEL_TOKEN`         | Vercel CLI token                                 | Server | No          |

**Validation:** The Zod schema is a module-scope constant in `next.config.ts`. `schema.parse(process.env)` runs whenever the config is loaded (`next dev` start, `next build`, `next start`), unless `process.env.SKIP_ENV_VALIDATION` is set. `next.config.ts` also declares the global `ProcessEnv` augmentation, so `process.env` is typed app-wide. The `scripts/typegen.ts` script sets `SKIP_ENV_VALIDATION=1` when calling `next typegen`.

> **MANDATORY:** The schema must NOT be moved into `src/` or imported from a `src/` file. Next watches `next.config.ts`'s module-dependency graph and restarts the dev server whenever a watched file changes — importing a `src/` file makes every `src/**` edit trigger a full dev-server restart (cold 5-10s recompiles). Keep the schema inline; `zod` is the only allowed import for it.

---

## Static Data

| File                   | Purpose                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `config/app.json`      | Feature settings (`minSkills: 3`, `minRating: 3`, `mapsUrl`, `sidebarShortcut: "s"`)         |
| `config/i18n.json`     | Locale definitions, default locale, title-case locales, spoken languages, hardcoded messages  |
| `config/icons.json`    | Lucide icon metadata (1,640 entries: name, categories, tags) for icon picker fuzzy search     |
| `config/markers.json`  | Globe marker coordinates (456 lat/lon pairs)                                                  |
| `config/metadata.json` | App name, version, URL, email, keywords, authors                                              |
| `config/theme.json`    | Theme modes, breakpoints, hex color palette for light/dark                                    |

---

## Error Handling

**Global error boundary:** `src/app/error.tsx` (client component), logs error, offers "go back" / "back to home" / "refresh page" actions.

**Global 404:** `src/app/not-found.tsx` (server component), checks auth to show appropriate link.

**Layout guards:** Admin layout calls `notFound()` if `!user.is_admin`. Certificates layout calls `notFound()` if `user.canEdit`.

**Database errors:**

- `safeQuery()` returns `{ data, error: null }` or `{ data: null, error: { code, message } }`
- `queryError()` normalizes unknown errors into `{ code, message }` shape
- Server actions return error objects, callers must check

**User feedback:** `sonner` toast notifications via `toast.success()`, `toast.error()`.

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
import { userTag } from '@/lib/cache'

export const updateUser = async (id: string, values: TableUpdate<'users'>) => {
  const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning()
  if (!updated) throw new Error('Failed to update user')
  revalidateTag(userTag(id), 'max')
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
