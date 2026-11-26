# v0.7 production runbook

Release steps for v0.7 (#33). Every step that writes to preview or production is a user step. Agents prepare and verify, the user runs or approves.

## Flow

Pull request #20, then `main` (preview), then validation, then a manual release, then the release workflow deploys production.

- Production is the `url` in `config/metadata.json`, the source of truth for the live domain: Vercel production branch `production`, Neon branch `production` in project `old-base-10661180`.
- Preview is `https://preview.glorecertificate.xyz`: the Vercel Preview env vars of the main project, Neon branch `staging`.
- `qa` is `https://qa.glorecertificate.xyz`: the Vercel Preview env vars of the `qa` project, an empty-start Neon database with the comment `glore:qa`, and its own R2 bucket.

## Deploy model

- A push to `main` migrates and deploys `qa` only. The preview changes only through `promote.yml`, and production only from a `v*` tag.
- To promote, run the `Promote to preview` workflow, or `gh workflow run promote.yml -f commit=<sha>`. An empty commit means the latest `main`.
- A PR deploys to the `qa` project only with the `preview` label (`github.md`, "Workflows"). The Neon Vercel integration is disconnected, so each project uses its unscoped Preview `DATABASE_URL`. Never add a branch-scoped `DATABASE_URL`.
- The `Default branch` ruleset and its required checks are in `github.md`, "Deploys". Admins can bypass it.
- A PR deploy never migrates. No test or seed writes to the preview.
- A `v*` tag runs `release.yml`, which checks that the preview had that commit, then migrates and deploys production with `vercel deploy --target=production`.
- The production build prerenders against the production database, so `deploy.yml` migrates it before `vercel build` (`migrate: true`).
- `deploy.yml` builds on the runner from `vercel pull`, which cannot read Secret variables. Every variable the build validates must use the Config type.

## State

- v0.7.0 is released: PR #214, tag `v0.7.0` on `ced87edb`. Production runs it.
- On 2026-11-19, production was migrated and imported: 34 courses as drafts, 116 lessons, 33 docs, the legal pages, and 75 level description drafts.
- Both databases have 38 migrations, through 0037.
- Staging holds the demo seed, and every staging mail goes to the info inbox.

## Preview

1. Wait for `Check / Check` and `E2E` to pass on pull request #20.
2. Merge pull request #20. When GitHub refuses the rebase and `main` is an ancestor, fast-forward with `git push origin release/v0.7:main`, then run `git switch main && git pull --ff-only`.
3. CI deploys the preview domain once check and e2e pass on `main`.
4. Import the catalog and seed the demo data per `manual-testing.md`, "Setup", step 6.
5. Validate the preview with `manual-testing.md`, then run "Verify" below against the preview domain.
6. CI migrates staging on each push to `main`, before the preview build. Check that the `Deploy preview` job passed before you validate.
7. After 0033, insert the level description drafts with the same prefix: `pnpm run content:levels --target staging`.

## Production env vars

The schema is `envSchema` in `next.config.ts`. Production builds always send mail over SMTP (`src/lib/email.ts`), so `MAIL_TRANSPORT` stays unset.

- `APP_URL`: the `url` in `config/metadata.json`. Already set. Change both together when the domain moves.
- `BETTER_AUTH_SECRET`: a fresh value from `openssl rand -base64 32`.
- `CRON_SECRET`: 16 or more characters. Set as a Secret: recreate it as Config, or the release build fails `envSchema`. Without it the daily cron (`/api/v1/cron/daily`, 03:00 UTC) refuses every call.
- `DATABASE_URL`: the Neon `production` connection string with `sslmode=require`. Confirm it targets `production`, not a copy.
- `GEMINI_API_KEY`. Set `GEMINI_MODEL` only to override the default fallback chain.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SENDER`, `SMTP_USER`, `SMTP_PASSWORD`.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` for the production bucket.
- `R2_PUBLIC_URL`: a custom domain on the bucket. It is still an `r2.dev` URL, which Cloudflare rate-limits. Approval mails and `/verify` link to it. Move it with the steps in "File links".
- Vercel project settings: "Node.js Version" reads 24.x (`engines.node` also forces it).

## Release

1. Back up production: in the Neon console create a branch `pre-v0.7-<date>` from `production`, or take a snapshot. The backup keeps the plaintext `team_invitations.token` column, so delete it once the release is stable.
2. Migrate from a local shell, with the production URL in front so it wins over `.env.local`: `DATABASE_URL='<production url>' pnpm run db migrate`.
3. Confirm `select count(*) from drizzle.__drizzle_migrations` returns 36.
4. Dry-run the catalog: `DATABASE_URL='<production url>' pnpm run content:import --target production --bootstrap --dry-run`.
5. Run the same command without `--dry-run`. Production always imports courses as drafts.
6. Insert the level description drafts: `DATABASE_URL='<production url>' pnpm run content:levels --target production --dry-run`, then the same command without `--dry-run`. It never overwrites edited text.
7. Create `release/v0.7.0` from `main` and run `pnpm run release 0.7.0`. It runs check and build, bumps the version, updates `CHANGELOG.md`, commits `chore(release): v0.7.0`, and pushes the branch.
8. Open a PR with that title and merge it through the queue. The merge deploys `qa`. Then promote the release commit and check the preview.
9. Run `pnpm run release:tag`. It tags the promoted release commit as `v0.7.0`, pushes the tag, and creates the GitHub release.
10. The tag runs `.github/workflows/release.yml`, which deploys production. Check that the cron job is listed in the Vercel project.

Run steps 2 and 9 back to back: 0028 drops the plaintext token column, so team invitation accept and resend fail on the old build until the deploy finishes. 0035 drops `certificate_skills.statement`, so certificate pages also fail on the old build.

The import refuses production once any course or doc exists, so steps 4 and 5 pass `--bootstrap`. After this release the team edits content in the app, and nobody passes the flag again.

## Migration notes

- 0015 dedupes rows before 0016 adds unique indexes. 0018 and 0021 backfill, and 0019 drops replaced columns.
- 0023 anonymizes deleted holders. 0025 dedupes default certificates and adds the audit indexes.
- 0026 to 0028 replace plaintext invitation tokens with a SHA-256 hash and move stored invitation notification links to `/api/v1/invitations/[id]`.
- 0027 backfills the hash in SQL, so the 4 open production team invitation links keep working.
- 0029 to 0032 only add tables (message overrides, legal, content translations, app settings) and `doc_articles.languages`, which defaults to all three locales.
- Release step 5 seeds the empty legal tables from `content/legal`.
- 0033 adds the `skill_level` enum and the `skill_level_descriptions` table.
- 0034 maps the 1 to 5 values to levels: 1 to 3 become `intermediate`, 4 becomes `good`, and 5 becomes `advanced`.
- 0034 stops when an issued certificate without a snapshot still has a tutor statement. With 0 production certificates, it passes.
- 0035 converts the level columns to the enum and drops `certificate_skills.statement`.

## Verify

Run these on the preview domain before the release and on the production domain after it.

1. Log in as an existing user and open the dashboard.
2. Open a legacy profile link `/<username>?v=<handle>`, a `/@<username>` profile, and a `/verify/<code>` link.
3. Request a password reset and confirm the mail arrives.
4. As an editor, open a course and run one AI menu command.
5. Editors review the imported courses and publish them per language.

## Rollback

1. In Vercel, promote the previous production deployment. On the Hobby plan, it is the only rollback target.
2. If data must go back, restore the Neon `production` branch to a time before the problem. Migrations have no down scripts.
3. Neon keeps 6 hours of history on the free plan. After 6 hours, a restore is not possible.

## Restore drill

Run the drill before each release that adds a migration.

1. In Neon, create a branch from `production` at a time in the last 6 hours. Give it a read-only compute and an expiry 2 hours later.
2. Compare the row counts of `users`, `organizations`, `courses`, `certificates`, `team_invitations`, and `drizzle.__drizzle_migrations` with production.
3. Compare the column, constraint, and index definitions with a local database that `pnpm run db migrate` built from the repository.
4. For the rehearsal, create a branch with a read-write compute and run `DATABASE_URL='<branch url>' pnpm run db migrate` on it before the release.
5. Delete each branch.

The drill on 2026-11-26 found these results:

- The branch was ready about 10 seconds after the request.
- The counts were the same as production: 7 users, 1 organization, 34 courses, 0 certificates, 5 invitations, and 38 migrations.
- The schema was the same as the repository: 428 columns, 140 constraints, and 143 indexes.
- The stored hash of `0002_tiresome_tinkerer` is not the hash of its file. The file changed after it ran, before March 2026. Drizzle selects migrations by date, so this has no effect.

## File links

The first move is from the `r2.dev` URL to `https://cdn.glorecertificate.xyz`. A later move to a `glorecertificate.net` domain uses the same steps.

1. Connect the domain to the bucket in the Cloudflare dashboard: R2, the bucket, Settings, Custom Domains. The domain must be a zone in the Cloudflare account of the bucket.
2. Open a file through the new domain and make sure that it loads.
3. Dry-run the rewrite: `DATABASE_URL='<production url>' pnpm run files:rehost --from <old URL> --to <new URL>`.
4. Set `R2_PUBLIC_URL` to the new URL: `pnpm exec vercel env update R2_PUBLIC_URL --environment production --value <new URL> --yes`.
5. Rebuild production: rerun the "Deploy production" job of the last Release run with `gh run rerun <run id> --job <job id>`. The build reads the `next/image` host from `R2_PUBLIC_URL`.
6. When the build is live, run the step 3 command with `--apply`, then run the dry run again. It must find 0 rows.
7. Turn off the old URL on the bucket: R2, the bucket, Settings, Public Development URL. Emails load their logo from the app, so no sent email uses it.

`vercel redeploy` does not apply a new `R2_PUBLIC_URL`. CI deploys a prebuilt output, so a redeploy keeps the old `next/image` host. Run step 6 right after step 5: until then, images that `next/image` loads from stored URLs do not load. For staging, use `--environment preview` and rebuild with the deploy job of the last CI run on `main`, or merge a PR.

## Known gaps

The launch items for mail, file links, and the backup branch are in #216. The other open items are the sub-issues of #52.
