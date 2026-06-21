# Technical reference: runtime and data

Runtime and data-layer reference for the GloRe Certificate codebase. Read the relevant section when working on a specific area.

Component/type/hook/util/theming/form/email/snippet reference: see `patterns.md`.

---

## Routing

### Route table

| Path                        | Auth               | Layout    | Description                                        |
| --------------------------- | ------------------ | --------- | -------------------------------------------------- |
| `/login`                    | Public             | Root      | Login page                                         |
| `/register`                 | Public             | Root      | Registration: creates a `pending` org join request |
| `/onboarding`               | Auth (pre-onboard) | Root      | Onboarding form                                    |
| `/onboarding/error`         | Auth (pre-onboard) | Root      | Onboarding error                                   |
| `/[username]`               | Public             | Root      | Public certificate page                            |
| `/dashboard`                | Auth               | Dashboard | Main dashboard                                     |
| `/about`                    | Auth               | Dashboard | About page                                         |
| `/admin`                    | Auth + `is_admin`  | Dashboard | Permanent redirect to `/admin/team` (no page)      |
| `/admin/team`               | Auth + `is_admin`  | Dashboard | Team management                                    |
| `/admin/users`              | Auth + `is_admin`  | Dashboard | User moderation: ban/unban, platform role changes  |
| `/admin/organizations`      | Auth + `is_admin`  | Dashboard | Org list (tabs: all/pending/active), approve/reject, create (no rep), invite (with rep) |
| `/admin/organizations/[id]` | Auth + `is_admin`  | Dashboard | Org detail (`?tab=`): members table (search/sort/role filter, role/remove/invite), settings (edit profile/avatar, delete org) |
| `/organization`             | Auth + org manager | Dashboard | Organization panel                                 |
| `/certificates`             | Auth + non-editor  | Dashboard | Certificate list                                   |
| `/certificates/new`         | Auth + non-editor  | Dashboard | New certificate                                    |
| `/certificates/[id]`        | Auth + non-editor  | Dashboard | Certificate detail                                 |
| `/courses`                  | Auth               | Dashboard | Course list                                        |
| `/courses/[slug]`           | Auth               | Dashboard | Course detail/editor                               |
| `/docs`                     | Auth               | Dashboard | Documentation                                      |
| `/docs/intro`               | Auth               | Dashboard | Introduction docs                                  |
| `/docs/faq`                 | Auth               | Dashboard | FAQ docs                                           |
| `/docs/tutorials`           | Auth               | Dashboard | Tutorial docs                                      |
| `/help`                     | Auth               | Dashboard | Help page                                          |
| `/settings`                 | Auth               | Dashboard | User settings                                      |
| `/offline`                  | Public             | Root      | PWA offline fallback page                          |

`/admin` has no page: `next.config.ts` permanently redirects it to `/admin/team`, the panel landing.

### API routes

| Path                  | Method   | Description                                       |
| --------------------- | -------- | ------------------------------------------------- |
| `/api/auth/[...all]`  | GET/POST | Better Auth catch-all handler                     |
| `/api/v1/ai/command`  | POST     | AI command endpoint                               |
| `/api/v1/ai/copilot`  | POST     | AI copilot endpoint                               |
| `/api/v1/join`        | GET      | Team invitation join endpoint                     |
| `/api/v1/manifest`    | GET      | Dynamic PWA manifest (locale-aware, cached 1h)    |
| `/api/v1/upload`      | POST     | R2 file upload                                    |
| `/api/v1/health`      | GET      | Health check (returns `{ status: 'ok' }`)         |

### Route groups

| Group         | Purpose                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `(auth)`      | Unauthenticated pages (login, register, onboarding). No shared layout beyond root.                 |
| `(dashboard)` | Authenticated pages with sidebar. Wrapped in `SidebarProvider > SessionProvider > CoursesProvider`. |

### Redirects

- `/` > `/dashboard` (permanent redirect in `next.config.ts`)

---

## Authentication flow

**Provider:** Better Auth (`better-auth`), stores users/sessions/accounts in the Neon database via the Drizzle adapter.

**Request lifecycle:**

1. `proxy.ts` (NextProxy) intercepts all non-static requests.
2. `auth.api.getSession()` validates the session via signed HTTP-only cookies.
3. Unauthenticated > redirect to `/login`.
4. Authenticated but not onboarded (`onboardedAt` is null) > redirect to `/onboarding`.
5. Onboarded accessing `/onboarding` > redirect to `/dashboard`.
6. Authenticated accessing `/login` > redirect to `/dashboard`.

**Token storage:** Better Auth manages session tokens in signed HTTP-only cookies. Session data is cached in cookies (5-minute TTL) to reduce API calls.

**Cookie prefix:** All app cookies use the `gl` prefix. Better Auth session cookies use `gl` via `advanced.cookiePrefix`.

**Auth instance:** `auth` exported from `src/lib/auth.ts`, server-only (`betterAuth()`). Used in server components, server actions, and the proxy. It imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (never the schema barrel), because `proxy.ts` calls `auth.api.getSession` on every request.

**`emailAndPassword.autoSignIn` is `false` and MUST stay false.** Every `signUpEmail` call creates an account for someone else (team/org invites), never the actor. With auto sign-in on, the invitee's session cookie would be written onto the inviter's response. Self-registration does not use `signUpEmail` (it creates a `pending` join request), so login (`signInEmail`) is unaffected.

**Plugins:**

| Plugin          | Purpose                              |
| --------------- | ------------------------------------ |
| `username()`    | Username/display username support    |
| `admin()`       | Admin role management, user creation |
| `nextCookies()` | Next.js cookie integration           |

**Auth API route:** `src/app/api/auth/[...all]/route.ts` (catch-all for all auth requests).

---

## Data fetching

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
const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, id), with: userWith })
  if (!user) throw new Error('User not found')
  return parseUser(user)
}

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))
  return await safeQuery(() => queryUserById(id))
}

export const findUser = async (id: string, { cache = true } = {}) => {
  if (!cache) return await queryUserById(id)
  const { data, error } = await fetchUser(id)
  if (error || !data) throw error || new Error('User not found')
  return data
}
```

### Transactions and the mutation layer

Production runs on the **neon-http** driver, which has **no interactive transactions**. For any write that spans more than one statement, use the `transaction()` helper from `@/db/client` instead of firing statements at `db` directly:

- `transaction(fn)` runs `fn(tx)` atomically. In dev (`pg`) it uses the pooled `node-postgres` transaction; in prod it reuses a lazily-initialized, module-scoped **neon-serverless** (WebSocket) pool (`max: 3`, shared across invocations in a warm function instance). Requires a global `WebSocket` (Node 22+; the repo pins `24.16.0` via `.node-version`, with an `engines.node: ">=22"` floor).
- Multi-statement write logic lives in `src/db/mutations/<domain>.ts` as composable units `(tx: Transaction, ...args) => ...`. The server action wraps the call: `await transaction(tx => deleteUser(tx, id))`.
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

**Tenancy:** authorization/tenant scoping stays at the action boundary (verify ownership/org membership before calling the mutation); mutations operate on already-authorized ids.

### Cache strategy

**Cache tags** (`src/lib/cache.ts`, `CacheTag` enum):

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
| `courseTag(slug)`                  | `course-{slug}`                   |
| `certificatesUserTag(userId)`      | `certificates-user-{userId}`      |
| `certificatesTutorTag(reviewerId)` | `certificates-tutor-{reviewerId}` |
| `certificatesOrgTag(orgId)`        | `certificates-org-{orgId}`        |

**Patterns:**

- `'use cache'` directive on inner fetch functions.
- `cacheTag()` to tag cached data.
- `cacheLife('max')` for long-lived caches.
- `revalidateTag(tag, 'max')` after mutations.
- React `cache()` for request-level deduplication.
- `{ cache: false }` option to bypass `'use cache'` in actions.

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

---

## Error handling

- `safeQuery()` wraps a query function in try/catch, returns `{ data, error: null }` or `{ data: null, error: { code, message } }`.
- `queryError()` normalizes unknown errors into the `{ code, message }` shape.
- Server actions return `{ data, error }` or `{ error }`; callers must check for errors.
- **Mutations that fail throw; queries that fail return error objects.**

**Global error boundary:** `src/app/error.tsx` (client component), logs the error, offers "go back" / "back to home" / "refresh page" actions.

**Global 404:** `src/app/not-found.tsx` (server component), checks auth to show the appropriate link.

**Layout guards:** the admin layout calls `notFound()` if `!user.is_admin`; the certificates layout calls `notFound()` if `user.canEdit`.

**User feedback:** `sonner` toast notifications via `toast.success()`, `toast.error()`.

---

## Environment variables

> **MANDATORY:** Every environment variable used by the Next.js app MUST be declared in the Zod schema in `next.config.ts`. `GITHUB_TOKEN` and `VERCEL_TOKEN` are excluded (external CLI tools only).

| Variable               | Purpose                                          | In schema |
| ---------------------- | ------------------------------------------------ | --------- |
| `APP_URL`              | Application base URL                             | Yes       |
| `BETTER_AUTH_SECRET`   | Better Auth secret key                           | Yes       |
| `R2_ACCOUNT_ID`        | Cloudflare account ID                            | Yes       |
| `R2_ACCESS_KEY_ID`     | R2 API token access key                          | Yes       |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret                              | Yes       |
| `R2_BUCKET_NAME`       | R2 bucket name                                   | Yes       |
| `R2_PUBLIC_URL`        | R2 public base URL (custom domain or r2.dev URL) | Yes       |
| `DATABASE_URL`         | Postgres connection string (Neon or local)       | Yes       |
| `GEMINI_API_KEY`       | Google Gemini API key                            | Yes       |
| `GEMINI_MODEL`         | Gemini model name                                | Yes       |
| `NEXT_DIST_DIR`        | Next.js `distDir` override (defaults to `.next`; agent preview sets `.claude/.next`) | Yes |
| `TSCONFIG_PATH`        | `typescript.tsconfigPath` override (agent preview sets `.claude/tsconfig.json`) | Yes |
| `SMTP_HOST`            | SMTP server hostname                             | Yes       |
| `SMTP_PORT`            | SMTP port                                        | Yes       |
| `SMTP_USER`            | SMTP username                                    | Yes       |
| `SMTP_PASSWORD`        | SMTP password                                    | Yes       |
| `SMTP_SENDER`          | Email sender address                             | Yes       |
| `GITHUB_TOKEN`         | GitHub personal access token (CLI only)          | No        |
| `VERCEL_TOKEN`         | Vercel CLI token (CLI only)                      | No        |

**Validation:** the Zod schema is a module-scope constant in `next.config.ts`. `schema.parse(process.env)` runs whenever the config loads (`next dev` start, `next build`, `next start`), unless `process.env.SKIP_ENV_VALIDATION` is set. `next.config.ts` also declares the global `ProcessEnv` augmentation, so `process.env` is typed app-wide. `scripts/typegen.ts` sets `SKIP_ENV_VALIDATION=1` when calling `next typegen`.

> **MANDATORY:** The schema must NOT be moved into `src/` or imported from a `src/` file. Next watches `next.config.ts`'s module-dependency graph and restarts the dev server whenever a watched file changes; importing a `src/` file makes every `src/**` edit trigger a full dev-server restart (cold 5-10s recompiles). Keep the schema inline; `zod` is the only allowed import for it.

---

## Static data

| File                   | Purpose                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `config/app.json`      | Feature settings (`minSkills: 3`, `minRating: 3`, `mapsUrl`, `sidebarShortcut: "s"`)          |
| `config/i18n.json`     | Locale definitions, default locale, title-case locales, spoken languages, hardcoded messages  |
| `config/icons.json`    | Lucide icon metadata (~1,640 entries: name, categories, tags) for icon picker fuzzy search    |
| `config/metadata.json` | App name, version, URL, email, keywords, authors                                              |
| `config/theme.json`    | Theme modes, breakpoints, hex color palette for light/dark                                    |
