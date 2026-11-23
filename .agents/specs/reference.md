# Technical reference: runtime and data

Data fetching, cache, errors, env vars, storage, and daily maintenance. Authentication and sessions: `auth.md`. Routes and the proxy: `routes.md`. Dev environment flags: `workflow.md`.

## Daily maintenance

- A daily Vercel Cron (`vercel.json`) calls `/api/v1/cron/daily`.
- The route answers 401 unless `isAuthorizedCron` (`src/lib/cron.ts`) accepts the request: production and a bearer token equal to `CRON_SECRET`.
- It then runs `runDailyMaintenance` (`src/actions/maintenance/`), with each step isolated so one failure does not stop the rest.
- Reminders: `certificate.review_reminder` goes to the assigned tutor at the `reviewReminderDays` marks of `config/app.json`.
- `certificate.review_escalated` goes out at the same marks, also for unassigned requests.
- `invitation.expiring` goes out once per send after `invitationReminderDay`, with a token-only link rebuilt from the sealed token (`revealInvitationToken`).
- Idempotency comes from `activity_events`, and the planners in `plan.ts` are pure with an injectable clock. `messages.stale` notices are in `content.md`.

### Pruning

- Pruning removes `rate_limits` idle for 24h and expired `sessions` and `verifications`.
- Pruning removes invitations expired, revoked, or declined for `invitationRetentionDays`. Accepted ones stay.
- Pruning removes R2 avatars and certificate PDFs older than 24h that no row references. A logo or signature URL stored in any certificate `snapshot` counts as referenced.
- The PDF of a revoked certificate counts as unreferenced, even when its row still holds a `documentUrl`.
- The sweepers delete orphan objects 20 at a time.
- Deleting a user, organization, or avatar removes the object at once, except an organization logo or signature that a certificate `snapshot` still references.

## Data fetching

### Query pattern

- Per table, `src/db/queries/<table>.ts` holds an `interface` extending `InferSelectModel<typeof table>` with the relations it loads.
- It also holds a pure `parse<Table>` that adds computed fields (for example `canEdit: Boolean(data.isAdmin || data.isEditor)`).
- The row type is `ReturnType<typeof parse<Table>>`.
- Parsers MUST NOT import `@/db/client`.
- Factor the real `db.query` into one private executor and reuse it from the cached branch and the `{ cache: false }` branch, never copy the query body.
- `findUser`, `fetchUser`, and `queryUserById` live in `actions/user-data.ts`. That module is `server-only` and never carries `'use server'`, because they check no caller.
- `src/actions/server-action-surface.test.ts` enforces the rule: every export of a `'use server'` module (single or double quotes) is a function declared in that file, with no re-export, `export *`, alias, `let`, or default alias.
- Each one calls a guard or sits on the named public allowlist in the test, with a reason.

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
- The pool needs a global `WebSocket` (Node 22+). The repo pins `24.22.1` in `.node-version` with `engines.node: "24.x"`, matching the Vercel Node.js 24 runtime.

### Mutation units

- Multi-statement logic lives in `src/db/mutations/<domain>.ts` as composable `(tx: Transaction, ...args) => ...` units.
- The action wraps the call: `await transaction(tx => deleteUser(tx, id))`.
- Inside a transaction, statements MUST run sequentially, one `await` at a time, because they share one connection and `Promise.all` on a `tx` corrupts the session.
- `.oxlintrc.json` turns off `react-doctor/async-parallel`, `async-await-in-loop`, and `server-sequential-independent-await` for `src/db/mutations/**` and `src/db/helpers.ts`.
- Batch writes inside one transaction use `mapSequential` from `@/db/helpers`.
- Progress and membership rows have unique indexes, so their inserts use `onConflictDoNothing()`.
- `submitCertificateRequest` takes a transaction-scoped advisory lock to keep one open certificate request per user and organization.
- Approving, featuring, and revoking a certificate take the advisory lock `certificate-default:<userId>` before touching any certificate row, so the default flag changes one writer at a time.
- Keep slow side effects (PDF generation, email, R2 uploads) outside the transaction: compute inputs first, then open a short transaction for the DB writes only.
- Authorization and tenant scoping stay at the action boundary: verify ownership or org membership before calling the mutation, which operates on already-authorized ids.

### Cache strategy

- Tags are the `CacheTag` enum plus per-record helpers (`userTag`, `courseTag`, `progressUserTag`, `legalTag`, `certificates*Tag`, `messagesTag`) in `src/lib/cache.ts`. Read it for the current set and owners.
- Put `'use cache'` (with `cacheLife('max')` for long-lived data) on the inner fetch function, never on the exported one.
- The exported function takes `{ cache: false }` to bypass, and React `cache()` dedupes per request.
- In a server action whose caller must see its own write, use `updateTag(tag)`. `updateTag` throws outside server actions.
- A read in a later request (a client reload after a mutation, or a live work queue) passes `{ cache: false }`: dev can serve that request the pre-write entry.
- Elsewhere use `revalidateTag(tag, 'max')`.

### Session cache

- Render paths read the session with `getSessionUser()` (`'use cache: private'`, `cacheLife({ stale: 30, revalidate: 60, expire: 600 })`).
- It passes `disableCookieCache` and `disableRefresh` and never calls `connection()`, so each render and prefetch checks the session in the database, and a revoked, banned, or signed-out session stops rendering at once.
- The 30 s `stale` is the lowest value that stays in prefetches (Next.js drops a private scope below 30 s) and equals `staleTimes.dynamic`.
- It leaves the scope out of the App Shell (5 minutes needed), so links to pages that read it use `prefetch`. A page already in the client router cache can outlive the session by up to 30 s.
- `logout` and every cache-tag action clear that cache.
- Role, ban, and editor checks read `getSessionUser()` plus the tag-invalidated `fetchUser`, never the cookie-cached session. Actions keep `getAuthUser()` and the `requireX` guards.
- Role and membership writes call `expireUserAccess` (org actions) or `revalidateUserAccess` (admin actions).
- Progress writes expire `progressUserTag(userId)`.
- Never mutate during render: enrollment is an explicit Start click calling `startCourse`, never a page effect.

## Error handling

- `safeQuery()` wraps a query in try/catch and returns `{ data, error: null }` or `{ data: null, error: { code, message } }`.
- `queryError()` normalizes unknown errors into that `{ code, message }` shape.
- Database errors (`DrizzleQueryError` and raw Postgres errors) are classified by SQLSTATE: `23505` is `CONFLICT`, other `23xxx` is `CONSTRAINT_VIOLATION`, `42501` is `UNAUTHORIZED`, `57014` is `TIMEOUT`, `08xxx`, `53300`, and `57Pxx` are `CONNECTION_ERROR`, the rest is `QUERY_ERROR`.
- They return a fixed message per code and log the SQLSTATE, constraint, table, driver message, and statement (never the bound values) with `console.error('[db] query failed')`.
- Errors the app throws itself get the fixed message of their code too, and an unclassified one is logged; only the impersonation lock keeps its message.
- Server actions return `{ data, error }` or `{ error }`, and callers MUST check.
- Mutations that fail throw. Queries that fail return error objects.
- The global boundary `src/app/error.tsx` (client) logs and offers go back, back to home, and refresh (`ErrorActions`).
- The global 404 `src/app/not-found.tsx` (server) checks auth to pick the right link.
- `(dashboard)/error.tsx` and the dashboard 404s render `DashboardHeader` and `Main`, so the sidebar and its trigger stay.
- The admin layout calls `notFound()` when `!user.isAdmin`, and the certificates layout when `user.canEdit`.
- User feedback uses `sonner`: `toast.success()` and `toast.error()`.

## Environment variables

- Every environment variable the Next.js app uses MUST be declared in the Zod schema in `next.config.ts`.
- `GITHUB_TOKEN` and `VERCEL_TOKEN` are the only exclusions, since external CLI tools read them and the app never does.
- Read `envSchema` in `next.config.ts` for the current set and validators.
- `MAIL_TRANSPORT` replaces SMTP in dev. In production only `mailpit` counts, and only when `APP_URL` is `localhost`, `127.0.0.1`, or `*.localhost`, so the mail specs run against a local `next start`.
- Values: `mailpit` delivers to the `pnpm run mail:up` inbox (`localhost:1025`), `log` only logs `[mail] <template> to <recipient>: <subject>`. `smtp` is the default and sends through Nodemailer.
- `VERCEL_ENV` is set by Vercel. `next.config.ts` builds `/dev/ui` only when it is `preview` (and on the dev server), so production and CI builds exclude the route and its chunks.
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
- `R2_ENDPOINT` (optional) points the client at an S3-compatible server and switches to path-style URLs.
- `e2e.yml` runs the Adobe S3Mock service (`glore-e2e` bucket, port 9000, anonymous reads), so the PDF approval test runs in CI.
- Avatars upload directly to R2 through a presigned PUT, which avoids the Server Action 1MB and Vercel 4.5MB body limits.
- The flow: `create*AvatarUploadUrl(contentType)` (the server picks the key and presigns), then the client `fetch(url, { method: 'PUT' })`, then `confirm*Avatar(key)` persists `avatarUrl`.
- A direct browser PUT requires bucket CORS that allows PUT from the app origin (`https://glore.localhost` in dev, the production domain).
- The R2 API token is object-scoped: it can PUT, GET, and DELETE objects but gets 403 on bucket-admin calls such as `PutBucketCors`. Set CORS in the Cloudflare dashboard or with an admin token.
- The avatar cap comes from `maxAvatarSize` in `config/app.json` and is enforced on the selected file in the `ImageCropper` dropzone.
- Rows store full public URLs (`R2_PUBLIC_URL` plus the key), and `next.config.ts` allows only the host of `R2_PUBLIC_URL` for `next/image`.
- `pnpm run files:rehost --from <old URL> --to <new URL>` (`scripts/files/`) rewrites the stored URLs in every text, JSON, and text array column of `public`. It is a dry run without `--apply`. Steps: `release-runbook.md`, "File links".

## Legal documents

- Tables: `legal_documents` (slug, `requiresAcceptance`, current version), `legal_versions`, `legal_translations`, and `legal_acceptances` (one per user and version).
- `loadLegalDocument(slug, locale, { cache })` in `src/lib/legal.ts` reads the current version, tagged `legalTag(slug)`, with an `en` fallback.
- A material `terms` version gates the dashboard until the user accepts it: `getPendingLegal` in the layout, `acceptLegal` on `/legal/accept`.
- `db:seed` and `content:import` seed version 1 from `content/legal` only into an empty `legal_documents`.

## App settings

- `app_settings` (`key`, `value jsonb`, `updated_by_id`, `updated_at`) holds the team-edited contact email, phone, website, social links, and legal entity. The editor is in `admin.md`.
- `loadSettings({ cache })` in `src/lib/settings.ts` reads it inside a `'use cache'` function tagged `CacheTag.Settings` with `cacheLife('max')`. A failed read logs and returns `DEFAULT_SETTINGS`.
- It uses no request API, so emails and cron call it. Saving calls `updateTag(CacheTag.Settings)`.

## Static data

- `config/app.json`: feature settings (`minSkills`, `maxAvatarSize`, and the rest).
- `config/i18n.json`: locales.
- `config/icons.json`: icon-picker metadata.
- `config/metadata.json`: app metadata and the default for every app setting. Keep `name`, `url`, `slug`, `version`, and `themeColor` here only.
- `config/theme.json`: breakpoints.

## Framework docs

- Grep `node_modules/next/dist/docs/` for Next.js APIs. It always matches the installed version.
- For context7, use the pinned id `/vercel/next.js/v<installed version>`: `cacheComponents` and `NextProxy` are v16-only, so a v15 answer is wrong.
