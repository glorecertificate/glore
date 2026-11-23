# v0.7 production runbook

Release steps for v0.7 (#33). Every step that writes to preview or production is a user step. Agents prepare and verify, the user runs or approves.

## Flow

Pull request #20, then `main` (preview), then validation, then a manual release, then the release workflow deploys production.

- Production is the `url` in `config/metadata.json`, the source of truth for the live domain: Vercel production branch `production`, Neon branch `production` in project `old-base-10661180`.
- Preview is `https://preview.glorecertificate.xyz`: the Vercel domain of git branch `main`, Neon branch `staging` (comment `glore:staging`).

## Deploy model

- Since v0.7.0, a push to `main` migrates and deploys staging only. Production deploys only from a `v*` tag.
- A push to `main` runs `ci.yml`: check and e2e, then `deploy.yml` migrates staging and deploys `main` with the Vercel Preview env vars to the preview domain.
- A PR gets a preview deploy only with the `preview` label (`github.md`, "Workflows"). The Neon Vercel integration is disconnected, so every preview uses the unscoped Preview `DATABASE_URL` (Neon `staging`). Never add a branch-scoped `DATABASE_URL`.
- The `Default branch` ruleset and its required checks are in `github.md`, "Deploys". Admins can bypass it.
- A PR deploy never migrates, so a PR never changes staging.
- A `v*` tag runs `release.yml`, which migrates and deploys production with `vercel deploy --target=production`.
- The production build prerenders against the production database, so `deploy.yml` migrates it before `vercel build` (`migrate: true`).
- `deploy.yml` builds on the runner from `vercel pull`, which cannot read Secret variables. Every variable the build validates must use the Config type.

## State

- v0.7.0 is released: PR #214, tag `v0.7.0` on `ced87edb`. Production runs it, and staging runs `main`.
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
8. Open a PR with that title and merge it through the queue. The merge deploys staging only.
9. Run `pnpm run release:tag`. It tags the squash commit on `main` as `v0.7.0`, pushes the tag, and creates the GitHub release.
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

1. In Vercel, promote the previous production deployment.
2. If data must go back, restore the `pre-v0.7-<date>` Neon branch or snapshot. Migrations have no down scripts.

## File links

The first move is from the `r2.dev` URL to `https://cdn.glorecertificate.xyz`. A later move to a `glorecertificate.net` domain uses the same steps.

1. Connect the domain to the bucket in the Cloudflare dashboard: R2, the bucket, Settings, Custom Domains. The domain must be a zone in the Cloudflare account of the bucket.
2. Open a file through the new domain and make sure that it loads.
3. Dry-run the rewrite: `DATABASE_URL='<production url>' pnpm run files:rehost --from <old URL> --to <new URL>`.
4. Run the same command with `--apply`, then run the dry run again. It must find 0 rows.
5. Set `R2_PUBLIC_URL` to the new URL in the production env vars and redeploy. The build reads the `next/image` host from it.
6. When the old domain serves no traffic, turn off its URL on the bucket.

Run steps 4 and 5 back to back: until the redeploy, signature images on the new URL do not load. Repeat the steps for staging if its bucket also uses an `r2.dev` URL.

## Known gaps

The launch items for mail, file links, and the backup branch are in #216. The other open items are the sub-issues of #52.
