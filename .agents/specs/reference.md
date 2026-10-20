# Technical reference: runtime and data

Runtime and data-layer reference. Read the section you need. Component, type, hook, util, theming, form, and email conventions: `patterns.md`.

## Routing

Two route groups: `(auth)` for unauthenticated pages (no shared layout beyond root) and `(dashboard)` for authenticated pages with the sidebar, wrapped in `SidebarProvider > SessionProvider > CoursesProvider`.

**Public:** `/login`, `/register` (submits org details and creates a `pending` org join request), `/[username]` (public certificate page), `/offline` (PWA fallback).

**Authenticated, pre-onboarding:** `/onboarding`, `/onboarding/error`.

**Authenticated, dashboard layout, no extra gate:** `/dashboard`, `/about`, `/courses`, `/courses/[slug]` (detail and editor), `/docs` plus `/docs/intro`, `/docs/faq`, `/docs/tutorials`, `/help`, `/settings`.

**Authenticated, dashboard layout, extra gate:**

| Route                       | Gate        | Notes                                                                                                                 |
| --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `/admin`                    | `isAdmin`   | No page: `next.config.ts` permanently redirects to `/admin/team`, the panel landing                                   |
| `/admin/team`               | `isAdmin`   | Team management                                                                                                       |
| `/admin/users`              | `isAdmin`   | User moderation: ban/unban, platform role changes                                                                     |
| `/admin/organizations`      | `isAdmin`   | Tabs all/pending/active/rejected; approve, reject (soft, keeps the org record), create (no rep), invite (with rep)    |
| `/admin/organizations/[id]` | `isAdmin`   | `?tab=`: members table (search/sort/role filter, role change, remove, invite), settings (profile, avatar, delete org) |
| `/organization`             | org manager | Organization panel                                                                                                    |
| `/certificates`             | non-editor  | List; `/certificates/new` and `/certificates/[id]` share the same gate                                                |

`/` permanently redirects to `/dashboard` (`next.config.ts`).

### API routes

| Path                   | Method   | Description                                    |
| ---------------------- | -------- | ---------------------------------------------- |
| `/api/auth/[...all]`   | GET/POST | Better Auth catch-all handler                  |
| `/api/v1/ai/command`   | POST     | AI command (editors, rate limited)             |
| `/api/v1/ai/copilot`   | POST     | AI copilot (editors, rate limited)             |
| `/api/v1/join`         | GET      | Team invitation join endpoint                  |
| `/api/v1/manifest`     | GET      | Dynamic PWA manifest (locale-aware, cached 1h) |
| `/api/v1/session`      | GET      | Clears cookies of a stale session, then login  |
| `/api/v1/upload`       | POST     | R2 file upload (editors, rate limited)         |
| `/api/v1/health`       | GET      | Health check (returns `{ status: 'ok' }`)      |
| `/api/v1/cron/cleanup` | GET      | Daily cleanup (Vercel Cron, `CRON_SECRET`)     |

## Authentication

Better Auth stores users, sessions, and accounts in Neon via the Drizzle adapter. The `auth` instance is exported from `src/lib/auth.ts`, server-only, used in server components, server actions, and the proxy. It imports only `accounts`, `sessions`, `users`, `verifications` from individual schema files (never the schema barrel), because `proxy.ts` calls `auth.api.getSession` on every request.

**Request lifecycle** in `proxy.ts` (NextProxy), which intercepts all non-static requests:

1. `auth.api.getSession()` validates the session from signed HTTP-only cookies.
2. Unauthenticated or banned > redirect to `/login` (`?expired=true` when a session cookie was present).
3. Authenticated but `onboardedAt` is null > redirect to `/onboarding`.
4. Onboarded and hitting `/onboarding` > redirect to `/dashboard`.
5. Authenticated and hitting `/login` > redirect to `/dashboard`.

**Cookies:** Better Auth manages session tokens in signed HTTP-only cookies, cached for 5 minutes to cut API calls. All app cookies use the `gl` prefix, Better Auth via `advanced.cookiePrefix`.

**`emailAndPassword.autoSignIn` is `false` and MUST stay false.** Every `signUpEmail` call creates an account for someone else (team and org invites), never the actor; with auto sign-in on, the invitee's session cookie would be written onto the inviter's response. Self-registration does not use `signUpEmail` (it creates a `pending` join request), so `signInEmail` login is unaffected.

**Plugins:** `username()` (username and display username), `admin()` (admin role management, user creation), `nextCookies()` (Next.js cookie integration). Catch-all route: `src/app/api/auth/[...all]/route.ts`.

**Hardening:** `disabledPaths` closes `/sign-up/email` and `/update-user` over HTTP, so accounts only come from invites through `auth.api`. Rate limits share the `rate_limits` table: Better Auth via `rateLimit.storage: 'database'`, app keys via `src/lib/rate-limit.ts`. `requireEditor` (`src/actions/guards.ts`) and `authorizeEditorRequest` (`src/lib/api.ts`) read the session with `disableCookieCache`, so bans and demotions apply at once. `getCurrentUser` roles are cached under `userTag`, so every membership write calls `expireUserAccess` (`src/actions/organizations/helpers.ts`). Login and password reset answer unknown users exactly like wrong passwords and real resets. A daily Vercel Cron (`vercel.json`) calls `/api/v1/cron/cleanup`, which prunes `rate_limits` rows idle for 24h and deletes R2 avatars older than 24h that no row references; deleting a user, organization, or avatar removes the object at once. Email changes go through `auth.api.changeEmail`, which mails a verification link to the new address via `emailVerification.sendVerificationEmail`.

**Stale sessions:** when the cookie cache outlives the user row, `getCurrentUser` redirects to `/api/v1/session`, which re-reads the session without the cache and clears auth cookies only when it is invalid, so a forged link cannot sign out a live user. `deleteAccount` signs out and expires `userTag` itself.

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
- **Inside a transaction, statements MUST run sequentially**, one `await` at a time. All statements share one connection, so `Promise.all` on a single `tx` corrupts the session. `.oxlintrc.json` turns off `react-doctor/async-parallel` and `async-await-in-loop` for `src/db/mutations/**` and `src/db/helpers.ts`; batch writes inside one transaction use `mapSequential` from `@/db/helpers`. Progress and membership rows have unique indexes, so their inserts use `onConflictDoNothing()`, and `createCertificateWithSkills` takes a transaction-scoped advisory lock to keep one non-draft certificate per user and organization.
- Keep slow side effects (PDF generation, email, R2 uploads) **outside** the transaction: compute inputs first, then open a short transaction for the DB writes only.

**Tenancy:** authorization and tenant scoping stay at the action boundary (verify ownership or org membership before calling the mutation); mutations operate on already-authorized ids.

### Cache strategy

Tags are the `CacheTag` enum plus per-record helpers (`userTag`, `courseTag`, `progressUserTag`, `certificates*Tag`) in `src/lib/cache.ts`; read it for the current set and owners.

- `'use cache'` (with `cacheLife('max')` for long-lived data) goes on the inner fetch function, never the exported one; the exported one takes `{ cache: false }` to bypass, and React `cache()` dedupes per request.
- In a server action whose caller must see its own write, use `updateTag(tag)`; elsewhere use `revalidateTag(tag, 'max')`. `updateTag` throws outside server actions.
- Role and membership writes call `expireUserAccess` (org actions) or `revalidateUserAccess` (admin actions); progress writes expire `progressUserTag(userId)`.
- Never mutate during render: a page that must record a visit (course enrollment) does it from a client effect calling the action (`CourseEnrollment`).

## Error handling

- `safeQuery()` wraps a query in try/catch and returns `{ data, error: null }` or `{ data: null, error: { code, message } }`; `queryError()` normalizes unknown errors into that `{ code, message }` shape.
- Server actions return `{ data, error }` or `{ error }`, and callers must check.
- **Mutations that fail throw; queries that fail return error objects.**
- Global boundary `src/app/error.tsx` (client) logs and offers go back, back to home, refresh. Global 404 `src/app/not-found.tsx` (server) checks auth to pick the right link.
- Layout guards: the admin layout calls `notFound()` if `!user.isAdmin`, the certificates layout if `user.canEdit`.
- User feedback is `sonner`: `toast.success()`, `toast.error()`.

## Environment variables

> **MANDATORY:** every environment variable the Next.js app uses MUST be declared in the Zod schema in `next.config.ts`. `GITHUB_TOKEN` and `VERCEL_TOKEN` are the only exclusions, since external CLI tools read them and the app never does.

Read `envSchema` in `next.config.ts` for the current set and validators. `MAIL_TRANSPORT=log` (ignored in production) swaps SMTP for a JSON transport that only logs `[mail] <template> to <recipient>`; set it in `.env.local` for dev and e2e so flows never mail real addresses.

**Validation:** the schema is a module-scope constant in `next.config.ts`. `schema.parse(process.env)` runs whenever the config loads (`next dev` start, `next build`, `next start`) unless `SKIP_ENV_VALIDATION` is set; `scripts/typegen.mts` sets it when calling `next typegen`, so a fresh clone with no secrets can still run `pnpm install`.

**File loading:** `@next/env` picks env files by phase, not by `NODE_ENV`. `next dev` reads `.env.development.local`, `.env.local`, `.env.development`, `.env`; every other command, `next build` and `next typegen` and `next start`, loads the config with `PHASE_PRODUCTION_BUILD` and reads `.env.production.local`, `.env.local`, `.env.production`, `.env`. Machine-local values therefore belong in `.env.local`, the only file both sets share: a required variable only in `.env.development.local` fails `next build` validation, whatever `NODE_ENV` says. Within one file the last definition of a variable wins, and a variable already in `process.env`, as on Vercel, is never overwritten by any file.

> **MANDATORY:** the schema must NOT move into `src/` or be imported from a `src/` file. Next watches the module-dependency graph of `next.config.ts` and restarts the dev server whenever a watched file changes, so importing from `src/` makes every `src/**` edit trigger a full restart (cold 5-10s recompiles). Keep the schema inline; `zod` is its only allowed import.

## Static data

`config/*.json` holds feature settings (`app.json`: `minSkills`, `minRating`, `maxAvatarSize`), locales (`i18n.json`), icon-picker metadata (`icons.json`), app metadata (`metadata.json`), and breakpoints (`theme.json`).

## Dev environment and performance

Non-obvious settings that keep dev HMR and CI builds fast. They back the dev-performance gotcha in `AGENTS.md` and MUST NOT be reverted in refactors.

**React Compiler:** `reactCompiler` is `phase !== PHASE_DEVELOPMENT_SERVER`, on for builds and off in dev, because Babel kills Turbopack HMR. Do not add manual `useMemo`/`useCallback` unless the compiler cannot handle the pattern.

**Turbopack dev cache:** `experimental.turbopackFileSystemCacheForDev: false` is REQUIRED. The Next 16 `true` default balloons `.next/dev/cache/turbopack` (1.4GB+ observed) and stalls every HMR by 5-10s through the `turbopack-compaction` and `turbopack-persistence` passes. Reclaim disk after toggling with `pnpm run dev:clean`.

**Oxlint typeAware split:** `.oxlintrc.json` keeps `typeAware: true` so CLI runs (`pnpm run check:lint`, pre-commit, pre-push, CI) include the type-aware rules (`no-floating-promises`, `no-misused-promises`, `unbound-method`). `.vscode/settings.json` sets `oxc.typeAware: false`, forwarded to the LSP by `oxc.oxc-vscode`, keeping the editor off the slow `oxlint-tsgolint` path. Change one side only by deliberately changing the other.

**Editor save chain:** `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`. `source.format.oxc` was dropped because `editor.formatOnSave` already runs oxfmt; `source.removeUnusedImports` was dropped because it calls the TypeScript language server on every save. `knip.deferSession: true` defers the module graph until started manually.

**Dual DB driver:** `src/db/client.ts` picks by URL host: `localhost` or `127.0.0.1` uses `node-postgres` + `pg.Pool`, anything else uses `neon-http`. The `DATABASE_URL` validator accepts `sslmode=require` (Neon) or `@localhost`/`@127.0.0.1`. Local Postgres runs on **port 5433** via `.env.local` (gitignored, avoids a host Postgres on 5432); provision with `pnpm run db:up` then `pnpm run db migrate`. Saves roughly 1.9s per HMR of Neon HTTP latency. Both drivers share the read and single-statement API (the `db` cast is safe); multi-statement writes take the `transaction()` path above.

**Prebuilt CI deploys:** `vercel.json` sets `git.deploymentEnabled: false`; `.github/workflows/deploy.yml` runs `vercel pull`, `build`, and `deploy --prebuilt` on the 4-core runner with a warm `.next/cache`, so Vercel's "Building" step is a ~20s upload rather than a ~3min build. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` sit in the workflow `env` as non-secret IDs (`.vercel/` is gitignored). Two flags MUST NOT be reverted: `typescript.ignoreBuildErrors: true` (the `Check` workflow runs `pnpm run check` first, so the build check is redundant; Next 16.3 type-checks builds by shelling out to the project-local `tsc` CLI, which measured 3.3s here, down from the 30-45s the TypeScript 6 JavaScript-API checker cost) and `experimental.turbopackFileSystemCacheForBuild: true` (lets the restored cache speed up compile).

## Framework docs

- Grep `node_modules/next/dist/docs/` for Next.js APIs; it always matches the installed version.
- For context7, use the pinned id `/vercel/next.js/v<installed version>`: `cacheComponents` and `NextProxy` are v16-only, so a v15 answer is wrong.

## Browser verification

- Drive the running dev server at `https://glore.localhost` with the machine-wide `agent-browser` skill; never start a second app stack or preview server.
- Reuse Playwright auth state (`--state tmp/playwright/.auth/<role>.json --ignore-https-errors`) to act as a seeded user.
- Close each named session in the turn that finishes with it; an orphan holds about 900MB of Chrome.
- `APP_URL` must match the driven host, since `allowedDevOrigins` and Better Auth `baseURL` derive from it.

## Testing

- `pnpm run test` runs Vitest in the Node environment over `src/**/*.test.ts` and `scripts/**/*.test.ts`. `vitest.config.ts` resolves tsconfig paths and aliases `server-only` to an empty module, so server actions import cleanly; mock `@/actions/auth` and `next/cache` per test. It loads `.env` and `.env.local`, so DB-backed tests (for example `src/db/mutations/certificate.test.ts`) run against the seeded local DB and skip themselves when `DATABASE_URL` is not local.
- `pnpm run db:seed` (`scripts/seed.mts`) upserts the org `glore-seed` and one user per role at `<role>@seed.glore.test`: `admin` (platform admin), `editor`, `owner` (org admin), `representative`, `tutor`, `volunteer`, `learner`. The shared password and roles live in `scripts/seed-data.ts`. It runs in one transaction, is idempotent, and exits non-zero unless `DATABASE_URL` points to localhost.
- Claude Code: tracked `.claude/settings.json` allowlists the check, test, typegen, and seed scripts, denies reads of local env files, and runs `oxfmt` on every edited file through a `PostToolUse` hook.
- `pnpm run test:e2e` runs Playwright (`e2e/`) against the dev server at `E2E_BASE_URL` (default `https://glore.localhost`). The `setup` project logs in `admin`, `owner`, and `volunteer` and stores their state in `tmp/playwright/.auth/`; specs pick one with `test.use({ storageState: authFile(role) })`. Better Auth limits sign-ins, so add a role to `AUTH_ROLES` instead of logging in inside specs.
