# v0.7 production runbook

Handoff for G8. Every step that writes to staging or production is a user step. Agents prepare and verify, the user runs or approves.

## State

- Branch `release/v0.7` holds the release, open as pull request #20 into `main`. Never merge it from GitHub: fast-forward `main` locally.
- Production (`elearning.glorecertificate.net`, Neon branch `production` in project `old-base-10661180`) lacks migrations 0013 to 0032.
- Production has no database comment and holds 0 certificates.
- Read-only pre-checks passed: 0017 and 0021 cannot collide (4 distinct skill group slugs, empty docs and join requests, no invitations table).

## Deploy model

- A push to `main` runs `ci.yml`: check and e2e, then `deploy.yml` deploys a preview with the Vercel Preview env vars. This preview is staging, served at `https://glorecertificate.vercel.app`.
- Every other branch gets a Vercel Git preview. The Neon integration gives it a `preview/<branch>` database copied from production, so these builds fail until production is migrated.
- The `Main` ruleset requires that `Vercel` check and `Check / Check`. Admins can bypass it.
- A `v*` tag runs `release.yml`, which deploys production with `vercel deploy --target=production`. A push to `main` never reaches production.

## Prepare

1. Migrate staging (Neon `staging`, 23 of 33 migrations): `DATABASE_URL='<staging url>' pnpm run db migrate`. The staging build prerenders against this database, so migrate before step 2.
2. Fast-forward `main` to `release/v0.7` and push it, never as a merge commit. CI deploys staging once check and e2e pass.
3. Seed staging per `manual-testing.md`, "Setup", step 6, then test it.
4. Back up production: in the Neon console create a branch `pre-v0.7-<date>` from `production`, or take a snapshot. The backup keeps the plaintext `team_invitations.token` column, so delete it once the release is stable.
5. Set the production env vars in Vercel, listed below.

## Production env vars

The schema is `envSchema` in `next.config.ts`.

- `APP_URL`: `https://elearning.glorecertificate.net`.
- `BETTER_AUTH_SECRET`: a fresh value from `openssl rand -base64 32`.
- `CRON_SECRET`: 16 or more characters. Without it the daily cron (`/api/v1/cron/daily`, 03:00 UTC) refuses every call.
- `DATABASE_URL`: the production connection string with `sslmode=require`.
- `GEMINI_API_KEY`. Set `GEMINI_MODEL` only to override the default fallback chain.
- `MAIL_TRANSPORT=smtp`, plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_SENDER`, `SMTP_USER`, `SMTP_PASSWORD`.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` for the production bucket.
- Vercel project settings: "Node.js Version" reads 24.x (`engines.node` also forces it).
- `R2_PUBLIC_URL`: a custom domain on the bucket, not the `r2.dev` URL. Approval mails and `/verify` link to it.

## Migrate and deploy

1. Migrate from a local shell, with the production URL in front so it wins over `.env.local`: `DATABASE_URL='<production url>' pnpm run db migrate`.
2. Confirm `select count(*) from drizzle.__drizzle_migrations` returns 33.
3. Dry-run the catalog: `DATABASE_URL='<production url>' pnpm run content:import --target production --bootstrap --dry-run`.
4. Run the same command without `--dry-run`. Production always imports courses as drafts.
5. Run `pnpm run release` on `main` and release `0.7.0`. The `v0.7.0` tag runs `.github/workflows/release.yml`, which deploys production.
6. Check that the cron job is listed in the Vercel project.

Run steps 1 and 5 back to back: 0028 drops the plaintext token column, so team invitation accept and resend fail on the old build until the deploy finishes.

The import refuses production once any course or doc exists, so steps 3 and 4 pass `--bootstrap`. After this release the team edits content in the app, and nobody passes the flag again.

Migration notes:

- 0015 dedupes rows before 0016 adds unique indexes. 0018 and 0021 backfill, and 0019 drops replaced columns.
- 0023 anonymizes deleted holders. 0025 dedupes default certificates and adds the audit indexes.
- 0026 to 0028 replace plaintext invitation tokens with a SHA-256 hash and move stored invitation notification links to `/api/v1/invitations/[id]`.
- 0027 backfills the hash in SQL, so the 4 open production team invitation links keep working.
- 0029 to 0032 only add tables (message overrides, legal, content translations, app settings) and `doc_articles.languages`, which defaults to all three locales.
- Step 4 seeds the empty legal tables from `content/legal`.

## Verify

1. Log in as an existing user and open the dashboard.
2. Open a legacy profile link with `?v=<handle>` and a `/verify/<code>` link.
3. Request a password reset and confirm the mail arrives.
4. As an editor, open a course and run one AI menu command.
5. Editors review the imported courses and publish them per language.

## Rollback

1. In Vercel, promote the previous production deployment.
2. If data must go back, restore the `pre-v0.7-<date>` Neon branch or snapshot. Migrations have no down scripts.

## Known gaps

Open items live in `tasks.md` under G3, G4, and G6. None is high severity.
