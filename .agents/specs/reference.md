# Technical reference: runtime and data

Authentication, data fetching, cache, errors, env vars, storage, and daily maintenance. Routes and the proxy: `routes.md`. Dev environment flags: `workflow.md`.

## Authentication

- Better Auth stores users, sessions, and accounts in Neon through the Drizzle adapter.
- The `auth` instance lives in `src/lib/auth.ts`, server-only, and serves server components, server actions, and the proxy.
- Import tables there only from `@/db/schema/<table>`, never the schema barrel, because `proxy.ts` calls `auth.api.getSession` on every request.
- Catch-all route: `src/app/api/auth/[...all]/route.ts`.

### Cookies

- Better Auth keeps session tokens in signed HTTP-only cookies, cached for 5 minutes to cut API calls.
- All app cookies use the `gl` prefix, and Better Auth uses it through `advanced.cookiePrefix`.

### Sign-up guard

- `emailAndPassword.autoSignIn` is `false` and MUST stay `false`.
- Every `signUpEmail` call creates an account for someone else (team invites), never for the actor.
- With auto sign-in on, the invitee's session cookie would be written onto the inviter's response.
- Self-registration does not use `signUpEmail`: it creates a `pending` join request, so `signInEmail` login is unaffected.

### Plugins

- `username()`: username and display username.
- `admin()`: admin role management, user creation, and impersonation. Its endpoints stay closed over HTTP.
- `impersonationGuard()`: local plugin in `lib/impersonation-guard.ts` (`admin.md`).
- `nextCookies()`: Next.js cookie integration.
- `team-invitations`: local plugin that exposes `acceptInvitation`.

### Hardening

- `disabledPaths` closes `/sign-up/email` and `/update-user` over HTTP, so accounts only come from invites through `auth.api`.
- Rate limits share the `rate_limits` table: Better Auth through `rateLimit.storage: 'database'`, app keys through `src/lib/rate-limit.ts`.
- `requireEditor` (`src/actions/guards.ts`) and `authorizeEditorRequest` (`src/lib/api.ts`) read the session with `disableCookieCache`, so bans and demotions apply at once.
- `getCurrentUser` roles are cached under `userTag`, so every membership write calls `expireUserAccess` (`src/actions/organizations/helpers.ts`).
- Login and password reset answer unknown users exactly like wrong passwords and real resets.
- Email changes go through `auth.api.changeEmail`, which mails a verification link to the new address through `emailVerification.sendVerificationEmail`.

### Stale sessions

- When the cookie cache outlives the user row, `getCurrentUser` redirects to `/api/v1/session`.
- That route re-reads the session without the cache and clears auth cookies only when the session is invalid, so a forged link cannot sign out a live user.
- `deleteAccount` signs out and expires `userTag` itself.

## Daily maintenance

- A daily Vercel Cron (`vercel.json`) calls `/api/v1/cron/daily`.
- The route answers 401 unless `isAuthorizedCron` (`src/lib/cron.ts`) accepts the request: production and a bearer token equal to `CRON_SECRET`.
- It then runs `runDailyMaintenance` (`src/actions/maintenance/`), with each step isolated so one failure does not stop the rest.
- Reminders: `certificate.review_reminder` goes to the assigned tutor at the `reviewReminderDays` marks of `config/app.json`.
- `certificate.review_escalated` goes out at the same marks, also for unassigned requests.
- `invitation.expiring` goes out once per send after `invitationReminderDay`, with a token-only link.
- Idempotency comes from `activity_events`, and the planners in `plan.ts` are pure with an injectable clock.
- Pruning removes `rate_limits` idle for 24h and expired `sessions` and `verifications`.
- Pruning removes invitations expired, revoked, or declined for `invitationRetentionDays`. Accepted ones stay.
- Pruning removes R2 avatars and certificate PDFs older than 24h that no row references. A logo or signature URL stored in any certificate `snapshot` counts as referenced. The PDF of a revoked certificate counts as unreferenced, even when its row still holds a `documentUrl`.
- Deleting a user, organization, or avatar removes the object at once, except an organization logo or signature that a certificate `snapshot` still references.

## Data fetching

### Query pattern

- Per table, `src/db/queries/<table>.ts` holds an `interface` extending `InferSelectModel<typeof table>` with the relations it loads.
- It also holds a pure `parse<Table>` that adds computed fields (for example `canEdit: Boolean(data.isAdmin || data.isEditor)`).
- The row type is `ReturnType<typeof parse<Table>>`.
- Parsers MUST NOT import `@/db/client`.
- Factor the real `db.query` into one private executor and reuse it from the cached branch and the `{ cache: false }` branch, never copy the query body.

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

### Database drivers

- `src/db/client.ts` picks the driver by URL host: `localhost` or `127.0.0.1` uses `node-postgres` with `pg.Pool`, anything else uses `neon-http`.
- The `DATABASE_URL` validator accepts `sslmode=require` (Neon) or `@localhost` and `@127.0.0.1`.
- Local Postgres runs on port 5433 through `.env.local` (gitignored, avoids a host Postgres on 5432). Provision it with `pnpm run db:up`, then `pnpm run db migrate`.
- Both drivers share the read and single-statement API, so the `db` cast is safe.

### Transactions and the mutation layer

- A single-statement write goes straight through `db` inside the server action, with no mutation file.
- It runs `safeParse` with the drizzle-zod schema, `db.insert/update(...).returning()`, `revalidateTag(...)`, and returns `{ data, error }` (see `createDocArticle` in `src/actions/docs.ts`).

### Transactions

- Production runs the neon-http driver, which has no interactive transactions, so any write spanning more than one statement uses `transaction()` from `@/db/client`.
- `transaction(fn)` runs `fn(tx)` atomically.
- Dev (`pg`) uses the pooled `node-postgres` transaction.
- Production reuses a lazily initialized, module-scoped neon-serverless WebSocket pool (`max: 3`, shared across invocations in a warm instance).
- The pool needs a global `WebSocket` (Node 22+). The repo pins `24.16.0` in `.node-version` with an `engines.node: ">=22"` floor.

### Mutation units

- Multi-statement logic lives in `src/db/mutations/<domain>.ts` as composable `(tx: Transaction, ...args) => ...` units.
- The action wraps the call: `await transaction(tx => deleteUser(tx, id))`.
- Inside a transaction, statements MUST run sequentially, one `await` at a time, because they share one connection and `Promise.all` on a `tx` corrupts the session.
- `.oxlintrc.json` turns off `react-doctor/async-parallel`, `async-await-in-loop`, and `server-sequential-independent-await` for `src/db/mutations/**` and `src/db/helpers.ts`.
- Batch writes inside one transaction use `mapSequential` from `@/db/helpers`.
- Progress and membership rows have unique indexes, so their inserts use `onConflictDoNothing()`.
- `submitCertificateRequest` takes a transaction-scoped advisory lock to keep one open certificate request per user and organization.
- Keep slow side effects (PDF generation, email, R2 uploads) outside the transaction: compute inputs first, then open a short transaction for the DB writes only.
- Authorization and tenant scoping stay at the action boundary: verify ownership or org membership before calling the mutation, which operates on already-authorized ids.

### Cache strategy

- Tags are the `CacheTag` enum plus per-record helpers (`userTag`, `courseTag`, `progressUserTag`, `certificates*Tag`) in `src/lib/cache.ts`. Read it for the current set and owners.
- Put `'use cache'` (with `cacheLife('max')` for long-lived data) on the inner fetch function, never on the exported one.
- The exported function takes `{ cache: false }` to bypass, and React `cache()` dedupes per request.
- In a server action whose caller must see its own write, use `updateTag(tag)`. `updateTag` throws outside server actions.
- Elsewhere use `revalidateTag(tag, 'max')`.
- Role and membership writes call `expireUserAccess` (org actions) or `revalidateUserAccess` (admin actions).
- Progress writes expire `progressUserTag(userId)`.
- Never mutate during render: enrollment is an explicit Start click calling `startCourse`, never a page effect.

## Error handling

- `safeQuery()` wraps a query in try/catch and returns `{ data, error: null }` or `{ data: null, error: { code, message } }`.
- `queryError()` normalizes unknown errors into that `{ code, message }` shape.
- Server actions return `{ data, error }` or `{ error }`, and callers MUST check.
- Mutations that fail throw. Queries that fail return error objects.
- The global boundary `src/app/error.tsx` (client) logs and offers go back, back to home, and refresh.
- The global 404 `src/app/not-found.tsx` (server) checks auth to pick the right link.
- The admin layout calls `notFound()` when `!user.isAdmin`, and the certificates layout when `user.canEdit`.
- User feedback uses `sonner`: `toast.success()` and `toast.error()`.

## Environment variables

- Every environment variable the Next.js app uses MUST be declared in the Zod schema in `next.config.ts`.
- `GITHUB_TOKEN` and `VERCEL_TOKEN` are the only exclusions, since external CLI tools read them and the app never does.
- Read `envSchema` in `next.config.ts` for the current set and validators.
- `MAIL_TRANSPORT` (ignored in production) replaces SMTP in dev: `mailpit` delivers to the `pnpm run mail:up` inbox (`localhost:1025`), `log` only logs `[mail] <template> to <recipient>`.
- `TEST_EMAIL` is read only by scripts (`db:seed:demo`), so it stays out of the schema.

### Validation and files

- `next.config.ts` must load with no env at all, because `pnpm install` runs `next typegen` with `SKIP_ENV_VALIDATION`. Never dereference an env var there without a fallback.
- The schema is a module-scope constant. `schema.parse(process.env)` runs whenever the config loads (`next dev` start, `next build`, `next start`) unless `SKIP_ENV_VALIDATION` is set.
- `scripts/typegen.mts` sets `SKIP_ENV_VALIDATION` when it calls `next typegen`, so a fresh clone with no secrets can still run `pnpm install`.
- `@next/env` picks env files by phase, not by `NODE_ENV`.
- `next dev` reads `.env.development.local`, `.env.local`, `.env.development`, `.env`. Every other command reads the `.env.production*` variants plus `.env.local` and `.env`.
- Put machine-local values in `.env.local`, the only file both sets share: a required variable only in `.env.development.local` fails `next build` validation.
- The last definition in a file wins, and no file overrides a variable already in `process.env` (as on Vercel).
- Define `APP_URL` once in `.env.local`: a duplicate or stale value sends redirects away from localhost, and Better Auth rejects the `Origin` of the driven host.
- The schema MUST NOT move into `src/` or be imported from a `src/` file.
- Next watches the module-dependency graph of `next.config.ts` and restarts the dev server whenever a watched file changes, so a `src/` import makes every `src/**` edit a full restart (cold 5 to 10s recompiles).
- Keep the schema inline. `zod` is its only allowed import.

## Storage (R2)

- `src/lib/storage.ts` holds the R2 helpers (`r2Put`, `r2Delete`, `r2List`, `r2PresignAvatar`, `r2PresignSignature`, `r2VerifyAvatar`).
- Avatars upload directly to R2 through a presigned PUT, which avoids the Server Action 1MB and Vercel 4.5MB body limits.
- The flow: `create*AvatarUploadUrl(contentType)` (the server picks the key and presigns), then the client `fetch(url, { method: 'PUT' })`, then `confirm*Avatar(key)` persists `avatarUrl`.
- A direct browser PUT requires bucket CORS that allows PUT from the app origin (`https://glore.localhost` in dev, the production domain).
- The R2 API token is object-scoped: it can PUT, GET, and DELETE objects but gets 403 on bucket-admin calls such as `PutBucketCors`. Set CORS in the Cloudflare dashboard or with an admin token.
- The avatar cap comes from `maxAvatarSize` in `config/app.json` and is enforced on the selected file in the `ImageCropper` dropzone.

## Static data

- `config/app.json`: feature settings (`minSkills`, `minRating`, `maxAvatarSize`, and the rest).
- `config/i18n.json`: locales.
- `config/icons.json`: icon-picker metadata.
- `config/metadata.json`: app metadata.
- `config/theme.json`: breakpoints.

## Framework docs

- Grep `node_modules/next/dist/docs/` for Next.js APIs. It always matches the installed version.
- For context7, use the pinned id `/vercel/next.js/v<installed version>`: `cacheComponents` and `NextProxy` are v16-only, so a v15 answer is wrong.
