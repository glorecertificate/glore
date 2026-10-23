# v0.7 production runbook

Handoff for G8. Every step that writes to preview or production is a user step. Agents prepare and verify, the user runs or approves.

## Flow

Pull request #20, then `main` (preview), then validation, then a manual release, then the release workflow deploys production.

- Production is `https://glorecertificate.xyz`: Vercel production branch `production`, Neon branch `production` in project `old-base-10661180`.
- Preview is `https://preview.glorecertificate.xyz`: the Vercel domain of git branch `main`, Neon branch `staging` (comment `glore:staging`).

## Deploy model

- A push to `main` runs `ci.yml`: check and e2e, then `deploy.yml` deploys `main` with the Vercel Preview env vars to the preview domain.
- Every other branch gets a Vercel Git preview. The Neon integration gives it a `preview/<branch>` database copied from production, so these builds fail until production is migrated.
- The `Main` ruleset requires that `Vercel` check and `Check / Check`. Admins can bypass it, which this release needs because of the previous point.
- A `v*` tag runs `release.yml`, which deploys production with `vercel deploy --target=production`. A push to `main` never reaches production.
- The production build prerenders against the production database, so production must be migrated before the tag.

## State

- `release/v0.7` is open as pull request #20 into `main`. Never merge it from GitHub: fast-forward `main` locally, so the signed commits keep their hashes.
- Neon `staging` has all 33 migrations. Preview `DATABASE_URL` points to it (sensitive, no branch scope) and Preview `APP_URL` is the preview domain.
- Production lacks migrations 0013 to 0032, has no database comment, and holds 0 certificates.
- Read-only pre-checks passed: 0017 and 0021 cannot collide (4 distinct skill group slugs, empty docs and join requests, no invitations table).

## Preview

1. Wait for `Check / Check` and `E2E` to pass on pull request #20.
2. Fast-forward `main` to `release/v0.7` and push it, never as a merge commit: `git switch main && git merge --ff-only release/v0.7 && git push origin main`.
3. CI deploys the preview domain once check and e2e pass on `main`.
4. Import the catalog and seed the demo data per `manual-testing.md`, "Setup", step 6.
5. Validate the preview with `manual-testing.md`, then run "Verify" below against the preview domain.

## Production env vars

The schema is `envSchema` in `next.config.ts`. Production builds always send mail over SMTP (`src/lib/email.ts`), so `MAIL_TRANSPORT` stays unset.

- `APP_URL`: `https://glorecertificate.xyz`. Already set.
- `BETTER_AUTH_SECRET`: a fresh value from `openssl rand -base64 32`.
- `CRON_SECRET`: 16 or more characters. Already set. Without it the daily cron (`/api/v1/cron/daily`, 03:00 UTC) refuses every call.
- `DATABASE_URL`: the Neon `production` connection string with `sslmode=require`. Confirm it targets `production`, not a copy.
- `GEMINI_API_KEY`. Set `GEMINI_MODEL` only to override the default fallback chain.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SENDER`, `SMTP_USER`, `SMTP_PASSWORD`.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` for the production bucket.
- `R2_PUBLIC_URL`: a custom domain on the bucket. It is still an `r2.dev` URL, which Cloudflare rate-limits. Approval mails and `/verify` link to it.
- Vercel project settings: "Node.js Version" reads 24.x (`engines.node` also forces it).

## Release

1. Back up production: in the Neon console create a branch `pre-v0.7-<date>` from `production`, or take a snapshot. The backup keeps the plaintext `team_invitations.token` column, so delete it once the release is stable.
2. Migrate from a local shell, with the production URL in front so it wins over `.env.local`: `DATABASE_URL='<production url>' pnpm run db migrate`.
3. Confirm `select count(*) from drizzle.__drizzle_migrations` returns 33.
4. Dry-run the catalog: `DATABASE_URL='<production url>' pnpm run content:import --target production --bootstrap --dry-run`.
5. Run the same command without `--dry-run`. Production always imports courses as drafts.
6. Run `pnpm run release` on `main` and release `0.7.0`. It runs check and build, bumps the version, updates `CHANGELOG.md`, and pushes `main` with the `v0.7.0` tag.
7. The tag runs `.github/workflows/release.yml`, which deploys production. Check that the cron job is listed in the Vercel project.

Run steps 2 and 6 back to back: 0028 drops the plaintext token column, so team invitation accept and resend fail on the old build until the deploy finishes.

The import refuses production once any course or doc exists, so steps 4 and 5 pass `--bootstrap`. After this release the team edits content in the app, and nobody passes the flag again.

## Migration notes

- 0015 dedupes rows before 0016 adds unique indexes. 0018 and 0021 backfill, and 0019 drops replaced columns.
- 0023 anonymizes deleted holders. 0025 dedupes default certificates and adds the audit indexes.
- 0026 to 0028 replace plaintext invitation tokens with a SHA-256 hash and move stored invitation notification links to `/api/v1/invitations/[id]`.
- 0027 backfills the hash in SQL, so the 4 open production team invitation links keep working.
- 0029 to 0032 only add tables (message overrides, legal, content translations, app settings) and `doc_articles.languages`, which defaults to all three locales.
- Release step 5 seeds the empty legal tables from `content/legal`.

## Verify

Run these on the preview domain before the release and on `https://glorecertificate.xyz` after it.

1. Log in as an existing user and open the dashboard.
2. Open a legacy profile link with `?v=<handle>` and a `/verify/<code>` link.
3. Request a password reset and confirm the mail arrives.
4. As an editor, open a course and run one AI menu command.
5. Editors review the imported courses and publish them per language.

## Rollback

1. In Vercel, promote the previous production deployment.
2. If data must go back, restore the `pre-v0.7-<date>` Neon branch or snapshot. Migrations have no down scripts.

## Known gaps

Open items live in `tasks.md` under G3, G4, and G6, and in `followups.md`. None is high severity.
