# Technical reference: runtime and data

Runtime and data-layer reference. Read the section you need. Component, type, hook, util, theming, form, and email conventions: `patterns.md`.

## Routing

Two route groups: `(auth)` for unauthenticated pages (no shared layout beyond root) and `(dashboard)` for authenticated pages with the sidebar, wrapped in `SidebarProvider > SessionProvider > CoursesProvider`.

**Public:** `/login`, `/register` (submits org details and creates a `pending` org join request), `/[username]` (public certificate page), `/offline` (PWA fallback).

**Authenticated, pre-onboarding:** `/onboarding`, `/onboarding/error`.

**Authenticated, dashboard layout, no extra gate:** `/dashboard`, `/about`, `/courses`, `/courses/[slug]` (detail and editor), `/docs` plus `/docs/intro`, `/docs/faq`, `/docs/tutorials`, `/help`, `/settings`.

**Authenticated, dashboard layout, extra gate:**

| Route                       | Gate        | Notes                                                                                                       |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `/admin`                    | `isAdmin`   | No page: `next.config.ts` permanently redirects to `/admin/team`, the panel landing                          |
| `/admin/team`               | `isAdmin`   | Team management                                                                                             |
| `/admin/users`              | `isAdmin`   | User moderation: ban/unban, platform role changes                                                           |
| `/admin/organizations`      | `isAdmin`   | Tabs all/pending/active/rejected; approve, reject (soft, keeps the org record), create (no rep), invite (with rep) |
| `/admin/organizations/[id]` | `isAdmin`   | `?tab=`: members table (search/sort/role filter, role change, remove, invite), settings (profile, avatar, delete org) |
| `/organization`             | org manager | Organization panel                                                                                          |
| `/certificates`             | non-editor  | List; `/certificates/new` and `/certificates/[id]` share the same gate                                       |

`/` permanently redirects to `/dashboard` (`next.config.ts`).

### API routes

| Path                 | Method   | Description                                    |
| -------------------- | -------- | ---------------------------------------------- |
| `/api/auth/[...all]` | GET/POST | Better Auth catch-all handler                  |
| `/api/v1/ai/command` | POST     | AI command endpoint                            |
| `/api/v1/ai/copilot` | POST     | AI copilot endpoint                            |
| `/api/v1/join`       | GET      | Team invitation join endpoint                  |
| `/api/v1/manifest`   | GET      | Dynamic PWA manifest (locale-aware, cached 1h) |
| `/api/v1/upload`     | POST     | R2 file upload                                 |
| `/api/v1/health`     | GET      | Health check (returns `{ status: 'ok' }`)      |

## Authentication

Better Auth stores users, sessions, and accounts in Neon via the Drizzle adapter. The `auth` instance is exported from `src/lib/auth.ts`, server-only, used in server components, server actions, and the proxy. It imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (never the schema barrel), because `proxy.ts` calls `auth.api.getSession` on every request.

**Request lifecycle** in `proxy.ts` (NextProxy), which intercepts all non-static requests:

1. `auth.api.getSession()` validates the session from signed HTTP-only cookies.
2. Unauthenticated > redirect to `/login`.
3. Authenticated but `onboardedAt` is null > redirect to `/onboarding`.
4. Onboarded and hitting `/onboarding` > redirect to `/dashboard`.
5. Authenticated and hitting `/login` > redirect to `/dashboard`.

**Cookies:** Better Auth manages session tokens in signed HTTP-only cookies, cached for 5 minutes to cut API calls. All app cookies use the `gl` prefix, Better Auth via `advanced.cookiePrefix`.

**`emailAndPassword.autoSignIn` is `false` and MUST stay false.** Every `signUpEmail` call creates an account for someone else (team and org invites), never the actor; with auto sign-in on, the invitee's session cookie would be written onto the inviter's response. Self-registration does not use `signUpEmail` (it creates a `pending` join request), so `signInEmail` login is unaffected.

**Plugins:** `username()` (username and display username), `admin()` (admin role management, user creation), `nextCookies()` (Next.js cookie integration). Catch-all route: `src/app/api/auth/[...all]/route.ts`.

## Data fetching

### Query pattern

Per table in `src/db/queries/<table>.ts`: an `interface` extending `InferSelectModel<typeof table>` with the relations it loads, a pure `parse<Table>` adding computed fields (e.g. `canEdit: Boolean(data.isAdmin || data.isEditor)`), and the row type as `ReturnType<typeof parse<Table>>`. Parsers must not import `@/db/client`.

Factor the real `db.query` into one private executor and reuse it from both the cached and the `{ cache: false }` branch, never copy-pasting the query body:

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

Single-statement writes go straight through `db` inside the server action, with no mutation file: `safeParse` with the drizzle-zod schema, `db.insert/update(...).returning()`, `revalidateTag(...)`, return `{ data, error }` (see `createDocArticle` in `src/actions/doc.ts`).

Production runs the **neon-http** driver, which has **no interactive transactions**, so any write spanning more than one statement uses `transaction()` from `@/db/client`:

- `transaction(fn)` runs `fn(tx)` atomically. Dev (`pg`) uses the pooled `node-postgres` transaction; prod reuses a lazily-initialized, module-scoped **neon-serverless** WebSocket pool (`max: 3`, shared across invocations in a warm instance). Requires a global `WebSocket` (Node 22+; the repo pins `24.16.0` via `.node-version` with an `engines.node: ">=22"` floor).
- Multi-statement logic lives in `src/db/mutations/<domain>.ts` as composable `(tx: Transaction, ...args) => ...` units. The action wraps the call: `await transaction(tx => deleteUser(tx, id))`.
- **Inside a transaction, statements MUST run sequentially**, one `await` at a time. All statements share one connection, so `Promise.all` on a single `tx` corrupts the session. This is why `react-doctor/async-parallel` is disabled in transactional mutation files.
- Keep slow side effects (PDF generation, email, R2 uploads) **outside** the transaction: compute inputs first, then open a short transaction for the DB writes only.

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
```

**Tenancy:** authorization and tenant scoping stay at the action boundary (verify ownership or org membership before calling the mutation); mutations operate on already-authorized ids.

### Cache strategy

Tags are the `CacheTag` enum in `src/lib/cache.ts`, which also holds the per-record helpers: `userTag(id)` gives `user-{id}`, `courseTag(slug)` gives `course-{slug}`, `certificatesUserTag(userId)` gives `certificates-user-{userId}`, `certificatesTutorTag(reviewerId)` gives `certificates-tutor-{reviewerId}`, and `certificatesOrgTag(orgId)` gives `certificates-org-{orgId}`. Global tags cover a whole collection (`admin-users`, `auth-user`, `auth-user-status`, `courses`, `doc-categories`, `organizations`, `skill-groups`, `team-members`, `user-email`); per-record tags are `user`, `course`, and `certificates`. Read the file for the current set and which query owns each tag.

- `'use cache'` goes on the inner fetch function, never the exported one.
- `cacheTag()` tags the data, `cacheLife('max')` for long-lived caches, `revalidateTag(tag, 'max')` after mutations.
- React `cache()` for request-level deduplication; `{ cache: false }` on the exported function to bypass.

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

## Error handling

- `safeQuery()` wraps a query in try/catch and returns `{ data, error: null }` or `{ data: null, error: { code, message } }`; `queryError()` normalizes unknown errors into that `{ code, message }` shape.
- Server actions return `{ data, error }` or `{ error }`, and callers must check.
- **Mutations that fail throw; queries that fail return error objects.**
- Global boundary `src/app/error.tsx` (client) logs and offers go back, back to home, refresh. Global 404 `src/app/not-found.tsx` (server) checks auth to pick the right link.
- Layout guards: the admin layout calls `notFound()` if `!user.isAdmin`, the certificates layout if `user.canEdit`.
- User feedback is `sonner`: `toast.success()`, `toast.error()`.

## Environment variables

> **MANDATORY:** every environment variable the Next.js app uses MUST be declared in the Zod schema in `next.config.ts`. `GITHUB_TOKEN` and `VERCEL_TOKEN` are the only exclusions, since external CLI tools read them and the app never does.

The schema covers `APP_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, the R2 set (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`), the Gemini set (`GEMINI_API_KEY`, `GEMINI_MODEL`), and the SMTP set (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`). Read `next.config.ts` for the current validators.

**Validation:** the schema is a module-scope constant in `next.config.ts`. `schema.parse(process.env)` runs whenever the config loads (`next dev` start, `next build`, `next start`) unless `SKIP_ENV_VALIDATION` is set; `scripts/typegen.mts` sets it when calling `next typegen`. The same file declares the global `ProcessEnv` augmentation, so `process.env` is typed app-wide.

> **MANDATORY:** the schema must NOT move into `src/` or be imported from a `src/` file. Next watches the module-dependency graph of `next.config.ts` and restarts the dev server whenever a watched file changes, so importing from `src/` makes every `src/**` edit trigger a full restart (cold 5-10s recompiles). Keep the schema inline; `zod` is its only allowed import.

## Static data

| File                   | Purpose                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `config/app.json`      | Feature settings (`minSkills: 3`, `minRating: 3`, `maxAvatarSize: 2048`, `mapsUrl`, `sidebarShortcut: "\\"`) |
| `config/i18n.json`     | Locale definitions, default locale, title-case locales, spoken languages, hardcoded messages                 |
| `config/icons.json`    | Lucide icon metadata (~1,640 entries: name, categories, tags) for icon picker fuzzy search                   |
| `config/metadata.json` | App name, version, URL, email, keywords, authors                                                            |
| `config/theme.json`    | Theme modes, breakpoints, hex color palette for light and dark                                              |

## Dev environment and performance

Non-obvious settings that keep dev HMR and CI builds fast. They back the dev-performance gotcha in `AGENTS.md` and MUST NOT be reverted in refactors.

**React Compiler:** `reactCompiler` is `phase !== PHASE_DEVELOPMENT_SERVER`, on for builds and off in dev, because Babel kills Turbopack HMR. Do not add manual `useMemo`/`useCallback` unless the compiler cannot handle the pattern.

**Turbopack dev cache:** `experimental.turbopackFileSystemCacheForDev: false` is REQUIRED. The Next 16 `true` default balloons `.next/dev/cache/turbopack` (1.4GB+ observed) and stalls every HMR by 5-10s through the `turbopack-compaction` and `turbopack-persistence` passes. Reclaim disk after toggling with `pnpm run dev:clean`.

**Oxlint typeAware split:** `.oxlintrc.json` keeps `typeAware: true` so CLI runs (`pnpm run check:lint`, pre-commit, pre-push, CI) include the type-aware rules (`no-floating-promises`, `no-misused-promises`, `unbound-method`). `.vscode/settings.json` sets `oxc.typeAware: false`, forwarded to the LSP by `oxc.oxc-vscode`, keeping the editor off the slow `oxlint-tsgolint` path. Change one side only by deliberately changing the other.

**Editor save chain:** `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`. `source.format.oxc` was dropped because `editor.formatOnSave` already runs oxfmt; `source.removeUnusedImports` was dropped because it calls the TypeScript language server on every save. `knip.deferSession: true` defers the module graph until started manually.

**Dual DB driver:** `src/db/client.ts` picks by URL host: `localhost` or `127.0.0.1` uses `node-postgres` + `pg.Pool`, anything else uses `neon-http`. The `DATABASE_URL` validator accepts `sslmode=require` (Neon) or `@localhost`/`@127.0.0.1`. Local Postgres runs on **port 5433** via `.env.development.local` (gitignored, dev-only, avoids a host Postgres on 5432); provision with `pnpm run db:up` then `pnpm run db migrate`. Saves roughly 1.9s per HMR of Neon HTTP latency. Both drivers share the read and single-statement API (the `db` cast is safe); multi-statement writes take the `transaction()` path above.

**Prebuilt CI deploys:** `vercel.json` sets `git.deploymentEnabled: false`; `.github/workflows/deploy.yml` runs `vercel pull`, `build`, and `deploy --prebuilt` on the 4-core runner with a warm `.next/cache`, so Vercel's "Building" step is a ~20s upload rather than a ~3min build. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` sit in the workflow `env` as non-secret IDs (`.vercel/` is gitignored). Two flags MUST NOT be reverted: `typescript.ignoreBuildErrors: true` (the `Check` workflow runs `pnpm run check` first, so the build check is redundant; Next 16.3 type-checks builds by shelling out to the project-local `tsc` CLI, which measured 3.3s here, down from the 30-45s the TypeScript 6 JavaScript-API checker cost) and `experimental.turbopackFileSystemCacheForBuild: true` (lets the restored cache speed up compile).

## Framework docs

Next.js is the only dependency here that ships its own documentation, under `node_modules/next/dist/docs/`. It always matches the installed version, so grep it for API pages instead of trusting recall.

context7 covers the rest of the stack and serves the same Next.js pages, but resolve the pinned id (`/vercel/next.js/v<installed version>`) rather than the bare `/vercel/next.js`. The unpinned id follows a moving default, and this app runs `cacheComponents`, Cached Components, and `NextProxy`, which are v16-only surface where a v15 answer is wrong rather than merely dated.

## Browser verification

Visual checks run through the machine-wide `agent-browser` skill against the dev server that is already running, never a second app stack. There is no agent-owned preview server, no isolated dist dir, and no preview MCP in this repo.

- Start the app with `pnpm run dev` if nothing is listening, then drive `https://glore.localhost` (portless routes it to Next on `127.0.0.1:45673`).
- Name the session after the task or worktree, act on snapshot refs, and close the session in the same turn that finishes with it. An orphaned session holds roughly 900MB of Chrome processes.
- Authenticated flows use a persistent `--session-name` profile so cookies survive across runs. Full flow, cleanup, and auth escalation rules: the user's `browser.instructions.md` and the `agent-browser` skill.
- `APP_URL` must match the host being driven, since `allowedDevOrigins` is derived from it.
