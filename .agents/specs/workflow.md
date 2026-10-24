# Agent workflow reference

Commands, seeds, translations, committing, skills, worktrees, verification, and the dev environment. `AGENTS.md` keeps the hard rules; this file holds their detail.

## Commands

- Always run `pnpm run <script>`, never bare `pnpm <script>`, so nothing collides with a built-in pnpm command.
- Exceptions: `pnpm install` and the README's bare shorthand.

| Command                   | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| `pnpm run dev`            | Dev server at `https://glore.localhost` (portless, port 45673)                   |
| `pnpm run dev:clean`      | Wipe `.next`, then start dev (reclaims Turbopack disk)                           |
| `pnpm run check`          | Parallel `check:types`, `check:lint`, `check:format`, `check:knip`, `check:i18n` |
| `pnpm run test`           | Vitest unit tests (`src/**/*.test.ts`, `scripts/**/*.test.ts`)                   |
| `pnpm run test:e2e`       | Playwright e2e against the running dev server, logged in as seeded users         |
| `pnpm run build`          | Production build                                                                 |
| `pnpm run i18n:overrides` | Count overrides per locale and stale state (`--target <env>`, read-only)         |
| `pnpm run i18n:pull`      | Fold published overrides into `messages/*.json` (`--target <env>`, `--dry-run`)  |
| `pnpm run content:check`  | Validate `content/` courses, lessons, and docs without touching a database       |
| `pnpm run typegen`        | Generate route and public-file types into `types/`                               |
| `pnpm run db <command>`   | drizzle-kit (`migrate`, `generate`, `studio`, ...)                               |
| `pnpm run db:up`          | Local Postgres in Docker on port 5433 (used by `next dev`)                       |
| `pnpm run db:reset`       | Wipe and recreate the local Postgres volume                                      |
| `pnpm run db:seed`        | Upsert one test user per role into the local DB (refuses non-local URLs)         |
| `pnpm run db:seed:demo`   | Full demo dataset on `TEST_EMAIL` plus-addresses (`--target local` or `staging`) |
| `pnpm run mail:up`        | Local Mailpit inbox: SMTP on 1025, UI and API at `http://localhost:8025`         |
| `pnpm run email`          | Preview email templates at `https://email.glore.localhost`                       |
| `pnpm run skills`         | Reinstall agent skills from `skills-lock.json`                                   |

## Seeds

### Test users

- `pnpm run db:seed` (`scripts/seed.mts`) upserts the org `glore-seed` and one user per role at `<role>@glore.test`.
- Roles: `admin` (platform admin), `editor`, `owner` (org owner), `representative`, `tutor`, `volunteer`, `learner`.
- `holder` is a volunteer for demo certificates, which tests that wipe `volunteer` leave alone.
- `recovery` serves the password reset spec.
- The shared password and roles live in `scripts/seed-data.ts`.
- The seed runs in one transaction, is idempotent, and exits non-zero unless `DATABASE_URL` points to localhost.

### Demo dataset

- `pnpm run db:seed:demo --target <local|staging>` (`scripts/seed-demo.mts`) builds the dataset of `.agents/references/manual-testing.md`.
- Accounts sit at `<local>+glore-<key>@<domain>` of `TEST_EMAIL`, with usernames `demo.<key>`.
- It creates three organizations (two approved in Italy and Spain, one pending) and 28 accounts.
- It creates 18 certificates in every status plus a deleted holder, learning progress, ratings, invitations, an invite link, join requests, events, and notifications.

### Demo seed behavior

- Run `pnpm run content:import --target <target>` first: the seed reads the course catalog and stops before writing if it is missing.
- The seed is idempotent and resets what it owns in one transaction.
- It upserts organizations and accounts, then deletes and rebuilds their certificates, invitations, links, requests, events, notifications, and progress.
- Dates are relative to the run.
- Approved certificates carry a snapshot and no stored PDF: the download renders from it.
- Data and planning live in `scripts/seed-demo-data.ts` (organizations, accounts) and `seed-demo-story.ts` (certificates, progress, flows, events, notifications; pure and unit tested).
- Localized text lives in `seed-demo-copy.ts`, SQL in `seed-demo-db.mts`, and shared upserts in `scripts/seed-db.mts`.
- `local` needs a localhost `DATABASE_URL`.
- `staging` needs a remote one whose database comment is `glore:staging` (`COMMENT ON DATABASE`, set on the Neon `staging` branch only, since Neon forbids custom database settings).
- Production never has the comment, so it is never seeded.

## Translations

- `en` is the source: `messages/en.json` and the legal seed fixtures `content/legal/*.en.md`. Code owns keys, message structure, and default copy.
- The team edits UI text at `/translations` (database overrides on top of the bundled catalogs), legal texts at `/legal`, and courses, docs, and skill groups in their editors (`admin.md`, `routes.md`).
- In feature work, add every new key to all three catalogs with real translations. Never delete a key in one catalog only.
- Rename a key with `pnpm run i18n:rename <old> <new>`, never in one catalog only. It prints SQL for the key's overrides.
- A key rename or removal can orphan or disable published overrides; the translations page flags them as stale.

### i18n check

- `pnpm run check:i18n` (`scripts/i18n/`) fails on a key missing from a locale and on an empty or non-string value.
- It also checks `serverNamespaces` in `config/i18n.json` against the `'use client'` import graph (`scripts/i18n/namespaces.mts`).
- It also fails on malformed ICU, and on an ICU argument, plural or select case, or tag (`{name}`, `<link>`) that differs from `en`. Plural categories may differ per language.
- It also fails on a legal seed fixture that misses a locale, has broken front matter, or has different headings.

## Committing

- Commit only when the current prompt asks for it.
- `pnpm run check` MUST exit 0 first, no exceptions.
- One logical task is one commit. Never split a task into partial commits.
- Use Conventional Commits with a lower-case subject (commitlint rejects sentence case) and a header of at most 100 characters.
- Allowed scopes: `release`, `deps`, `deps-dev`, `security`.
- Hook mechanics (lefthook pre-commit, commit-msg, pre-push): `code.md`.

## Git history

- History is linear. Never create a merge commit: no `git merge` without `--ff-only`, no merging `main` into a branch, no GitHub merge button.
- Update a branch with `git rebase main`. Integrate it by rebase or fast-forward, or squash it into one commit when its commits do not stand alone.
- On GitHub, merge commits are disabled in the repository settings, so pull requests use "Rebase and merge" or "Squash and merge".
- Branch protection on `main` does not require linear history, because the maintainer may force-push `main`. Lefthook's `pre-merge-commit` and `pre-push` jobs and the CI "Linear history" job reject merge commits instead.
- To clean up history that already holds merges, rebuild it on `main` and squash each merged branch whose commits no longer replay cleanly. Never push that rewrite without the user's approval.

## Pull requests

- Write the PR body in Simplified Technical English with the sections of `.github/pull_request_template.md`. Pass it with `--body-file`.
- After you open a PR, run the Claude review: `/code-review <number> --fix`, one commit for each accepted fix, a push, and one summary comment.
- Dependabot PRs get no Claude review. CI and the pnpm release-age gate (`code.md`) cover them.
- After the review pushes, run `git pull --ff-only` before more work on the branch.

## Dependencies

- CI installs with the pnpm release-age gate in `code.md`, "Release age". Never commit a bump on the day its version was published.
- Node.js follows Vercel Functions (24.x and 22.x, checked 2026-10-23). `.node-version`, `engines.node` (`24.x`), and `@types/node` (`^24`) move together, so `pnpm outdated` always lists `@types/node`.
- `@platejs/dnd` is pinned to `53.1.0`: 53.3 types `dragEntry` as possibly undefined, which breaks the vendored `table-node.tsx`. Lift the pin when the editor block is re-pulled.
- `pnpm run bump` upgrades pnpm and runs `pnpm update -Li`. Commit pnpm and Node, each major, and the lint toolchain separately.

## Skills

- Third-party skills are vendored and tracked in `.agents/skills/`. `.claude/skills` symlinks to it, so read them through `.agents/skills/`.
- Never hand-edit a vendored skill. Only `pnpm run skills` (the `skills` CLI) updates its files and `skills-lock.json`.
- `pnpm run skills` pulls each source's default branch, so a run meant to restore one skill can rewrite every tracked skill.
- After a run, review the `.agents/skills/` and `skills-lock.json` diff as a code change, then `git restore` and `git clean` any skill you did not mean to update.
- `web-design-guidelines` fetches its rules at runtime from `vercel-labs/web-interface-guidelines` on `main`, so it can change with no lockfile change.
- `agent-browser`, `sync-i18n`, `sync-docs`, and `sync-agents` are machine-wide skills invoked by name, not vendored here.

| Working on                       | Read / run                                                           |
| -------------------------------- | -------------------------------------------------------------------- |
| Any React or Next.js code        | `vercel-react-best-practices` (apply CRITICAL > HIGH > MEDIUM > LOW) |
| Next.js APIs and config          | `node_modules/next/dist/docs/` (version-exact, see `reference.md`)   |
| UI and visual review             | `vercel-react-best-practices` + `web-design-guidelines`              |
| Driving or verifying the real UI | `agent-browser`                                                      |
| shadcn/ui components             | `shadcn`                                                             |
| Database and schema              | `neon-drizzle`                                                       |
| Email (`src/emails/`)            | `react-email`                                                        |
| Cloudflare                       | `cloudflare`                                                         |
| Translations (`messages/`)       | `sync-i18n`                                                          |
| Docs (README, `.agents/`)        | `sync-docs`, or `sync-agents` for agentic files                      |

## MCP and Claude settings

- `.mcp.json` declares `cloudflare` (R2 and Workers docs) and `neon` (database ops). `.claude/settings.json` enables both.
- Tracked `.claude/settings.json` allowlists the check and test scripts and denies local env reads.
- Its PostToolUse hook runs oxfmt on edited code, JSON, CSS, Markdown, and YAML files.
- Put personal overrides in `.claude/settings.local.json`.

## Worktrees and lanes

- The orchestrator works on a branch (v0.7: `release/v0.7`) in the main checkout. Worktrees are only for spawned lane agents.
- Rebase a finished lane onto that branch and fast-forward it (`git merge --ff-only`), or squash the lane into one commit. Then delete its worktree and branch.
- Before integrating lanes, run `git status` in the main checkout, because a lane once leaked a copy of its commit there. Compare unexplained changes with lane commits before restoring them.
- Commit with explicit paths so stray staged changes never ride along.
- A lane worktree gets `node_modules` as a symlink to the main checkout. Never run `pnpm install` inside a lane worktree.
- A lane that changes the lockfile replaces the symlink with a real directory and installs with `pnpm install --ignore-scripts`, because the `prepare` script rewrites the shared git hooks.
- An install writes through the symlink, rewrites the main links to the worktree path, and breaks the main dev server and `pnpm run` when the worktree is removed.
- In a lane, run tools directly from `node_modules/.bin`.
- If an install already happened, run `CI=true pnpm install --frozen-lockfile` in the main checkout before removing the worktree, then confirm `readlink node_modules/next` starts with `.pnpm/`.

## Email verification

Email flows (auth, invite, certificate, account) are tested by the agent, never handed to the user.

1. Run `pnpm run mail:up`.
2. Confirm delivery with `pnpm run test:e2e -- e2e/recovery.spec.ts`. It fails when no mail reaches Mailpit, usually because `.env.local` lacks `MAIL_TRANSPORT=mailpit`.
3. When that variable is missing, ask the user to set it. Env files are unreadable to agents, and dev otherwise sends real SMTP email.
4. Drive the flow, then read the message and its links from `http://localhost:8025/api/v1/search?query=to:"<email>"`.

## Docs sync

- Docs sync triggers on a change to routes, API endpoints, server actions, hooks, utils, env vars, components, providers, skills, commands, or structure.
- On a trigger, update `AGENTS.md`, `README.md`, and the matching spec in the same change, without asking.
- Edit `AGENTS.md` directly, never `CLAUDE.md`, which only imports it.
- Inventories the code already enumerates (hook lists, env var tables, cache tags) stay in the code with a pointer here, not copied.

## Testing

### Unit tests

- `pnpm run test` runs Vitest in the Node environment over `src/**/*.test.ts` and `scripts/**/*.test.ts`.
- `vitest.config.ts` resolves tsconfig paths and aliases `server-only` to an empty module, so server actions import cleanly. Mock `@/actions/auth` and `next/cache` per test.
- It loads `.env` and `.env.local`, so DB-backed tests (for example `src/db/mutations/certificate.test.ts`) run against the local DB and skip themselves when `DATABASE_URL` is not local.
- The certificate suites build their own org and users with `src/actions/certificates/test-harness.ts`.

### End-to-end tests

- `pnpm run test:e2e` runs Playwright (`e2e/`) against the dev server at `E2E_BASE_URL` (default `https://glore.localhost`).
- The `legal` project runs last. Target it with `--project=setup --project=legal --no-deps`.
- The `setup` project logs in every `AUTH_ROLES` seed user and stores their state in `.playwright/.auth/`. Specs pick one with `test.use({ storageState: authFile(role) })`.
- Better Auth limits sign-ins, so add a role to `AUTH_ROLES` instead of logging in inside specs. Setup clears local `rate_limits` first.
- `e2e/mail.ts` reads Mailpit (`MAILPIT_URL`). `recovery.spec.ts` resets the `recovery` seed user's password through the emailed link, and `db:seed` restores it.
- Run Playwright with `--workers=2`: 4 workers make the dev server answer 502.

### CI workflows

- `ci.yml` (push) runs `check.yml` (`check` and `test`) and `e2e.yml`, then the preview `deploy.yml` after both pass.
- `e2e.yml` starts Postgres and Mailpit services, migrates, imports the catalog, seeds, runs `next build`, then Playwright's `webServer` runs `next start` on port 3000.
- CI has dummy R2 credentials, so the PDF approval test in `certificate-lifecycle.spec.ts` skips there and runs only locally against the real bucket.
- CI launches Chromium with WebGL off: the `cobe` globe on software WebGL takes over 8 cores and starves the runner.
- `release.yml` deploys production after `check.yml` only.

## Browser verification

- Drive the running dev server at `https://glore.localhost` with the machine-wide `agent-browser` skill. Never start a second app stack or preview server.
- Reuse Playwright auth state (`--state .playwright/.auth/<role>.json --ignore-https-errors`) to act as a seeded user.
- Close each named session in the turn that finishes with it, because an orphan holds about 900MB of Chrome.
- `APP_URL` must match the driven host, since `allowedDevOrigins` and Better Auth `baseURL` derive from it.
- When a page hangs on a spinner that never resolves, read the dev server logs: the server-side React error names the failing component, and the browser only shows the Suspense fallback.

## Dev environment and performance

Non-obvious settings keep dev HMR and CI builds fast. They back the dev-performance gotcha in `AGENTS.md` and MUST NOT be reverted in refactors.

### React Compiler and memory

- `reactCompiler` is `phase !== PHASE_DEVELOPMENT_SERVER`: on for builds, off in dev, because Babel kills Turbopack HMR.
- The `dev` script sets `NODE_OPTIONS` to load `scripts/dev-preload.mts` and to cap the heap at 4 GB (`--max-old-space-size=4096`).
- The preload disables React's dev-only async debug hook, which retained about 0.8 MB per request. Its test fails when an upgrade stops matching it.
- `turbopackFileSystemCacheForDev`, `turbopackGc`, and `turbopackMemoryEviction: 'auto'` hold Turbopack near 1.5 GB on Next 16.4.
- The first compile after a dev restart takes 6 to 7 seconds on login and `/dashboard`, so e2e uses a 20s expect timeout locally.

### Editor lint and save chain

- CLI runs (`pnpm run check:lint`, git hooks, CI) use `.oxlintrc.json` with `typeAware: true` for `no-floating-promises` and `no-misused-promises`.
- `.vscode/settings.json` sets `oxc.typeAware: false` and `oxc.configPath` to `oxlint.editor.config.mts`.
- That editor config drops the React Compiler rules except `rules-of-hooks` and `exhaustive-deps` (110 of 185 ms per keystroke).
- `knip.deferSession: true` keeps the knip extension idle.
- Change one side of the editor and CLI lint pair only by deliberately changing the other.
- `editor.codeActionsOnSave` runs ONLY `source.fixAll.oxc`. Never re-add `source.organizeImports` or `source.removeUnusedImports`.
- `source.format.oxc` was removed because `editor.formatOnSave` already runs oxfmt.
- The TypeScript import actions call the language server on every save, re-print imports with semicolons, and collapse oxfmt's groups, which flashes on save.
- `js/ts.format.semicolons: "remove"` stays, because auto-import and quick fixes print imports outside oxfmt.
- Duplicate imports no longer merge on save, but `pnpm run check` still blocks them.

### CI builds

- `vercel.json` pins functions to `fra1`, next to Neon (`eu-central-1`), and sets `git.deploymentEnabled.main: false`.
- Its `buildCommand` runs `typegen` first: Vercel's cached install skips `prepare`.
- `.github/workflows/deploy.yml` runs `vercel pull`, `build`, and `deploy --prebuilt` on the 4-core runner with a warm `.next/cache`, so Vercel only uploads.
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are non-secret workflow `env` IDs.
- `typescript.ignoreBuildErrors` is gone: `next build` type-checks with `tsconfig.build.json`, so a type error fails the build even when `Check` is skipped.
- `experimental.turbopackFileSystemCacheForBuild: true` MUST stay, because it lets the restored cache speed up compile.
- After adding a route handler, a stale typed-route error from `tsc` clears when `.next/.tsbuildinfo` is moved away.
